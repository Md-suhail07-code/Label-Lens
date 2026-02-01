import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using gemini-1.5-flash for speed and cost-efficiency (closest valid model to your request)
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

const OFF_HEADERS = {
  "User-Agent": "LabelLens/1.0 (Educational Project)",
  "Accept": "application/json"
};

/** Try OFF product API; returns product object or null */
async function fetchOffProduct(code, base = 'org') {
  const host = base === 'net' ? 'world.openfoodfacts.net' : 'world.openfoodfacts.org';
  const url = `https://${host}/api/v0/product/${code}.json`;
  try {
    const res = await axios.get(url, {
      headers: OFF_HEADERS,
      timeout: 8000,
      validateStatus: () => true
    });
    const data = res.data;
    if (res.status === 200 && data && typeof data === 'object' && data.status === 1 && data.product) return data.product;
  } catch (e) {
    console.log(`   OFF ${base} failed:`, e.message);
  }
  return null;
}

/** Try OFF v2 product API (.net); returns product object or null */
async function fetchOffProductV2(code) {
  try {
    const url = `https://world.openfoodfacts.net/api/v2/product/${code}`;
    const res = await axios.get(url, {
      headers: OFF_HEADERS,
      timeout: 8000,
      validateStatus: () => true
    });
    const data = res.data;
    if (res.status === 200 && data && typeof data === 'object' && data.status === 1 && data.product) return data.product;
  } catch (e) {
    console.log('   OFF v2 .net failed:', e.message);
  }
  return null;
}

/** Fallback: search by barcode (search_terms); returns product object or null */
async function searchOffByCode(code) {
  try {
    const res = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
      params: {
        search_terms: code,
        search_simple: 1,
        action: 'process',
        json: 1,
        fields: 'code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,image_url,image_front_url,nutriscore_grade'
      },
      headers: OFF_HEADERS,
      timeout: 8000,
      validateStatus: () => true
    });
    const products = res.data?.products || [];
    const match = products.find(p => String(p.code || '') === String(code));
    return match || products[0] || null;
  } catch (e) {
    console.log('   Search API failed:', e.message);
  }
  return null;
}

/** * Call Gemini AI to analyze ingredients 
 */
async function analyzeWithGemini(productName, ingredientsText, healthCondition, allergies) {
  try {
    const prompt = `
        You are a food ingredient risk analysis engine.

        Analyze the following INGREDIENT LIST exactly as written:
        "${ingredientsText}"
        These ingredients are the ingredients of the product "${productName}"
        
        User Health Context:
        - Health Condition: ${healthCondition || "None"}
        - Allergies: ${allergies && allergies.length ? allergies.join(", ") : "None"}

        Rules:
        - Consider Indian packaged food context.
        - Be conservative and factual.
        - Do NOT give medical advice.
        - Consider allergies and health condition while assigning risk.
        - If any ingredient conflicts with allergies, increase risk.

        Return ONLY a valid JSON object.
        NO markdown. NO explanations outside JSON.

        JSON Schema:
        {
          "productName": "Estimated product name",
          "riskScore": 0-100,
          "verdict": "Safe" | "Moderate" | "Risky" | "Hazardous",
          "analysisSummary": "One short sentence summary",
          "flaggedIngredients": [
            {
              "name": "Ingredient name",
              "risk": "Low" | "Medium" | "High",
              "reason": "Simple explanation"
            }
          ],
          "alternatives": [
            "The healthiest alternative product name to the product from the same category",
            "Another healthier alternative product name to the product from the same category"
          ]
        }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean markdown if Gemini wraps response in ```json ... ```
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback if AI fails
    return {
      productName: productName,
      riskScore: 50,
      verdict: "Unknown",
      analysisSummary: "AI Analysis failed. Showing raw ingredients.",
      flaggedIngredients: [],
      alternatives: []
    };
  }
}

// --- CONTROLLER: Process Barcode Search ---
const processBarcodeSearch = async (req, res) => {
  try {
    const rawBarcode = req.body?.barcode;
    // Extract user health data from request body (ensure your frontend sends these)
    const { healthCondition, allergies } = req.body; 

    if (rawBarcode == null || String(rawBarcode).trim() === '') {
      return res.status(400).json({ success: false, message: "No barcode provided." });
    }

    const barcode = String(rawBarcode).trim();
    console.log(`🔹 Processing barcode: ${barcode}`);

    // 1. Fetch Product from OpenFoodFacts (Try multiple endpoints)
    let product = await fetchOffProduct(barcode, 'org');
    if (!product) product = await fetchOffProduct(barcode, 'net');
    if (!product) product = await fetchOffProductV2(barcode);
    if (!product) product = await searchOffByCode(barcode);

    if (!product) {
      console.log('❌ Product not found in OFF.');
      return res.json({
        success: false,
        message: "Product not found. Please try scanning again."
      });
    }

    console.log('✅ Found product via OFF:', product.product_name || "Unknown Name");

    // 2. Prepare Data for Gemini
    const productName = product.product_name || product.product_name_en || "Unknown Product";
    const ingredientsText = product.ingredients_text || product.ingredients_text_en || "";
    const productImage = product.image_front_url || product.image_url || null;
    const brand = product.brands || "Unknown Brand";

    if (!ingredientsText) {
       return res.json({
         success: true,
         data: {
            productName,
            brand,
            image: productImage,
            riskScore: 0,
            verdict: "Unknown",
            analysisSummary: "Ingredients list missing in database. Cannot analyze.",
            flaggedIngredients: [],
            alternatives: []
         }
       });
    }

    // 3. Get AI Analysis
    const aiAnalysis = await analyzeWithGemini(productName, ingredientsText, healthCondition, allergies);

    // 4. Merge OFF Data with AI Data
    const resultData = {
      ...aiAnalysis, // verdict, riskScore, flaggedIngredients, alternatives
      productName: aiAnalysis.productName || productName, // Prefer AI cleaned name
      brand: brand,
      image: productImage,
      ingredients: ingredientsText
    };

    return res.json({ success: true, data: resultData });

  } catch (error) {
    console.error("🔥 Server Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error connecting to product database."
    });
  }
};

// Placeholder for Image Scan
const processImageScan = async (req, res) => {
    return res.json({ success: false, message: "Image scan not implemented in MVP." });
};

export { processBarcodeSearch, processImageScan };