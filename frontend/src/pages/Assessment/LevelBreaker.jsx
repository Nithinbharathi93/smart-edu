import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { Trophy, AlertCircle, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

const LevelBreaker = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get('/assessment/questions');
      
      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        setError("No questions available at the moment.");
      }
    } catch (err) {
      // Specific check for the 403 Persona restriction
      if (err.response?.status === 403) {
        setError("Assessment not required: Your persona is already set for specialized learning.");
      } else {
        console.error("Fetch error:", err);
        setError("Failed to load assessment. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };
  fetchQuestions();
}, []);

  const handleSelect = (optionIdx) => {
    const currentQuestion = questions[currentIdx];
    const isCorrect = optionIdx === currentQuestion.correct;
    
    // Build answer object as per Module 3 spec: { q_index, selected, is_correct }
    const newAnswer = { 
      q_index: currentIdx, 
      selected: optionIdx, 
      is_correct: isCorrect 
    };
    
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitAssessment(updatedAnswers);
    }
  };

  const submitAssessment = async (finalAnswers) => {
    setLoading(true);
    // Score calculation based on total correct answers
    const totalScore = finalAnswers.filter(a => a.is_correct).length;
    
    try {
      // POST /assessment/submit matches the request format in Module 3
      const { data } = await api.post('/assessment/submit', { 
        score: totalScore, 
        answers: finalAnswers 
      });
      setResult(data); // Expects { message, level, name }
    } catch (err) {
      setError("Failed to submit results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading State
  if (loading && questions.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-green-600 w-12 h-12" />
        <p className="text-slate-500 font-medium animate-pulse">Analyzing your skill level...</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-red-100 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-black mb-2">Oops! Something went wrong</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} className="w-full">Try Again</Button>
      </div>
    );
  }

  // 3. Result State (Module 3 Success)
  if (result) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-10 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-50">
        <div className="w-24 h-24 bg-gradient-to-tr from-green-600 to-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-black text-black mb-3 tracking-tight">Level Unlocked!</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">{result.message}</p>
        
        <div className="bg-slate-50 rounded-3xl p-6 mb-10 border border-slate-100">
          <span className="text-xs font-bold text-green-600 uppercase tracking-widest block mb-2">New Global Rank</span>
          <div className="text-4xl font-black text-black tracking-tighter">{result.name}</div>
          <p className="text-xs text-green-600/70 mt-2">Level {result.level} of 6</p>
        </div>
        
        <Button onClick={() => navigate('/dashboard')} className="w-full py-4 text-lg">
          Explore My Syllabi
        </Button>
      </div>
    );
  }

  // 4. Question State
  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto mt-16 px-6 pb-20">
      {/* Progress Header */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="px-3 py-1 bg-green-50/50 text-green-600 rounded-full font-bold text-xs uppercase tracking-wider">
              Assessment In Progress
            </span>
            <h2 className="text-3xl font-bold text-black mt-3">Question {currentIdx + 1}</h2>
          </div>
          <span className="text-green-600/70 font-mono text-sm">{currentIdx + 1} / {questions.length}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm mb-8">
        <h3 className="text-xl font-bold text-black leading-snug mb-8">
          {q?.q || "Loading question..."}
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {q?.options.map((opt, i) => (
            <button 
              key={i} 
              onClick={() => handleSelect(i)}
              className="group flex items-center justify-between p-5 text-left border-2 border-slate-100 rounded-2xl hover:border-green-50/500 hover:bg-green-50/50/50 transition-all"
            >
              <span className="font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">{opt}</span>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-green-50/500 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-green-600/70 text-sm flex items-center justify-center gap-2">
        <CheckCircle2 size={16} /> Answers are final once selected.
      </p>
    </div>
  );
};

export default LevelBreaker;