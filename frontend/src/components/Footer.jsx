import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin } from 'lucide-react';
import logo from "../assets/smartedu.png";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 opacity-90">
              <img src={logo} alt="Logo" className="h-8 w-auto grayscale" />
              <span className="text-xl font-bold text-gray-800">Smart Edu</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Empowering learners with AI-driven syllabi, adaptive coding challenges, and intelligent document analysis.
            </p>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/dashboard" className="hover:text-green-600 transition">Dashboard</Link></li>
              <li><Link to="/create-course" className="hover:text-green-600 transition">Syllabus Generator</Link></li>
              <li><Link to="/create-course?mode=upload" className="hover:text-green-600 transition">PDF Study Chat</Link></li>
            </ul>
          </div>

          {/* Socials Column */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Connect</h4>
            <div className="flex space-x-3">
              {[Github, Twitter, Linkedin].map((Icon, idx) => (
                <a key={idx} href="#" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-green-600 hover:text-white transition duration-300">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Smart Edu Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
}