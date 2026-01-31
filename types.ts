
export enum MessageRole {
  USER = 'user',
  NEBULA = 'nebula'
}

export interface Attachment {
  type: 'image' | 'video' | 'file';
  data: string; // base64 or text
  name?: string;
  mimeType: string;
}

export interface Artifact {
  id: string;
  title: string;
  language: string;
  content: string;
  type: 'code' | 'web' | 'svg' | 'markdown';
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  isStreaming?: boolean;
  thinking?: string;
  generatedImage?: string;
  generatedVideo?: string;
  // Added audioResponse to store base64 encoded PCM audio data for TTS playback
  audioResponse?: string;
  groundingUrls?: Array<{ uri: string; title: string }>;
  artifact?: Artifact;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  isShadow?: boolean;
  owner?: string;
}

export interface User {
  name: string;
  email: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  isVerifiedCreator?: boolean;
  globalMemory: string[]; // Cross-conversation memory bank
}
