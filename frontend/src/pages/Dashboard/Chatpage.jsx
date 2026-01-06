// src/pages/Dashboard/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Send,
  Bot,
  User,
  ArrowLeft,
  Loader2,
  Sparkles,
  Trash2,
  Info,
} from "lucide-react";
import logo from "../../assets/smartedu.png";

const ChatPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const syllabusId = searchParams.get("syllabus_id");
  const pdfId = searchParams.get("pdf_id");
  const level = searchParams.get("level") || "Beginner";

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "I am your Socratic Tutor. Instead of giving answers, I will guide you with questions to help you master the concept. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const formatMessage = (text) => {
    if (!text) return "";
    return text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-black text-emerald-400">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="italic opacity-90">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    // 1. Update UI with user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // 2. Prepare Payload: Ensuring syllabus_id is a number
      const payload = {
        syllabus_id: Number(syllabusId),
        question: userMessage,
        level: level
      };

      // 3. Request logic: Both routes now use similar structure
      const endpoint = syllabusId ? '/chat/syllabus' : '/chat';
      const response = await api.post(endpoint, payload);

      // 4. Extract answer and add to state
      const botResponse = response.data.answer || response.data.response || "I processed your request, but I have no specific answer.";
      setMessages(prev => [...prev, { role: 'ai', content: botResponse }]);
      
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "My **Socratic Core** is experiencing a connection delay. Please try asking your question again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 font-sans">
      {/* Chat Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
              <img src={logo} alt="Logo" className="h-7 w-auto" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Socratic Tutor
              </h2>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={10} />{" "}
                {syllabusId
                  ? "Syllabus Context Active"
                  : "Document Analysis Active"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
          title="Clear Chat"
        >
          <Trash2 size={18} />
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } animate-in fade-in slide-in-from-bottom-2`}
          >
            <div
              className={`max-w-[80%] flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border ${
                  msg.role === "user"
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`p-4 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                }`}
              >
                {/* Apply the formatting helper here */}
                {formatMessage(msg.content)}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tutor is thinking...
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100 shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex gap-3"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this curriculum..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-300">
              <Info size={16} title="Socratic mode is active" />
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-[52px] w-[52px] bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-slate-200"
          >
            <Send size={20} />
          </button>
        </form>
        <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">
          CodeVerse Socratic Engine • {level} Mode
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
