// src/pages/Practice/PracticeLab.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { Play, Sparkles, HelpCircle, Loader2, ArrowLeft, AlertTriangle, ChevronRight } from 'lucide-react';

const PracticeLab = () => {
  const { syllabusId, week } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [aiMessage, setAiMessage] = useState({ 
    title: "Socratic Assistant", 
    content: "I'm ready to help. Analyze the problem on the left and start coding!" 
  });
  
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setGenerating(true);
        setError(null);

        // Required body fields for problem generation
        const payload = { 
          syllabus_id: Number(syllabusId), 
          week_number: Number(week),
          concept: location.state?.concept || "Array methods",
          level: location.state?.level || "Beginner"
        };

        const { data } = await api.post('/generate-problem', payload);
        
        if (data) {
          setProblem(data);
          setCode("// " + data.concept + "\n\nfunction solution() {\n  // Your code here\n}");
        }
      } catch (err) {
        setError("Failed to generate problem. Ensure the backend is running.");
      } finally {
        setGenerating(false);
      }
    };
    fetchProblem();
  }, [syllabusId, week, location.state]);

  // Logic for POST /compile
  const runCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setOutput("");

    try {
      const { data } = await api.post('/compile', { 
        language: 'javascript', // From Global Constants
        version: '18.15.0',      // Required version string
        source_code: code 
      });
      
      // Update terminal with stdout, output, or error result
      setOutput(data.stdout || data.output || data.stderr || "Execution complete.");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Compiler Error: Failed to execute code.";
      setOutput(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Logic for POST /problem/guide (Socratic Hint)
  const getHint = async () => {
    if (!problem) return;
    setHintLoading(true);
    try {
      const { data } = await api.post('/problem/guide', { 
        problem_details: {
          title: problem.title,
          description: problem.description
        },
        user_query: "I'm stuck, can you give me a conceptual hint?",
        user_code: code 
      });
      
      setAiMessage({ 
        title: data.hint_title || "Think about this...", 
        content: data.conceptual_guidance 
      });
    } catch (err) {
      setAiMessage({ 
        title: "Tutor Unavailable", 
        content: "I'm having trouble connecting right now. Try reviewing the constraints!" 
      });
    } finally {
      setHintLoading(false);
    }
  };

  if (generating) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500 w-12 h-12 mb-4" />
      <p className="text-slate-400 font-mono text-sm tracking-widest uppercase animate-pulse">Initializing Lab...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-bold text-white mb-8">{error}</h2>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 flex-shrink-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20 uppercase tracking-tighter">Week {week}</span>
            <h1 className="text-sm font-bold text-white tracking-tight">{problem?.title}</h1>
          </div>
        </div>
        <Button onClick={runCode} isLoading={loading} className="h-9 px-6 bg-indigo-600 hover:bg-indigo-500 transition-all border-none shadow-lg shadow-indigo-500/20">
          <Play size={16} className="mr-2 fill-current" /> Run Code
        </Button>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Description & Examples */}
        <div className="w-1/2 border-r border-slate-800 overflow-y-auto p-8 bg-slate-950 scrollbar-hide">
          <div className="max-w-2xl space-y-10">
            <section>
              <h2 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">Problem Statement</h2>
              <p className="text-slate-300 text-lg leading-relaxed">{problem?.description}</p>
            </section>
            
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Constraints</h3>
              <ul className="space-y-3">
                {problem?.constraints?.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-400 font-mono italic">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                    {c}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Examples</h3>
              <div className="space-y-6">
                {problem?.examples?.map((ex, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm transition-all hover:border-slate-700">
                    <div className="mb-2"><span className="text-indigo-400 font-bold">Input:</span> <span className="text-slate-200">{ex.input}</span></div>
                    <div><span className="text-emerald-400 font-bold">Output:</span> <span className="text-slate-200">{ex.output}</span></div>
                    {ex.explanation && (
                       <div className="mt-4 pt-4 border-t border-slate-800 text-slate-500 text-xs leading-relaxed italic">
                         {ex.explanation}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right Pane: AI & Code Editor */}
        <div className="w-1/2 flex flex-col bg-slate-900 overflow-hidden shadow-2xl">
          
          {/* Socratic Helper */}
          <div className="h-1/3 border-b border-slate-800 p-6 overflow-y-auto bg-indigo-600/5 relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-400" /> 
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Socratic Assistant</span>
            </div>
            <h4 className="text-white font-bold text-sm mb-1">{aiMessage.title}</h4>
            <p className="text-sm text-slate-400 italic leading-relaxed">
              "{aiMessage.content}"
            </p>
            <button 
              onClick={getHint}
              disabled={hintLoading}
              className="mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              {hintLoading ? (
                <Loader2 className="animate-spin w-3 h-3" />
              ) : (
                <HelpCircle size={14} />
              )}
              {hintLoading ? "Thinking..." : "Get a conceptual hint"}
            </button>
          </div>
          
          {/* Editor Area */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
            <div className="flex-1 p-6 font-mono text-sm scrollbar-hide">
              <textarea 
                className="w-full h-full bg-transparent border-none outline-none text-indigo-300 resize-none leading-relaxed selection:bg-indigo-500/30"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                placeholder="// Start coding..."
              />
            </div>
            
            {/* Terminal Console */}
            <div className="h-40 border-t border-slate-800 bg-black/80 p-5 font-mono text-[11px] overflow-y-auto">
              <div className="flex items-center gap-2 text-slate-600 mb-3 uppercase tracking-widest font-black">
                <ChevronRight size={14} /> System Console
              </div>
              <pre className={`${(output.includes('Error') || output.includes('Failed')) ? 'text-rose-400' : 'text-emerald-400'} whitespace-pre-wrap leading-relaxed`}>
                {output || "Output will appear here after execution..."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeLab;