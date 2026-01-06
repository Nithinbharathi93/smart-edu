import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { 
  Play, Sparkles, HelpCircle, Loader2, ArrowLeft, 
  AlertTriangle, ChevronRight, Flag, X, Brain, Clock, AlertCircle,
  Send, CheckCircle2, Code
} from 'lucide-react';

const PracticeLab = () => {
  const { syllabusId, week, problemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Data & Profile States
  const [problem, setProblem] = useState(null);
  const [profile, setProfile] = useState(null);
  const [solution, setSolution] = useState(null);
  const [submitResults, setSubmitResults] = useState(null);
  
  // UI States
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [aiMessage, setAiMessage] = useState({ 
    title: "Socratic Assistant", 
    content: "Analyze the problem and start coding. Use the flag if you're truly stuck!" 
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

const initializeLab = async () => {
  try {
    setGenerating(true);
    setError(null);

    // 1. Fetch Profile and Syllabus metadata first
    const [profileRes, syllabusRes] = await Promise.all([
      api.get('/profile/me'),
      api.get(`/get-syllabus/${syllabusId}`)
    ]);
    
    setProfile(profileRes.data);
    const syllabusLevel = syllabusRes.data.level; // Use the actual level from DB

    let problemData;
    
    if (problemId) {
      // Fetch existing
      const res = await api.get(`/problems/${problemId}`);
      problemData = res.data;
    } else {
      // GENERATE NEW with guaranteed Syllabus Level
      const payload = { 
        syllabus_id: Number(syllabusId), 
        week_number: Number(week),
        concept: location.state?.concept || "Core Concepts",
        level: syllabusLevel // <--- No more defaulting to "Beginner"
      };
      const res = await api.post('/generate-problem', payload);
      problemData = res.data;
    }
    
    if (problemData) {
      setProblem(problemData);
      setCode(problemData.starter_code || "");
    }
  } catch (err) {
    setError("Failed to load the challenge.");
  } finally {
    setGenerating(false);
  }
};

    initializeLab();
  }, [syllabusId, week, problemId]);

  // Run Code logic (POST /compile)
  const runCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const { data } = await api.post('/compile', { 
        language: profile?.default_language || 'javascript',
        version: '3.10.0', 
        source_code: code 
      });
      setOutput(data.stdout || data.output || data.stderr || "Execution complete.");
    } catch (err) {
      setOutput(err.response?.data?.error || "Compiler Error: Failed to execute code.");
    } finally {
      setLoading(false);
    }
  };

  // Submit logic (POST /compile/submit)
  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/compile/submit', {
        problem_id: problem.id,
        language: profile?.default_language || 'python',
        source_code: code
      });
      setSubmitResults(data);
    } catch (err) {
      alert("Submission failed. Check your syntax.");
    } finally {
      setSubmitting(false);
    }
  };

const getSolution = async () => {
  if (!problem?.id) return;
  setSolutionLoading(true);
  console.log("Fetching solution for problem ID:", problem.id);
  try {
    // POST /problem/solution using only the problem_id
    const { data } = await api.post('/problem/solution', {
      problem_id: problem.id
    });
    
    // If the backend sends the code as a stringified object within a string, 
    // we ensure it's handled properly here
    setSolution(data);
  } catch (err) {
    console.error("Solution Fetch Error:", err.response?.data || err.message);
    alert("The AI generated a malformed solution. Please try again or check the console.");
  } finally {
    setSolutionLoading(false);
  }
};

  const getHint = async () => {
    if (!problem) return;
    setHintLoading(true);
    try {
      const { data } = await api.post('/problem/guide', { 
        problem_details: { title: problem.title, description: problem.description },
        user_query: "I'm stuck, can you give me a conceptual hint?",
        user_code: code 
      });
      setAiMessage({ title: data.hint_title, content: data.conceptual_guidance });
    } catch (err) {
      setAiMessage({ title: "Tutor Unavailable", content: "Check your logic!" });
    } finally {
      setHintLoading(false);
    }
  };

  if (generating) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-green-50/500 w-12 h-12 mb-4" />
      <p className="text-green-600/70 font-mono text-sm tracking-widest uppercase animate-pulse">Initializing Environment...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-bold text-white mb-8">{error}</h2>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const editorStyles = {
    fontSize: `${profile?.editor_config?.font_size || 14}px`,
    color: profile?.editor_config?.theme === 'monokai' ? '#F8F8F2' : '#A5B4FC',
    backgroundColor: profile?.editor_config?.theme === 'monokai' ? '#272822' : 'transparent',
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-black flex items-center justify-between px-6 bg-black flex-shrink-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-green-50/500/10 text-green-500 px-2 py-1 rounded border border-green-50/500/20 uppercase tracking-tighter">Week {week}</span>
            <h1 className="text-sm font-bold text-white tracking-tight">{problem?.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
  onClick={getSolution}
  disabled={solutionLoading || generating}
  className="p-2 text-green-600/70 hover:text-white bg-black rounded-lg transition-colors disabled:opacity-50"
  title="View Solution"
>
  {solutionLoading ? (
    <Loader2 size={18} className="animate-spin text-green-500" />
  ) : (
    <Flag size={18} />
  )}
</button>
          <button onClick={runCode} disabled={loading} className="flex items-center gap-2 px-4 py-1.5 bg-black hover:bg-slate-700 text-xs font-bold rounded-lg transition-all text-slate-300">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run
          </button>
          <Button onClick={handleSubmit} isLoading={submitting} className="h-9 px-6 bg-green-600 hover:bg-green-50/500 border-none shadow-lg shadow-green-50/500/20">
            <Send size={16} className="mr-2" /> Submit
          </Button>
        </div>
      </header>

      {/* Main Container - 4 Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN */}
        <div className="w-1/2 flex flex-col border-r border-black overflow-hidden">
          {/* Top 3/4: Problem */}
          <div className="h-[75%] overflow-y-auto p-8 bg-slate-950 scrollbar-hide">
            <section className="max-w-2xl space-y-10">
              <div>
                <h2 className="text-xs font-black text-green-50/500 uppercase tracking-widest mb-4">Problem Statement</h2>
                <p className="text-slate-300 text-lg leading-relaxed">{problem?.description}</p>
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Examples</h3>
                <div className="space-y-6">
                  {problem?.examples?.map((ex, i) => (
                    <div key={i} className="bg-black/50 border border-black rounded-2xl p-6 font-mono text-sm">
                      <div className="mb-2"><span className="text-green-500 font-bold">Input:</span> <span className="text-slate-200">{ex.input}</span></div>
                      <div><span className="text-green-400 font-bold">Output:</span> <span className="text-slate-200">{ex.output}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Bottom 1/4: AI Tutor */}
          <div className="h-[25%] p-6 bg-green-600/5 border-t border-black overflow-y-auto relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-green-500" /> 
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Socratic Assistant</span>
            </div>
            <h4 className="text-white font-bold text-sm mb-1">{aiMessage.title}</h4>
            <p className="text-sm text-green-600/70 italic leading-relaxed">"{aiMessage.content}"</p>
            <button 
              onClick={getHint}
              disabled={hintLoading}
              className="mt-4 text-xs font-bold text-green-500 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              {hintLoading ? <Loader2 size={14} className="animate-spin" /> : <HelpCircle size={14} />}
              Get a conceptual hint
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-1/2 flex flex-col bg-black overflow-hidden">
{/* Top 3/4: Smart Editor Area */}
<div className="h-[75%] flex flex-col bg-slate-950 overflow-hidden relative">
  <div className="flex-1 flex font-mono overflow-hidden" style={{ backgroundColor: editorStyles.backgroundColor }}>
    
    {/* Line Numbers Gutter */}
    {profile?.editor_config?.line_numbers === 'on' && (
      <div 
        className="select-none py-6 px-3 text-right border-r border-black/50 bg-black/20 text-slate-600 pointer-events-none z-10"
        style={{ fontSize: editorStyles.fontSize, minWidth: '3.5rem', lineHeight: '1.625' }}
      >
        {code.split('\n').map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
    )}

    <div className="flex-1 relative overflow-hidden">
      <textarea 
        className="w-full h-full p-6 bg-transparent border-none outline-none resize-none leading-relaxed overflow-x-auto relative z-20"
        style={{ 
          fontSize: editorStyles.fontSize, 
          color: editorStyles.color,
          lineHeight: '1.625',
          tabSize: 4
        }}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          const { selectionStart, selectionEnd, value } = e.target;
          
          // 1. Handle Tab Key (Insert 4 spaces)
          if (e.key === 'Tab') {
            e.preventDefault();
            const newCode = value.substring(0, selectionStart) + "    " + value.substring(selectionEnd);
            setCode(newCode);
            setTimeout(() => {
              e.target.selectionStart = e.target.selectionEnd = selectionStart + 4;
            }, 0);
          }

          // 2. Auto-close Brackets and Quotes
          const pairs = { '{': '}', '[': ']', '(': ')', '"': '"', "'": "'" };
          if (pairs[e.key]) {
            e.preventDefault();
            const pair = pairs[e.key];
            const newCode = value.substring(0, selectionStart) + e.key + pair + value.substring(selectionEnd);
            setCode(newCode);
            setTimeout(() => {
              e.target.selectionStart = e.target.selectionEnd = selectionStart + 1;
            }, 0);
          }

          // 3. Smart Indent on Enter
          if (e.key === 'Enter') {
            const lines = value.substring(0, selectionStart).split('\n');
            const lastLine = lines[lines.length - 1];
            const indent = lastLine.match(/^\s*/)[0]; // Maintain current indentation
            const extraIndent = lastLine.trim().endsWith('{') || lastLine.trim().endsWith(':') ? "    " : "";
            
            e.preventDefault();
            const newCode = value.substring(0, selectionStart) + "\n" + indent + extraIndent + value.substring(selectionEnd);
            setCode(newCode);
            setTimeout(() => {
              e.target.selectionStart = e.target.selectionEnd = selectionStart + 1 + indent.length + extraIndent.length;
            }, 0);
          }
        }}
        spellCheck="false"
        placeholder="// Start coding..."
      />
    </div>
  </div>
</div>

          {/* Bottom 1/4: System Console */}
          <div className="h-[25%] border-t border-black bg-black/80 p-5 font-mono text-[11px] overflow-y-auto">
            <div className="flex items-center gap-2 text-slate-600 mb-3 uppercase tracking-widest font-black">
              <ChevronRight size={14} /> System Console
            </div>
            <pre className={`${output.includes('Error') ? 'text-rose-400' : 'text-green-400'} whitespace-pre-wrap leading-relaxed`}>
              {output || "Output will appear here after execution..."}
            </pre>
          </div>
        </div>
      </div>

      {/* Solution Modal */}
      {solution && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
    <div className="bg-black border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
      
      {/* Modal Header */}
      <div className="p-6 border-b border-black flex justify-between items-center bg-black/50">
        <div className="flex items-center gap-2 text-green-500 font-bold">
          <Flag size={20} /> Master Solution
        </div>
        <button onClick={() => setSolution(null)} className="text-green-600/70 hover:text-white p-2">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
        
        {/* Step-by-Step Logic Section */}
        <section>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Brain size={14} className="text-green-50/500" /> Logical Approach
          </h3>
          <ul className="space-y-3">
            {solution.approach.split('\n').map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                <span className="text-green-50/500 font-bold font-mono">{i + 1}.</span>
                <span>{point.replace(/^\d+\.\s*/, '')}</span> {/* Cleans existing "1. " prefixes */}
              </li>
            ))}
          </ul>
        </section>

        {/* Optimized Code Block */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Code size={14} className="text-green-500" /> Optimized {solution.language}
            </h3>
          </div>
          <pre className="p-6 bg-black rounded-2xl border border-black text-indigo-300 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
            {solution.code}
          </pre>
        </section>

        {/* Complexity Analysis */}
        <section className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-black/30 rounded-2xl border border-black/50">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Clock size={14} /> Time Complexity
            </h3>
            <span className="text-lg font-black text-green-400 font-mono">{solution.complexity.time}</span>
          </div>
          <div className="p-4 bg-black/30 rounded-2xl border border-black/50">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Brain size={14} /> Space Complexity
            </h3>
            <span className="text-lg font-black text-amber-400 font-mono">{solution.complexity.space}</span>
          </div>
        </section>
      </div>

      <div className="p-6 bg-black/50 border-t border-black">
        <Button onClick={() => setSolution(null)} className="w-full">
          Close Solution
        </Button>
      </div>
    </div>
  </div>
)}

      {/* Submit Results Modal */}
      {submitResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-black border border-slate-700 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-black flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white">Validation Results</h3>
                <p className="text-slate-500">Passed {submitResults.passed_count} / {submitResults.total_cases} cases</p>
              </div>
              <button onClick={() => setSubmitResults(null)} className="text-green-600/70 hover:text-white p-2"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
              {submitResults.results.map((res, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${res.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-green-600/70 uppercase tracking-widest">Test Case {i+1}</span>
                    {res.passed ? <CheckCircle2 className="text-green-500" size={16} /> : <AlertCircle className="text-red-500" size={16} />}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono leading-tight">
                    <div><p className="text-slate-500 mb-1">Expected</p><p className="text-white bg-black/30 p-2 rounded">{res.expected}</p></div>
                    <div><p className="text-slate-500 mb-1">Actual</p><p className={res.passed ? 'text-green-400 bg-black/30 p-2 rounded' : 'text-rose-400 bg-black/30 p-2 rounded'}>{res.actual}</p></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-black/30">
               <Button onClick={() => setSubmitResults(null)} className="w-full">Continue Coding</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeLab;