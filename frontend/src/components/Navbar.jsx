import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard, PlusCircle } from 'lucide-react';
import logo from "../assets/smartedu.png"; 

export default function Navbar({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3">
              <img src={logo} alt="Smart Edu Logo" className="h-10 w-auto" />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-900 leading-none">Smart Edu</h1>
                <p className="text-[10px] text-green-600 font-bold tracking-widest uppercase">AI Learning Companion</p>
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              // Logged In View
              <>
                <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-green-600 font-medium transition">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
                <Link to="/create-course" className="flex items-center gap-2 text-gray-600 hover:text-green-600 font-medium transition">
                  <PlusCircle size={18} /> New Course
                </Link>
                
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    {user.email}
                  </span>
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-red-600 transition"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              // Public View
              <>
                <Link to="/login" className="text-gray-600 hover:text-green-600 font-medium transition">Login</Link>
                <Link to="/register" className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition shadow-md hover:shadow-lg">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-green-600 focus:outline-none p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0">
          <div className="px-6 py-4 space-y-3">
            {user ? (
              <>
                <div className="pb-2 mb-2 border-b border-gray-100 text-sm text-gray-500">{user.email}</div>
                <Link to="/dashboard" className="block py-2 text-gray-700 font-medium hover:text-green-600">Dashboard</Link>
                <Link to="/create-course" className="block py-2 text-gray-700 font-medium hover:text-green-600">Create Course</Link>
                <button 
                  onClick={onLogout}
                  className="w-full text-left py-2 text-red-600 font-medium flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-gray-700 font-medium">Login</Link>
                <Link to="/register" className="block py-2 text-green-600 font-bold">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}