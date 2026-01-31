
import React, { useState, useEffect } from 'react';
import { Artifact } from '../types';

interface ArtifactViewProps {
  artifact: Artifact;
  onClose: () => void;
}

const ArtifactView: React.FC<ArtifactViewProps> = ({ artifact: initialArtifact, onClose }) => {
  const [artifact, setArtifact] = useState(initialArtifact);
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'edit'>(
    ['html', 'svg', 'xml'].includes(initialArtifact.language.toLowerCase()) ? 'preview' : 'code'
  );
  const [playKey, setPlayKey] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setArtifact(initialArtifact);
    setViewMode(['html', 'svg', 'xml'].includes(initialArtifact.language.toLowerCase()) ? 'preview' : 'code');
  }, [initialArtifact]);

  const canPreview = ['html', 'svg', 'xml', 'markdown'].includes(artifact.language.toLowerCase());

  const handlePlay = () => {
    setIsRunning(true);
    setPlayKey(prev => prev + 1);
    // Simulate a brief neural rendering delay
    setTimeout(() => setIsRunning(false), 800);
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s/g, '_')}.${artifact.language === 'svg' ? 'svg' : (artifact.language === 'html' ? 'html' : 'txt')}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderPreview = () => {
    if (artifact.language === 'svg') {
      return (
        <div key={playKey} className={`flex items-center justify-center h-full p-8 bg-white/5 rounded-3xl overflow-auto transition-all duration-500 ${isRunning ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
          <div dangerouslySetInnerHTML={{ __html: artifact.content }} className="max-w-full max-h-full" />
        </div>
      );
    }
    if (artifact.language === 'html') {
      return (
        <iframe
          key={playKey}
          title="Nebula Live Environment"
          srcDoc={artifact.content}
          className={`w-full h-full bg-white rounded-3xl shadow-2xl transition-all duration-500 ${isRunning ? 'opacity-0 blur-sm' : 'opacity-100 blur-0'}`}
          sandbox="allow-scripts"
        />
      );
    }
    return (
      <div className="p-8 text-slate-500 font-medium italic flex flex-col items-center justify-center h-full">
        <svg className="w-16 h-16 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        Logic synthesis complete. Preview disabled for current core.
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0c1f] border-l border-white/5 animate-in slide-in-from-right duration-500 shadow-[-30px_0_60px_rgba(0,0,0,0.6)] z-40 relative">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0d0e25]/60 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl nebula-gradient flex items-center justify-center shadow-lg animate-pulse">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest truncate max-w-[150px]">{artifact.title}</h3>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-tighter">Nebula Projection Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
            {canPreview && (
              <button 
                onClick={() => setViewMode('preview')} 
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'preview' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Output
              </button>
            )}
            <button 
              onClick={() => setViewMode('code')} 
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'code' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Source
            </button>
            <button 
              onClick={() => setViewMode('edit')} 
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'edit' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Modify
            </button>
          </div>

          <button 
            onClick={handlePlay} 
            className={`p-2.5 rounded-xl transition-all ${isRunning ? 'bg-cyan-500 text-white animate-spin' : 'bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-white/10'}`}
            title="Re-run Protocol"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>

          <button onClick={handleDownload} className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-white/10" title="Extract Logic">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>

          <div className="w-px h-6 bg-white/10 mx-1"></div>

          <button onClick={onClose} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90" title="Decommission Workspace">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 relative">
        {isRunning && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0c1f]/40 backdrop-blur-md pointer-events-none transition-all duration-300">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">Running Neural Simulation</span>
          </div>
        )}

        {viewMode === 'edit' ? (
          <textarea
            value={artifact.content}
            onChange={(e) => setArtifact({ ...artifact, content: e.target.value })}
            className="w-full h-full p-8 bg-[#0d1117] text-cyan-50/90 font-mono text-sm rounded-3xl border border-white/5 resize-none focus:outline-none focus:border-cyan-500/30 shadow-inner"
            placeholder="Edit logic stream..."
          />
        ) : viewMode === 'code' ? (
          <div className="w-full h-full rounded-3xl overflow-hidden border border-white/5 bg-[#0d1117] p-8 overflow-auto shadow-inner">
            <pre className="font-mono text-sm leading-relaxed text-cyan-50/90 selection:bg-cyan-500/30">
              <code className="font-jetbrains">{artifact.content}</code>
            </pre>
          </div>
        ) : (
          <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative">
            {renderPreview()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactView;
