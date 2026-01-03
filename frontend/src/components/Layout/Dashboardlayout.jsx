// src/components/Layout/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Bell,
  Code2,
  Library
} from 'lucide-react';
import logo from '../../assets/smartedu.png';

const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile/me');
        setProfile(data);
      } catch (err) {
        console.error("Layout Profile Fetch Error:", err);
      }
    };
    fetchProfile();
  }, []);

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'My Syllabi', path: '/dashboard/syllabi', icon: <BookOpen size={18} /> },
    { name: 'Practice Library', path: '/problems', icon: <Library size={18} /> },
    { name: 'Assessments', path: '/dashboard/assessment', icon: <Trophy size={18} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* --- Sidebar --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-black transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <Link to="/dashboard" className="p-8 flex items-center gap-3">
            <div className=" p-2 rounded-xl text-white shadow-lg shadow-green-50/500/20">
              <img 
                          src={logo} 
                          alt="SmartEdu Logo" 
                          className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
                        />
            </div>
            <span className="text-xl font-black text-white tracking-tighter italic">SmartEdu</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-1 mt-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all
                  ${isActive(item.path) 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-50/500/20' 
                    : 'text-green-600/70 hover:bg-black hover:text-slate-100'}
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.name}
                </div>
                {isActive(item.path) && <ChevronRight size={14} />}
              </Link>
            ))}
          </nav>

          {/* User Bottom Section Card */}
          <div className="p-4 border-t border-black bg-black/50">
            <div className="bg-black/50 rounded-2xl p-4 mb-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-green-50/500 flex items-center justify-center text-white font-black text-sm">
                  {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-white truncate">{profile?.full_name || "New Learner"}</p>
                  <p className="text-[10px] text-slate-500 truncate font-mono uppercase tracking-tighter">Level {profile?.current_level || 1} {profile?.persona}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-green-600/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h2 className="text-sm font-black text-black tracking-tight">
                {profile ? `Welcome back, ${profile.full_name.split(' ')[0]}!` : "Hello there!"}
              </h2>
              <p className="text-[10px] font-bold text-green-600/70 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Learning Environment Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-green-600/70 hover:text-green-600 hover:bg-green-50/50 rounded-full transition-all relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white"></span>
            </button>
            
            <div className="h-6 w-px bg-slate-200" />

            {/* Header Profile Trigger */}
            <Link 
              to="/dashboard/profile"
              className="flex items-center gap-3 p-1 pl-3 rounded-full hover:bg-slate-50 border border-slate-100 transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-black leading-tight">My Profile</p>
                <p className="text-[9px] text-green-600/70 font-bold leading-tight">View Progress</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-black ring-2 ring-green-50/500/20 shadow-sm">
                {profile?.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-50/30">
          <div className="p-1">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;