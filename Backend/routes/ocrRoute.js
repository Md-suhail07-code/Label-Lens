import express from 'express';
import multer from 'multer';
import { processImageScan, processBarcodeSearch } from '../controllers/ocrController.js';
import { isAuthenticated } from '../middleware/isAuthenticated.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/process-scan', isAuthenticated, upload.single('image'), processImageScan);
router.post('/barcode-lookup', isAuthenticated, processBarcodeSearch);

export default router;