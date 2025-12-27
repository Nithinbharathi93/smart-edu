import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CourseList() {
  // Mock data - replace with API fetch
  const courses = [
    { id: 1, title: 'Node.js and Express', progress: 0, total_weeks: 4 },
    { id: 2, title: 'React Fundamentals', progress: 25, total_weeks: 6 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Library</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {courses.map(course => (
             <Link key={course.id} to={`/course/${course.id}`} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <BookOpen size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{course.total_weeks} Weeks Duration</p>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: `${course.progress}%`}}></div>
                </div>
             </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}