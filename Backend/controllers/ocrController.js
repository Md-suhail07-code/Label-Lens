import axios from 'axios';
import { ScanHistory } from '../models/historyModel.js'; // Keep this if you want to save history, otherwise remove

// Headers are required by OpenFoodFacts to avoid being blocked
const OFF_HEADERS = {
  "User-Agent": "LabelLens/1.0 - Food label scanner",
  "Accept": "application/json"
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
    console.log(`🔹 Lookup OpenFoodFacts for: ${cleanBarcode}`);

    // 3. Request data from OpenFoodFacts
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`;
    
    const response = await axios.get(offUrl, { 
      headers: OFF_HEADERS,
      validateStatus: () => true // Prevent axios from throwing error on 404
    });

    // 4. Check if product exists
    const data = response.data;
    
    if (response.status === 404 || data.status === 0 || !data.product) {
      console.log("❌ Product not found in OFF database.");
      return res.json({ success: false, message: "Product not found." });
    }

    const product = data.product;

    // 5. Extract NAME, INGREDIENTS, IMAGE URL from Open Food Facts only (no Gemini)
    const resultData = {
      productName: product.product_name || product.product_name_en || "Unknown Product",
      imageUrl: product.image_url || product.image_front_url || product.image_front_small_url || null,
      ingredients: product.ingredients_text || product.ingredients_text_en || "Ingredients list not available.",
      // Placeholders for UI (not from OFF)
      brand: product.brands || "Unknown Brand",
      riskScore: 0,
      verdict: "Info Only",
      analysisSummary: "Product info from Open Food Facts.",
      flaggedIngredients: [],
      alternatives: []
    };

    console.log("✅ Product found:", resultData.productName);

    // 6. Optional: Save to DB (Remove this block if you don't want to save history yet)
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
          flaggedIngredients: [], // Empty because no AI
          alternatives: []
        }).save();
      } catch (err) {
        console.error("⚠️ Failed to save history:", err.message);
      }
    }

    // 7. Send Response
    return res.json({
      success: true,
      data: resultData
    });

  } catch (error) {
    console.error("🔥 Controller Error:", error);
    return res.status(500).json({ success: false, message: "Server error during lookup." });
  }
};

// Export only what we need
export { processBarcodeSearch };