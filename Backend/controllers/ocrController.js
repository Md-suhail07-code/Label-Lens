import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using gemini-1.5-flash for speed
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

const OFF_HEADERS = {
  "User-Agent": "LabelLens/1.0 (Educational Project)",
  "Accept": "application/json"
};

// --- 🛡️ SAFETY NET: HARDCODED DEMO DATA ---
// If the API fails, the app will silently fall back to this data.
const DEMO_PRODUCTS = {
  "8901063142664": { // Britannia Milk Bikis
    product_name: "Britannia Milk Bikis",
    ingredients_text: "Refined Wheat Flour (Maida), Sugar, Refined Palm Oil, Milk Solids, Invert Sugar Syrup, Iodised Salt, Leavening Agents (503(ii), 500(ii)), Emulsifiers (322, 471), Dough Conditioner (223), Vitamins and Minerals.",
    image_front_url: "https://images.openfoodfacts.org/images/products/890/106/314/2664/front_en.118.400.jpg",
    brands: "Britannia"
  },
  "8901491502030": { // Lays American Style
     product_name: "Lay's American Style Cream & Onion",
     ingredients_text: "Potato, Edible Vegetable Oil (Palmolein, Sunflower Oil), Seasoning (Sugar, Iodised Salt, Milk Solids, Spices & Condiments, Maltodextrin, Flavour (Natural and Nature Identical Flavouring Substances), Cheese Powder, Hydrolysed Vegetable Protein, Flavour Enhancers (627, 631), Edible Vegetable Oil (Palm, Coconut), Anticaking Agent (551)).",
     image_front_url: "https://images.openfoodfacts.org/images/products/890/149/150/2030/front_en.19.400.jpg",
     brands: "Lays"
  }
};

/** Try OFF product API; returns product object or null */
async function fetchOffProduct(code, base = 'org') {
  const host = base === 'net' ? 'world.openfoodfacts.net' : 'world.openfoodfacts.org';
  const url = `https://${host}/api/v0/product/${code}.json`;
  try {
    const res = await axios.get(url, {
      headers: OFF_HEADERS,
      timeout: 12000, // INCREASED TO 12 SECONDS
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
      timeout: 12000, // INCREASED TO 12 SECONDS
      validateStatus: () => true
    });
    const data = res.data;
    if (res.status === 200 && data && typeof data === 'object' && data.status === 1 && data.product) return data.product;
  } catch (e) {
    console.log('   OFF v2 .net failed:', e.message);
  }
  return null;
}

/** Fallback: search by barcode */
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
      timeout: 12000, // INCREASED TO 12 SECONDS
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

/** Call Gemini AI to analyze ingredients */
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

        CRITICAL INSTRUCTION (TEXT CLEANING):
        The input text contains OCR errors, bad spacing, and formatting issues.
        Your FIRST task is to fix this text into a readable, comma-separated list.

        Return ONLY a valid JSON object.

        JSON Schema:
        {
          "cleanedIngredients": "THE CORRECTED, HUMAN-READABLE INGREDIENT LIST GOES HERE",
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
             "Specific REAL BRAND NAME available in India (e.g. 'Too Yumm Veggie Stix', 'Epigamia Greek Yogurt'). Do NOT use generic names like 'Baked Chips'. It must be a specific product found in Indian grocery stores.",
            "Another specific REAL BRAND NAME available in India."
          ]
        }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      cleanedIngredients: null,
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
    const { healthCondition, allergies } = req.body; 

    if (rawBarcode == null || String(rawBarcode).trim() === '') {
      return res.status(400).json({ success: false, message: "No barcode provided." });
    }

    const barcode = String(rawBarcode).trim();
    console.log(`🔹 Processing barcode: ${barcode}`);

    // 1. Try Real API First
    let product = await fetchOffProduct(barcode, 'org');
    if (!product) product = await fetchOffProduct(barcode, 'net');
    if (!product) product = await fetchOffProductV2(barcode);
    if (!product) product = await searchOffByCode(barcode);

    // 2. 🚨 EMERGENCY FALLBACK: Check Hardcoded Data if API failed
    if (!product && DEMO_PRODUCTS[barcode]) {
        console.log("⚠️ API Failed. Activating Safety Net for:", barcode);
        product = DEMO_PRODUCTS[barcode];
    }

    if (!product) {
      return res.json({ success: false, message: "Product not found. Please try scanning again." });
    }

    // 3. Prepare Data
    const productName = product.product_name || product.product_name_en || "Unknown Product";
    const ingredientsText = product.ingredients_text || product.ingredients_text_en || "";
    const productImage = product.image_front_url || product.image_url || null;
    const brand = product.brands || "Unknown Brand";

    // 4. Get AI Analysis
    let aiAnalysis = {};
    if (ingredientsText) {
        aiAnalysis = await analyzeWithGemini(productName, ingredientsText, healthCondition, allergies);
    }

    // 5. Merge Data
    const resultData = {
      ...aiAnalysis, 
      productName: aiAnalysis.productName || productName,
      brand: brand,
      image: productImage,
      ingredients: aiAnalysis.cleanedIngredients || ingredientsText, 
      rawIngredients: ingredientsText
    };

    return res.json({ success: true, data: resultData });

  } catch (error) {
    console.error("🔥 Server Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// --- ADDED THIS BACK TO FIX THE ERROR ---
const processImageScan = async (req, res) => {
    return res.json({ success: false, message: "Image scan not implemented in MVP." });
};

export { processBarcodeSearch, processImageScan };
