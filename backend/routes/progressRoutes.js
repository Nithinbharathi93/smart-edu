import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  saveCourse,
  getUserCourses,
  getCourse,
  updateCourseProgress,
  saveLessonCompletion,
  getLessonProgress,
  savePracticeSubmission,
  getPracticeSubmissions
} from '../controllers/progressController.js';

const router = express.Router();

// Course Routes
router.post('/save-course', requireAuth, saveCourse);
router.get('/courses', requireAuth, getUserCourses);
router.get('/courses/:courseId', requireAuth, getCourse);
router.put('/courses/:courseId/progress', requireAuth, updateCourseProgress);

// Lesson Progress Routes
router.post('/lessons/complete', requireAuth, saveLessonCompletion);
router.get('/courses/:courseId/lessons', requireAuth, getLessonProgress);

// Practice Submission Routes
router.post('/submissions', requireAuth, savePracticeSubmission);
router.get('/submissions', requireAuth, getPracticeSubmissions);

export default router;
