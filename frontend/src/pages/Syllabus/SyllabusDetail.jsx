// src/pages/Dashboard/SyllabusDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { 
  PlayCircle, 
  Book, 
  CheckCircle2, 
  Loader2, 
  History, 
  ArrowLeft, MessageSquare
} from 'lucide-react';

const SyllabusDetail = () => {
  const { id: syllabusId } = useParams(); // Renamed for clarity
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [existingProblems, setExistingProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Syllabus Detail
        const syllabusRes = await api.get(`/get-syllabus/${syllabusId}`);
        setData(syllabusRes.data);

        // 2. Fetch all problems
        const problemsRes = await api.get('/problems');
        
        // 3. Fix: Ensure type-safe filtering (comparing strings to strings)
        const relevant = problemsRes.data.filter(p => 
          String(p.syllabus_id) === String(syllabusId)
        );
        setExistingProblems(relevant);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [syllabusId]);

  const handlePracticeClick = (week) => {
    // Check if any problem exists for this specific week
    const hasExisting = existingProblems.some(p => p.week_number === week.week_number);

    if (hasExisting) {
      // Meaningful Connection: If history exists, user chooses versioning
      const choice = window.confirm(
        `Unit ${week.week_number} has previous attempts.\n\nOK: Generate a new version\nCancel: View your version history`
      );
      
      if (choice) {
        // Navigate to generate NEW (POST)
        navigate(`/practice/${syllabusId}/${week.week_number}`, {
          state: { concept: week.key_concepts[0], level: data.level }
        });
      } else {
        // Navigate to history list
        navigate(`/problems?syllabus=${syllabusId}&week=${week.week_number}`);
      }
      return;
    }

    // Default: Start fresh
    navigate(`/practice/${syllabusId}/${week.week_number}`, {
      state: { concept: week.key_concepts[0], level: data.level }
    });
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-green-600 w-8 h-8 mb-4" />
      <p className="text-green-600/70 text-[10px] font-black uppercase tracking-[0.2em]">Syncing Journey...</p>
    </div>
  );
  
  if (!data) return <div className="p-8 text-center text-slate-500 text-sm">Syllabus missing.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-green-600/70 hover:text-green-600 font-bold text-[10px] mb-8 transition-colors uppercase tracking-widest"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      {/* Header Info */}
      <div className="bg-green-600 rounded-3xl p-8 text-white mb-10 relative overflow-hidden shadow-xl shadow-indigo-100">
        <div className="relative z-10">
          <div className="h-8 flex justify-between items-start">
            <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
              {data.level} Module
            </span>
            <Button 
              onClick={() => navigate(`/dashboard/chat?syllabus_id=${syllabusId}&level=${data.level}`)}
              className="h-8 px-4 bg-none text-white text-[10px] font-black uppercase hover:bg-zinc-900 shadow-none border border-white/100"
            >
              <MessageSquare size={14} className="mr-2" /> Ask Socratic Tutor
            </Button>
          </div>
          <h1 className="text-3xl font-black mt-3 mb-4 tracking-tight">
            {data.syllabus_data.syllabus_title}
          </h1>
          <div className="flex items-center gap-6 text-indigo-100/70 text-[11px] font-bold">
            <span className="flex items-center gap-2"><Book size={16}/> {data.syllabus_data.weeks.length} Units</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16}/> {existingProblems.length} Problems Saved</span>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-green-500 rounded-full blur-[80px] opacity-40" />
      </div>

      <div className="space-y-4 relative">
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-slate-200 -z-0" />

        {data.syllabus_data.weeks.map((week, index) => {
          // Robust calculation for isPracticed
          const isPracticed = existingProblems.some(p => p.week_number === week.week_number);
          
          return (
            <div key={index} className="relative flex items-start gap-6 group">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm z-10 transition-all border-2 ${
                isPracticed ? 'bg-green-600 border-indigo-100 text-white' : 'bg-white border-slate-100 text-green-600/70'
              }`}>
                {isPracticed ? <CheckCircle2 size={20} /> : <span className="text-sm font-black">{week.week_number}</span>}
              </div>

              <div className={`flex-1 bg-white border rounded-2xl p-6 transition-all hover:border-indigo-200 ${
                isPracticed ? 'border-green-50/50 shadow-sm' : 'border-slate-200'
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-black tracking-tight">{week.theme}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {week.key_concepts.map((concept, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded border border-slate-100 uppercase tracking-tighter">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isPracticed && (
                      <button 
                        onClick={() => navigate(`/problems?syllabus=${syllabusId}&week=${week.week_number}`)}
                        className="p-2 text-green-600/70 hover:text-green-600 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                        title="View Unit History"
                      >
                        <History size={16} />
                        <span>History</span>
                      </button>
                    )}
                    <Button 
                      onClick={() => handlePracticeClick(week)}
                      className={`h-9 px-5 text-[10px] font-black uppercase tracking-widest ${
                        isPracticed ? 'bg-green-600 text-white' : 'bg-black text-white'
                      } border-none transition-all active:scale-95`}
                    >
                      {isPracticed ? "Practice New" : "Start Unit"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyllabusDetail;