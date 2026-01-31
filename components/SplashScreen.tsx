
import React from 'react';

interface SplashScreenProps {
  onStart: () => void;
  userName?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, userName }) => {
  return (
    <div className="h-screen w-full bg-[#06071b] flex flex-col items-center justify-center p-10 relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-8xl font-black mb-4 tracking-tight nebula-logo-gradient animate-in fade-in duration-1000">
          Nebula
        </h1>
        <h2 className="text-4xl font-black text-white mb-6 animate-in slide-in-from-bottom duration-700">
           Hello, {userName || "Traveler"}
        </h2>
        <p className="max-w-xs text-lg text-slate-400 font-medium mb-12 leading-relaxed">
          From content creation to smart automation, experience the future now.
        </p>

        <button 
          onClick={onStart}
          className="group flex items-center gap-4 bg-white/10 glass px-8 py-5 rounded-[2.5rem] hover:bg-white/20 transition-all duration-500 hover:scale-105 active:scale-95"
        >
          <span className="text-xl font-bold tracking-tight">Access Interface</span>
          <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] group-hover:rotate-45 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7M5 12h16" />
            </svg>
          </div>
        </button>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -z-0"></div>
    </div>
  );
};

export default SplashScreen;
