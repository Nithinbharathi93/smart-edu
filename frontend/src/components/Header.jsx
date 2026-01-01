import React from 'react';
import { BookOpen, User, LogOut, Menu } from 'lucide-react';

const Header = ({ user }) => {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <BookOpen className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">SmartEdu</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-slate-600 font-medium">
        <a href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</a>
        <a href="/syllabi" className="hover:text-indigo-600 transition-colors">My Courses</a>
        {user ? (
          <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                <User size={18} />
              </div>
              <span className="text-sm font-semibold">{user.email.split('@')[0]}</span>
            </div>
            <button className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <a href="/login" className="hover:text-indigo-600">Login</a>
            <a href="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
              Get Started
            </a>
          </div>
        )}
      </div>
      <button className="md:hidden"><Menu /></button>
    </nav>
  );
};

export default Header;