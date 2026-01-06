// src/pages/Dashboard/LevelBreaker.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { Trophy, AlertCircle, Loader2, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

const LevelBreaker = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  
  // UI States for Step 2
  const [selectedOption, setSelectedOption] = useState(null);
  const [confidence, setConfidence] = useState(0.5); // Default 50%
  const [isDontKnow, setIsDontKnow] = useState(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/assessment/questions');
        if (data && data.length > 0) setQuestions(data);
        else setError("No questions available.");
      } catch (err) {
        if (err.response?.status === 403) setError("Assessment not required: specialized learning path active.");
        else setError("Failed to load assessment.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleNext = () => {
    const currentQuestion = questions[currentIdx];
    
    // Payload mapping for POST /assessment/submit
    const answerEntry = {
      question_id: currentQuestion.id || currentIdx + 1,
      isCorrect: isDontKnow ? false : selectedOption === currentQuestion.correct,
      confidence: isDontKnow ? 0 : parseFloat(confidence),
      isDontKnow: isDontKnow
    };

    const updatedAnswers = [...answers, answerEntry];
    setAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setConfidence(0.5); // Reset to 50%
      setIsDontKnow(false);
    } else {
      submitAssessment(updatedAnswers);
    }
  };

  const submitAssessment = async (finalAnswers) => {
    setLoading(true);
    try {
      const { data } = await api.post('/assessment/submit', { answers: finalAnswers });
      setResult(data);
    } catch (err) {
      setError("Failed to submit results.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && questions.length === 0) return (
    <div className="h-[80vh] flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-emerald-500 w-8 h-8 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Matrix...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
      <AlertCircle className="text-rose-500 mx-auto mb-4" size={32} />
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Protocol Alert</h2>
      <p className="text-[11px] font-bold text-slate-500 mt-2 mb-6 leading-relaxed">{error}</p>
      <Button onClick={() => navigate('/dashboard')} className="w-full h-10 bg-slate-900 text-[10px] font-black uppercase tracking-widest">Return Home</Button>
    </div>
  );

  if (result) return (
    <div className="max-w-md mx-auto mt-20 text-center p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl">
      <div className="w-16 h-16 bg-emerald-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6">
        <Trophy size={32} />
      </div>
      <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Assessment Complete</h2>
      <div className="bg-slate-50 rounded-xl p-4 my-6 border border-slate-100">
        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Rank Identity</span>
        <div className="text-2xl font-black text-slate-900 leading-none">{result.name}</div>
        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Tier {result.level} Access</p>
      </div>
      <Button onClick={() => navigate('/dashboard')} className="w-full h-12 bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Enter Workspace</Button>
    </div>
  );

  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto mt-12 px-6 pb-24">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-3">
          <div className="flex items-center gap-2">
             <Sparkles size={14} className="text-emerald-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Level Breaker Analysis</span>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">UNIT {currentIdx + 1}/{questions.length}</span>
        </div>
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-50 shadow-sm relative overflow-hidden">
        <h3 className="text-lg font-black text-slate-900 leading-tight mb-8">{q?.q}</h3>
        
        <div className="grid grid-cols-1 gap-2 mb-8">
          {q?.options.map((opt, i) => (
            <button 
              key={i} 
              disabled={isDontKnow}
              onClick={() => setSelectedOption(i)}
              className={`flex items-center justify-between p-4 text-left border rounded-xl transition-all ${
                selectedOption === i 
                ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700' 
                : 'border-slate-100 bg-slate-50/20 text-slate-500 hover:border-slate-200'
              } ${isDontKnow ? 'opacity-30' : ''}`}
            >
              <span className="text-[11px] font-black uppercase tracking-tight">{opt}</span>
              {selectedOption === i && <CheckCircle2 size={16} />}
            </button>
          ))}
          
          <button 
            onClick={() => {
              setIsDontKnow(!isDontKnow);
              setSelectedOption(null);
            }}
            className={`flex items-center gap-2 p-4 border rounded-xl transition-all mt-4 ${
              isDontKnow ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-dashed border-slate-200 text-slate-400'
            }`}
          >
            <HelpCircle size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Mark as Unknown Concept</span>
          </button>
        </div>

        {/* Confidence Scale: Restricted 25% - 100% */}
        {!isDontKnow && selectedOption !== null && (
          <div className="pt-8 border-t border-slate-50 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
               <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Confidence Logic (Min 25%)</label>
               <span className="text-base font-black text-emerald-600 italic">{Math.round(confidence * 100)}%</span>
            </div>
            
            <div className="relative h-10 flex items-center mb-8">
  {/* Visual Track Container */}
  <div className="absolute inset-0 flex items-center pointer-events-none">
    <div className="relative w-full h-1.5 flex rounded-full overflow-hidden">
      {/* Visual Disabled Zone (0-25%) - Now truly reflects the 0-0.25 range */}
      <div className="h-full w-[25%] bg-slate-200" />
      {/* Active Zone (25-100%) */}
      <div className="h-full w-[75%] bg-emerald-100" />
    </div>
  </div>
  
  <input 
    type="range" 
    min="0" // Allow the slider to move to the far left
    max="1" 
    step="0.01"
    value={confidence}
    onChange={(e) => {
      const val = parseFloat(e.target.value);
      // Clamp the value: if they slide into the grey, force it to 0.25
      setConfidence(val < 0.25 ? 0.25 : val);
    }}
    className="absolute inset-0 w-full bg-transparent appearance-none cursor-pointer z-10 accent-emerald-500"
    style={{
      // Custom CSS to make the slider thumb look disabled in the grey zone
      filter: confidence <= 0.25 ? 'grayscale(1) opacity(0.5)' : 'none'
    }}
  />
</div>

<div className="flex justify-between mt-[-1rem] mb-10">
  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Minimal Guess</span>
  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Full Certainty</span>
</div>
            
            <Button onClick={handleNext} className="w-full h-11 bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest border-none">
              Commit Response
            </Button>
          </div>
        )}

        {isDontKnow && (
           <Button onClick={handleNext} className="w-full h-11 bg-amber-600 hover:bg-amber-700 rounded-xl border-none text-[10px] font-black uppercase">
             Skip Unit
           </Button>
        )}
      </div>
    </div>
  );
};

export default LevelBreaker;