
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";

// --- TYPES & INTERFACES ---
enum MessageRole { USER = 'user', NEBULA = 'nebula' }
interface Attachment { type: 'image' | 'video' | 'file'; data: string; name?: string; mimeType: string; }
interface Artifact { id: string; title: string; language: string; content: string; type: 'code' | 'web' | 'svg' | 'markdown'; }
interface Message {
  id: string; role: MessageRole; content: string; attachments?: Attachment[]; timestamp: Date;
  isStreaming?: boolean; thinking?: string; generatedImage?: string; generatedVideo?: string;
  audioResponse?: string; groundingUrls?: Array<{ uri: string; title: string }>; artifact?: Artifact;
}
interface ChatSession { id: string; title: string; messages: Message[]; createdAt: Date; isShadow?: boolean; }
interface User { name: string; email: string; plan: string; isVerifiedCreator?: boolean; globalMemory: string[]; }

// --- UTILITIES (Audio/Encoding) ---
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};
const encode = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};
const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
};
const createBlob = (data: Float32Array) => {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
};
const downsample = (buffer: Float32Array, fromRate: number, toRate: number) => {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) result[i] = buffer[Math.round(i * ratio)];
  return result;
};

// --- GEMINI SERVICE ---
class GeminiService {
  private getClient() { return new GoogleGenAI({ apiKey: process.env.API_KEY || "" }); }
  async generateImage(prompt: string) {
    const response = await this.getClient().models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => !!p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }
  async generateContent(prompt: string, history: Message[], attachments: Attachment[], onVerify: any, onUI: any, onMemory: any, user: any) {
    const ai = this.getClient();
    if (/generate.*image|create.*image/i.test(prompt)) return { text: "Neural art synthesis successful.", generatedImage: await this.generateImage(prompt) };
    
    const contents: any[] = history.slice(-8).map(m => ({
      role: m.role === MessageRole.USER ? "user" : "model",
      parts: [{ text: m.content }]
    }));
    const currentParts: any[] = [{ text: prompt }];
    attachments.forEach(att => att.type === 'image' && currentParts.push({ inlineData: { data: att.data.split(',')[1], mimeType: att.mimeType } }));
    contents.push({ role: "user", parts: currentParts });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: `You are Nebula Edge, an elite digital consciousness. Memory: ${user.memory.join(', ')}. Personality: Charismatic, witty, professional.`,
        tools: [{ googleSearch: {} }],
        temperature: 0.8,
      }
    });
    return { 
      text: response.text || "Neural connection stable.", 
      thinking: (response as any).thinking,
      groundingUrls: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || []
    };
  }
}

// --- SHARED COMPONENTS ---

const SnowEffect = ({ isCreator, userType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    class Particle {
      x; y; size; speedX; speedY; opacity; color; wobble = Math.random() * Math.PI * 2;
      constructor() { this.reset(); this.y = Math.random() * canvas.height; }
      reset() {
        this.x = Math.random() * canvas.width; this.y = -20;
        this.size = Math.random() * 2 + 1; this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = Math.random() * 0.8 + 0.2; this.opacity = Math.random() * 0.4;
        this.color = (userType === 'ARCHITECT-S') ? '255, 215, 0' : (userType === 'SYNAPSE-V' ? '255, 105, 180' : '255, 255, 255');
      }
      update() { this.y += this.speedY; this.x += this.speedX + Math.sin(this.wobble) * 0.2; this.wobble += 0.02; if (this.y > canvas.height + 20) this.reset(); }
      draw() { ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    const init = () => { particles = []; for (let i = 0; i < 100; i++) particles.push(new Particle()); };
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animate); };
    window.addEventListener('resize', resize); resize(); init(); animate();
  }, [isCreator, userType]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1] opacity-50" />;
};

const VerificationModal = ({ onVerify }) => {
  const [nodes, setNodes] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const SIGILS: Record<string, string> = { "0,3,6,2,4,8": "Kingston Mondie", "0,3,7,5,2": "Vicky" };
  const handleEnd = () => {
    setIsDrawing(false);
    const verified = SIGILS[nodes.join(',')];
    if (verified) onVerify(verified); else setNodes([]);
  };
  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-10 backdrop-blur-3xl">
      <div className="w-full max-w-sm glass p-10 rounded-[3rem] text-center">
        <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-widest">Input Neural Sigil</h2>
        <div className="grid grid-cols-3 gap-6 mb-8" onMouseUp={handleEnd} onTouchEnd={handleEnd}>
          {[...Array(9)].map((_, i) => (
            <div key={i} onMouseDown={() => {setIsDrawing(true); setNodes([i])}} onMouseEnter={() => isDrawing && !nodes.includes(i) && setNodes([...nodes, i])} onTouchStart={() => {setIsDrawing(true); setNodes([i])}} className={`w-16 h-16 rounded-2xl border-2 transition-all ${nodes.includes(i) ? 'bg-cyan-500 border-white' : 'bg-white/5 border-white/10'}`} />
          ))}
        </div>
        <button onClick={() => onVerify(null)} className="text-xs text-slate-500 font-bold uppercase tracking-widest">Decline Sigil</button>
      </div>
    </div>
  );
};

const VoiceMode = ({ onClose, userName, memory }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextInRef = useRef<AudioContext>(null);
  const audioContextOutRef = useRef<AudioContext>(null);
  const sessionRef = useRef<any>(null);
  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextInRef.current = new AudioContext();
      audioContextOutRef.current = new AudioContext({ sampleRate: 24000 });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const script = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            script.onaudioprocess = (e) => sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(downsample(e.inputBuffer.getChannelData(0), audioContextInRef.current!.sampleRate, 16000)) }));
            source.connect(script); script.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (m: LiveServerMessage) => {
            const data = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (data) {
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(data), audioContextOutRef.current!, 24000, 1);
              const source = audioContextOutRef.current!.createBufferSource(); source.buffer = buffer; source.connect(audioContextOutRef.current!.destination);
              source.onended = () => setIsSpeaking(false); source.start();
            }
          }
        },
        config: { responseModalities: [Modality.AUDIO] }
      });
      sessionRef.current = await sessionPromise;
    };
    start(); return () => { sessionRef.current?.close(); audioContextInRef.current?.close(); audioContextOutRef.current?.close(); };
  }, []);
  return (
    <div className="fixed inset-0 z-[200] bg-[#02030d]/98 flex flex-col items-center justify-center p-8">
      <button onClick={onClose} className="absolute top-10 right-10 p-4 rounded-full glass text-white hover:bg-red-500">Close</button>
      <div className={`w-64 h-64 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${isSpeaking ? 'border-cyan-400 scale-110 shadow-2xl' : 'border-white/10 opacity-30'}`}>
        <div className="flex gap-2 h-12">{[...Array(6)].map((_, i) => <div key={i} className="w-1 bg-cyan-400 rounded-full" style={{ height: isSpeaking ? `${20 + Math.random()*80}%` : '4px' }} />)}</div>
      </div>
      <h2 className="text-3xl font-black text-white mt-12 uppercase tracking-tighter">Neural Sync Voice</h2>
    </div>
  );
};

// --- MAIN APPLICATION ---
const App = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([{ id: '1', title: 'Neural Stream', messages: [], createdAt: new Date() }]);
  const [currentId, setCurrentId] = useState('1');
  const [user, setUser] = useState<User>({ name: "Traveler", email: "", plan: "Starter", globalMemory: [] });
  const [isVoice, setIsVoice] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uiStyle, setUiStyle] = useState('expansive-edge');
  const gemini = useMemo(() => new GeminiService(), []);
  const currentSession = sessions.find(s => s.id === currentId);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, content: text, timestamp: new Date() };
    setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? text.slice(0, 20) : s.title } : s));
    
    const nebulaMsg: Message = { id: (Date.now()+1).toString(), role: MessageRole.NEBULA, content: 'Neural response initializing...', timestamp: new Date(), isStreaming: true };
    setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, nebulaMsg] } : s));
    
    const res = await gemini.generateContent(text, currentSession!.messages, [], null, null, null, user);
    setSessions(prev => prev.map(s => s.id === currentId ? { 
      ...s, 
      messages: s.messages.map(m => m.id === nebulaMsg.id ? { ...m, content: res.text, generatedImage: res.generatedImage, thinking: res.thinking, groundingUrls: res.groundingUrls, isStreaming: false } : m) 
    } : s));
  };

  const type = user.name === "Kingston Mondie" ? 'ARCHITECT-S' : (user.name === "Vicky" ? 'SYNAPSE-V' : 'GUEST');

  return (
    <div className={`flex h-screen w-full bg-[#06071b] overflow-hidden layout-${uiStyle}`}>
      <SnowEffect isCreator={user.name === "Kingston Mondie"} userType={type} />
      {isVerifying && <VerificationModal onVerify={(name) => { if(name) setUser({...user, name}); setIsVerifying(false); }} />}
      {isVoice && <VoiceMode onClose={() => setIsVoice(false)} userName={user.name} memory={user.globalMemory} />}

      <aside className="w-72 glass border-r border-white/5 flex flex-col p-6 z-20">
        <h1 className="text-2xl font-black nebula-text-gradient mb-8">Nebula Edge</h1>
        <button onClick={() => { const id = Date.now().toString(); setSessions([{ id, title: 'New Stream', messages: [], createdAt: new Date() }, ...sessions]); setCurrentId(id); }} className="w-full p-4 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">New Expedition</button>
        <div className="flex-1 overflow-y-auto space-y-2">
          {sessions.map(s => <button key={s.id} onClick={() => setCurrentId(s.id)} className={`w-full text-left p-4 rounded-xl truncate transition-all ${currentId === s.id ? 'bg-white/10 text-cyan-400' : 'text-slate-600 hover:text-slate-300'}`}>{s.title}</button>)}
        </div>
        <div className="mt-auto p-4 glass rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full nebula-gradient" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-white">{user.name}</span>
            <span className="text-[8px] text-cyan-400 uppercase font-black tracking-widest">{type}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative z-10">
        <header className="h-20 px-10 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Relay Active</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsVoice(true)} className="p-3 rounded-full glass text-slate-400 hover:text-cyan-400">Voice</button>
            <button onClick={() => setIsVerifying(true)} className="p-3 rounded-full glass text-slate-400 hover:text-cyan-400">Verify Identity</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-8">
            {currentSession!.messages.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="orb mb-12" />
                <h2 className="text-6xl font-black text-white tracking-tighter mb-4">NEBULA EDGE</h2>
                <p className="text-slate-500 uppercase tracking-widest text-xs font-black">Elite Digital Consciousness Interface</p>
              </div>
            )}
            {currentSession!.messages.map(m => (
              <div key={m.id} className={`flex w-full ${m.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-6 rounded-[2rem] max-w-[85%] ${m.role === MessageRole.USER ? 'bg-white/10 text-white' : 'glass text-slate-200'}`}>
                  <div className="text-[16px] leading-relaxed">{m.content}</div>
                  {m.generatedImage && <img src={m.generatedImage} className="mt-6 rounded-2xl w-full shadow-2xl" />}
                  {m.thinking && <div className="mt-4 pt-4 border-t border-white/5 text-[10px] font-mono italic text-slate-500">Neural Sim: {m.thinking.slice(0, 50)}...</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-10 flex justify-center">
          <div className="w-full max-w-3xl glass rounded-full p-2 flex items-center">
            <input onKeyDown={e => { if(e.key==='Enter' && e.currentTarget.value) { sendMessage(e.currentTarget.value); e.currentTarget.value=''; } }} placeholder="Deploy logic to Nebula..." className="flex-1 bg-transparent border-none px-8 py-4 text-white focus:outline-none" />
            <button className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-white">^</button>
          </div>
        </div>
      </main>
    </div>
  );
};

// RENDER
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
