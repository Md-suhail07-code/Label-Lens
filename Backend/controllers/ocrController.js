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
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ---------- Cloudinary ----------
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

// ---------- IMAGE SCAN (OCR + Gemini) – unchanged ----------
const processImageScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const user = req.user || {};
    const healthCondition = user.healthCondition || "none";
    const allergies = user.allergies || [];

    const uploadResult = await uploadFromBuffer(req.file.buffer);
    const imageUrl = uploadResult.secure_url;

    const [ocrResult] = await visionClient.textDetection({
      image: { content: req.file.buffer }
    });
    const extractedText = ocrResult.textAnnotations?.[0]?.description || "";

    if (!extractedText) {
      return res.json({
        success: false,
        message: "No readable text found in image."
      });
    }

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
        Return ONLY a valid JSON object.
        JSON Schema:
        {
          "productName": "Estimated product name",
          "riskScore": 0-100,
          "verdict": "Safe" | "Moderate" | "Risky" | "Hazardous",
          "analysisSummary": "One short sentence summary",
          "flaggedIngredients": [
            { "name": "Ingredient name", "risk": "Low" | "Medium" | "High", "reason": "Simple explanation" }
          ],
          "alternatives": [ "Alternative 1", "Alternative 2" ]
        }
    `;

    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text();
    const cleanJson = aiText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

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

// ---------- BARCODE LOOKUP (OpenFoodFacts only) – remade from scratch ----------
const OFF_USER_AGENT = "LabelLens/1.0 (https://github.com/label-lens)";

/** Normalize barcode: digits only (strip spaces, dashes, etc.) so OFF accepts it. */
function normalizeBarcode(value) {
  if (value == null) return "";
  const s = String(value).trim();
  const digits = s.replace(/\D/g, "");
  return digits;
}

const processBarcodeSearch = async (req, res) => {
  try {
    const raw = req.body.barcode;
    const barcode = normalizeBarcode(raw);

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: "No barcode provided."
      });
    }

    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await axios.get(url, {
      headers: { "User-Agent": OFF_USER_AGENT },
      timeout: 15000
    });

    const body = response.data || {};
    if (!body || body.status !== 1 || !body.product) {
      return res.json({
        success: false,
        message: "Product not found in OpenFoodFacts database."
      });
    }

    const p = body.product;

    const productName = p.product_name || p.product_name_en || "Unknown Product";
    const imageUrl = p.image_url || p.image_front_url || p.image_front_small_url || p.image_thumb_url || "";
    const ingredients = p.ingredients_text || p.ingredients_text_en || "";
    const brand = p.brands || (p.brands_tags && p.brands_tags[0]) || "Unknown";

    // History model requires scannedImageUrl; use placeholder if OFF has no image
    const scannedImageUrl = imageUrl || "https://images.openfoodfacts.org/images/icons/dist/packaging.svg";

    const riskScore = 0;
    const verdict = "Safe";
    const analysisSummary = ingredients
      ? "Product info from OpenFoodFacts. AI analysis coming soon."
      : "Product found. Ingredients not available in database.";
    const flaggedIngredients = [];
    const alternatives = [];

    if (req.user) {
      await new ScanHistory({
        user: req.user._id,
        scannedImageUrl,
        scanType: "barcode",
        productName,
        riskScore,
        verdict,
        analysisSummary,
        flaggedIngredients,
        alternatives: []
      }).save();
    }

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
  } catch (err) {
    console.error("Barcode Lookup Error:", err.message || err);
    res.status(500).json({
      success: false,
      error: "Failed to lookup barcode"
    });
  }
};

export { processImageScan, processBarcodeSearch };
