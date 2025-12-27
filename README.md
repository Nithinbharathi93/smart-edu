# 🚀 Smart-Edu: AI-Powered Learning Platform

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-v18+-43853d?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.2.1-90c53f?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**The Future of Learning is Here** 🎓 ✨

Transform how students learn with AI-powered course generation, intelligent problem solving, and real-time progress tracking.

[Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [Architecture](#architecture)

</div>

---

## 🌟 Features

### 🤖 AI-Powered Course Generation
- **Intelligent Syllabus Creation**: Generate comprehensive courses with AI using advanced prompts
- **Structured Learning Paths**: Organized by weeks with topics, key concepts, and recommended problems
- **Multi-Format Input**: Create courses from text prompts or upload PDF materials
- **Customizable Difficulty Levels**: Beginner, Intermediate, Advanced course generation

### 💻 Integrated Coding Environment
- **Live Code Execution**: Real-time code compilation and execution via Piston API
- **Multi-Language Support**: Python, JavaScript, Java, C++ and more
- **Instant Feedback**: See output immediately as you write
- **Problem Showcase**: Curated DSA and algorithm problems with examples

### 🧠 AI-Powered Code Analysis
- **Intelligent Hints**: Get contextual hints without spoiling solutions
- **Code Review**: AI analyzes your code and provides:
  - Strengths of your approach
  - Areas for improvement
  - Edge case suggestions
  - Time & Space complexity analysis
- **Learning-Focused Feedback**: Hints designed to guide, not just answer

### 📊 Progress Tracking & Analytics
- **Course Dashboard**: View all your courses at a glance
- **Progress Bars**: Visual representation of course completion
- **Lesson Tracking**: Monitor which lessons you've completed
- **Practice History**: Track all coding submissions and results
- **Performance Metrics**: Understand your learning journey

### 🔐 Secure Authentication
- **Supabase Auth**: Industry-standard JWT authentication
- **Row-Level Security**: Your data is yours alone
- **Session Management**: Persistent login with token storage
- **Safe Data Access**: All queries protected with user verification

### 📱 Responsive Design
- **Mobile-Friendly**: Works seamlessly on all devices
- **Beautiful UI**: Tailwind CSS with custom components
- **Dark Mode Ready**: Modern, eye-friendly interface
- **Smooth Animations**: Polished user experience

---

## 🛠️ Tech Stack

### Frontend
```
⚛️  React 19.2.0       - UI Framework
🎨 Tailwind CSS 3.4.19 - Styling
🧭 React Router DOM    - Navigation
✨ Lucide React        - Icons
⚡ Vite               - Build Tool
```

### Backend
```
🚀 Express 5.2.1       - Web Framework
🔑 Supabase           - Auth & Database
🤖 Google Gemini AI   - Course Generation
🧠 HuggingFace API    - Code Analysis
📄 Multer             - File Uploads
```

### Database
```
🗄️  PostgreSQL (Supabase) - Primary Database
🔒 Row Level Security     - Data Protection
📊 Real-time Updates      - Live Synchronization
```

---

## 📋 Project Structure

```
smart-edu/
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateCourse.jsx
│   │   │   ├── CourseView.jsx
│   │   │   └── Practice.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                   # Express API
│   ├── config/                # Configuration files
│   │   ├── supabaseClient.js
│   │   └── aiConfig.js
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── aiController.js
│   │   ├── compilerController.js
│   │   ├── pdfController.js
│   │   └── progressController.js
│   ├── models/                # Database models
│   │   ├── DocumentModel.js
│   │   ├── ResourceModel.js
│   │   └── ProgressModel.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── compilerRoutes.js
│   │   ├── pdfRoutes.js
│   │   └── progressRoutes.js
│   ├── middleware/            # Express middleware
│   │   └── authMiddleware.js
│   ├── migrations/            # Database migrations
│   │   └── 001_create_progress_tables.sql
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Google Gemini API key
- HuggingFace API key

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/smart-edu.git
cd smart-edu

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2️⃣ Environment Setup

**Backend** - Create `backend/.env`:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI Services
HUGGINGFACE_API_KEY=your-huggingface-token
GEMINI_API_KEY=your-google-api-key

# Server
PORT=5000
NODE_ENV=development
```

**Frontend** - Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3️⃣ Database Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Copy the SQL migration from `backend/migrations/001_create_progress_tables.sql`
3. Run it in Supabase SQL Editor
4. Tables created: `user_courses`, `lesson_progress`, `practice_submissions`

### 4️⃣ Run the Application

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` 🎉

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup          - Register new user
POST   /api/auth/login           - Login user
```

### AI Services
```
POST   /api/ai/generate-syllabus    - Generate course syllabus
POST   /api/ai/generate-questions   - Generate practice problems
POST   /api/ai/code-comments        - Analyze code and provide hints
POST   /api/ai/big-o-analysis       - Analyze time/space complexity
```

### Compiler
```
POST   /api/compiler/execute        - Execute code
```

### Progress Tracking
```
POST   /api/progress/save-course                    - Save course to user account
GET    /api/progress/courses                       - Get all user courses
GET    /api/progress/courses/:courseId             - Get specific course
PUT    /api/progress/courses/:courseId/progress    - Update course progress
POST   /api/progress/lessons/complete              - Mark lesson complete
GET    /api/progress/courses/:courseId/lessons     - Get lesson progress
POST   /api/progress/submissions                   - Save code submission
GET    /api/progress/submissions                   - Get submission history
```

---

## 🎨 User Flows

### 📚 For Learners
1. **Sign Up** → Create account with email/password
2. **Explore** → Browse available courses
3. **Create Course** → Generate AI course or upload materials
4. **Learn** → Study syllabus with organized weekly content
5. **Practice** → Solve coding problems with AI guidance
6. **Track Progress** → Monitor learning on dashboard

### 🏫 For Teachers (Future)
- Create structured courses
- Set custom problems
- Monitor student progress
- Generate reports

---

## 🔐 Security Features

✅ **JWT Authentication** - Secure token-based auth
✅ **Row Level Security** - Database-level access control
✅ **Password Hashing** - Bcrypt encryption via Supabase
✅ **HTTPS Ready** - Production-grade security
✅ **CORS Protected** - Restricted API access
✅ **Input Validation** - Server-side validation

---

## 📊 Database Schema

### user_courses
```sql
id UUID PRIMARY KEY
user_id UUID (references auth.users)
course_title TEXT
syllabus_data JSONB
progress_percentage NUMERIC
status TEXT (in_progress, completed)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### lesson_progress
```sql
id UUID PRIMARY KEY
user_id UUID
course_id UUID
week_number INTEGER
exercise_index INTEGER
completed BOOLEAN
created_at TIMESTAMP
```

### practice_submissions
```sql
id UUID PRIMARY KEY
user_id UUID
course_id UUID
problem_id TEXT
code TEXT
language TEXT
is_passed BOOLEAN
created_at TIMESTAMP
```

---

## 🚦 Status

- ✅ Authentication System
- ✅ Course Generation
- ✅ Syllabus Display
- ✅ Practice Problems
- ✅ Code Execution
- ✅ AI Code Analysis
- ✅ Progress Tracking
- 🔄 Mobile App (Coming Soon)
- 🔄 Team Features (Coming Soon)
- 🔄 Certification (Coming Soon)

---

## 📚 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Express Guide](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com)
- [Google Gemini API](https://ai.google.dev)

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

Need help? We're here for you!

- 📧 Email: support@smart-edu.dev
- 💭 GitHub Issues: [Report a Bug](https://github.com/yourusername/smart-edu/issues)
- 💡 Discussions: [Ask a Question](https://github.com/yourusername/smart-edu/discussions)

---

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Peer-to-peer code review
- [ ] Live collaboration tools
- [ ] Mobile app (React Native)
- [ ] Gamification features
- [ ] Custom curriculum builder
- [ ] AI tutor chatbot
- [ ] Video integration

---

<div align="center">

### Made with ❤️ for the learning community

**[⭐ Star us on GitHub](https://github.com/yourusername/smart-edu)** if you love Smart-Edu!

</div>