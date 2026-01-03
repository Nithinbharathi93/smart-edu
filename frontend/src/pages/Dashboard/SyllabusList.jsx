import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SyllabusCard from '../../components/ui/Card';
import { Search, Loader2, BookOpen } from 'lucide-react';

const SyllabusList = () => {
  const navigate = useNavigate();
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSyllabi = async () => {
      try {
        const { data } = await api.get('/my-courses'); // Updated endpoint
        setSyllabi(data);
      } catch (err) {
        console.error("Error fetching library:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabi();
  }, []);

  // Filter logic using the new flat syllabus_title
  const filtered = syllabi.filter(s => 
    s.syllabus_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Course Library</h1>
        <p className="text-slate-500">Access all your AI-tailored study plans.</p>
      </div>

      <div className="relative mb-10 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600/70" size={20} />
        <input 
          type="text" 
          placeholder="Search courses..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-50/500 outline-none shadow-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((s) => (
            <SyllabusCard 
              key={s.id}
              title={s.syllabus_title} // Updated mapping
              level={s.level}
              duration={s.duration}
              progress={0}
              onClick={() => navigate(`/dashboard/syllabi/${s.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <BookOpen className="text-slate-300 mx-auto mb-4" size={40} />
          <p className="text-slate-500 font-medium">No courses match your search.</p>
        </div>
      )}
    </div>
  );
};

export default SyllabusList;