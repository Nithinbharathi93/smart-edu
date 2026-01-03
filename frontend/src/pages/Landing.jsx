// src/pages/Landing.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';
import { 
  BrainCircuit, 
  FileText, 
  Code2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6 text-center max-w-6xl mx-auto overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
          <Sparkles size={14} />
          <span>The Future of Technical Education</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-black tracking-tighter mb-8 leading-[0.9]">
          Master Code with <br />
          <span className="text-green-500 italic">Socratic Precision.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          CodeVerse transforms static PDFs and complex topics into adaptive, 
          AI-guided coding paths. Don't just learn—evolve through structured 
          challenges and Socratic mentorship.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={() => navigate('/register')} 
            className="px-10 py-6 text-sm font-black uppercase tracking-widest bg-green-600 hover:bg-green-500 shadow-xl shadow-green-200 border-none rounded-2xl"
          >
            Start Your Journey <ArrowRight size={18} className="ml-2" />
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/login')}
            className="px-10 py-6 text-sm font-black uppercase tracking-widest border-slate-200 text-slate-600 rounded-2xl"
          >
            Sign In to Lab
          </Button>
        </div>

        {/* Hero Visual */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-full w-full" />
          <div className="bg-slate-100 rounded-[3rem] p-4 md:p-8 border border-slate-200 shadow-2xl">
            <div className="bg-black rounded-[2rem] h-[400px] md:h-[600px] w-full overflow-hidden flex items-center justify-center p-10">
               {/* Placeholder for a Dashboard Preview or the Robot Logo */}
               <div className="text-green-500 font-mono text-sm opacity-50 animate-pulse">
                  &gt; INITIALIZING_SOCRATIC_CORE_... <br/>
                  &gt; MAPPING_LEARNING_ROADMAP_... <br/>
                  &gt; READY_FOR_INGESTION_
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Feature Sections */}
      <section className="py-32 bg-black text-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight tracking-tight">
                From Raw Documentation <br/>
                to <span className="text-green-500">Structured Wisdom.</span>
              </h2>
              <div className="space-y-8">
                <DetailItem 
                  icon={<FileText className="text-green-500" />}
                  title="PDF Intelligence"
                  desc="Upload textbooks, research papers, or API docs. Our AI parses the technical depth to generate a week-by-week syllabus."
                />
                <DetailItem 
                  icon={<Cpu className="text-green-500" />}
                  title="Adaptive Level Breaker"
                  desc="Skip the basics. Our initial assessment measures your existing proficiency and adjusts problem difficulty in real-time."
                />
                <DetailItem 
                  icon={<ShieldCheck className="text-green-500" />}
                  title="Verified Progress"
                  desc="Every solution is cross-verified against hidden test cases. Build your library of passed challenges."
                />
              </div>
            </div>
            <div className="relative">
               <div className="aspect-square bg-green-500/10 rounded-[4rem] border border-green-500/20 flex items-center justify-center p-12">
                  <BrainCircuit size={120} className="text-green-500 animate-pulse" />
               </div>
               {/* Decorative floating elements */}
               <div className="absolute -top-10 -left-10 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Socratic Active</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic">"What happens to complexity <br/> if we use a Hash Map here?"</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black text-green-600 uppercase tracking-[0.3em] mb-4">Core Capabilities</h2>
            <h3 className="text-4xl font-black text-black tracking-tight">Built for the Modern Architect.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Code2 className="text-green-600" />}
              title="Browser-Based IDE"
              desc="A full-featured coding environment with auto-indentation, bracket pairing, and instant execution for Python and JavaScript."
            />
            <FeatureCard 
              icon={<Sparkles className="text-green-600" />}
              title="The Socratic Tutor"
              desc="Unlike standard LLMs, our AI doesn't just give answers. It guides you conceptual hints to foster deep understanding."
            />
            <FeatureCard 
              icon={<CheckCircle2 className="text-green-600" />}
              title="Versioned Repository"
              desc="Revisit every attempt. Track your evolution from beginner scripts to optimized, production-ready solutions."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-green-600 rounded-[3.5rem] p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-green-200">
          <div className="relative z-10">
            <h2 className="text-5xl font-black mb-8 tracking-tighter italic">Ready to break your levels?</h2>
            <p className="text-green-100 mb-12 text-lg max-w-xl mx-auto font-medium">
              Join the new era of autonomous learning. Upload your first document and let CodeVerse build your path.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => navigate('/register')}
                variant="secondary" 
                className="px-12 py-6 bg-black text-green-400 border-none hover:bg-zinc-900 rounded-2xl font-black uppercase tracking-widest text-xs"
              >
                Create Free Account
              </Button>
            </div>
          </div>
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20" />
        </div>
      </section>

      <Footer />
    </div>
  );
};

const DetailItem = ({ icon, title, desc }) => (
  <div className="flex gap-6">
    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h4 className="text-lg font-bold mb-2 tracking-tight">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-green-100 transition-all duration-500 group">
    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-black text-black mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

export default Landing;