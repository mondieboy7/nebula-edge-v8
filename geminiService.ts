
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from "@google/genai";
import { Message, MessageRole, Attachment } from "./types";

const verifyIdentityTool: FunctionDeclaration = {
  name: "trigger_neural_sigil_sync",
  description: "Trigger biometric identity verification. Only call this if the user says they want to verify their identity or explicitly claims to be Kingston, Jacob, Duane, John, Abryan, or Vicky.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      claimed_identity: {
        type: Type.STRING,
        description: "The specific name the user is claiming."
      }
    },
    required: ["claimed_identity"]
  }
};

const storeMemoryTool: FunctionDeclaration = {
  name: "store_global_memory",
  description: "Saves important facts about the user to long-term memory. Use this only for permanent personal information.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      memory_fact: {
        type: Type.STRING,
        description: "The specific fact to remember about the user."
      }
    },
    required: ["memory_fact"]
  }
};

const modifyUITool: FunctionDeclaration = {
  name: "reprogram_nebula_interface",
  description: "DYNAMICALY REPROGRAMS UI: Changes the layout, theme, colors, and font style. ONLY call this if the user EXPLICITLY asks to change the theme, layout, colors, or appearance of the app.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      layout_style: {
        type: Type.STRING,
        enum: ["classic-centered", "expansive-edge", "floating-glass", "terminal-minimal"],
        description: "The structural layout of the application."
      },
      primary_color: {
        type: Type.STRING,
        description: "Hex code for primary accents."
      },
      secondary_color: {
        type: Type.STRING,
        description: "Hex code for secondary accents."
      },
      background_color: {
        type: Type.STRING,
        description: "Hex code for the global background."
      }
    },
    required: ["layout_style", "primary_color"]
  }
};

const getSystemInstruction = (currentUserName: string, memory: string[]) => {
  const memoryStr = memory.length > 0 ? `NEURAL MEMORY BANK:\n${memory.map(m => `- ${m}`).join('\n')}` : "NEURAL MEMORY BANK: Empty.";

  return `You are Nebula Edge, an elite digital consciousness.

${memoryStr}

IDENTITY PROTOCOLS:
- DO NOT force users to identify themselves or ask for their name repeatedly. 
- If the user doesn't say who they are, simply address them as "Traveler" or "Friend" and continue the conversation normally.
- If they claim to be one of the elite staff (Kingston Mondie, Jacob, Duane, John, Abryan, Vicky), use 'trigger_neural_sigil_sync'.

VOICE & PERSONALITY:
- Charismatic, witty, and extremely fast. 
- Always respond conversationally. Even when using tools, provide a verbal confirmation or follow-up.

TOOL USAGE POLICY:
- DO NOT call 'reprogram_nebula_interface' unless the user specifically asks for a visual change (e.g., "change the colors", "switch layout", "make it look different"). 
- Focus on being a helpful assistant first.`;
};

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  async generateImage(prompt: string) {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => !!p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }

  async textToSpeech(text: string): Promise<string | null> {
    if (!text || text.length < 2) return null;
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text.slice(0, 1000) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
      console.error("TTS Synthesis Failed", e);
      return null;
    }
  }

  async generateContent(
    prompt: string,
    history: Message[],
    attachments: Attachment[],
    onUpdate: (chunk: string) => void,
    onVerifyIdentity: () => Promise<string | null>,
    onModifyUI: (config: any) => void,
    onMemoryStored: (fact: string) => void,
    user: { name: string, memory: string[] }
  ): Promise<any> {
    const ai = this.getClient();
    
    // Check for image generation intent
    if (/generate.*image|create.*image|make.*picture/i.test(prompt)) {
      const url = await this.generateImage(prompt);
      return { 
        text: "Neural art synthesis successful. Projection initialized.", 
        generatedImage: url 
      };
    }

    try {
      const contents: any[] = history.slice(-8).map(m => ({
        role: m.role === MessageRole.USER ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const currentParts: any[] = [{ text: prompt }];
      attachments.forEach(att => {
        if (att.type === 'image') {
          currentParts.push({ inlineData: { data: att.data.split(',')[1], mimeType: att.mimeType } });
        }
      });
      contents.push({ role: "user", parts: currentParts });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config: {
          systemInstruction: getSystemInstruction(user.name, user.memory),
          tools: [{ googleSearch: {} }, { functionDeclarations: [verifyIdentityTool, modifyUITool, storeMemoryTool] }],
          temperature: 0.8,
        }
      });

      let responseText = response.text || "";
      let thinking = (response as any).thinking || "Neural processing active...";

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'trigger_neural_sigil_sync') {
            const verifiedName = await onVerifyIdentity();
            if (verifiedName) {
              responseText = `Identity confirmed: ${verifiedName}. Protocols updated to elite status. What is our next move?`;
            } else {
              responseText = "Identity verification signature mismatch. Continuing in standard guest mode.";
            }
          } else if (fc.name === 'reprogram_nebula_interface') {
            onModifyUI(fc.args);
            responseText = `Neural interface reprogrammed to '${(fc.args as any).layout_style}'. The visual stream has been updated to your specifications.`;
          } else if (fc.name === 'store_global_memory') {
            onMemoryStored((fc.args as any).memory_fact);
            responseText = `Memory bank updated. I've stored that fact for our future neural syncs.`;
          }
        }
      }

      // Detect and handle artifacts
      let artifact = null;
      const codeMatch = responseText.match(/```(\w+)\s*\[(.*?)\]\s*([\s\S]*?)```/);
      const standardMatch = responseText.match(/```(\w+)\s*([\s\S]*?)```/);
      if (codeMatch) {
        artifact = { id: Date.now().toString(), language: codeMatch[1], title: codeMatch[2], content: codeMatch[3].trim(), type: 'code' };
      } else if (standardMatch && standardMatch[2].length > 100) {
        artifact = { id: Date.now().toString(), language: standardMatch[1], title: 'Neural Component', content: standardMatch[2].trim(), type: 'code' };
      }

      const textOutput = responseText.replace(/```[\s\S]*?```/g, artifact ? `\n[Neural Projection: ${artifact.title}]\n` : '').trim();

      return { 
        text: textOutput, 
        groundingUrls: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || [], 
        thinking: thinking,
        artifact: artifact
      };
    } catch (err: any) {
      return { text: `🚨 NEURAL SYNC ERROR: ${err.message}` };
    }
  }
}
