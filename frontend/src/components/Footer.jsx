import React from 'react';
import { BookOpen, User, LogOut, Menu } from 'lucide-react';

const Footer = () => (
  <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-indigo-600 w-5 h-5" />
          <span className="text-lg font-bold">SmartEdu</span>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          The AI-powered learning companion that builds personalized syllabi and provides Socratic tutoring for developers.
        </p>
      </div>
      <div className="flex flex-col gap-2 text-sm text-slate-600">
        <h4 className="font-bold text-slate-800 mb-2">Platform</h4>
        <a href="#" className="hover:text-indigo-600">Features</a>
        <a href="#" className="hover:text-indigo-600">Adaptive Assessment</a>
        <a href="#" className="hover:text-indigo-600">Coding Lab</a>
      </div>
      <div className="text-sm text-slate-600">
        <h4 className="font-bold text-slate-800 mb-2">Connect</h4>
        <p>Support: help@smartedu.ai</p>
        <div className="mt-4 flex gap-4">
           {/* Social Icons Placeholder */}
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
      © 2026 SmartEdu AI Inc. All rights reserved.
    </div>
  </footer>
);

export default Footer;  