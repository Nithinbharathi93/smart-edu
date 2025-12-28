import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Play, 
  Cpu, 
  Lightbulb, 
  Activity, 
  Terminal, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Simple Markdown Parser
const parseMarkdown = (text) => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const elements = [];
  let codeBlock = null;
  let codeLanguage = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      if (codeBlock === null) {
        codeLanguage = line.slice(3).trim() || 'text';
        codeBlock = [];
      } else {
        elements.push({
          type: 'code',
          language: codeLanguage,
          content: codeBlock.join('\n')
        });
        codeBlock = null;
        codeLanguage = '';
      }
      i++;
      continue;
    }

    if (codeBlock !== null) {
      codeBlock.push(line);
      i++;
      continue;
    }

    // Headers
    if (line.startsWith('##')) {
      elements.push({ type: 'h2', content: line.slice(2).trim() });
      i++;
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', content: line.slice(1).trim() });
      i++;
      continue;
    }

    // Lists
    if (line.startsWith('* ')) {
      const listItems = [];
      while (i < lines.length && lines[i].startsWith('* ')) {
        listItems.push(lines[i].slice(2).trim());
        i++;
      }
      elements.push({ type: 'list', items: listItems });
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push({ type: 'hr' });
      i++;
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraphs
    elements.push({ type: 'p', content: line });
    i++;
  }

  return elements;
};

const MarkdownRenderer = ({ content }) => {
  const elements = parseMarkdown(content);

  return (
    <div className="space-y-3 text-sm">
      {elements.map((el, idx) => {
        switch (el.type) {
          case 'h1':
            return (
              <h1 key={idx} className="text-xl font-bold text-gray-200 mt-4 mb-2">
                {el.content}
              </h1>
            );
          case 'h2':
            return (
              <h2 key={idx} className="text-lg font-semibold text-gray-300 mt-3 mb-1">
                {el.content}
              </h2>
            );
          case 'p':
            return (
              <p key={idx} className="text-gray-400 leading-relaxed">
                {el.content.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={i} className="text-gray-200">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return (
                      <code
                        key={i}
                        className="bg-gray-900 text-green-400 px-1 rounded text-xs font-mono"
                      >
                        {part.slice(1, -1)}
                      </code>
                    );
                  }
                  return part;
                })}
              </p>
            );
          case 'list':
            return (
              <ul key={idx} className="space-y-1 ml-4">
                {el.items.map((item, i) => (
                  <li key={i} className="text-gray-400 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>
                      {item.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={j} className="text-gray-200">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        if (part.startsWith('`') && part.endsWith('`')) {
                          return (
                            <code
                              key={j}
                              className="bg-gray-900 text-green-400 px-1 rounded text-xs font-mono"
                            >
                              {part.slice(1, -1)}
                            </code>
                          );
                        }
                        return part;
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            );
          case 'code':
            return (
              <div key={idx} className="bg-gray-950 rounded-lg p-3 overflow-x-auto border border-gray-800">
                <div className="text-xs text-gray-500 mb-2 font-mono">{el.language}</div>
                <pre className="text-gray-300 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                  <code>{el.content}</code>
                </pre>
              </div>
            );
          case 'hr':
            return <hr key={idx} className="border-gray-700 my-2" />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default function Practice() {
  // --- AUTHENTICATION & ROUTING ---
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, weekId, lessonId } = useParams();
  const [user, setUser] = useState(null);

  // Extract courseData from location state (passed from CourseView)
  const courseData = location.state?.courseData;
  
  // Extract key concepts from the specific week (based on weekId from URL)
  const getTopicOptions = () => {
    if (!courseData || !courseData.weeks) return [];
    
    // Get the week number from URL params
    const currentWeekNumber = parseInt(weekId);
    
    // Find the current week in courseData
    const currentWeek = courseData.weeks.find(w => w.weekNumber === currentWeekNumber);
    
    // Return only that week's concepts
    if (currentWeek && currentWeek.keyConcepts && currentWeek.keyConcepts.length > 0) {
      return currentWeek.keyConcepts;
    }
    
    return [];
  };

  const topicOptions = getTopicOptions();
  const defaultTopic = topicOptions.length > 0 ? topicOptions[0] : 'General';

  // --- STATE MANAGEMENT ---
  
  // Authentication State
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Problem State
  const [problem, setProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [filters, setFilters] = useState({ topic: defaultTopic, difficulty: 'Medium' });

  // Editor State
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello World");');
  const [language, setLanguage] = useState('javascript');
  
  // Execution State
  const [output, setOutput] = useState(null); // { stdout, stderr, exitCode }
  const [isRunning, setIsRunning] = useState(false);

  // AI Assistance State
  const [hint, setHint] = useState(null);
  const [complexity, setComplexity] = useState(null);
  const [loadingAi, setLoadingAi] = useState({ hint: false, complexity: false });

  // --- API HANDLERS ---

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
    setIsAuthLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // 1. Generate New Problem
  const fetchProblem = async () => {
    setLoadingProblem(true);
    setProblem(null);
    setHint(null);
    setComplexity(null);
    setOutput(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/ai/generate-coding-questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: filters.topic,
          difficulty: filters.difficulty,
          count: 1
        })
      });

      const data = await res.json();
      if (data.problems && data.problems.length > 0) {
        setProblem(data.problems[0]);
      }
    } catch (error) {
      console.error("Error fetching problem:", error);
      alert("Failed to generate problem. Check backend connection.");
    } finally {
      setLoadingProblem(false);
    }
  };

  // 2. Run Code (Compiler)
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/compiler/run', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: language,
          code: code,
          input: "" // Add user input field if needed
        })
      });

      const data = await res.json();
      setOutput(data);
    } catch (error) {
      console.error("Compiler error:", error);
      setOutput({ stderr: "Failed to connect to compiler service." });
    } finally {
      setIsRunning(false);
    }
  };

  // 3. Get AI Hint
  const handleGetHint = async () => {
    if (!code) {
      alert("Please write some code first.");
      return;
    }

    setLoadingAi(prev => ({ ...prev, hint: true }));
    try {
      const token = localStorage.getItem('token');
      
      // Build sample test case from problem examples
      let sampleTestCase = "";
      if (problem?.examples && problem.examples.length > 0) {
        const example = problem.examples[0];
        sampleTestCase = `Input: ${JSON.stringify(example.input)}\nExpected Output: ${example.output}`;
      }

      const res = await fetch('http://localhost:5000/api/ai/code-comments', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          code,
          questionTitle: problem?.title || "Coding Problem",
          sampleTestCase: sampleTestCase
        })
      });
      const data = await res.json();
      console.log("AI Response (Full):", data);
      
      // Use the data directly if it has the expected structure, otherwise check for wrapped versions
      const hintData = data.data || data.suggestions || data;
      console.log("Final Hint Data Being Set:", hintData);
      setHint(hintData);
    } catch (error) {
      console.error(error);
      alert("Failed to get hint. Please try again.");
    } finally {
      setLoadingAi(prev => ({ ...prev, hint: false }));
    }
  };

  // 4. Get Big-O Analysis
  const handleAnalyzeComplexity = async () => {
    setLoadingAi(prev => ({ ...prev, complexity: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/ai/BIG-O', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      setComplexity(data['big-o']);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAi(prev => ({ ...prev, complexity: false }));
    }
  };

  // Load a problem on initial mount
  useEffect(() => {
    fetchProblem();
  }, []);

  if (isAuthLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar user={user} onLogout={handleLogout} />

      {/* --- Main Content: Split View --- */}
      <main className="flex-grow flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        
        {/* LEFT PANEL: Problem Statement */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-gray-200 bg-white h-full overflow-y-auto">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-100 flex gap-3 bg-gray-50/50 sticky top-0 z-10">
            <select 
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 outline-none"
              value={filters.topic}
              onChange={(e) => setFilters({...filters, topic: e.target.value})}
            >
              {topicOptions.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <select 
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 outline-none"
              value={filters.difficulty}
              onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <button 
              onClick={fetchProblem}
              disabled={loadingProblem}
              className="ml-auto bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 transition"
            >
              {loadingProblem ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              New Problem
            </button>
          </div>

          {/* Problem Content */}
          <div className="p-6 md:p-8 flex-grow">
            {loadingProblem ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Loader2 size={40} className="animate-spin mb-4 text-green-600" />
                <p>Generating a unique problem for you...</p>
              </div>
            ) : problem ? (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    problem.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                    problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {problem.difficulty}
                  </span>
                  <span className="text-gray-400 text-sm">|</span>
                  <span className="text-gray-500 text-sm font-medium">{problem.topics?.join(', ')}</span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">{problem.title}</h1>
                
                <div className="prose prose-green max-w-none text-gray-600 mb-8 leading-relaxed">
                  {problem.description}
                </div>

                {/* Examples */}
                <div className="space-y-6 mb-8">
                  {problem.examples?.map((ex, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <p className="font-bold text-gray-900 text-sm mb-2">Example {idx + 1}:</p>
                      <div className="space-y-2 text-sm font-mono">
                        <div>
                          <span className="text-gray-500">Input:</span> 
                          <span className="text-gray-900 ml-2">{JSON.stringify(ex.input)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Output:</span> 
                          <span className="text-gray-900 ml-2">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="text-gray-500 italic mt-2 border-t border-gray-200 pt-2 text-xs font-sans">
                            Explanation: {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {problem.constraints && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Constraints:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      {problem.constraints.map((c, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: c }} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-20">
                <p>Click "New Problem" to start practicing.</p>
              </div>
            )}
          </div>
        </div>


        {/* RIGHT PANEL: Editor & Tools */}
        <div className="w-full lg:w-1/2 flex flex-col bg-gray-900 h-full">
          
          {/* Editor Toolbar */}
          <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-mono px-3 py-1.5 bg-gray-800 rounded-md">
                <Terminal size={14} />
                <select 
                   value={language}
                   onChange={(e) => setLanguage(e.target.value)}
                   className="bg-transparent outline-none text-gray-200 cursor-pointer"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleRunCode}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition disabled:opacity-50"
              >
                {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Run
              </button>
            </div>
          </div>

          {/* Code Editor Area */}
          <div className="flex-grow relative">
            <textarea
              className="w-full h-full bg-[#1e1e1e] text-gray-200 font-mono text-sm p-4 outline-none resize-none"
              spellCheck="false"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {/* AI Tools & Output Panel */}
          <div className="h-1/3 bg-gray-800 border-t border-gray-700 flex flex-col">
            
            {/* Tools Tabs */}
            <div className="flex border-b border-gray-700">
              <button 
                onClick={handleGetHint}
                disabled={loadingAi.hint}
                className="flex-1 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-700 border-r border-gray-700 flex items-center justify-center gap-2 transition"
              >
                {loadingAi.hint ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                Get Hint
              </button>
              <button 
                onClick={handleAnalyzeComplexity}
                disabled={loadingAi.complexity}
                className="flex-1 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center gap-2 transition"
              >
                {loadingAi.complexity ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                Time Complexity
              </button>
            </div>

            {/* Results Area */}
            <div className="flex-grow p-4 overflow-y-auto font-mono text-sm">
              
              {/* Case 1: Hint/Complexity Result */}
              {(hint || complexity) && !output && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                  {hint && typeof hint === 'object' && hint.overallFeedback ? (
                    <div className="space-y-4">
                      {/* Overall Feedback */}
                      <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg text-yellow-200">
                        <strong className="flex items-center gap-2 mb-2"><Lightbulb size={16}/> Overall Feedback</strong>
                        <p className="text-sm leading-relaxed">{hint.overallFeedback}</p>
                      </div>

                      {/* Strengths */}
                      {hint.strengths && hint.strengths.length > 0 && (
                        <div className="bg-green-900/20 border border-green-700/50 p-4 rounded-lg text-green-200">
                          <strong className="flex items-center gap-2 mb-2 text-green-300">✓ Strengths</strong>
                          <ul className="space-y-1 text-sm">
                            {hint.strengths.map((strength, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {hint.improvements && hint.improvements.length > 0 && (
                        <div className="bg-orange-900/20 border border-orange-700/50 p-4 rounded-lg">
                          <strong className="flex items-center gap-2 mb-2 text-orange-300">⚡ Areas for Improvement</strong>
                          <div className="text-orange-200">
                            {hint.improvements.map((improvement, i) => (
                              <div key={i} className="mb-3">
                                <MarkdownRenderer content={improvement} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hints */}
                      {hint.hints && hint.hints.length > 0 && (
                        <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-lg">
                          <strong className="flex items-center gap-2 mb-2 text-blue-300">💡 Hints</strong>
                          <div className="text-blue-200">
                            {hint.hints.map((h, i) => (
                              <div key={i} className="mb-3">
                                <MarkdownRenderer content={h} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Edge Cases */}
                      {hint.edgeCases && hint.edgeCases.length > 0 && (
                        <div className="bg-purple-900/20 border border-purple-700/50 p-4 rounded-lg">
                          <strong className="flex items-center gap-2 mb-2 text-purple-300">🎯 Edge Cases to Consider</strong>
                          <div className="text-purple-200">
                            {hint.edgeCases.map((edgeCase, i) => (
                              <div key={i} className="mb-3">
                                <MarkdownRenderer content={edgeCase} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : hint && typeof hint === 'string' ? (
                    <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded text-yellow-200">
                      <strong className="flex items-center gap-2 mb-1"><Lightbulb size={14}/> AI Hint:</strong>
                      <div className="text-sm mt-2">
                        <MarkdownRenderer content={hint} />
                      </div>
                    </div>
                  ) : null}
                  
                  {complexity && (
                    <div className="bg-blue-900/20 border border-blue-700/50 p-3 rounded text-blue-200">
                      <strong className="flex items-center gap-2 mb-1"><Activity size={14}/> Big-O Analysis:</strong>
                      <p className="text-lg font-bold">{complexity}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: Compiler Output */}
              {output ? (
                <div className="animate-in fade-in">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs uppercase tracking-wider font-bold">Terminal Output</span>
                      {output.stderr ? (
                        <span className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/> Error</span>
                      ) : (
                        <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle size={12}/> Success</span>
                      )}
                   </div>
                   
                   {output.stdout && (
                     <pre className="text-gray-300 whitespace-pre-wrap">{output.stdout}</pre>
                   )}
                   
                   {output.stderr && (
                     <pre className="text-red-400 whitespace-pre-wrap mt-2">{output.stderr}</pre>
                   )}
                </div>
              ) : (
                // Case 3: Idle State
                !hint && !complexity && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                    <Terminal size={24} className="mb-2 opacity-50" />
                    <p>Run your code to see output here</p>
                  </div>
                )
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}