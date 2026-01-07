import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/smartedu.png';
import { User, LogOut, Menu, Library, LayoutDashboard } from 'lucide-react';

const Header = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-100 px-6 lg:px-10 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-slate-50">
      
      {/* Brand Logo & Name */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="relative">
          <img 
            src={logo} 
            alt="Zentellect Logo" 
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </div>
        <span className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
          Zen<span className="text-emerald-500">tellect</span>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-slate-500">
          <Link to="/dashboard" className="hover:text-emerald-500 transition-colors flex items-center gap-2">
            <LayoutDashboard size={14} /> Dashboard
          </Link>
          <Link to="/problems" className="hover:text-emerald-500 transition-colors flex items-center gap-2">
            <Library size={14} /> Library
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
            <Link to="/dashboard/profile" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                <User size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-900 leading-none truncate max-w-[80px]">
                  {user.email.split('@')[0]}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Learner</span>
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Toggle */}
      <button className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg">
        <Menu size={24} />
      </button>
    </nav>
  );
};

export default Header;