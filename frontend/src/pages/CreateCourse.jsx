import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, BookOpen, Cpu, Loader2, FileText, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null)
  
  // Default mode based on URL query param ?mode=upload
  const [mode, setMode] = useState(searchParams.get('mode') === 'upload' ? 'upload' : 'ai');
  const [loading, setLoading] = useState(false);
  
  // AI Form State
  const [formData, setFormData] = useState({
    topic: '',
    level: 'Intermediate',
    duration: '4 weeks'
  });

  // PDF Form State
  const [file, setFile] = useState(null);

// inside CreateCourse.jsx

const handleAiSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Get the token stored during login
    const token = localStorage.getItem('token'); 

    if (!token) {
        alert("You are not logged in!");
        navigate('/login');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/ai/generate-syllabus', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // 2. Attach the token here
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                topics: formData.topic,
                level: formData.level,
                duration: formData.duration
            })
        });

        // 3. Check if the request was actually successful
        if (!response.ok) {
            throw new Error('Failed to generate syllabus. Status: ' + response.status);
        }
        
        const data = await response.json();
        
        // Validate response - expected top-level key `syllabus_title`
        if (!data || !data.syllabus_title) {
          console.error('Unexpected syllabus response:', data);
          alert('Received unexpected syllabus format from AI. Check server logs.');
          setLoading(false);
          return;
        }

        // Save course to database
        try {
          const saveCourseResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/progress/save-course`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
              courseTitle: formData.topic,
              syllabusData: data
            })
          });
          
          if (saveCourseResponse.ok) {
            const savedCourse = await saveCourseResponse.json();
            console.log('Course saved:', savedCourse);
          } else {
            console.warn('Could not save course, status:', saveCourseResponse.status);
          }
        } catch (saveError) {
          console.error("Warning: Could not save course to database:", saveError);
        }
        
        navigate(`/course/generated-${Date.now()}`, { state: { courseData: data } });

    } catch (error) {
        console.error("Failed to generate:", error);
        alert(error.message); // Show the actual error to the user
    } finally {
        setLoading(false);
    }
};

  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const token = localStorage.getItem('token');

    if (!token) {
      alert("You are not logged in!");
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('http://localhost:5000/api/pdf/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload PDF. Status: ' + response.status);
      }

      navigate('/chat'); // Redirect to chat after upload
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

    const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Learning Path</h1>
          <p className="text-gray-500">Choose how you want to start your learning journey</p>
        </div>

        {/* Toggle Switch */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex mb-8">
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'ai' 
                ? 'bg-green-100 text-green-700 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Cpu size={18} />
            AI Generated
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'upload' 
                ? 'bg-green-100 text-green-700 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Upload size={18} />
            Upload Material
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          
          {mode === 'ai' ? (
            <form onSubmit={handleAiSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What do you want to learn?</label>
                <input 
                  type="text" 
                  placeholder="e.g. Node.js, Advanced React, Python for Data Science..." 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-white"
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-white"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  >
                    <option>1 week</option>
                    <option>2 weeks</option>
                    <option>4 weeks</option>
                    <option>8 weeks</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : <BookOpen size={20} />}
                {loading ? 'Generating Syllabus...' : 'Generate Syllabus'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePdfSubmit} className="text-center py-8">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 mb-6 flex flex-col items-center justify-center hover:bg-gray-50 transition cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>
                {file ? (
                  <div>
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-900">Click or drag PDF here</p>
                    <p className="text-sm text-gray-500 mt-1">Upload textbooks or lecture notes</p>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={!file || loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                {loading ? 'Processing PDF...' : 'Upload & Start Chat'}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}