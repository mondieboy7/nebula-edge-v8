
import React, { useState, useRef } from 'react';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const isImage = file.type.startsWith('image');
        const isVideo = file.type.startsWith('video');
        
        setAttachments(prev => [...prev, {
          type: isImage ? 'image' : (isVideo ? 'video' : 'file'),
          data: reader.result as string,
          name: file.name,
          mimeType: file.type
        }]);
      };
      if (file.type.startsWith('image') || file.type.startsWith('video')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  return (
    <div className="pb-10 pt-2 px-8 bg-transparent z-30 w-full flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="glass rounded-[2rem] p-2 flex flex-col shadow-2xl border-white/10 transition-all duration-300 focus-within:border-cyan-500/30">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 p-4 border-b border-white/5">
              {attachments.map((att, i) => (
                <div key={i} className="relative group">
                  {att.type === 'file' ? (
                    <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-2">
                       <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-5.414-5.414A2 2 0 0011.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" /></svg>
                       <span className="text-[8px] text-slate-500 truncate w-full text-center mt-1">{att.name}</span>
                    </div>
                  ) : (
                    <img src={att.data} alt="Preview" className="w-16 h-16 object-cover rounded-2xl border border-white/10 shadow-lg" />
                  )}
                  <button 
                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-xl hover:scale-110 transition-transform"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-1">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,video/*,.pdf,.txt,.js,.py,.ts,.html"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-cyan-400 transition-all hover:scale-110"
              title="Attach Logic"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Deploy logic to Nebula Edge..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white py-4 resize-none min-h-[50px] max-h-[200px] text-[16px] font-medium placeholder:text-slate-600 font-plus"
              rows={1}
            />

            <button 
              onClick={handleSend}
              disabled={isLoading || (!text.trim() && attachments.length === 0)}
              className={`p-3 rounded-full transition-all duration-300 shadow-xl ${
                isLoading || (!text.trim() && attachments.length === 0)
                  ? 'text-slate-700'
                  : 'text-white bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:scale-110 active:scale-95'
              }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
