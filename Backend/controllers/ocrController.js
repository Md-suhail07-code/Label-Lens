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
  model: "gemini-3-flash-preview"
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

// ---------- MAIN CONTROLLER ----------
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

    // 3️⃣ Gemini Prompt (STRICT & PERSONALIZED)
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
            "Cleaner alternative suggestion 1",
            "Cleaner alternative suggestion 2"
          ]
        }
        `;

    // 4️⃣ Gemini Call
    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text();

    // 5️⃣ Safe JSON cleanup
    const cleanJson = aiText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    // 6️⃣ Save Scan History
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

    // 7️⃣ Response
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

// ---------- BARCODE LOOKUP (OpenFoodFacts only; Gemini commented out for future use) ----------
const processBarcodeSearch = async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: "No barcode provided" });
    }

    // 1️⃣ Fetch from OpenFoodFacts API
    const offResponse = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    if (offResponse.data.status !== 1 || !offResponse.data.product) {
      return res.json({
        success: false,
        message: "Product not found in OpenFoodFacts database."
      });
    }

    const product = offResponse.data.product;
    const productName = product.product_name || "Unknown Product";
    const imageUrl = product.image_url || product.image_front_url || "";
    const ingredients = product.ingredients_text || "";
    const brand = product.brands || "Unknown";

    // Placeholder data so results page can show image + name (no Gemini analysis yet)
    const riskScore = 0;
    const verdict = "Safe";
    const analysisSummary = "Product info from OpenFoodFacts. AI analysis will be available when Gemini is re-enabled.";
    const flaggedIngredients = [];
    const alternatives = [];

    // 2️⃣ Save Scan History (with placeholder analysis fields)
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
        alternatives: alternatives.map(p => ({ productName: p }))
      }).save();
    }

    // 3️⃣ Response (name, image, ingredients from OpenFoodFacts)
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

    // ----- GEMINI API (commented out – re-enable when integrating again) -----
    // const user = req.user || {};
    // const healthCondition = user.healthCondition || "none";
    // const allergies = user.allergies || [];
    //
    // const prompt = `
    //     You are a food ingredient risk analysis engine.
    //     Analyze the following product:
    //     Product Name: "${productName}"
    //     Ingredients: "${ingredients}"
    //     User Health Context:
    //     - Health Condition: ${healthCondition}
    //     - Allergies: ${allergies.length ? allergies.join(", ") : "None"}
    //     Rules:
    //     - Consider Indian packaged food context.
    //     - Be conservative and factual.
    //     - Do NOT give medical advice.
    //     - Consider allergies and health condition while assigning risk.
    //     Return ONLY a valid JSON object. NO markdown.
    //     JSON Schema:
    //     {
    //       "riskScore": 0-100,
    //       "verdict": "Safe" | "Moderate" | "Risky" | "Hazardous",
    //       "analysisSummary": "One short sentence summary",
    //       "flaggedIngredients": [ { "name": "...", "risk": "Low|Medium|High", "reason": "..." } ],
    //       "alternatives": [ "suggestion 1", "suggestion 2" ]
    //     }
    // `;
    // const aiResult = await model.generateContent(prompt);
    // const aiText = aiResult.response.text();
    // const cleanJson = aiText.replace(/```json|```/g, "").trim();
    // const parsedData = JSON.parse(cleanJson);
    // Then use parsedData.riskScore, parsedData.verdict, etc. in response and ScanHistory.
    // ----- END GEMINI API -----
  } catch (error) {
    console.error("Barcode Lookup Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to lookup barcode"
    });
  }
};

export { processImageScan, processBarcodeSearch };
