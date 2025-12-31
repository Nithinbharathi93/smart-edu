import supabase from '../config/supabaseClient.js';

export const ProgressModel = {
  // Save a course/syllabus for the user
  async saveCourse(userId, courseTitle, syllabusData, sourceType = 'ai', documentId = null) {
    const { data, error } = await supabase
      .from('user_courses')
      .insert({
        user_id: userId,
        course_title: courseTitle,
        syllabus_data: syllabusData,
        source_type: sourceType,
        document_id: documentId,
        status: 'in_progress',
        progress_percentage: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all courses for a user
  async getUserCourses(userId) {
    const { data, error } = await supabase
      .from('user_courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a specific course
  async getCourse(courseId, userId) {
    const { data, error } = await supabase
      .from('user_courses')
      .select('*')
      .eq('id', courseId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update course progress
  async updateCourseProgress(courseId, userId, progressPercentage, status = 'in_progress') {
    const { data, error } = await supabase
      .from('user_courses')
      .update({
        progress_percentage: progressPercentage,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Save lesson/exercise completion
  async saveLessonCompletion(userId, courseId, weekNumber, exerciseIndex, completed = true) {
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        week_number: weekNumber,
        exercise_index: exerciseIndex,
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      }, {
        onConflict: 'user_id,course_id,week_number,exercise_index'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get lesson progress for a course
  async getLessonProgress(userId, courseId) {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) throw error;
    return data;
  },

  // Save coding practice submission
  async savePracticeSubmission(userId, courseId, problemId, code, language, isPassed) {
    const { data, error } = await supabase
      .from('practice_submissions')
      .insert({
        user_id: userId,
        course_id: courseId,
        problem_id: problemId,
        code: code,
        language: language,
        passed: isPassed,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get practice submissions for a user
  async getPracticeSubmissions(userId, courseId = null) {
    let query = supabase
      .from('practice_submissions')
      .select('*')
      .eq('user_id', userId);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query.order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
