
import React, { useState, useRef, useEffect } from 'react';
import { 
  Message, 
  MessageRole, 
  ChatSession, 
  Attachment,
  User,
  Artifact
} from './types';
import { GeminiService } from './geminiService';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import SnowEffect from './components/SnowEffect';
import ArtifactView from './components/ArtifactView';
import VoiceMode from './components/VoiceMode';
import VerificationModal from './components/VerificationModal';

const STORAGE_KEY = 'nebula_edge_vault_v1';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'chat'>('splash');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationResolver, setVerificationResolver] = useState<((val: string | null) => void) | null>(null);
  
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_user');
    return saved ? JSON.parse(saved) : {
      name: "Traveler",
      email: "guest@nebula.io",
      plan: 'Starter',
      isVerifiedCreator: false,
      globalMemory: []
    };
  });

  const [uiConfig, setUiConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_ui');
    return saved ? JSON.parse(saved) : {
      primary: '#22d3ee',
      layoutStyle: 'expansive-edge'
    };
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const geminiRef = useRef<GeminiService | null>(null);

  useEffect(() => {
    geminiRef.current = new GeminiService();
    if (sessions.length === 0) {
      const firstSession: ChatSession = {
        id: 'default-stream-' + Date.now(),
        title: 'Neural Stream Initialized',
        messages: [],
        createdAt: new Date()
      };
      setSessions([firstSession]);
      setCurrentSessionId(firstSession.id);
    } else {
      setCurrentSessionId(sessions[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_ui', JSON.stringify(uiConfig));
  }, [uiConfig]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nebula-cyan', uiConfig.primary);
    if (uiConfig.secondary) root.style.setProperty('--nebula-purple', uiConfig.secondary);
    if (uiConfig.background) root.style.setProperty('--nebula-bg', uiConfig.background);
    
    if (!uiConfig.secondary) {
      if (user.name === "Kingston Mondie") {
        root.style.setProperty('--nebula-cyan', '#facc15');
        root.style.setProperty('--nebula-bg', '#0a001a'); 
      } else if (user.name === "Vicky") {
        root.style.setProperty('--nebula-cyan', '#ff69b4');
        root.style.setProperty('--nebula-bg', '#1a001a');
      }
    }
  }, [uiConfig, user.name]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleVerifyIdentity = (): Promise<string | null> => {
    return new Promise((resolve) => {
      setShowVerification(true);
      setVerificationResolver(() => (identityName: string | null) => {
        setShowVerification(false);
        if (identityName) {
          const isCreator = identityName === "Kingston Mondie";
          setUser(prev => ({ 
            ...prev,
            name: identityName,
            isVerifiedCreator: isCreator,
            plan: isCreator ? 'Enterprise' : 'Pro' 
          }));
        }
        resolve(identityName);
      });
    });
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!currentSessionId || (!text.trim() && attachments.length === 0)) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text,
      attachments,
      timestamp: new Date()
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? text.slice(0, 30) : s.title } : s
    ));

    const nebulaMsgId = (Date.now() + 1).toString();
    const nebulaMsg: Message = {
      id: nebulaMsgId,
      role: MessageRole.NEBULA,
      content: 'Accessing core relay...',
      timestamp: new Date(),
      isStreaming: true
    };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, nebulaMsg] } : s));

    try {
      if (geminiRef.current) {
        const result = await geminiRef.current.generateContent(
          text,
          currentSession?.messages || [],
          attachments,
          () => {}, 
          handleVerifyIdentity,
          (config) => {
            setUiConfig({ 
              primary: config.primary_color, 
              secondary: config.secondary_color, 
              background: config.background_color,
              layoutStyle: config.layout_style || 'expansive-edge'
            });
          },
          (fact) => {
             setUser(prev => ({ ...prev, globalMemory: [...prev.globalMemory, fact] }));
          },
          { name: user.name, memory: user.globalMemory }
        );

        setSessions(prev => prev.map(s => 
          s.id === currentSessionId ? { 
            ...s, 
            messages: s.messages.map(m => m.id === nebulaMsgId ? { 
              ...m, 
              content: result.text, 
              isStreaming: false,
              generatedImage: result.generatedImage,
              generatedVideo: result.generatedVideo,
              thinking: result.thinking,
              groundingUrls: result.groundingUrls,
              artifact: result.artifact
            } : m) 
          } : s
        ));
      }
    } catch (error) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { 
          ...s, 
          messages: s.messages.map(m => m.id === nebulaMsgId ? { ...m, content: "🚨 Neural Path Severed.", isStreaming: false } : m) 
        } : s
      ));
    }
  };

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'New Neural Stream',
      messages: [],
      createdAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveArtifact(null);
    setAppState('chat');
  };

  const isKingston = user.name === "Kingston Mondie";
  const isVicky = user.name === "Vicky";
  const isSquad = ["Jacob", "Duane", "John", "Abryan"].includes(user.name);
  const currentIdentityType = isKingston ? 'ARCHITECT-S' : (isVicky ? 'SYNAPSE-V' : (isSquad ? 'SYNAPSE-S' : 'GUEST'));

  if (appState === 'splash') {
    return (
      <>
        <SnowEffect userType={currentIdentityType} isCreator={isKingston} />
        <SplashScreen onStart={() => setAppState('chat')} userName={user.name} />
      </>
    );
  }

  return (
    <div 
      className={`flex h-screen w-full transition-all duration-1000 text-slate-200 overflow-hidden relative layout-${uiConfig.layoutStyle}`}
      style={{ backgroundColor: 'var(--nebula-bg, #06071b)' }}
    >
      <SnowEffect userType={currentIdentityType} isCreator={isKingston} />
      {isVoiceMode && <VoiceMode onClose={() => setIsVoiceMode(false)} userName={user.name} memory={user.globalMemory} />}
      {showVerification && verificationResolver && <VerificationModal onVerify={verificationResolver} />}
      
      <Sidebar 
        sessions={sessions}
        currentId={currentSessionId}
        onSelect={(id) => { setCurrentSessionId(id); setActiveArtifact(null); }}
        onNewChat={createNewChat}
        isOpen={isSidebarOpen}
        toggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        userName={user.name}
        isCreator={isKingston}
        memoryCount={user.globalMemory.length}
      />
      
      <main className="flex-1 flex flex-row relative h-full overflow-hidden">
        <div className={`chat-area-wrapper flex-1 flex flex-col relative h-full transition-all duration-500 ${activeArtifact ? 'max-w-[45%] opacity-40 blur-[4px]' : 'max-w-full'}`}>
          <Header 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSpeechEnabled={isVoiceMode}
            onToggleSpeech={() => setIsVoiceMode(true)}
            onProfileClick={user.name === "Traveler" ? () => handleVerifyIdentity() : () => {}}
            userName={user.name}
            isVerified={user.name !== "Traveler"}
            identityType={currentIdentityType}
          />
          
          <div className="chat-container flex-1 overflow-hidden flex flex-col">
            <ChatArea 
              messages={currentSession?.messages || []} 
              onAction={(text) => handleSendMessage(text, [])}
              onSelectArtifact={setActiveArtifact}
              userName={user.name}
            />
          </div>
          
          <InputArea onSend={handleSendMessage} isLoading={!!currentSession?.messages.find(m => m.isStreaming)} />
        </div>

        {activeArtifact && <div className="flex-[1.2] h-full relative group"><ArtifactView artifact={activeArtifact} onClose={() => setActiveArtifact(null)} /></div>}
      </main>
    </div>
  );
};

export default App;
