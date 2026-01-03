// src/pages/Dashboard/SyllabusList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SyllabusCard from '../../components/ui/Card';
import { 
  Search, 
  Loader2, 
  BookOpen, 
  Trash2, 
  Plus,
  RefreshCw,
  Library
} from 'lucide-react';
import Button from '../../components/ui/Button';

const SyllabusList = () => {
  const navigate = useNavigate();
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      // Fetch all user courses
      const { data } = await api.get('/my-courses'); 
      setSyllabi(data);
    } catch (err) {
      console.error("Error fetching library:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabi();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevents navigating to detail page on click
    if (!window.confirm("Permanently delete this syllabus? All version history will be lost.")) return;
    
    try {
      setDeleteLoading(id);
      // Execute the new delete route
      await api.delete(`/syllabus/${id}`); 
      setSyllabi(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete syllabus. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const filtered = syllabi.filter(s => 
    s.syllabus_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500 w-10 h-10 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Course Library...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2 text-emerald-500">
            <Library size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Active Curriculums</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Course Library</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">Manage and access your AI-tailored study plans.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchSyllabi}
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 transition-all active:scale-95"
            title="Refresh Courses"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="h-12 px-6 bg-slate-900 hover:bg-black rounded-2xl text-[11px] font-black uppercase tracking-widest border-none"
          >
            <Plus size={18} className="mr-2" /> New Syllabus
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-10 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
        <input 
          type="text" 
          placeholder="SEARCH BY TITLE OR CONCEPT..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none shadow-sm transition-all"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid Section */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((s) => (
            <div key={s.id} className="relative group">
              <SyllabusCard 
                title={s.syllabus_title} 
                level={s.level}
                duration={s.duration}
                progress={0}
                onClick={() => navigate(`/dashboard/syllabi/${s.id}`)}
              />
              
              {/* Contextual Delete Button */}
              <button 
                onClick={(e) => handleDelete(e, s.id)}
                disabled={deleteLoading === s.id}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md text-slate-400 hover:text-rose-500 rounded-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                title="Delete Course"
              >
                {deleteLoading === s.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <BookOpen className="text-slate-300 mx-auto mb-4 opacity-50" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Archive Empty or No Matches Found</p>
        </div>
      )}
    </div>
  );
};

export default SyllabusList;