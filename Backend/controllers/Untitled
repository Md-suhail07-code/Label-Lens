import vision from '@google-cloud/vision';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { ScanHistory } from '../models/historyModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const visionClient = new vision.ImageAnnotatorClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash" // Updated to stable model name
});

// ---------- Cloudinary Upload ----------
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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ---------- MAIN CONTROLLER (Image Scan) ----------
const processImageScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const user = req.user || {};
    const healthCondition = user.healthCondition || "none";
    const allergies = user.allergies || [];

    // 1️⃣ Upload image for history
    const uploadResult = await uploadFromBuffer(req.file.buffer);
    const imageUrl = uploadResult.secure_url;

    // 2️⃣ OCR Extraction
    const [ocrResult] = await visionClient.textDetection({
      image: { content: req.file.buffer }
    });

    const extractedText =
      ocrResult.textAnnotations?.[0]?.description || "";

    if (!extractedText) {
      return res.json({
        success: false,
        message: "No readable text found in image."
      });
    }

    // 3️⃣ Gemini Prompt
    const prompt = `
        You are a food ingredient risk analysis engine.
        Analyze the following INGREDIENT LIST exactly as written:
        "${extractedText}"

        User Health Context:
        - Health Condition: ${healthCondition}
        - Allergies: ${allergies.length ? allergies.join(", ") : "None"}

        Rules:
        - Consider Indian packaged food context.
        - Be conservative and factual.
        - Do NOT give medical advice.
        - Consider allergies and health condition while assigning risk.
        
        Return ONLY a valid JSON object.
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
          "alternatives": [ "Alternative 1", "Alternative 2" ]
        }
        `;

    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text();
    const cleanJson = aiText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    // 4️⃣ Save Scan History
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
        alternatives: parsedData.alternatives.map(p => ({ productName: p }))
      }).save();
    }

    res.json({
      success: true,
      data: {
        imageUrl,
        extractedText,
        ...parsedData
      }
    });

  } catch (error) {
    console.error("LabelLens Processing Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze image"
    });
  }
};

// OpenFoodFacts requires a User-Agent
const OFF_HEADERS = {
  "User-Agent": "LabelLens/1.0 - Food ingredient scanner",
};

// ---------- BARCODE LOOKUP (FIXED & ROBUST) ----------
const processBarcodeSearch = async (req, res) => {
  try {
    const rawBarcode = req.body.barcode;
    let barcode = rawBarcode != null ? String(rawBarcode).trim() : "";

    if (!barcode) {
      return res.status(400).json({ error: "No barcode provided" });
    }

    // Helper function to query OFF API
    const fetchFromOFF = async (code) => {
      try {
        const response = await axios.get(
            `https://world.openfoodfacts.org/api/v0/product/${code}.json`,
            { headers: OFF_HEADERS }
        );
        return response.data;
      } catch (err) {
        return null;
      }
    };

    // 1️⃣ First Attempt: Query exact barcode
    let data = await fetchFromOFF(barcode);

    // 2️⃣ Retry Logic: If not found and looks like UPC (12 chars), try EAN-13 (13 chars)
    // Many scanners read UPC without the leading 0, but OFF stores it as EAN-13.
    if ((!data || data.status !== 1) && barcode.length === 12) {
      console.log(`Retrying UPC ${barcode} as EAN-13 (0${barcode})...`);
      const retryData = await fetchFromOFF(`0${barcode}`);
      if (retryData && retryData.status === 1) {
        data = retryData;
      }
    }

    // Check if product was found
    if (!data || data.status !== 1 || !data.product) {
      console.log(`Product not found for barcode: ${barcode}`);
      return res.json({
        success: false,
        message: "Product not found in OpenFoodFacts database."
      });
    }

    const product = data.product;
    
    // 3️⃣ Extract Data Safely (Fallbacks for missing fields)
    const productName = product.product_name || product.product_name_en || "Unknown Product";
    const brand = product.brands || product.brands_tags?.[0] || "Unknown Brand";
    
    // Image fallback priority: Selected -> Front -> Thumb
    const imageUrl = product.image_url || product.image_front_url || product.image_thumb_url || "";
    
    // Ingredients fallback priority: Text -> Text En -> Empty
    const ingredients = product.ingredients_text || product.ingredients_text_en || "Ingredients list not available.";

    // 4️⃣ Placeholder Analysis (Until you re-enable Gemini)
    // Note: Since Gemini is commented out, we return "Safe" defaults so the UI doesn't crash.
    const riskScore = 0;
    const verdict = "Safe";
    const analysisSummary = ingredients !== "Ingredients list not available." 
        ? "Product details retrieved from database. AI analysis pending." 
        : "Product found, but ingredients are missing from database.";
        
    const flaggedIngredients = [];
    const alternatives = [];

    // 5️⃣ Save Scan History
    if (req.user) {
      await new ScanHistory({
        user: req.user._id,
        scannedImageUrl: imageUrl,
        scanType: "barcode",
        productName,
        riskScore,
        verdict,
        analysisSummary,
        flaggedIngredients,
        alternatives: [] // alternatives usually need schema matching
      }).save();
    }

    // 6️⃣ Send Success Response
    res.json({
      success: true,
      data: {
        productName,
        brand,
        imageUrl,
        ingredients,
        riskScore,
        verdict,
        analysisSummary,
        flaggedIngredients,
        alternatives
      }
    });

  } catch (error) {
    console.error("Barcode Lookup Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to lookup barcode"
    });
  }
};

export { processImageScan, processBarcodeSearch };