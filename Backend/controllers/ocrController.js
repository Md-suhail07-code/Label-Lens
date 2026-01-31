import vision from '@google-cloud/vision';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import axios from 'axios';
import { ScanHistory } from '../models/historyModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// ==========================================
// CONFIGURATION & CLIENTS
// ==========================================

const visionClient = new vision.ImageAnnotatorClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const OFF_HEADERS = {
  "User-Agent": "LabelLens/1.0 (Educational Project)",
  "Accept": "application/json"
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// --- Helper: Clean JSON Parsing ---
function parseGeminiJson(text) {
  try {
    let clean = text.replace(/```json|```/g, "").trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error("❌ JSON Parse Error:", e.message);
    return null;
  }
}

// --- Helper: Fetch Image for Alternatives ---
// specific search to find a product image by name
async function fetchProductImage(productName) {
  try {
    // We search OFF for the product name to get an image
    const url = `https://world.openfoodfacts.org/cgi/search.pl`;
    const res = await axios.get(url, {
      params: {
        search_terms: productName,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: 1, // We only need the top result
        fields: 'image_front_small_url,image_front_url,product_name,brands'
      },
      headers: OFF_HEADERS,
      timeout: 3000
    });
    
    const products = res.data?.products || [];
    if (products.length > 0) {
      return products[0].image_front_small_url || products[0].image_front_url || null;
    }
  } catch (error) {
    console.log(`   [OFF Image Fetch Failed for ${productName}]`);
  }
  return null;
}

// --- Helper: Full Gemini Analysis (Risk + Alternatives) ---
async function analyzeWithGemini(productName, ingredientsText, user) {
  try {
    const healthCondition = user?.healthCondition || "none";
    const allergies = user?.allergies || [];

    const prompt = `
      Analyze Product: "${productName}"
      Ingredients: "${ingredientsText}"
      User Context: Health: ${healthCondition}, Allergies: ${allergies.join(", ")}

      TASK:
      1. Analyze the ingredients for health risks (Indian context).
      2. Assign a Risk Score (0-100, where 100 is most dangerous).
      3. Suggest exactly 3 "Cleaner/Healthier" alternative products available in the INDIAN MARKET.
         - Alternatives MUST be real, specific brand names (e.g. "Tata Soulfull Ragi Bites", "Yoga Bar Muesli").

      Return VALID JSON ONLY:
      {
        "riskScore": Number,
        "verdict": "Safe" | "Moderate" | "Risky" | "Hazardous",
        "analysisSummary": "Short, punchy summary of why it is safe or unsafe.",
        "flaggedIngredients": [ { "name": "Ingredient Name", "reason": "Short reason why" } ],
        "alternatives": ["Brand Name 1", "Brand Name 2", "Brand Name 3"]
      }
    `;

    const aiResult = await model.generateContent(prompt);
    const parsed = parseGeminiJson(aiResult.response.text());
    
    // Default fallback if AI fails
    if (!parsed) return {
      riskScore: 50,
      verdict: "Unknown",
      analysisSummary: "Could not analyze ingredients.",
      flaggedIngredients: [],
      alternatives: []
    };

    return parsed;

  } catch (error) {
    console.error("⚠️ Gemini Analysis Failed:", error.message);
    return null;
  }
}

// --- OpenFoodFacts Fetchers ---
async function fetchOffProduct(code) {
  // Try .org first, then .net as fallback
  const domains = ['world.openfoodfacts.org', 'world.openfoodfacts.net'];
  
  for (const domain of domains) {
    try {
      const url = `https://${domain}/api/v2/product/${code}`;
      const res = await axios.get(url, { headers: OFF_HEADERS, timeout: 5000 });
      if (res.data?.product) return res.data.product;
    } catch (e) { continue; }
  }
  return null;
}

// ==========================================
// CONTROLLERS
// ==========================================

// 1. PROCESS BARCODE SEARCH
const processBarcodeSearch = async (req, res) => {
  try {
    const rawBarcode = req.body?.barcode;
    if (!rawBarcode) return res.status(400).json({ success: false, message: "No barcode provided." });
    
    console.log(`🔹 Processing Barcode: ${rawBarcode}`);

    // 1. GET PRODUCT FROM OFF
    const product = await fetchOffProduct(rawBarcode);

    if (!product) {
      return res.json({ success: false, message: "Product not found." });
    }

    console.log('✅ Found Product in OFF:', product.product_name);

    // 2. PREPARE DATA FOR GEMINI
    const productName = product.product_name || product.product_name_en || "Unknown Product";
    const ingredients = product.ingredients_text || product.ingredients_text_en || "Ingredients list not available.";
    const productImage = product.image_front_url || product.image_url || null;
    const brand = product.brands || "Unknown Brand";

    // 3. GET GEMINI ANALYSIS & ALTERNATIVES
    console.log('✨ Analyzing with Gemini...');
    const user = req.user || {};
    const analysis = await analyzeWithGemini(productName, ingredients, user);

    if (!analysis) {
       // Fallback if Gemini fails entirely
       return res.json({ 
         success: true, 
         data: { 
           productName, brand, image: productImage, ingredients, 
           riskScore: 50, verdict: "Moderate", alternatives: [] 
         } 
       });
    }

    // 4. ENRICH ALTERNATIVES WITH IMAGES (The key step you asked for)
    let enrichedAlternatives = [];
    if (analysis.alternatives && Array.isArray(analysis.alternatives)) {
      console.log(`🔎 Fetching images for ${analysis.alternatives.length} alternatives...`);
      
      enrichedAlternatives = await Promise.all(
        analysis.alternatives.map(async (altName) => {
          const imgUrl = await fetchProductImage(altName);
          return {
            name: altName,
            image: imgUrl, // This image comes from a fresh OFF query
            brand: "Suggested Alternative"
          };
        })
      );
    }

    // 5. CONSTRUCT FINAL RESPONSE
    const resultData = {
      productName,
      brand,
      image: productImage,
      ingredients,
      riskScore: analysis.riskScore,
      verdict: analysis.verdict,
      analysisSummary: analysis.analysisSummary,
      flaggedIngredients: analysis.flaggedIngredients || [],
      alternatives: enrichedAlternatives // Fully populated with images
    };

    // Optional: Save to history here if you want barcode scans in history too

    return res.json({ success: true, data: resultData });

  } catch (error) {
    console.error("🔥 Server Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// 2. PROCESS IMAGE SCAN (OCR)
const processImageScan = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    // 1. Upload & OCR
    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "label-lens-scans" },
          (error, result) => (result ? resolve(result) : reject(error))
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    };

    const uploadResult = await uploadFromBuffer(req.file.buffer);
    const [ocrResult] = await visionClient.textDetection({ image: { content: req.file.buffer } });
    const extractedText = ocrResult.textAnnotations?.[0]?.description || "";

    if (!extractedText) return res.json({ success: false, message: "No text found." });

    // 2. Gemini Analysis
    const user = req.user || {};
    const analysis = await analyzeWithGemini("Scanned Label", extractedText, user);
    
    // 3. Enrich Alternatives
    let enrichedAlternatives = [];
    if (analysis && analysis.alternatives) {
      enrichedAlternatives = await Promise.all(
        analysis.alternatives.map(async (altName) => {
          const imgUrl = await fetchProductImage(altName);
          return { name: altName, image: imgUrl, brand: "Suggested" };
        })
      );
    }

    const finalData = {
       imageUrl: uploadResult.secure_url,
       extractedText,
       productName: "Scanned Label",
       ...analysis,
       alternatives: enrichedAlternatives
    };

    // 4. Save History
    if (req.user) {
      await new ScanHistory({
        user: req.user._id,
        scannedImageUrl: finalData.imageUrl,
        scanType: "image_ocr",
        productName: finalData.productName,
        riskScore: finalData.riskScore,
        verdict: finalData.verdict,
        analysisSummary: finalData.analysisSummary,
        flaggedIngredients: finalData.flaggedIngredients,
        alternatives: finalData.alternatives 
      }).save();
    }

    res.json({ success: true, data: finalData });

  } catch (error) {
    console.error("LabelLens Processing Error:", error);
    res.status(500).json({ success: false, error: "Failed to analyze image" });
  }
};

export { processBarcodeSearch, processImageScan };