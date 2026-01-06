// src/pages/Practice/ProblemList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { 
  Trash2, 
  ExternalLink, 
  Search, 
  Loader2, 
  AlertCircle,
  Database,
  RefreshCw,
  Plus,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

const ProblemList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const syllabusContext = searchParams.get('syllabus');
  const weekContext = searchParams.get('week');

  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchProblems();
  }, [syllabusContext, weekContext]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/problems');
      
      let filtered = data;
      if (syllabusContext && weekContext) {
        filtered = data.filter(p => 
          String(p.syllabus_id) === String(syllabusContext) && 
          String(p.week_number) === String(weekContext)
        );
      }
      
      setProblems(filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error("Failed to fetch problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanent Action: Are you sure you want to delete this version?")) return;
    setDeleteLoading(id);
    try {
      await api.delete(`/problems/${id}`);
      setProblems((prev) => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Delete failed.");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-green-50/500">
      <Loader2 className="animate-spin w-10 h-10 mb-4" />
      <p className="font-mono text-[10px] uppercase tracking-[0.4em]">Retrieving_Versions...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 pb-20">
      <div className="max-w-5xl mx-auto">
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Back to Learning Path
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-green-500">
              <Database size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {syllabusContext ? `Syllabus #${syllabusContext} / Week ${weekContext}` : "Global Repository"}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {syllabusContext ? "Version History" : "Challenge Library"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchProblems}
              className="p-3 bg-black border border-black rounded-xl hover:bg-black text-green-600/70 transition-all"
            >
              <RefreshCw size={18} />
            </button>
            
            {syllabusContext && weekContext && (
              <Button 
                onClick={() => navigate(`/practice/${syllabusContext}/${weekContext}`)} 
                className="h-11 px-6 bg-green-600 hover:bg-green-50/500 border-none text-[11px] font-bold uppercase tracking-wider"
              >
                <Sparkles size={16} className="mr-2" /> Generate New Version
              </Button>
            )}
          </div>
        </div>

        <div className="bg-black/30 border border-black rounded-[2rem] overflow-hidden backdrop-blur-md">
          {problems.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/50 bg-black/50">
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Challenge</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Difficulty</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/30">
                {problems.map((p) => (
                  <tr key={p.id} className="hover:bg-green-50/500/[0.02] transition-colors group">
                    <td className="p-6 text-[10px] font-mono text-slate-500 leading-tight">
                      {new Date(p.created_at).toLocaleDateString()} <br/>
                      <span className="opacity-50">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-slate-200 group-hover:text-green-500 transition-colors text-sm">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">
                        {p.concept}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-[9px] px-2 py-0.5 rounded border font-black uppercase ${
                        p.difficulty === 'Beginner' ? 'border-green-500/20 text-green-500 bg-green-500/5' :
                        p.difficulty === 'Intermediate' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                        'border-rose-500/20 text-rose-400 bg-rose-500/5'
                      }`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/practice/${p.syllabus_id}/${p.week_number}/${p.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-black text-slate-300 rounded-xl hover:bg-white hover:text-black transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <ExternalLink size={12} /> Resume
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          disabled={deleteLoading === p.id}
                          className="p-2.5 bg-black text-slate-600 rounded-xl hover:text-rose-500 transition-all"
                        >
                          {deleteLoading === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <AlertCircle size={40} className="text-black mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No attempts found</h3>
              <p className="text-slate-500 text-[11px] max-w-xs mb-8 uppercase tracking-widest">You haven't generated any problems for this unit yet.</p>
              <Button onClick={() => navigate(`/dashboard/syllabi/create`)}>
                Create your first syllabus
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemList;