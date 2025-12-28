import { ProgressModel } from '../models/ProgressModel.js';

export const saveCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseTitle, syllabusData } = req.body;

    if (!courseTitle || !syllabusData) {
      return res.status(400).json({ error: 'courseTitle and syllabusData are required' });
    }

    // Pass 'ai' as the source_type for AI-generated courses
    const course = await ProgressModel.saveCourse(userId, courseTitle, syllabusData, 'ai');
    res.status(201).json({
      success: true,
      message: 'Course saved successfully',
      course
    });
  } catch (error) {
    console.error('Error saving course:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const courses = await ProgressModel.getUserCourses(userId);
    
    res.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    const course = await ProgressModel.getCourse(courseId, userId);
    res.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateCourseProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;
    const { progressPercentage, status } = req.body;

    if (!courseId || progressPercentage === undefined) {
      return res.status(400).json({ error: 'courseId and progressPercentage are required' });
    }

    const updatedCourse = await ProgressModel.updateCourseProgress(
      courseId,
      userId,
      progressPercentage,
      status
    );

    res.json({
      success: true,
      message: 'Course progress updated',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ error: error.message });
  }
};

export const saveLessonCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, weekNumber, exerciseIndex } = req.body;

    if (!courseId || weekNumber === undefined || exerciseIndex === undefined) {
      return res.status(400).json({ error: 'courseId, weekNumber, and exerciseIndex are required' });
    }

    const lessonProgress = await ProgressModel.saveLessonCompletion(
      userId,
      courseId,
      weekNumber,
      exerciseIndex,
      true
    );

    res.json({
      success: true,
      message: 'Lesson marked as complete',
      progress: lessonProgress
    });
  } catch (error) {
    console.error('Error saving lesson completion:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getLessonProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    const progress = await ProgressModel.getLessonProgress(userId, courseId);
    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    res.status(500).json({ error: error.message });
  }
};

export const savePracticeSubmission = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, problemId, code, language, isPassed } = req.body;

    if (!courseId || !problemId || !code || !language) {
      return res.status(400).json({ error: 'courseId, problemId, code, and language are required' });
    }

    const submission = await ProgressModel.savePracticeSubmission(
      userId,
      courseId,
      problemId,
      code,
      language,
      isPassed || false
    );

    res.json({
      success: true,
      message: 'Practice submission saved',
      submission
    });
  } catch (error) {
    console.error('Error saving practice submission:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPracticeSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.query;

    const submissions = await ProgressModel.getPracticeSubmissions(userId, courseId || null);
    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching practice submissions:', error);
    res.status(500).json({ error: error.message });
  }
};
