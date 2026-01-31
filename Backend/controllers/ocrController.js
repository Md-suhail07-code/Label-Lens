import vision from '@google-cloud/vision';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import axios from 'axios'; // Added for fetching images
import { ScanHistory } from '../models/historyModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const visionClient = new vision.ImageAnnotatorClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash" // Updated to stable model name, or keep "gemini-3-flash-preview" if you have access
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

// ---------- Helper: Fetch Image from OFF ----------
async function fetchProductImage(productName) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl`;
    const res = await axios.get(url, {
      params: {
        search_terms: productName,
        search_simple: 1,
        action: 'process',
        json: 1,
        page_size: 1, // We only need the top result
        fields: 'image_front_small_url,image_front_url,product_name'
      },
      timeout: 3000 // Short timeout to not slow down response too much
    });

    const products = res.data?.products || [];
    if (products.length > 0) {
      // Return the image URL if found
      return products[0].image_front_small_url || products[0].image_front_url || null;
    }
  } catch (error) {
    console.log(`   [OFF Search Failed for ${productName}]:`, error.message);
  }
  return null;
}

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
        
        CRITICAL INSTRUCTION FOR ALTERNATIVES:
        - Provide exactly 3 "Cleaner alternative" suggestions.
        - These must be SPECIFIC BRANDED PRODUCTS available in the Indian Market (e.g., "Tata Soulfull Ragi Bites" instead of just "Ragi bites").
        - They must be in the same category as the scanned item.

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
            "Specific Brand Product Name 1",
            "Specific Brand Product Name 2",
            "Specific Brand Product Name 3"
          ]
        }
        `;

    // 4️⃣ Gemini Call
    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text();

    // 5️⃣ Safe JSON cleanup
    const cleanJson = aiText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    // 6️⃣ ENRICH ALTERNATIVES WITH IMAGES (New Feature)
    let enrichedAlternatives = [];
    if (parsedData.alternatives && Array.isArray(parsedData.alternatives)) {
        console.log("🔍 Fetching images for alternatives:", parsedData.alternatives);
        
        // Execute OFF queries in parallel
        enrichedAlternatives = await Promise.all(
            parsedData.alternatives.map(async (altName) => {
                const img = await fetchProductImage(altName);
                return {
                    name: altName,
                    image: img,
                    productName: altName // Backwards compatibility for DB/Frontend
                };
            })
        );
    }

    // Replace string array with object array in parsedData
    parsedData.alternatives = enrichedAlternatives;

    // 7️⃣ Save Scan History
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
        // Save the enriched objects (ensure your Mongoose model supports object array or mixed for alternatives)
        alternatives: parsedData.alternatives 
      }).save();
    }

    // 8️⃣ Response
    res.json({
      success: true,
      data: {
        imageUrl,
        extractedText,
        ...parsedData // This now includes alternatives with images
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