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

// using standard stable model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash" 
});

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

// --- Cloudinary Upload Helper ---
const uploadFromBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "label-lens-scans" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// --- OpenFoodFacts Fetchers (For Barcode Search) ---
async function fetchOffProduct(code, base = 'org') {
  const host = base === 'net' ? 'world.openfoodfacts.net' : 'world.openfoodfacts.org';
  const url = `https://${host}/api/v0/product/${code}.json`;
  try {
    const res = await axios.get(url, { headers: OFF_HEADERS, timeout: 5000, validateStatus: () => true });
    const data = res.data;
    if (res.status === 200 && data && typeof data === 'object' && data.status === 1 && data.product) return data.product;
  } catch (e) { console.log(`   OFF ${base} failed:`, e.message); }
  return null;
}

async function fetchOffProductV2(code) {
  try {
    const url = `https://world.openfoodfacts.net/api/v2/product/${code}`;
    const res = await axios.get(url, { headers: OFF_HEADERS, timeout: 5000, validateStatus: () => true });
    const data = res.data;
    if (res.status === 200 && data && typeof data === 'object' && data.status === 1 && data.product) return data.product;
  } catch (e) { console.log('   OFF v2 .net failed:', e.message); }
  return null;
}

async function searchOffByCode(code) {
  try {
    const res = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
      params: {
        search_terms: code, search_simple: 1, action: 'process', json: 1,
        fields: 'code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,image_url,image_front_url,nutriscore_grade'
      },
      headers: OFF_HEADERS, timeout: 5000, validateStatus: () => true
    });
    return res.data?.products?.find(p => String(p.code || '') === String(code)) || res.data?.products?.[0] || null;
  } catch (e) { console.log('   Search API failed:', e.message); }
  return null;
}

// --- Helper: Fetch Image for Alternatives (Used by both flows) ---
async function fetchProductImage(productName) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl`;
    const res = await axios.get(url, {
      params: {
        search_terms: productName,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: 1,
        fields: 'image_front_small_url,image_front_url,product_name'
      },
      timeout: 3000
    });
    const products = res.data?.products || [];
    if (products.length > 0) {
      return products[0].image_front_small_url || products[0].image_front_url || null;
    }
  } catch (error) {
    // console.log(`   [OFF Search Failed for ${productName}]`);
  }
  return null;
}

// --- Helper: Clean JSON Parsing ---
function parseGeminiJson(text) {
  try {
    // Remove markdown code blocks
    let clean = text.replace(/```json|```/g, "").trim();
    // Find the first '{' and last '}' to handle any extra intro/outro text
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error("   ❌ JSON Parse Error:", e.message);
    return null;
  }
}

// --- Helper: Generate Alternatives for Barcode Flow ---
async function generateAlternativesWithGemini(productName, ingredientsText, user) {
  try {
    const healthCondition = user?.healthCondition || "none";
    const allergies = user?.allergies || [];

    const prompt = `
      Product: "${productName}"
      Ingredients: "${ingredientsText}"
      User Context: Health Condition: ${healthCondition}, Allergies: ${allergies.join(", ")}

      TASK: Suggest exactly 3 "Cleaner/Healthier" alternative products available in the INDIAN MARKET.
      They must be specific brand names (e.g. "Tata Soulfull", "Yoga Bar", "Slurrp Farm").
      Return ONLY valid JSON.
      { "alternatives": ["Brand Name 1", "Brand Name 2", "Brand Name 3"] }
    `;

    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text();
    const parsed = parseGeminiJson(aiText);

    if (parsed && parsed.alternatives && Array.isArray(parsed.alternatives)) {
      // Enrich with images
      const enriched = await Promise.all(parsed.alternatives.map(async (altName) => {
         const img = await fetchProductImage(altName);
         return { name: altName, image: img, productName: altName };
      }));
      return enriched;
    }
    return [];
  } catch (error) {
    console.error("   ⚠️ Gemini Alternatives Failed:", error.message);
    return [];
  }
}

// --- Data Builder for Barcode Results ---
function buildResultData(product) {
  const nutriScore = (product.nutriscore_grade || 'unknown').toLowerCase();
  let derivedVerdict = 'moderate';
  let derivedScore = 50;
  if (['a', 'b'].includes(nutriScore)) { derivedVerdict = 'safe'; derivedScore = 15; }
  else if (['c', 'd'].includes(nutriScore)) { derivedVerdict = 'moderate'; derivedScore = 55; }
  else if (nutriScore === 'e') { derivedVerdict = 'unsafe'; derivedScore = 85; }

  return {
    productName: product.product_name || product.product_name_en || "Unknown Product",
    brand: product.brands || "Unknown Brand",
    image: product.image_front_url || product.image_url || null,
    ingredients: product.ingredients_text || product.ingredients_text_en || "Ingredients list not available.",
    riskScore: derivedScore,
    verdict: derivedVerdict,
    analysisSummary: `NutriScore: ${nutriScore.toUpperCase()}.`,
    flaggedIngredients: derivedVerdict === 'unsafe' ? [{ name: "High Risk Additives", reason: "Low NutriScore (E)." }] : [],
    alternatives: [] 
  };
}

// ==========================================
// CONTROLLERS
// ==========================================

// 1. PROCESS BARCODE SEARCH
const processBarcodeSearch = async (req, res) => {
  try {
    const rawBarcode = req.body?.barcode;
    if (!rawBarcode) return res.status(400).json({ success: false, message: "No barcode provided." });
    
    const barcode = String(rawBarcode).trim();
    console.log(`🔹 Processing Barcode: ${barcode}`);

    // Try multiple endpoints to find the product
    let product = await fetchOffProduct(barcode, 'org');
    if (!product) product = await fetchOffProduct(barcode, 'net');
    if (!product) product = await fetchOffProductV2(barcode);
    if (!product) product = await searchOffByCode(barcode);

    if (product) {
      console.log('✅ Found Product in OFF');
      const resultData = buildResultData(product);

      // --- NEW: GEMINI ALTERNATIVES ---
      console.log('✨ Generating Alternatives via Gemini...');
      const user = req.user || {};
      const aiAlts = await generateAlternativesWithGemini(resultData.productName, resultData.ingredients, user);
      
      if (aiAlts.length > 0) {
        console.log(`✅ ${aiAlts.length} Alternatives Found`);
        resultData.alternatives = aiAlts;
      } else {
        console.log('⚠️ No Alternatives generated');
      }

      return res.json({ success: true, data: resultData });
    }

    return res.json({ success: false, message: "Product not found." });
  } catch (error) {
    console.error("🔥 Server Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// 2. PROCESS IMAGE SCAN
const processImageScan = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    const user = req.user || {};
    const healthCondition = user.healthCondition || "none";
    const allergies = user.allergies || [];

    // 1️⃣ Upload image
    const uploadResult = await uploadFromBuffer(req.file.buffer);
    const imageUrl = uploadResult.secure_url;

    // 2️⃣ OCR
    const [ocrResult] = await visionClient.textDetection({ image: { content: req.file.buffer } });
    const extractedText = ocrResult.textAnnotations?.[0]?.description || "";

    if (!extractedText) return res.json({ success: false, message: "No text found." });

    // 3️⃣ Gemini Analysis
    const prompt = `
        Analyze INGREDIENTS: "${extractedText}"
        User Context: Health: ${healthCondition}, Allergies: ${allergies.join(", ")}
        
        Rules: Indian context. Conservative.
        Provide exactly 3 "Cleaner alternative" suggestions (Specific Indian Brand Products).
        
        Return JSON ONLY:
        {
          "productName": "Estimated Name",
          "riskScore": 0-100,
          "verdict": "Safe" | "Moderate" | "Risky" | "Hazardous",
          "analysisSummary": "Short summary",
          "flaggedIngredients": [ { "name": "Ing", "risk": "High", "reason": "Why" } ],
          "alternatives": [ "Brand Product 1", "Brand Product 2", "Brand Product 3" ]
        }
    `;

    const aiResult = await model.generateContent(prompt);
    const parsedData = parseGeminiJson(aiResult.response.text());

    if (!parsedData) throw new Error("Failed to parse AI response");

    // 4️⃣ Enrich Alternatives with Images
    if (parsedData.alternatives && Array.isArray(parsedData.alternatives)) {
        parsedData.alternatives = await Promise.all(
            parsedData.alternatives.map(async (altName) => {
                const img = await fetchProductImage(altName);
                return { name: altName, image: img, productName: altName };
            })
        );
    }

    // 5️⃣ Save History
    if (req.user) {
      await new ScanHistory({
        user: req.user._id,
        scannedImageUrl: imageUrl,
        scanType: "image_ocr",
        productName: parsedData.productName,
        riskScore: parsedData.riskScore,
        verdict: parsedData.verdict,
        analysisSummary: parsedData.analysisSummary,
        flaggedIngredients: parsedData.flaggedIngredients,
        alternatives: parsedData.alternatives 
      }).save();
    }

    res.json({ success: true, data: { imageUrl, extractedText, ...parsedData } });

  } catch (error) {
    console.error("LabelLens Processing Error:", error);
    res.status(500).json({ success: false, error: "Failed to analyze image" });
  }
};

export { processBarcodeSearch, processImageScan };
