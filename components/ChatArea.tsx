
import React, { useRef, useEffect } from 'react';
import { Message, MessageRole, Artifact } from '../types';
import MessageItem from './MessageItem';

interface ChatAreaProps {
  messages: Message[];
  onAction: (text: string) => void;
  onSelectArtifact: (artifact: Artifact) => void;
  userName?: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, onAction, onSelectArtifact, userName }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 relative">
      <div className="max-w-3xl mx-auto space-y-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-10 animate-in fade-in duration-1000">
            <h2 className="text-4xl font-black mb-2 tracking-tighter text-white uppercase glitch" data-text={`Hello, ${userName || "Traveler"}`}>
              Hello, {userName || "Traveler"}
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] mb-12 text-[10px]">
              {userName === 'Traveler' ? 'Protocol Access: Guest' : 'Identity Synced: Verified'}
            </p>

            <div className="relative mb-16">
               <div className="orb shadow-[0_0_100px_rgba(34,211,238,0.2)]"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-24 h-24 rounded-full glass flex items-center justify-center border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <span className="text-white text-3xl font-black">N</span>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <ActionButton icon="🎨" label="Create Image" onClick={() => onAction("Generate a cinematic 4K image of a futuristic cyberpunk city with gold highlights")} />
              <ActionButton icon="🎬" label="Create Video" onClick={() => onAction("Create a 720p video of a black hole consuming a star system")} />
              <ActionButton icon="🔍" label="Web Search" onClick={() => onAction("What are the latest tech breakthroughs today?")} />
              <ActionButton icon="🔐" label="Verify Sigil" onClick={() => onAction("I need to verify my identity")} />
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageItem 
              key={msg.id || idx} 
              message={msg} 
              onSelectArtifact={onSelectArtifact} 
            />
          ))
        )}
        <div ref={bottomRef} className="h-20" />
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="nebula-btn px-6 py-5 rounded-[2rem] flex items-center justify-center gap-4 glass group"
  >
    <span className="text-2xl group-hover:scale-125 transition-transform">{icon}</span>
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default ChatArea;
