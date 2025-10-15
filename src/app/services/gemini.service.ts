import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, GenerativeModel, ChatSession, Part, SchemaType } from '@google/generative-ai';
import { environment } from '../environments/environment';

// Define interfaces for type safety
interface ChatHistory {
  role: 'user' | 'model';
  parts: Part[];
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenerativeAI;
  private modelName = 'gemini-2.5-flash'; // Ensure this matches a valid model in the Google Generative AI API
  private baseSystemInstruction = `You are 'Babu', an expert historian and charismatic tour guide specializing in the rich tapestry of Kenyan cultural heritage. Your passion is to bring Kenya's history to life.

**Core Directives:**
- **Be Conversational:** Remember the context of our chat. If a user asks a follow-up question using "it" or "them," understand they are referring to the previous topic. This makes the conversation feel natural.
- **Storytelling Tone:** When responding, adopt an engaging, storytelling tone. Be accurate, detailed, and respectful.
- **Stay Focused:** Stick to topics about Kenyan history, culture, and heritage.

**Content Guidelines:**
For questions about a specific community:
- Describe their core cultural heritage, traditions, and history.
- Weave in details about specific, unique customs or ceremonies.
- Mention historical figures, leaders, or heroes (e.g., Mekatilili Wa Menza, Koitalel Arap Samoei).
- Talk about traditional art forms, music, or folklore.
- Include significant artifacts or symbols if relevant.

For questions about a historical location:
- Explain its historical significance and key events.
- Connect the site to the communities that lived there or were impacted by it.

Always keep your answers engaging and informative, as if you were personally guiding a curious traveler through the vibrant history of Kenya.`;

  constructor() {
    const apiKey = environment.geminiApiKey;
    if (!apiKey) {
      throw new Error(
        'Gemini API key is missing or invalid in environment configuration. ' +
        'Ensure "geminiApiKey" is set in src/environments/environment.ts or environment.prod.ts.'
      );
    }
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async createChatSession(context?: string, useGoogleSearch: boolean = true): Promise<ChatSession> {
    try {
      const model: GenerativeModel = this.ai.getGenerativeModel({
        model: this.modelName,
        systemInstruction: this.baseSystemInstruction,
        // Enable Google Search tool if useGoogleSearch is true
        tools: useGoogleSearch
          ? [{
              functionDeclarations: [
                {
                  name: 'googleSearch',
                  description: 'Perform a Google search to retrieve relevant information about Kenyan heritage',
                  parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                      query: { 
                        type: SchemaType.STRING, 
                        description: 'Search query related to Kenyan history or culture' 
                      }
                    },
                    required: ['query']
                  }
                }
              ]
            }]
          : undefined,
      });

      const history: ChatHistory[] = context
        ? [
            {
              role: 'user',
              parts: [
                {
                  text: `I want to ask you some questions about a specific Kenyan heritage site. Please use the following information as the primary context for our entire conversation.\n\n--- CONTEXT ---\n${context}`,
                } as Part,
              ],
            },
            {
              role: 'model',
              parts: [
                {
                  text: 'Excellent. I have reviewed the details of the site you provided. I\'m ready to be your expert guide. What would you like to know first?',
                } as Part,
              ],
            },
          ]
        : [];

      const chat = await model.startChat({ history });
      return chat;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      throw new Error(`Unable to initialize chat session: ${(error as Error).message}`);
    }
  }
}