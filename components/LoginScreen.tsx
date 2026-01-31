
import React, { useState } from 'react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      // Fix: Include missing globalMemory property to satisfy the User interface requirements
      onLogin({ name, email, plan: 'Starter', globalMemory: [] });
    }
  };

  return (
    <div className="h-screen w-full bg-[#06071b] flex items-center justify-center p-6">
      <div className="w-full max-w-md glass p-10 rounded-[3rem] border-white/5 shadow-2xl animate-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full nebula-btn flex items-center justify-center mb-6 border-cyan-500/30">
            <span className="text-3xl font-black text-white">N</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Access Nebula</h2>
          <p className="text-slate-500 font-medium">Identify yourself, Traveler.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="e.g. Hosam"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="hosam@nebula.io"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-white/10 glass py-5 rounded-2xl text-lg font-bold hover:bg-white/20 transition-all active:scale-95 shadow-xl border-white/10 mt-4"
          >
            Initialize Session
          </button>
        </form>

        <p className="mt-8 text-center text-slate-600 text-sm font-medium">
          By entering, you agree to our <span className="text-slate-400">Quantum Privacy Protocols</span>.
        </p>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] -z-0"></div>
    </div>
  );
};

export default LoginScreen;
