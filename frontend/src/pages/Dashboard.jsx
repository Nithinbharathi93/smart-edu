import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Upload, PlayCircle } from 'lucide-react';

// Import the new components
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!storedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchUserCourses(token);
    }
  }, [navigate]);

  const fetchUserCourses = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/progress/courses', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Prevent flash of content before redirect
  if (!user) return null; 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* 1. Use the Navbar Component */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* 2. Main Dashboard Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-12">
        
        <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-500">Welcome back, <span className="font-semibold text-green-700">{user.email}</span>! Ready to learn?</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          
          {/* Action 1: Create New Course */}
          <Link 
            to="/create-course" 
            className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition flex items-start gap-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
                <Plus size={100} className="text-green-600" />
            </div>
            <div className="bg-green-100 text-green-600 p-4 rounded-xl group-hover:bg-green-600 group-hover:text-white transition z-10">
              <Plus size={32} />
            </div>
            <div className="z-10">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create Learning Path</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Generate a custom syllabus and coding exercises for any topic.
              </p>
            </div>
          </Link>

          {/* Action 2: Upload Material */}
          <Link 
            to="/create-course?mode=upload" 
            className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition flex items-start gap-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
                <Upload size={100} className="text-gray-900" />
            </div>
            <div className="bg-gray-100 text-gray-600 p-4 rounded-xl group-hover:bg-gray-900 group-hover:text-white transition z-10">
              <Upload size={32} />
            </div>
            <div className="z-10">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Study Material</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Upload PDFs to chat with your textbooks and generate quizzes.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Activity Section */}
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-green-600"/> Your Learning Paths
        </h2>
        
        {/* Courses Grid or Empty State */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading your courses...</p>
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/course/${course.id}`}
                state={{ courseData: course.syllabus_data }}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition flex-1">
                      {course.course_title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      course.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 font-medium">Progress</span>
                      <span className="text-xs font-bold text-gray-900">{course.progress_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.syllabus_data?.targetAudience || 'Learning path'}
                  </p>

                  <div className="text-xs text-gray-500">
                    Created {new Date(course.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
              <PlayCircle size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No active courses</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              You haven't started any learning paths yet.
            </p>
            <Link to="/create-course" className="text-green-600 font-semibold hover:text-green-700 hover:underline">
              Start your first course &rarr;
            </Link>
          </div>
        )}

      </main>

      {/* 3. Use the Footer Component */}
      <Footer />
      
    </div>
  );
}