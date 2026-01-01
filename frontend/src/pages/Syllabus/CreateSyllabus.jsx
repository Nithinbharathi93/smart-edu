// src/pages/Dashboard/CreateSyllabus.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { Upload, Sparkles, Type, Clock, BarChart3, FileText } from 'lucide-react';

const CreateSyllabus = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('topic'); // 'topic' | 'pdf'
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    topic: '',
    duration: '4 weeks',
    level: 'Beginner'
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let syllabusRes;
      
      if (mode === 'pdf') {
        // Step 1: Ingest PDF
        const uploadData = new FormData();
        uploadData.append('file', file);
        const ingestRes = await api.post('/ingest', uploadData);
        
        // Step 2: Generate from PDF
        syllabusRes = await api.post('/generate-syllabus', {
          pdf_id: ingestRes.data.pdf_id,
          duration: formData.duration,
          level: formData.level
        });
      } else {
        // Topic-based generation
        syllabusRes = await api.post('/generate-topic-syllabus', {
          topic: formData.topic,
          duration: formData.duration,
          level: formData.level
        });
      }
      
      // Navigate to the new syllabus (assuming response returns the ID)
      navigate(`/dashboard/syllabi/${syllabusRes.data.id || ''}`);
    } catch (err) {
      alert("Failed to generate syllabus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Syllabus</h1>
        <p className="text-slate-500">How would you like to build your learning path?</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
        <button 
          onClick={() => setMode('topic')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${mode === 'topic' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Type size={18} /> Topic-Based
        </button>
        <button 
          onClick={() => setMode('pdf')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${mode === 'pdf' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={18} /> PDF Ingestion
        </button>
      </div>

      <form onSubmit={handleCreate} className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {mode === 'topic' ? (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 text-indigo-600">Learning Topic</label>
            <input 
              type="text"
              placeholder="e.g. Rust Memory Safety or Advanced React Patterns"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              required
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
            <input 
              type="file" 
              id="pdf-upload" 
              className="hidden" 
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Upload className="text-indigo-600" size={24} />
              </div>
              <p className="font-bold text-slate-800">{file ? file.name : 'Click to upload PDF'}</p>
              <p className="text-xs text-slate-400 mt-1">Maximum size: 10MB</p>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Clock size={16} className="text-indigo-600" /> Duration
            </label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            >
              {[1, 2, 4, 6, 8, 12].map(n => <option key={n} value={`${n} weeks`}>{n} Weeks</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <BarChart3 size={16} className="text-indigo-600" /> Target Level
            </label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
              value={formData.level}
              onChange={(e) => setFormData({...formData, level: e.target.value})}
            >
              {['Beginner', 'Intermediate', 'Expert'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <Button type="submit" isLoading={loading} className="w-full py-4 text-lg">
          <Sparkles size={20} className="mr-2" />
          Generate Learning Path
        </Button>
      </form>
    </div>
  );
};

export default CreateSyllabus;