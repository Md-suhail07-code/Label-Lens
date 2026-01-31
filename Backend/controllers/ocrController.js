import axios from 'axios';
import { ScanHistory } from '../models/historyModel.js'; // Keep this if you want to save history, otherwise remove

// Headers are required by OpenFoodFacts to avoid being blocked
const OFF_HEADERS = {
  "User-Agent": "LabelLens/1.0 - Food label scanner",
  "Accept": "application/json"
};

/** Placeholder for camera/OCR scan – app uses barcode + Open Food Facts only. */
const processImageScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided." });
    }
    return res.json({
      success: true,
      data: {
        productName: "Scanned Product",
        brand: "—",
        imageUrl: null,
        ingredients: "Use barcode scan for product details from Open Food Facts.",
        riskScore: 0,
        verdict: "Info Only",
        analysisSummary: "Use barcode scan for product details.",
        flaggedIngredients: [],
        alternatives: []
      }
    });
  } catch (error) {
    console.error("processImageScan:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * Search for a product by barcode as a fallback strategy
 * Uses OpenFoodFacts search API instead of direct product lookup
 */
const searchProductByBarcode = async (barcode) => {
  try {
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl`;
    const response = await axios.get(searchUrl, {
      params: {
        search_terms: barcode,
        search_simple: 1,
        action: 'process',
        json: 1,
        fields: 'product_name,product_name_en,brands,ingredients_text,ingredients_text_en,image_url,image_front_url,image_front_small_url'
      },
      headers: OFF_HEADERS,
      timeout: 10000 // 10 second timeout
    });

    if (response.data.products && response.data.products.length > 0) {
      console.log(`✅ Found product via search API`);
      return response.data.products[0];
    }
    return null;
  } catch (err) {
    console.error("⚠️ Search fallback failed:", err.message);
    return null;
  }
};

const processBarcodeSearch = async (req, res) => {
  try {
    // 1. DEBUGGING: Log exactly what the frontend sent
    console.log("🔹 Backend received request body:", req.body);

    const { barcode } = req.body;

    if (!barcode) {
      console.log("❌ No barcode provided in body.");
      return res.status(400).json({ success: false, message: "No barcode provided." });
    }

    // 2. Clean the barcode (remove spaces/dashes if any)
    const cleanBarcode = String(barcode).trim();
    console.log(`🔹 Looking up barcode: ${cleanBarcode}`);

    // Validate barcode format (should be 8-13 digits)
    if (!/^\d{8,13}$/.test(cleanBarcode)) {
      console.log("❌ Invalid barcode format. Expected 8-13 digits.");
      return res.status(400).json({ 
        success: false, 
        message: "Invalid barcode format. Must be 8-13 digits." 
      });
    }

    // 3. Try multiple barcode format variations
    // OpenFoodFacts can be finicky with barcode formats (EAN-13, UPC-A, etc.)
    const barcodeVariations = [
      cleanBarcode,                                          // Original (e.g., 89010630350271)
      cleanBarcode.padStart(13, '0'),                       // Pad to 13 digits (if shorter)
      cleanBarcode.length === 13 ? cleanBarcode.substring(1) : null, // Remove leading digit (9010630350271)
      cleanBarcode.length === 12 ? '0' + cleanBarcode : null,        // Add leading 0 (for UPC-A to EAN-13)
      cleanBarcode.length === 13 ? '0' + cleanBarcode : null         // Try with extra leading 0
    ].filter(Boolean); // Remove null/undefined values

    // Remove duplicates
    const uniqueVariations = [...new Set(barcodeVariations)];

    console.log(`🔹 Will try ${uniqueVariations.length} barcode variations:`, uniqueVariations);

    let productData = null;
    let successfulBarcode = null;

    // 4. Try each barcode variation
    for (const barcodeVariant of uniqueVariations) {
      console.log(`   Trying: ${barcodeVariant}`);
      
      const offUrl = `https://world.openfoodfacts.org/api/v2/product/${barcodeVariant}.json`;
      
      try {
        const response = await axios.get(offUrl, { 
          headers: OFF_HEADERS,
          timeout: 8000, // 8 second timeout
          validateStatus: () => true // Don't throw on 404
        });

        const data = response.data;
        
        // Check if we got a valid product
        // OFF returns status: 1 for found, status: 0 for not found
        if (response.status === 200 && data.status === 1 && data.product) {
          console.log(`✅ Product found with barcode: ${barcodeVariant}`);
          productData = data;
          successfulBarcode = barcodeVariant;
          break; // Stop searching once we find a match
        } else {
          console.log(`   Not found (status: ${data.status})`);
        }
      } catch (err) {
        console.log(`   Request failed: ${err.message}`);
        continue; // Try next variation
      }
    }

    // 5. If no variation worked, try search API as last resort
    if (!productData) {
      console.log("🔹 Direct lookup failed. Trying search API fallback...");
      const searchResult = await searchProductByBarcode(cleanBarcode);
      
      if (searchResult) {
        productData = { product: searchResult, status: 1 };
        successfulBarcode = cleanBarcode;
        console.log(`✅ Product found via search: ${searchResult.product_name || 'Unknown'}`);
      }
    }

    // 6. If still nothing found, return error
    if (!productData || !productData.product) {
      console.log("❌ Product not found in OpenFoodFacts database.");
      console.log("   Tried variations:", uniqueVariations);
      return res.json({ 
        success: false, 
        message: "Product not found in OpenFoodFacts database. The barcode may not be registered yet, or try scanning again with better lighting.",
        attemptedBarcodes: uniqueVariations
      });
    }

    const product = productData.product;

    // 7. Extract product information from OpenFoodFacts
    const resultData = {
      productName: product.product_name || product.product_name_en || "Unknown Product",
      imageUrl: product.image_url || product.image_front_url || product.image_front_small_url || null,
      ingredients: product.ingredients_text || product.ingredients_text_en || "Ingredients list not available.",
      brand: product.brands || "Unknown Brand",
      // Placeholders (no AI analysis yet)
      riskScore: 0,
      verdict: "Info Only",
      analysisSummary: "Product information from Open Food Facts. Detailed ingredient analysis coming soon.",
      flaggedIngredients: [],
      alternatives: []
    };

    console.log("✅ Successfully processed product:", {
      name: resultData.productName,
      brand: resultData.brand,
      barcodeUsed: successfulBarcode,
      hasImage: !!resultData.imageUrl,
      hasIngredients: resultData.ingredients !== "Ingredients list not available."
    });

    // 8. Optional: Save scan to database
    if (req.user) {
      try {
        await new ScanHistory({
          user: req.user._id,
          scannedImageUrl: resultData.imageUrl || "https://via.placeholder.com/150",
          scanType: "barcode",
          productName: resultData.productName,
          riskScore: 0,
          verdict: "Safe",
          analysisSummary: resultData.ingredients,
          flaggedIngredients: [],
          alternatives: []
        }).save();
        console.log("✅ Scan saved to history");
      } catch (err) {
        console.error("⚠️ Failed to save scan history:", err.message);
        // Don't fail the request if history save fails
      }
    }

    // 9. Send successful response
    return res.json({
      success: true,
      data: resultData,
      meta: {
        barcodeUsed: successfulBarcode,
        originalBarcode: cleanBarcode
      }
    });

  } catch (error) {
    console.error("🔥 Fatal error in processBarcodeSearch:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error during barcode lookup. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { processImageScan, processBarcodeSearch };