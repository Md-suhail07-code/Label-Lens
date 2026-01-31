import axios from 'axios';

// --- CONTROLLER: Process Barcode Search ---
const processBarcodeSearch = async (req, res) => {
  try {
    const { barcode } = req.body;

    // 1. Basic Validation
    if (!barcode) {
      return res.status(400).json({ 
        success: false, 
        message: "No barcode provided." 
      });
    }

    console.log(`🔹 Processing barcode: ${barcode}`);

    // 2. Query OpenFoodFacts API (Using the reliable v0 endpoint)
    // We add a random number to the URL to prevent caching issues
    const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json?t=${Date.now()}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "LabelLens/1.0 (Educational Project)",
        "Accept": "application/json"
      },
      timeout: 10000 // 10 seconds timeout
    });

    const data = response.data;

    // 3. Check if product exists
    if (data.status === 0 || !data.product) {
      console.log("❌ Product not found in OFF.");
      return res.json({
        success: false,
        message: "Product not found. Please try scanning again."
      });
    }

    const product = data.product;

    // 4. GENERATE MVP DATA (Map OFF data to your Frontend App Structure)
    // OpenFoodFacts gives a "NutriScore" (A, B, C, D, E). 
    // We map this to your "Risk Score" and "Verdict" so the UI works.

    const nutriScore = (product.nutriscore_grade || 'unknown').toLowerCase();
    
    let derivedVerdict = 'moderate';
    let derivedScore = 50;
    
    // Logic: A/B = Safe, C/D = Moderate, E = Unsafe
    if (['a', 'b'].includes(nutriScore)) {
      derivedVerdict = 'safe';
      derivedScore = 15; // Low risk
    } else if (['c', 'd'].includes(nutriScore)) {
      derivedVerdict = 'moderate';
      derivedScore = 55; // Medium risk
    } else if (nutriScore === 'e') {
      derivedVerdict = 'unsafe';
      derivedScore = 85; // High risk
    }

    // 5. Construct the final object
    const resultData = {
      productName: product.product_name || product.product_name_en || "Unknown Product",
      brand: product.brands || "Unknown Brand",
      image: product.image_front_url || product.image_url || null, // Note: Frontend expects 'image' or 'imageUrl'
      
      // The Ingredients Text
      ingredients: product.ingredients_text || product.ingredients_text_en || "Ingredients list not available.",
      
      // The Calculated Scores
      riskScore: derivedScore,
      verdict: derivedVerdict,
      
      // Placeholder Analysis (MVP Requirement)
      analysisSummary: `This product has a NutriScore of ${nutriScore.toUpperCase()}. (MVP: Detailed toxicity analysis is a placeholder).`,
      
      // Flagged Ingredients (Demo logic for MVP)
      flaggedIngredients: derivedVerdict === 'unsafe' ? [
        { name: "High Risk Additives", reason: "Product flagged due to low NutriScore (E)." }
      ] : [],
      
      alternatives: [] // Keep empty for MVP
    };

    console.log(`✅ Success: Found ${resultData.productName}`);

    // 6. Send Response to Frontend
    return res.json({
      success: true,
      data: resultData
    });

  } catch (error) {
    console.error("🔥 Server Error:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server error connecting to product database." 
    });
  }
};

// Placeholder for Image Scan (Keep to prevent router errors if you have this route defined)
const processImageScan = async (req, res) => {
    return res.json({ success: false, message: "Image scan not implemented in MVP." });
};

export { processBarcodeSearch, processImageScan };