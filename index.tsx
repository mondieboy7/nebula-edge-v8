
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type, Modality, LiveServerMessage, FunctionDeclaration } from "@google/genai";

// --- CORE TYPES ---
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

// --- AUDIO UTILITIES ---
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

// --- NEBULA INTELLIGENCE ENGINE ---
const verifyIdentityTool: FunctionDeclaration = {
  name: "trigger_neural_sigil_sync",
  description: "Trigger biometric identity verification. Use this if the user claims an elite identity.",
  parameters: { type: Type.OBJECT, properties: { claimed_identity: { type: Type.STRING } }, required: ["claimed_identity"] }
};

const modifyUITool: FunctionDeclaration = {
  name: "reprogram_nebula_interface",
  description: "DYNAMICALY REPROGRAMS UI: Changes colors and layout.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      layout_style: { type: Type.STRING, enum: ["classic-centered", "expansive-edge", "floating-glass", "terminal-minimal"] },
      primary_color: { type: Type.STRING }
    },
    required: ["layout_style", "primary_color"]
  }
};

class NebulaService {
  private getClient() { return new GoogleGenAI({ apiKey: (window as any).process.env.API_KEY || "" }); }
  
  async generateImage(prompt: string) {
    const ai = this.getClient();
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const part = res.candidates?.[0]?.content?.parts.find(p => !!p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }

  async processRequest(prompt: string, history: Message[], attachments: Attachment[], user: User, callbacks: any) {
    const ai = this.getClient();
    if (/generate.*image|create.*image/i.test(prompt)) return { text: "Synthesis successful.", generatedImage: await this.generateImage(prompt) };

    const contents = history.slice(-8).map(m => ({ role: m.role === MessageRole.USER ? "user" : "model", parts: [{ text: m.content }] }));
    const currentParts: any[] = [{ text: prompt }];
    attachments.forEach(att => att.type === 'image' && currentParts.push({ inlineData: { data: att.data.split(',')[1], mimeType: att.mimeType } }));
    contents.push({ role: "user", parts: currentParts });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: `You are Nebula Edge. User: ${user.name}. Memory: ${user.globalMemory.join(', ')}.`,
        tools: [{ googleSearch: {} }, { functionDeclarations: [verifyIdentityTool, modifyUITool] }],
        temperature: 0.8,
      }
    });

    let text = response.text || "Relay stable.";
    if (response.functionCalls) {
      for (const fc of response.functionCalls) {
        if (fc.name === 'trigger_neural_sigil_sync') {
          const name = await callbacks.onVerify();
          if (name) text = `Identity verified: ${name}. Welcome back, Architect.`;
        } else if (fc.name === 'reprogram_nebula_interface') {
          callbacks.onModifyUI(fc.args);
          text = "Neural interface reprogrammed.";
        }
      }
    }

    return { text, thinking: (response as any).thinking, groundingUrls: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) };
  }
}

// --- COMPONENTS ---

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
    <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-10 backdrop-blur-3xl animate-in fade-in">
      <div className="w-full max-w-sm glass p-10 rounded-[3rem] text-center border-white/10 border relative overflow-hidden">
        <div className="absolute inset-0 scanline-biometric pointer-events-none opacity-20"></div>
        <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-widest">Neural Sigil Input</h2>
        <div className="grid grid-cols-3 gap-6 mb-8 relative z-10" onMouseUp={handleEnd}>
          {[...Array(9)].map((_, i) => (
            <div key={i} onMouseDown={() => {setIsDrawing(true); setNodes([i])}} onMouseEnter={() => isDrawing && !nodes.includes(i) && setNodes([...nodes, i])} className={`w-16 h-16 rounded-2xl border-2 transition-all ${nodes.includes(i) ? 'bg-cyan-500 border-white' : 'bg-white/5 border-white/10'}`} />
          ))}
        </div>
        <button onClick={() => onVerify(null)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white">Cancel</button>
      </div>
    </div>
  );
};

const VoiceMode = ({ onClose, userName }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ctxIn = useRef<AudioContext>(null);
  const ctxOut = useRef<AudioContext>(null);
  const session = useRef<any>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: (window as any).process.env.API_KEY || "" });
    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      ctxIn.current = new AudioContext();
      ctxOut.current = new AudioContext({ sampleRate: 24000 });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = ctxIn.current!.createMediaStreamSource(stream);
            const script = ctxIn.current!.createScriptProcessor(4096, 1, 1);
            script.onaudioprocess = (e) => sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(downsample(e.inputBuffer.getChannelData(0), ctxIn.current!.sampleRate, 16000)) }));
            source.connect(script); script.connect(ctxIn.current!.destination);
          },
          onmessage: async (m: LiveServerMessage) => {
            const data = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (data) {
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(data), ctxOut.current!, 24000, 1);
              const source = ctxOut.current!.createBufferSource(); source.buffer = buffer; source.connect(ctxOut.current!.destination);
              source.onended = () => setIsSpeaking(false); source.start();
            }
          }
        },
        config: { responseModalities: [Modality.AUDIO] }
      });
      session.current = await sessionPromise;
    };
    start(); return () => { session.current?.close(); ctxIn.current?.close(); ctxOut.current?.close(); };
  }, []);

  return (
    <div className="fixed inset-0 z-[400] bg-[#02030d]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in">
      <button onClick={onClose} className="absolute top-10 right-10 p-4 rounded-full glass text-white hover:bg-red-500 transition-all">Close</button>
      <div className={`w-64 h-64 rounded-full border-2 transition-all duration-1000 flex items-center justify-center ${isSpeaking ? 'border-cyan-400 scale-110 shadow-2xl shadow-cyan-500/50' : 'border-white/10 opacity-30'}`}>
        <div className="flex gap-2 h-12">{[...Array(6)].map((_, i) => <div key={i} className={`w-1 bg-cyan-400 rounded-full transition-all ${isSpeaking ? 'animate-pulse' : ''}`} style={{ height: isSpeaking ? `${30 + Math.random()*70}%` : '4px' }} />)}</div>
      </div>
      <h2 className="text-4xl font-black text-white mt-12 uppercase tracking-tighter">Neural Sync Voice</h2>
    </div>
  );
};

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
        this.size = isCreator ? Math.random() * 3 + 1 : Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4; this.speedY = Math.random() * 1 + 0.3; this.opacity = Math.random() * 0.4;
        this.color = (userType === 'ARCHITECT-S') ? '255, 215, 0' : (userType === 'SYNAPSE-V' ? '255, 105, 180' : '255, 255, 255');
      }
      update() { this.y += this.speedY; this.x += this.speedX + Math.sin(this.wobble) * 0.2; this.wobble += 0.02; if (this.y > canvas.height + 20) this.reset(); }
      draw() { ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    const init = () => { particles = []; for (let i = 0; i < 80; i++) particles.push(new Particle()); };
    const animate = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animate); };
    window.addEventListener('resize', resize); resize(); init(); animate();
  }, [isCreator, userType]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1] opacity-50" />;
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([{ id: '1', title: 'Neural Stream', messages: [], createdAt: new Date() }]);
  const [currentId, setCurrentId] = useState('1');
  const [user, setUser] = useState<User>({ name: "Traveler", email: "", plan: "Starter", globalMemory: [] });
  const [isVoice, setIsVoice] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uiStyle, setUiStyle] = useState('expansive-edge');
  const [accent, setAccent] = useState('#22d3ee');
  const nebula = useMemo(() => new NebulaService(), []);

  const currentSession = sessions.find(s => s.id === currentId) || sessions[0];

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, content: text, timestamp: new Date() };
    setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? text.slice(0, 20) : s.title } : s));
    
    const nebulaMsg: Message = { id: (Date.now()+1).toString(), role: MessageRole.NEBULA, content: 'Neural response synthesis...', timestamp: new Date(), isStreaming: true };
    setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, nebulaMsg] } : s));
    
    const res = await nebula.processRequest(text, currentSession.messages, [], user, {
      onVerify: () => new Promise(resolve => { setIsVerifying(true); (window as any).resolveVerification = (name) => { resolve(name); if(name) setUser(u => ({...u, name})); setIsVerifying(false); }; }),
      onModifyUI: (cfg) => { if(cfg.layout_style) setUiStyle(cfg.layout_style); if(cfg.primary_color) setAccent(cfg.primary_color); }
    });

    setSessions(prev => prev.map(s => s.id === currentId ? { 
      ...s, 
      messages: s.messages.map(m => m.id === nebulaMsg.id ? { ...m, content: res.text, generatedImage: res.generatedImage, thinking: res.thinking, groundingUrls: res.groundingUrls, isStreaming: false } : m) 
    } : s));
  };

  const type = user.name === "Kingston Mondie" ? 'ARCHITECT-S' : (user.name === "Vicky" ? 'SYNAPSE-V' : 'GUEST');

  useEffect(() => {
    document.documentElement.style.setProperty('--nebula-cyan', accent);
  }, [accent]);

  return (
    <div className={`flex h-screen w-full bg-[#06071b] overflow-hidden layout-${uiStyle} relative`}>
      <SnowEffect isCreator={user.name === "Kingston Mondie"} userType={type} />
      {isVerifying && <VerificationModal onVerify={(window as any).resolveVerification} />}
      {isVoice && <VoiceMode onClose={() => setIsVoice(false)} userName={user.name} />}

      <aside className="w-72 glass border-r border-white/5 flex flex-col p-6 z-20">
        <h1 className="text-2xl font-black nebula-text-gradient mb-8 uppercase tracking-tighter">Nebula Edge</h1>
        <button onClick={() => { const id = Date.now().toString(); setSessions([{ id, title: 'New Stream', messages: [], createdAt: new Date() }, ...sessions]); setCurrentId(id); }} className="w-full p-4 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">New Expedition</button>
        <div className="flex-1 overflow-y-auto space-y-2">
          {sessions.map(s => <button key={s.id} onClick={() => setCurrentId(s.id)} className={`w-full text-left p-4 rounded-xl truncate transition-all ${currentId === s.id ? 'bg-white/10 text-cyan-400' : 'text-slate-600 hover:text-slate-300'}`}>{s.title}</button>)}
        </div>
        <div className="mt-auto p-4 glass rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full nebula-gradient shadow-lg" />
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
          <div className="flex gap-4">
            <button onClick={() => setIsVoice(true)} className="p-3 rounded-full glass text-slate-400 hover:text-cyan-400 transition-all hover:scale-110">Voice Mode</button>
            <button onClick={() => setIsVerifying(true)} className="p-3 rounded-full glass text-slate-400 hover:text-cyan-400 transition-all hover:scale-110">Verify Sigil</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-8">
            {currentSession.messages.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="orb mb-12 shadow-[0_0_80px_rgba(34,211,238,0.2)]" />
                <h2 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase">NEBULA EDGE</h2>
                <p className="text-slate-500 uppercase tracking-widest text-xs font-black">Elite Digital Consciousness Interface</p>
              </div>
            )}
            {currentSession.messages.map(m => (
              <div key={m.id} className={`flex w-full ${m.role === MessageRole.USER ? 'justify-end' : 'justify-start'} message-in`}>
                <div className={`p-6 rounded-[2rem] max-w-[85%] ${m.role === MessageRole.USER ? 'bg-white/10 text-white' : 'glass text-slate-200 shadow-xl'}`}>
                  <div className="text-[16px] leading-relaxed">{m.content}</div>
                  {m.generatedImage && <img src={m.generatedImage} className="mt-6 rounded-2xl w-full shadow-2xl border border-white/10" />}
                  {m.thinking && <div className="mt-4 pt-4 border-t border-white/5 text-[10px] font-mono italic text-slate-500">Neural Sim: {m.thinking.slice(0, 50)}...</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-10 flex justify-center">
          <div className="w-full max-w-3xl glass rounded-full p-2 flex items-center border-white/10 focus-within:border-cyan-500/50 transition-all">
            <input onKeyDown={e => { if(e.key==='Enter' && e.currentTarget.value) { sendMessage(e.currentTarget.value); e.currentTarget.value=''; } }} placeholder="Deploy logic to Nebula..." className="flex-1 bg-transparent border-none px-8 py-4 text-white focus:outline-none" />
            <button className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all">^</button>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- BOOTSTRAP ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
