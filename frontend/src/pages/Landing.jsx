import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Code, Upload } from 'lucide-react';

// Import Shared Components
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Landing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Check login status so Navbar shows the right buttons (Login vs Dashboard)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      
      {/* 1. Shared Navbar */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* 2. Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 mt-16 mb-24">
        <div className="inline-block p-2 px-4 rounded-full bg-green-50 text-green-700 font-semibold text-sm mb-6 border border-green-100 animate-fade-in-up">
          🚀 AI-Powered Learning is Here
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          Master any skill with a <br />
          <span className="text-green-600">Personalized Roadmap.</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          Upload your textbook or let our AI generate a custom syllabus. 
          Solve coding questions tailored to <em>your</em> level, not a generic list.
        </p>
        
        <div className="flex gap-4">
            <Link to="/register" className="px-8 py-4 bg-gray-900 text-white text-lg font-bold rounded-xl shadow-xl hover:bg-gray-800 transition transform hover:-translate-y-1">
              Start Learning Free
            </Link>
            <Link to="/dashboard" className="px-8 py-4 bg-white text-gray-900 border border-gray-200 text-lg font-bold rounded-xl shadow-sm hover:border-green-300 hover:text-green-700 transition">
              {user ? "Go to Dashboard" : "View Demo"}
            </Link>
        </div>
      </main>

      {/* 3. Features Grid */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900">Why choose Smart Edu?</h2>
                <div className="h-1 w-20 bg-green-500 mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Syllabus */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 group">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Custom Syllabus</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tell us the topic (e.g., "ReactJS"), and we generate a structured 4-week plan. No more guessing what to learn next.
                </p>
            </div>

            {/* Feature 2: Coding */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 group">
                <div className="w-14 h-14 bg-gray-900 text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Code size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Adaptive Coding</h3>
                <p className="text-gray-600 leading-relaxed">
                  Practice with AI-generated problems. Get real-time feedback, hints, and "Big-O" complexity analysis instantly.
                </p>
            </div>

            {/* Feature 3: PDF Upload */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 group">
                <div className="w-14 h-14 bg-green-600 text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <Upload size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Study from Material</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload your college notes or textbooks. Our AI becomes a study companion that answers questions from <em>your</em> files.
                </p>
            </div>
            </div>
        </div>
      </section>

      {/* 4. Shared Footer */}
      <Footer />
    </div>
  );
}