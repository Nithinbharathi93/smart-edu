# 🔧 Authentication Fix Guide

## Problem
You were getting **403 Forbidden** errors when trying to access protected API endpoints like `/api/progress/courses` and `/api/ai/generate-syllabus`.

## Root Cause
The authentication middleware was not properly verifying JWT tokens because:
1. `jsonwebtoken` package was not installed (now added to package.json)
2. The middleware wasn't using proper JWT verification with the SUPABASE_JWT_SECRET
3. Missing environment variables in .env file

## ✅ Fix Applied

### 1. Added jsonwebtoken to package.json
Updated `backend/package.json` to include `"jsonwebtoken": "^9.1.2"`

### 2. Improved authMiddleware.js
- Now uses `jwt.verify()` with SUPABASE_JWT_SECRET for proper token validation
- Correctly extracts user ID from token's `sub` (subject) claim
- Better error messages for debugging
- Removes dependency on deprecated Supabase auth.getUser() method

### 3. Created .env.example
Reference file showing all required environment variables

## 🚀 Steps to Complete the Fix

### Step 1: Copy Environment Variables
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_KEY`
   - **Service role key** → `SUPABASE_SERVICE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET` (scroll down to find it)

### Step 2: Create .env file
In `backend/` directory, create a `.env` file:

```bash
# Copy from Supabase dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Get these from respective services
HUGGINGFACE_API_KEY=your-huggingface-token
GEMINI_API_KEY=your-google-api-key

# Server settings
PORT=5000
NODE_ENV=development
```

### Step 3: Install Dependencies
```bash
cd backend
npm install
```

### Step 4: Test Authentication
Once the environment variables are set and npm install completes:

1. Start the backend:
   ```bash
   npm start
   ```

2. In the frontend, create a new course via **CreateCourse** page

3. Check the backend console for:
   - Should see proper JWT verification success
   - No more 403 errors
   - User ID properly extracted from token

### Step 5: Verify Database Tables
Before testing the full flow, make sure the database tables exist:

1. Go to Supabase → **SQL Editor**
2. Run the migration from `backend/migrations/001_create_progress_tables.sql`
3. This creates:
   - `user_courses` table
   - `lesson_progress` table
   - `practice_submissions` table

## 🔍 How JWT Verification Works Now

**Token Flow:**
1. **Frontend** stores token from login in localStorage
2. **Frontend** sends token in Authorization header: `Bearer <token>`
3. **Backend middleware** extracts token and verifies it using SUPABASE_JWT_SECRET
4. **Backend middleware** extracts user ID from token's `sub` claim
5. **Backend** attaches `req.user` with {id, email, aud}
6. **Route handler** accesses user ID via `req.user.id`

**Token Structure (JWT):**
```
Header: { alg: 'HS256', typ: 'JWT' }
Payload: { 
  sub: 'user-uuid',           // User ID
  email: 'user@example.com',
  aud: 'authenticated',
  exp: timestamp,             // Expiration
  iat: timestamp              // Issued at
}
Signature: HMACSHA256(header.payload, SUPABASE_JWT_SECRET)
```

## 🐛 Troubleshooting

### Still getting 403 errors?
1. **Check .env file** - Ensure SUPABASE_JWT_SECRET is correct
   - Go to Supabase → Settings → API → JWT Secret
   - Copy the entire value

2. **Clear browser storage** - Old/invalid tokens might be cached
   - Open DevTools → Application → Local Storage
   - Delete 'token' and 'user' entries
   - Log in again

3. **Check backend logs** - Should see:
   ```
   JWT verification error: ... (if token invalid)
   Auth middleware error: ... (if other issue)
   ```

4. **Verify npm install ran** - Check `backend/node_modules/` exists
   - If not, run: `npm install` in backend directory

### Can't find SUPABASE_JWT_SECRET?
1. Go to Supabase Dashboard
2. Select your project
3. Settings → API
4. Look for "JWT Secret" section (might need to scroll)
5. Copy the long string (looks like "super-secret-jwt-token-xxxx...")

## 📋 Checklist

- [ ] Created `backend/.env` file with all Supabase keys
- [ ] Ran `npm install` in backend directory
- [ ] Created database tables (SQL migration)
- [ ] Started backend server (`npm start`)
- [ ] Logged in with a test account
- [ ] Created a course from CreateCourse page
- [ ] Verified courses show on Dashboard
- [ ] Checked browser console for no errors
- [ ] Checked backend console for proper JWT verification

## ✨ Expected Result

After completing these steps:
- ✅ Dashboard loads without 403 errors
- ✅ CreateCourse can generate syllabus
- ✅ CreateCourse saves course to database
- ✅ Dashboard displays user's courses with progress bars
- ✅ Can navigate to CourseView and Practice pages
- ✅ Progress is tracked and saved to database

## 📞 If Still Having Issues

Check these files to verify setup:
- `backend/.env` - Has all required variables
- `backend/package.json` - Has `jsonwebtoken` in dependencies
- `backend/middleware/authMiddleware.js` - Uses `jwt.verify()` properly
- `backend/config/supabaseClient.js` - Uses correct URL and keys
