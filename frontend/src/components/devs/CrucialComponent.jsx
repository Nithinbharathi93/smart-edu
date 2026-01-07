import React, { useEffect } from 'react';
import { Sparkles, Home, ShieldCheck, CodeXml   } from 'lucide-react'; // Using Lucide for icons

const CrucialComponent = () => {
  useEffect(() => {
    // A secret greeting for those who check the console even here!
    console.log(
      "%c 🏆 LEVEL 99 DEVELOPER FOUND %c",
      "background: #fbbf24; color: #000; font-weight: bold; font-size: 20px; padding: 5px;",
      "background: transparent;"
    );
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-yellow-500/20 rounded-full blur-[120px]" />

      {/* Main Content Card */}
      <div className="z-10 text-center space-y-8 px-6">
        
        {/* The Golden Egg Icon */}
        <div className="relative inline-block group">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-green-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <div className="relative bg-slate-900 ring-1 ring-white/10 rounded-full p-8">
            <CodeXml className="w-16 h-16 text-yellow-400" />
          </div>
        </div>

        {/* The Big Reveal */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
            Great.. you have found the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 bg-[length:200%_auto] animate-gradient">
              ultimate easter egg!!
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
            You've ventured where few users dare to tread. <br />
            Your curiosity has been rewarded with this secret sanctum.
          </p>
        </div>

        {/* Badge and Button */}
        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-green-400 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Developer Access Verified</span>
          </div>

          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-white text-slate-950 px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            <Home className="w-5 h-5" />
            Go Back to Reality
          </button>
        </div>
      </div>

      {/* Bottom Footer Decor */}
      <div className="absolute bottom-8 text-white text-xs tracking-[0.2em] uppercase">
        Developer's Message: "Jeichuta Maara..!"
      </div>
    </div>
  );
};

export default CrucialComponent;