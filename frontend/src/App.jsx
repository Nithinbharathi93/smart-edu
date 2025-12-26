import './App.css'
import React from "react";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20 animate-pulse" />

      {/* Main card */}
      <div className="relative z-10 max-w-lg w-full mx-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
          
          {/* Icon */}
          <div className="text-6xl mb-4 animate-bounce">🚧</div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold text-white tracking-wide">
            Under Construction
          </h1>

          {/* Gradient divider */}
          <div className="h-1 w-24 mx-auto my-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full" />

          {/* Subtitle */}
          <p className="text-gray-300 text-lg">
            We’re building something
            <span className="text-white font-semibold"> insanely cool</span>.
          </p>

          <p className="text-gray-400 mt-2">
            Come back later. Trust us.
          </p>

          {/* Button */}
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-pink-500/40 transition-all duration-300"
          >
            Refresh Reality 🔄
          </button>
        </div>
      </div>

      {/* Floating blur blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl" />
    </div>
  );
}


