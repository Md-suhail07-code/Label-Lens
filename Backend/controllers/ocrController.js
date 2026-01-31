import vision from '@google-cloud/vision';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { ScanHistory } from '../models/historyModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

export default processImageScan;
