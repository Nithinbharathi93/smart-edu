// src/components/Layout/DashboardLayout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
  UserCircle
} from 'lucide-react';

const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Updated Navigation Links
  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Syllabi', path: '/dashboard/syllabi', icon: <BookOpen size={20} /> },
    { name: 'Assessments', path: '/dashboard/assessment', icon: <Trophy size={20} /> },
    { name: 'Profile', path: '/dashboard/profile', icon: <UserCircle size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Helper to check if a route is active
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* --- Sidebar --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <Link to="/dashboard" className="p-6 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BookOpen size={24} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">SmartEdu</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)} // Close sidebar on mobile after click
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all
                  ${isActive(item.path) 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.name}
                </div>
                {isActive(item.path) && <ChevronRight size={16} />}
              </Link>
            ))}
          </nav>

          {/* User Bottom Section */}
          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-medium hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workspace</p>
              <h2 className="text-sm font-bold text-slate-700">
                {user.email?.split('@')[0]}'s Dashboard
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profile Trigger */}
            <Link 
              to="/dashboard/profile"
              className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-200">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">My Profile</p>
                <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[100px]">{user.email}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Rendered Here */}
        <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-50/50">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-md transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;