
import React, { useState, useRef } from 'react';
import { Message, MessageRole, Artifact } from '../types';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface MessageItemProps {
  message: Message;
  onSelectArtifact?: (artifact: Artifact) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onSelectArtifact }) => {
  const isNebula = message.role === MessageRole.NEBULA;
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAudio = async (base64: string) => {
    try {
      setIsPlaying(true);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const bytes = decode(base64);
      const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (e) {
      console.error("Neural Voice Relay Failure", e);
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex w-full ${isNebula ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-700 px-4`}>
      <div className={`flex flex-col gap-3 max-w-[95%] md:max-w-[85%] ${!isNebula ? 'items-end' : 'items-start'}`}>
        
        {isNebula && (
          <div className="flex items-center gap-2 mb-1 px-4">
             <div className="w-5 h-5 rounded-md nebula-gradient flex items-center justify-center text-[8px] font-black text-white shadow-lg">N</div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nebula Edge Elite</span>
             {message.audioResponse && (
               <button 
                 onClick={() => playAudio(message.audioResponse!)}
                 className={`ml-2 p-1.5 rounded-full transition-all glass ${isPlaying ? 'text-cyan-400 scale-110 shadow-cyan-500/50' : 'text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                 title="Play Neural Synthesis"
               >
                 {isPlaying ? (
                    <div className="flex gap-0.5 items-end h-3">
                      <div className="w-0.5 h-full bg-cyan-400 animate-pulse"></div>
                      <div className="w-0.5 h-2/3 bg-cyan-400 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-0.5 h-full bg-cyan-400 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    </div>
                 ) : (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                 )}
               </button>
             )}
          </div>
        )}

        {isNebula && message.thinking && (
          <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-400 font-mono italic flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
             <span className="opacity-60">Neural Simulation: {message.thinking.slice(0, 100)}...</span>
          </div>
        )}

        <div className={`p-6 md:p-8 rounded-[2.5rem] transition-all duration-500 relative group ${
          isNebula 
            ? 'glass border-white/5 text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.4)]' 
            : 'bg-white/10 border border-white/20 text-white shadow-2xl'
        }`}>
          <div className="whitespace-pre-wrap leading-relaxed text-[16px] font-medium relative font-plus tracking-tight">
            {message.content}
            {message.isStreaming && <span className="inline-block w-2 h-5 bg-cyan-400 ml-2 animate-pulse rounded-full align-middle shadow-[0_0_10px_#22d3ee]"></span>}
          </div>

          {message.generatedImage && (
            <div className="mt-8 relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
              <img src={message.generatedImage} alt="Generated Art" className="w-full h-auto transform transition-transform duration-1000 group-hover:scale-110" />
            </div>
          )}

          {message.generatedVideo && (
            <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.6)] bg-black aspect-video max-h-[700px] w-full">
              <video src={message.generatedVideo} controls className="w-full h-full object-contain" playsInline autoPlay loop />
            </div>
          )}

          {message.groundingUrls && message.groundingUrls.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex flex-wrap gap-3">
                {message.groundingUrls.map((g, i) => (
                  <a key={i} href={g.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] glass px-4 py-2.5 rounded-2xl hover:bg-cyan-500/20 text-cyan-400 transition-all border border-white/10 flex items-center gap-3 font-bold">
                    <img src={`https://www.google.com/s2/favicons?domain=${new URL(g.uri).hostname}&sz=32`} className="w-4 h-4 rounded-sm" alt="" />
                    <span className="truncate max-w-[150px]">{g.title || 'Source Relay'}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {message.artifact && (
            <div className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group/art hover:bg-white/10 transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl nebula-gradient flex items-center justify-center text-white shadow-xl">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                 </div>
                 <h4 className="text-xs font-black uppercase text-white tracking-widest">{message.artifact.title}</h4>
              </div>
              <button onClick={() => onSelectArtifact?.(message.artifact!)} className="px-5 py-2.5 rounded-xl bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
                Expand
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
