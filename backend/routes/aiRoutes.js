import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js'; // Protect these routes
import { 
    getCodeComments, 
    getBigOAnalysis, 
    generateSyllabus, 
    generateQuestions,
    assessUserLevel // <--- Import the new controller
} from '../controllers/aiController.js';

const router = express.Router();

// Route for the assessment (The one giving you the error)
router.post('/assess-level', requireAuth, assessUserLevel); 

// Other AI Routes
router.post('/code-comments', requireAuth, getCodeComments);
router.post('/big-o', requireAuth, getBigOAnalysis);
router.post('/generate-syllabus', requireAuth, generateSyllabus);
router.post('/generate-coding-questions', requireAuth, generateQuestions);

// REMOVED: router.post('/safety-check', checkSafety);

export default router;