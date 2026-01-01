// src/pages/Dashboard/SyllabusDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { ChevronRight, PlayCircle, Book, CheckCircle2, Loader2 } from 'lucide-react';

const SyllabusDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/get-syllabus/${id}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!data) return <div className="p-8 text-center">Syllabus not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="bg-indigo-600 rounded-3xl p-8 text-white mb-10 relative overflow-hidden shadow-xl shadow-indigo-100">
        <div className="relative z-10">
          <span className="bg-indigo-500/50 text-indigo-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {data.level} Path
          </span>
          <h1 className="text-4xl font-extrabold mt-3 mb-2">{data.syllabus_data.syllabus_title}</h1>
          <div className="flex items-center gap-6 text-indigo-100">
            <span className="flex items-center gap-2"><Book size={18}/> {data.syllabus_data.weeks.length} Weeks</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={18}/> 0% Completed</span>
          </div>
        </div>
        {/* Decorative Graphic */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
      </div>

      {/* Timeline Section */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-z-10 before:h-full before:w-0.5 before:bg-slate-200">
        {data.syllabus_data.weeks.map((week, index) => (
          <div key={index} className="relative flex items-start gap-8 group">
            {/* Week Number Indicator */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center shadow-sm z-10 group-hover:border-indigo-100 transition-colors">
              <span className="text-sm font-bold text-slate-800">{week.week_number}</span>
            </div>

            {/* Week Card */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{week.theme}</h3>
                  <div className="flex flex-wrap gap-2">
                    {week.key_concepts.map((concept, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-100">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
                
                <Button 
  onClick={() => navigate(`/practice/${id}/${week.week_number}`, {
    state: { 
      concept: week.key_concepts[0], // Sending the first concept to the AI
      level: data.level              // Sending the syllabus level
    }
  })}
  className="bg-indigo-50 text-indigo-600 border-none"
>
  Start Practice
</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyllabusDetail;