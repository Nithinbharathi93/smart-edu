-- Create user_courses table
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_title TEXT NOT NULL,
  syllabus_data JSONB NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_created_at ON user_courses(created_at DESC);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES user_courses(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  exercise_index INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, week_number, exercise_index)
);

-- Create index for faster queries
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_course_id ON lesson_progress(course_id);

-- Create practice_submissions table
CREATE TABLE IF NOT EXISTS practice_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES user_courses(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  passed BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_practice_submissions_user_id ON practice_submissions(user_id);
CREATE INDEX idx_practice_submissions_course_id ON practice_submissions(course_id);
CREATE INDEX idx_practice_submissions_submitted_at ON practice_submissions(submitted_at DESC);

-- Enable Row Level Security for user_courses
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only see their own courses
CREATE POLICY "Users can view their own courses" ON user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own courses" ON user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" ON user_courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" ON user_courses
  FOR DELETE USING (auth.uid() = user_id);

-- Enable Row Level Security for lesson_progress
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson progress" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson progress" ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress" ON lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable Row Level Security for practice_submissions
ALTER TABLE practice_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions" ON practice_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submissions" ON practice_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
