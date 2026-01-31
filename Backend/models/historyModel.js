import mongoose from "mongoose";

const ScanHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  scannedAt: {
    type: Date,
    default: Date.now
  },
  scanType: {
    type: String,
    enum: ['barcode', 'image_ocr', 'manual_search'],
    required: true
  },
  productName: {
    type: String,
    default: "Unknown Product"
  },
  barcode: {
    type: String,
    trim: true
  },
  scannedImageUrl: {
    type: String, 
    required: true
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  verdict: {
    type: String,
    enum: ['Safe', 'Moderate', 'Risky', 'Hazardous'],
    required: true
  },
  analysisSummary: {
    type: String,
  },
  flaggedIngredients: [{
    ingredientName: String,
    riskLevel: String,
    reason: String
  }],
  
  alternatives: [{
    productName: String,
    reason: String,
    imageUrl: String,
    purchaseLink: String
  }]
});

export const ScanHistory = mongoose.model("ScanHistory", ScanHistorySchema);