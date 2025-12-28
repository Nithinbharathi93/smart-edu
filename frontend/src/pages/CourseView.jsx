import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Code, BookOpen, CheckCircle, Clock, Layout, Terminal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CourseView() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Transform the new data structure to match component expectations
  const transformCourseData = (data) => {
    // Accept either `course_goals` or legacy `learning_goals`
    const topLevelGoals = data.course_goals || data.learning_goals || [];

    const weeks = (data.weeks || []).map((week, idx) => {
      return {
        weekNumber: week.week_number ?? idx + 1,
        topic: week.theme || week.topic || `Week ${idx + 1}`,
        topicsCovered: week.key_concepts || week.topics || week.topicsCovered || [],
        keyConcepts: week.key_concepts || [],
        exercises: week.activities_and_exercises || week.recommended_problems || week.exercises || [],
        recommendedResources: week.recommended_resources || [],
        notes: week.notes || ''
      };
    });

    return {
      syllabusTitle: data.syllabus_title || data.syllabusTitle || 'Untitled Syllabus',
      targetAudience: data.target_audience || data.targetAudience || '',
      prerequisites: data.prerequisites || [],
      learningObjectives: topLevelGoals,
      weeks
    };
  };

  const [courseData, setCourseData] = useState(
    location.state?.courseData 
      ? transformCourseData(location.state.courseData)
      : null
  );
  const [expandedWeek, setExpandedWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(storedUser));

    if (!courseData) {
      // If no state data, redirect back to create course
      navigate('/create-course');
    } else {
      setLoading(false);
    }
  }, [courseData, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user || loading || !courseData) return null;

  console.log(courseData)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Course Header Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  AI Generated
                </span>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  {courseData.weeks.length} Weeks
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                {courseData.syllabusTitle}
              </h1>
              <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">
                {courseData.targetAudience}
              </p>
            </div>
            
            <div className="flex gap-3">
               <Link to={`/practice/${courseId || 'generated-course'}/1/1`} state={{ courseData }} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition shadow-sm">
                  <Terminal size={18} />
                  Practice
               </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Col: Syllabus Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layout size={24} className="text-green-600" />
            Course Syllabus
          </h2>

          <div className="space-y-4">
            {courseData.weeks.map((week, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  expandedWeek === index ? 'border-green-500 shadow-md' : 'border-gray-200 shadow-sm hover:border-green-200'
                }`}
              >
                {/* Accordion Header */}
                <button 
                  onClick={() => setExpandedWeek(expandedWeek === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      expandedWeek === index ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'
                    }`}>
                      W{week.weekNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{week.topic}</h3>
                      <p className="text-sm text-gray-500">{week.topicsCovered.length} Topics • {week.exercises.length} Exercises</p>
                    </div>
                  </div>
                  {expandedWeek === index ? <ChevronUp className="text-green-600" /> : <ChevronDown className="text-gray-400" />}
                </button>

                {/* Accordion Body */}
                {expandedWeek === index && (
                  <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50/50">
                    
                    {/* Topics List */}
                    <div className="mt-6">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Topics Covered</h4>
                      <ul className="grid gap-2">
                        {week.topicsCovered.map((topic, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-700 bg-white p-3 rounded-lg border border-gray-100">
                            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Concepts */}
                    {week.keyConcepts && (
                      <div className="mt-6">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Key Concepts</h4>
                        <div className="flex flex-wrap gap-2">
                          {week.keyConcepts.map((concept, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold border border-blue-100">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {week.notes && (
                      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800"><span className="font-bold">Note:</span> {week.notes}</p>
                      </div>
                    )}

                    {/* Exercises Card */}
                    <div className="mt-6 bg-gray-900 text-white p-5 rounded-xl relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-green-400 font-bold text-xs uppercase tracking-wider">
                          <Code size={14} /> Recommended Problems
                        </div>
                        <ul className="space-y-3 mb-4">
                          {week.exercises.slice(0, 6).map((exercise, i) => (
                            <li key={i} className="text-sm text-gray-300 flex gap-2">
                              <span className="text-green-400 font-bold">•</span>
                              {exercise}
                            </li>
                          ))}
                        </ul>
                        <Link to={`/practice/${courseId || 'generated-course'}/${week.weekNumber}/1`} state={{ courseData }} className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition">
                          Start Exercises <Terminal size={14} />
                        </Link>
                      </div>
                      {/* Decorative bg element */}
                      <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                         <Code size={100} />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Metadata Sidebar */}
        <div className="space-y-6">
          
          {/* Prerequisites Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-gray-400" />
              Prerequisites
            </h3>
            <ul className="space-y-3">
              {courseData.prerequisites.map((req, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Learning Objectives */}
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              What you'll learn
            </h3>
            <ul className="space-y-3">
              {courseData.learningObjectives.slice(0, 5).map((obj, i) => (
                <li key={i} className="text-sm text-green-800 flex gap-2">
                  <span className="font-bold">•</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}