# Database Setup Instructions

## Creating Tables in Supabase

You need to create the following tables in your Supabase database to enable progress tracking:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `migrations/001_create_progress_tables.sql`
5. Click **Run** to execute the SQL

### Option 2: Using psql Command Line

If you have `psql` installed locally:

```bash
psql "postgresql://[user]:[password]@[host]:[port]/[database]" < migrations/001_create_progress_tables.sql
```

You can find your connection string in Supabase Dashboard > Database > Connection String

## Tables Created

### 1. `user_courses`
Stores all courses created by users

**Columns:**
- `id` - UUID primary key
- `user_id` - References auth.users
- `course_title` - Course name
- `syllabus_data` - JSON data of the course
- `status` - 'in_progress', 'completed', or 'archived'
- `progress_percentage` - 0-100
- `created_at` - Timestamp
- `updated_at` - Timestamp

### 2. `lesson_progress`
Tracks which lessons/exercises users have completed

**Columns:**
- `id` - UUID primary key
- `user_id` - References auth.users
- `course_id` - References user_courses
- `week_number` - Week in the course
- `exercise_index` - Index of exercise
- `completed` - Boolean
- `completed_at` - Timestamp

### 3. `practice_submissions`
Stores coding practice submissions

**Columns:**
- `id` - UUID primary key
- `user_id` - References auth.users
- `course_id` - References user_courses (optional)
- `problem_id` - ID of the problem
- `code` - The submitted code
- `language` - Programming language
- `passed` - Boolean indicating if it passed tests
- `submitted_at` - Timestamp

## Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only view their own data
- Users can only insert/update/delete their own records
- The database enforces privacy at the SQL level

## Verification

After running the SQL, verify the tables were created:

1. Go to Supabase Dashboard > Database > Tables
2. You should see:
   - user_courses
   - lesson_progress
   - practice_submissions

If you don't see these tables, check the error message in the SQL Editor and try again.

## Troubleshooting

### Error: "Column 'user_id' references undefined table"
Make sure `auth.users` table exists. This should be created automatically when you enable authentication in Supabase.

### Error: "Already exists"
If tables already exist, you can safely ignore this error. The `IF NOT EXISTS` clauses prevent duplicate creation.

### Error: "Permission denied"
Make sure your Supabase user has permissions to create tables. Use an admin/service role if needed.
