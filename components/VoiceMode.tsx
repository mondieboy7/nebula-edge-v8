
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, encode, createBlob } from '../utils/audioUtils';

interface VoiceModeProps {
  onClose: () => void;
  userName: string;
  memory: string[];
}

const VoiceMode: React.FC<VoiceModeProps> = ({ onClose, userName, memory }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Manual downsampler to convert hardware rate (44.1/48k) to 16k
  const downsample = (buffer: Float32Array, fromRate: number, toRate: number) => {
    if (fromRate === toRate) return buffer;
    const ratio = fromRate / toRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      result[i] = buffer[Math.round(i * ratio)];
    }
    return result;
  };

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const startSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // FIX: Do NOT force sampleRate here to avoid NotSupportedError
        audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const hardwareRate = audioContextInRef.current.sampleRate;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              const source = audioContextInRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Resample to 16000 for Gemini
                const resampledData = downsample(inputData, hardwareRate, 16000);
                const pcmBlob = createBlob(resampledData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextInRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
              }

              if (message.serverContent?.turnComplete) {
                setTranscription('');
              }

              const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && audioContextOutRef.current) {
                setIsModelSpeaking(true);
                const outCtx = audioContextOutRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                
                const buffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outCtx.destination);
                
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsModelSpeaking(false);
                };

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsModelSpeaking(false);
              }
            },
            onerror: (e) => {
              console.error("Live Error", e);
              setError("Neural Sync Link lost. Check API key status.");
            },
            onclose: () => onClose()
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: `You are Nebula Edge in Talking Mode. 
Current user: ${userName}. 
Memory context: ${memory.join(', ')}.
Keep responses extremely snappy and conversational. If you hear the user start talking, stop immediately.`
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Session failed", err);
        setError("Microphone access denied or connection refused.");
        setIsConnecting(false);
      }
    };

    startSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      audioContextInRef.current?.close();
      audioContextOutRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#02030d]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
      <div className="absolute top-8 right-8 flex gap-4">
        <button onClick={onClose} className="p-5 rounded-full glass text-white hover:bg-red-500 transition-all shadow-2xl active:scale-90">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="relative mb-24">
        <div className={`w-64 h-64 rounded-full transition-all duration-1000 blur-3xl opacity-40 absolute inset-0 ${isModelSpeaking ? 'bg-cyan-500 scale-150 animate-pulse' : 'bg-purple-500 scale-110 opacity-20'}`}></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-40 h-40 rounded-full glass border-2 flex items-center justify-center transition-all duration-500 ${isModelSpeaking ? 'border-cyan-400 scale-110 shadow-[0_0_50px_rgba(34,211,238,0.5)]' : 'border-white/10 scale-100'}`}>
            <div className="flex gap-1.5 items-end h-12">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 rounded-full transition-all duration-150 ${isModelSpeaking ? 'bg-cyan-400' : 'bg-slate-700'}`}
                  style={{ 
                    height: isModelSpeaking ? `${20 + Math.random() * 80}%` : '8px',
                    transitionDelay: `${i * 0.05}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
          <div className="mt-8 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 shadow-xl">
            {isConnecting ? 'Establishing Neural Link...' : (isModelSpeaking ? 'Nebula Transmitting' : 'Listening for Signature...')}
          </div>
        </div>
      </div>

      <div className="text-center max-w-lg">
        <h2 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase glitch" data-text="NEURAL VOICE">Neural Voice</h2>
        
        {error ? (
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold uppercase tracking-widest animate-shake">
            {error}
          </div>
        ) : (
          <div className="min-h-[120px] flex flex-col items-center">
            {transcription ? (
               <div className="glass px-8 py-5 rounded-3xl border-white/5 animate-in fade-in slide-in-from-bottom-2 shadow-2xl">
                 <p className="text-white font-medium text-lg italic">"{transcription}"</p>
               </div>
            ) : (
              <p className="text-slate-400 text-sm font-medium leading-relaxed italic opacity-80 mb-8 px-10">
                Nebula is synced to your biometrics. Just start speaking.
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default VoiceMode;
