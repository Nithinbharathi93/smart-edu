// src/pages/Landing.jsx
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';
import { BrainCircuit, FileText, Code2, Sparkles } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
          <Sparkles size={16} />
          <span>New: AI-Powered PDF to Syllabus Ingestion</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
          Master any skill with <span className="text-indigo-600">Socratic</span> AI.
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload a PDF or choose a topic. Our AI builds a personalized curriculum, 
          challenges you with code, and guides you like a real tutor.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button className="px-10 py-4 text-lg">Start Learning Free</Button>
          <Button variant="secondary" className="px-10 py-4 text-lg">View Demo</Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for the modern developer</h2>
            <p className="text-slate-500">Everything you need to go from Novice to Master.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="text-blue-600" />}
              title="PDF Ingestion"
              desc="Drop your documentation or textbooks. We'll extract the core concepts into a structured weekly plan."
            />
            <FeatureCard 
              icon={<BrainCircuit className="text-purple-600" />}
              title="Adaptive Assessment"
              desc="The 'Level Breaker' test measures your current skill and adjusts the difficulty of your problems in real-time."
            />
            <FeatureCard 
              icon={<Code2 className="text-indigo-600" />}
              title="AI Coding Lab"
              desc="Write code in our browser compiler. If you're stuck, our Socratic tutor asks questions to lead you to the solution."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-indigo-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to break your levels?</h2>
          <p className="text-indigo-100 mb-8 text-lg">Join 10,000+ developers upskilling with SmartEdu.</p>
          <Button variant="secondary" className="mx-auto bg-white text-indigo-600 border-none hover:bg-indigo-50">
            Create Your First Syllabus
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

export default Landing;