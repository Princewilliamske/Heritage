import { Component, ViewChild, inject, ChangeDetectorRef, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { PromptLoggerService } from '../../services/prompt-logger.service';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  isStreaming?: boolean;
  sources?: { uri: string; title: string }[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css'],
  providers: [GeminiService, PromptLoggerService]
})
export class ChatbotComponent implements OnInit, OnDestroy {
  geminiService = inject(GeminiService);
  cdr = inject(ChangeDetectorRef);
  promptLoggerService = inject(PromptLoggerService);

  chat: any = null;
  messages: Message[] = [
    {
      id: 'initial',
      role: 'bot',
      text: "Jambo! I'm Babu, your guide to Kenyan heritage. Our conversation is context-aware, so feel free to ask follow-up questions. For example, you can ask about 'Fort Jesus' and then ask 'who built it?'\n\nHow can I help you explore Kenya's history today?"
    }
  ];
  input = '';
  isLoading = false;
  copiedMessageId: string | null = null;

  isListening = false;
  isVoiceReplyEnabled = false;
  isWebSearchEnabled = false;
  isSpeechSupported = false;
  isSpeaking = false;
  speechRecognition: any;

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSpeechSupported = true;
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.lang = 'en-US';
        this.speechRecognition.interimResults = false;

        this.speechRecognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          this.input = transcript;
          this.isListening = false;
          this.cdr.detectChanges();
          this.handleSend();
        };

        this.speechRecognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          this.isListening = false;
          this.cdr.detectChanges();
        };

        this.speechRecognition.onend = () => {
          if (this.isListening) {
            this.isListening = false;
            this.cdr.detectChanges();
          }
        };
      }
    }
  }

  async ngOnInit() {
    this.chat = await this.geminiService.createChatSession(undefined, this.isWebSearchEnabled);
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.stopSpeaking();
    if (this.speechRecognition) this.speechRecognition.stop();
  }

  scrollToBottom() {
    try {
      setTimeout(() => this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch { }
  }

  async handleSend() {
    if (!this.input.trim() || !this.chat) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: this.input };
    this.messages.push(userMessage);
    const currentInput = this.input;
    this.input = '';
    this.isLoading = true;
    this.scrollToBottom();

    // ✅ Unified query handler for both streaming and search
    await this.handleChatQuery(currentInput, this.isWebSearchEnabled);
  }

  private async handleChatQuery(prompt: string, isWebSearch = false) {
  if (!this.chat) return;

  const botMessageId = (Date.now() + 1).toString();
  const botMessage: Message = { id: botMessageId, role: 'bot', text: '', isStreaming: true };
  this.messages.push(botMessage);
  this.cdr.detectChanges();
  this.scrollToBottom();

  try {
    let stream: AsyncIterable<any> | null = null;

    // Try streaming if available
    try {
      stream = this.chat.sendMessageStream(prompt);
      if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') stream = null;
    } catch {
      stream = null;
    }

    this.isLoading = true;
    let text = '';

    if (stream) {
      // ✅ Streamed response
      for await (const chunk of stream) {
        // Chunk can be string or object
        let chunkText = '';

        if (typeof chunk === 'string') chunkText = chunk;
        else if (chunk?.text) chunkText = chunk.text;
        else if (chunk?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
          chunkText = chunk.response.candidates[0].content.parts[0].text;
        }

        // Remove extra quotes if present
        chunkText = chunkText.replace(/^['"]|['"]$/g, '');
        text += chunkText;
        botMessage.text = text;
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    } else {
      // ✅ Non-stream response
      const response = await this.chat.sendMessage(prompt);

      if (typeof response === 'string') text = response;
      else if (response?.text) text = response.text;
      else if (response?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.response.candidates[0].content.parts[0].text;
      } else if (typeof response === 'object') text = JSON.stringify(response);

      text = text.replace(/^['"]|['"]$/g, '');

      // Self-chunking typing effect
      const chunkSize = 50;
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        botMessage.text += chunk;
        this.cdr.detectChanges();
        this.scrollToBottom();
        await new Promise(r => setTimeout(r, 20));
      }

      // Extract web search sources if applicable
      if (isWebSearch) {
        const groundingMetadata = response?.candidates?.[0]?.groundingMetadata;
        const sources = groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) as { uri: string; title: string }[];
        if (sources?.length) botMessage.sources = sources;
      }
    }

    botMessage.isStreaming = false;
    this.speak(botMessage.text);

    this.promptLoggerService.logPrompt({
      prompt,
      status: 'successful',
      context: isWebSearch ? 'Chatbot (Web Search)' : 'Chatbot (Stream)',
    });

  } catch (error) {
    console.error('Error sending message:', error);
    botMessage.text = "I'm sorry, I'm having trouble connecting right now. Please try again.";
    botMessage.isStreaming = false;

    this.promptLoggerService.logPrompt({
      prompt,
      status: 'unsuccessful',
      context: isWebSearch ? 'Chatbot (Web Search)' : 'Chatbot (Stream)',
      errorMessage: (error as Error).message,
    });
  } finally {
    this.isLoading = false;
    this.cdr.detectChanges();
    this.scrollToBottom();
  }
}



  toggleListening() {
    if (!this.isSpeechSupported) return;
    if (this.isListening) this.speechRecognition.stop();
    else this.speechRecognition.start();
    this.isListening = !this.isListening;
  }

  toggleWebSearch() {
    this.isWebSearchEnabled = !this.isWebSearchEnabled;
    this.clearChat();
  }

  toggleVoiceReply() {
    this.isVoiceReplyEnabled = !this.isVoiceReplyEnabled;
    if (!this.isVoiceReplyEnabled) this.stopSpeaking();
  }

  speak(text: string) {
    if (!this.isVoiceReplyEnabled || !text || typeof window === 'undefined' || !window.speechSynthesis) return;

    this.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => { this.isSpeaking = true; this.cdr.detectChanges(); };
    utterance.onend = () => { this.isSpeaking = false; this.cdr.detectChanges(); };
    utterance.onerror = (event) => { console.error('Speech synthesis error:', event.error); this.isSpeaking = false; this.cdr.detectChanges(); };
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }

  copyToClipboard(message: Message) {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).then(() => {
      this.copiedMessageId = message.id;
      setTimeout(() => {
        if (this.copiedMessageId === message.id) this.copiedMessageId = null;
        this.cdr.detectChanges();
      }, 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  }

  async clearChat() {
    this.stopSpeaking();
    this.chat = await this.geminiService.createChatSession(undefined, this.isWebSearchEnabled);
    this.messages = [
      {
        id: 'initial', role: 'bot',
        text: this.isWebSearchEnabled
          ? "Jambo! Web search is enabled. I can now answer questions about recent events or provide sourced information. What would you like to know?"
          : "Jambo! I'm Babu, your guide to Kenyan heritage. Ask me again about anything you'd like to know!"
      }
    ];
    this.isLoading = false;
    this.input = '';
    this.copiedMessageId = null;
    this.scrollToBottom();
  }
}
