import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Loader2, BookOpen, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Markdown formatter for simple formatting
const formatMarkdown = (text) => {
  if (!text) return text;
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
    .replace(/__(.*?)__/g, '<strong>$1</strong>') // __bold__
    .replace(/_(.*?)_/g, '<em>$1</em>') // _italic_
    .replace(/`(.*?)`/g, '<code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>') // `code`
    .replace(/\n/g, '<br/>'); // newlines
};

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [contextType, setContextType] = useState('pdf'); 
  const [syllabusData, setSyllabusData] = useState(null);
  const [documentId, setDocumentId] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      content: 'Hey there! 👋 I\'ve got your document memorized and ready to help. Feel free to ask me to explain concepts, summarize sections, or dive deep into any topic. What would you like to explore?',
      source: null,
      sourceExpanded: false
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    // 1. Check Auth & Params
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(storedUser));
    setIsAuthLoading(false);

    // 2. Determine Context
    if (location.state?.contextType) {
      setContextType(location.state.contextType); // 'pdf' or 'syllabus'
      
      if (location.state.contextType === 'syllabus' && location.state.syllabusData) {
        setSyllabusData(location.state.syllabusData);
        setMessages([{
            id: 1,
            role: 'ai',
            content: `Hello! I'm ready to help you with your course "**${location.state.syllabusData.syllabusTitle || 'Study Plan'}**". Ask me anything about the weeks, topics, or exercises!`,
            source: null,
            sourceExpanded: false
        }]);
      } else {
        // Default PDF message
         setMessages([{
            id: 1,
            role: 'ai',
            content: 'Hey there! 👋 I\'ve got your document memorized and ready to help. Feel free to ask me to explain concepts, summarize sections, or dive deep into any topic. What would you like to explore?',
            source: null,
            sourceExpanded: false
        }]);
      }

      if (location.state.documentId) {
        setDocumentId(location.state.documentId);
      }
    }

  }, [navigate, location.state]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Toggle source expansion
  const toggleSource = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, sourceExpanded: !msg.sourceExpanded } : msg
    ));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message
    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      let response;

      if (contextType === 'pdf') {
         // Existing PDF Chat
         response = await fetch('http://localhost:5000/api/pdf/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                question: userMessage.content,
                documentId: documentId // Pass this if backend supported specific doc search, currently acts global or last uploaded
            })
          });
      } else {
         // Syllabus/Smart Response Chat
         // Construct a context string from the syllabus object
         const contextString = JSON.stringify(syllabusData, null, 2);
         
         response = await fetch('http://localhost:5000/api/ai/smart-response', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                question: userMessage.content, 
                context: contextString,
                documentTitle: syllabusData?.syllabusTitle || "Course Syllabus"
            })
          });
      }

      const data = await response.json();

      // 3. Add AI Response
      if (response.ok) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'ai',
          content: data.answer,
          source: data.source_snippet || null, // Smart response might not return snippets in same format, handle gracefully
          sourceExpanded: false
        }]);
      } else {
        throw new Error(data.message || data.error || 'Failed to get answer');
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: "Oops! Something went wrong. I couldn't process that request right now.",
        isError: true,
        sourceExpanded: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans dark:bg-gray-900 transition-colors duration-200">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-grow flex flex-col h-[calc(100vh-128px)]" style={{ width: '98vw' }}>
        
        {/* Header / Context Bar */}
        <div className="bg-white p-4 border-b border-gray-200 shadow-sm flex items-center justify-between dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg text-green-700 dark:bg-green-900 dark:text-green-300">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-gray-900 dark:text-gray-100">
                        {contextType === 'pdf' ? 'Document Companion' : 'Course Tutor'}
                    </h2>
                    <p className="text-xs text-gray-500 flex items-center gap-1 dark:text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {contextType === 'pdf' ? 'Answering from PDF' : 'Answering from Syllabus'}
                    </p>
                </div>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                Powered by Gemini
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow bg-white overflow-y-auto p-6 space-y-6 dark:bg-gray-900">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user' ? 'bg-gray-900 text-white dark:bg-green-600' : 'bg-green-100 text-green-700 dark:bg-gray-800 dark:text-green-400'
                    }`}>
                        {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-gray-900 text-white rounded-tr-none dark:bg-green-600' 
                                : msg.isError 
                                    ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-none dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50'
                                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
                        }`}>
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: formatMarkdown(msg.content) 
                              }} 
                              className="break-words"
                            />
                        </div>

                        {/* Source Context Dropdown - Only for AI with source */}
                        {msg.source && msg.role === 'ai' && (
                            <div className="mt-3 w-full max-w-md">
                                <button
                                    onClick={() => toggleSource(msg.id)}
                                    className="flex items-center gap-2 text-xs font-semibold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-2 rounded-lg border border-yellow-200 transition w-full justify-between dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/50 dark:hover:bg-yellow-900/30"
                                >
                                    <span className="flex items-center gap-2">
                                        <FileText size={14} />
                                        Source from document
                                    </span>
                                    {msg.sourceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {/* Expanded Source Content */}
                                {msg.sourceExpanded && (
                                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs leading-relaxed text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-900/50">
                                        <p className="italic opacity-90">
                                            "{msg.source.substring(0, 300)}{msg.source.length > 300 ? '...' : ''}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            
            {/* Loading Indicator */}
            {loading && (
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 dark:bg-gray-800">
                        <Bot size={20} className="text-green-700 dark:text-green-400" />
                    </div>
                    <div className="bg-gray-50 px-5 py-4 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-2 dark:bg-gray-800 dark:border-gray-700">
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                        <span className="text-gray-400 text-sm">Thinking...</span>
                    </div>
                </div>
            )}
            
            {/* Invisible div to track scroll position */}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <form onSubmit={handleSend} className="relative flex items-center gap-2 max-w-6xl mx-auto">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about your document..."
                    className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 border-0 rounded-xl py-3 pl-5 pr-14 focus:ring-2 focus:ring-green-100 focus:bg-white transition outline-none dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-green-900 dark:focus:bg-gray-800"
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="absolute right-2 p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
            </form>
            <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-600">
                Always verify important information directly from your document
            </div>
        </div>

      </main>

    </div>
  );
}