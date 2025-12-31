import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/authMiddleware.js';
import { uploadPDF, chatWithPDF,uploadPDFAndGenerateSyllabus } from '../controllers/pdfController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-pdf', requireAuth, upload.single("pdf"), uploadPDF);
router.post('/upload-pdf-and-generate-syllabus', requireAuth, upload.single("pdf"), uploadPDFAndGenerateSyllabus);
router.post('/chat', requireAuth, chatWithPDF);

export default router;