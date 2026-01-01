// src/components/ui/Card.jsx
import React from 'react';
import { BookOpen, MoreVertical, Clock } from 'lucide-react';

const SyllabusCard = ({ title, level, progress, duration, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <BookOpen size={20} className="text-indigo-600 group-hover:text-white" />
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreVertical size={18} />
        </button>
      </div>

      <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
        {title}
      </h3>
      
      <div className="flex items-center gap-3 text-slate-500 text-sm mb-6">
        <span className="flex items-center gap-1">
          <Clock size={14} /> {duration}
        </span>
        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
          level === 'Expert' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
        }`}>
          {level}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-500">Progress</span>
          <span className="text-indigo-600">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SyllabusCard;