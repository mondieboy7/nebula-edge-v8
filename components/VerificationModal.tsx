
import React, { useState, useEffect } from 'react';

interface VerificationModalProps {
  onVerify: (identity: string | null) => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ onVerify }) => {
  const [nodes, setNodes] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // THE INNER CIRCLE REGISTRY
  const SIGILS: Record<string, string> = {
    "0,3,6,2,4,8": "Kingston Mondie", // The "K" shape
    "0,1,2,5,8": "John",              // Top & Right bar
    "0,3,7,5,2": "Vicky",             // The "V" shape (Viki)
    "0,1,2,5,4,3,6,7,8": "Jacob",     // The "S" Spiral
    "0,3,6,7,4,1": "Duane",           // The "D" loop
    "6,3,1,5,8": "Abryan"             // The "A" peak
  };

  const handleNodeEnter = (id: number) => {
    if (isDrawing && !nodes.includes(id)) {
      setNodes(prev => [...prev, id]);
      // Visual feedback
      const el = document.getElementById(`sigil-node-${id}`);
      if (el) {
        el.classList.add('node-active-flash');
        setTimeout(() => el.classList.remove('node-active-flash'), 300);
      }
    }
  };

  const handleStart = (id: number) => {
    setIsDrawing(true);
    setNodes([id]);
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const patternStr = nodes.join(',');
    
    const verifiedName = SIGILS[patternStr];
    
    if (verifiedName) {
      setSuccess(verifiedName);
      setTimeout(() => onVerify(verifiedName), 1500);
    } else {
      setError(true);
      setNodes([]);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#02030d]/98 backdrop-blur-3xl animate-in fade-in duration-500 font-plus">
      <div className="absolute inset-0 scanline-biometric pointer-events-none opacity-40"></div>
      
      <div className={`w-full max-w-md glass p-10 rounded-[4rem] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all duration-500 relative overflow-hidden ${error ? 'animate-shake border-red-500/50' : ''} ${success ? 'border-cyan-500 shadow-[0_0_80px_rgba(34,211,238,0.3)]' : 'border-white/10'}`}>
        
        {/* Biometric Scanning HUD Line */}
        <div className={`absolute left-0 right-0 h-0.5 bg-cyan-400/60 blur-[2px] z-0 animate-hud-scan pointer-events-none ${success ? 'hidden' : ''}`}></div>

        <div className="flex flex-col items-center mb-12 text-center relative z-10">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 border-2 transition-all duration-1000 relative ${success ? 'bg-cyan-500 border-white scale-110 shadow-[0_0_40px_rgba(34,211,238,0.8)]' : 'bg-white/5 border-white/10'}`}>
            <div className={`absolute inset-0 rounded-full border border-cyan-400/40 animate-ping-slow ${isDrawing ? 'opacity-100' : 'opacity-0'}`}></div>
            {success ? (
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="flex flex-col items-center">
                 <svg className={`w-12 h-12 ${error ? 'text-red-500' : 'text-cyan-400'} ${isDrawing ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.708 0 3.29.426 4.672 1.176m0 0a9.963 9.963 0 012.303 1.9c.57.57 1.053 1.202 1.432 1.889m-3.735 1.126a3.99 3.99 0 00-7.471 0m9.984 4.56a5.97 5.97 0 01-6.323 5.447m3.146-3.146a11.954 11.954 0 013.146-3.146" />
                 </svg>
                 <span className="text-[8px] font-black text-cyan-400/60 uppercase tracking-[0.3em] mt-2">Biometrics</span>
              </div>
            )}
          </div>
          <h2 className={`text-3xl font-black text-white tracking-tighter uppercase mb-2 ${success ? 'glitch-success' : ''}`} data-text={success ? 'ACCESS GRANTED' : 'NEURAL SIGIL'}>
            {success ? 'Access Granted' : 'Neural Sigil'}
          </h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.5em]">
            {success ? `${success} Verified` : 'Input Pattern Protocol'}
          </p>
        </div>

        <div 
          className="grid grid-cols-3 gap-10 p-4 mb-12 relative touch-none select-none z-10"
          onMouseLeave={handleEnd}
          onMouseUp={handleEnd}
          onTouchEnd={handleEnd}
        >
          {/* Neural Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.length > 1 && nodes.map((nodeId, idx) => {
              if (idx === 0) return null;
              const prevNode = nodes[idx - 1];
              const x1 = (prevNode % 3) * 33.33 + 16.66;
              const y1 = Math.floor(prevNode / 3) * 33.33 + 16.66;
              const x2 = (nodeId % 3) * 33.33 + 16.66;
              const y2 = Math.floor(nodeId / 3) * 33.33 + 16.66;
              return (
                <line 
                  key={idx} 
                  x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} 
                  stroke={error ? '#ef4444' : '#22d3ee'} 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  className="animate-line-draw drop-shadow-[0_0_15px_rgba(34,211,238,1)]"
                />
              );
            })}
          </svg>

          {[...Array(9)].map((_, i) => (
            <div 
              key={i}
              id={`sigil-node-${i}`}
              className={`w-full aspect-square rounded-[1.5rem] border-2 flex flex-col items-center justify-center transition-all duration-300 relative z-10 ${
                nodes.includes(i) 
                  ? (error ? 'bg-red-500/30 border-red-500 scale-125' : 'bg-cyan-500/40 border-cyan-400 scale-125 shadow-[0_0_25px_rgba(34,211,238,0.7)]') 
                  : 'bg-white/5 border-white/10 hover:border-white/40 cursor-crosshair'
              }`}
              onMouseDown={() => handleStart(i)}
              onMouseEnter={() => handleNodeEnter(i)}
              onTouchStart={(e) => { e.preventDefault(); handleStart(i); }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                const nodeId = element?.getAttribute('data-node-id');
                if (nodeId !== null && nodeId !== undefined) handleNodeEnter(parseInt(nodeId));
              }}
              data-node-id={i}
            >
              <span className={`text-[10px] font-black transition-colors mb-1 ${nodes.includes(i) ? 'text-white' : 'text-slate-700'}`}>{i}</span>
              <div className={`w-2.5 h-2.5 rounded-full transition-transform duration-500 ${nodes.includes(i) ? 'bg-white scale-150' : 'bg-slate-800'}`} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 relative z-10 text-center">
          <div className="flex justify-center gap-2 opacity-30">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
             ))}
          </div>
          <button 
            type="button"
            onClick={() => onVerify(null)}
            className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white transition-colors"
          >
            Decline Challenge
          </button>
        </div>
      </div>

      <style>{`
        .scanline-biometric {
          background: linear-gradient(to bottom, transparent 50%, rgba(34, 211, 238, 0.03) 50%);
          background-size: 100% 4px;
        }
        @keyframes hud-scan {
          from { top: -5%; }
          to { top: 105%; }
        }
        .animate-hud-scan {
          animation: hud-scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .node-active-flash {
          animation: node-flash-anim 0.3s ease-out;
        }
        @keyframes node-flash-anim {
          0% { transform: scale(1.3); box-shadow: 0 0 40px #22d3ee; }
          100% { transform: scale(1.25); box-shadow: 0 0 25px rgba(34,211,238,0.7); }
        }
        .animate-line-draw {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: line-anim 0.4s forwards;
        }
        @keyframes line-anim {
          to { stroke-dashoffset: 0; }
        }
        .animate-ping-slow {
          animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .glitch-success {
          text-shadow: 2px 0 #22d3ee, -2px 0 #ff0080;
          animation: glitch-anim 0.2s infinite alternate;
        }
        @keyframes glitch-anim {
          0% { transform: translate(1px, 1px); }
          100% { transform: translate(-1px, -1px); }
        }
      `}</style>
    </div>
  );
};

export default VerificationModal;
