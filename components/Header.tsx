
import React from 'react';

interface HeaderProps {
  toggleSidebar: () => void;
  isSpeechEnabled: boolean;
  onToggleSpeech: () => void;
  onProfileClick: () => void;
  userName: string;
  isVerified?: boolean;
  identityType?: 'ARCHITECT-S' | 'SYNAPSE-V' | 'SYNAPSE-S' | 'GUEST';
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSpeechEnabled, onToggleSpeech, onProfileClick, userName, isVerified, identityType }) => {
  const getThemeColor = () => {
    if (identityType === 'ARCHITECT-S') return 'text-nebula-cyan border-nebula-cyan bg-nebula-cyan/10';
    if (identityType === 'SYNAPSE-V') return 'text-nebula-cyan border-nebula-cyan bg-nebula-cyan/10';
    if (identityType === 'SYNAPSE-S') return 'text-nebula-purple border-nebula-purple bg-nebula-purple/10';
    return 'text-slate-500 border-white/10 bg-white/5';
  };

  const getIndicatorColor = () => {
    if (identityType === 'ARCHITECT-S') return 'bg-yellow-400';
    if (identityType === 'SYNAPSE-V') return 'bg-pink-400';
    if (identityType === 'SYNAPSE-S') return 'bg-purple-400';
    return 'bg-slate-600';
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-transparent z-20">
      <div className="flex items-center gap-6">
        <button onClick={toggleSidebar} className="text-slate-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">Nebula Edge</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Digital Peer Engine</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`border px-3 py-1 rounded-full flex items-center gap-1.5 transition-all duration-1000 ${getThemeColor()} ${isVerified ? 'shadow-[0_0_15px_rgba(0,0,0,0.5)]' : ''}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${getIndicatorColor()} ${isVerified ? 'animate-ping' : ''}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest`}>
                {isVerified ? `Neural Link: ${identityType}` : 'Relay: GUEST'}
              </span>
            </div>

            {isVerified && identityType === 'ARCHITECT-S' && (
              <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse">
                <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">God-Mode</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSpeech}
          className={`p-2.5 rounded-full transition-all duration-300 ${
            isSpeechEnabled ? 'text-nebula-cyan drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] scale-110' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        
        <button 
          onClick={onProfileClick}
          className={`flex items-center gap-3 glass pl-4 pr-1.5 py-1.5 rounded-full border-white/10 transition-all active:scale-95 hover:border-white/30`}
        >
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline ${isVerified ? 'text-white' : 'text-slate-400'}`}>{userName}</span>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all nebula-gradient shadow-lg`}>
              <svg className={`w-5 h-5 text-white`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
