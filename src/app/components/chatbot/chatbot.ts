import { Component, ViewChild, inject, ChangeDetectorRef, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { GeminiService } from '../../services/gemini.service';
import { PromptLoggerService } from '../../services/prompt-logger.service';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  isStreaming?: boolean;
  sources?: { uri: string; title: string; }[];
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
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  scrollToBottom() {
    try {
      setTimeout(() => this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch {}
  }

  async handleSend() {
    if (!this.input.trim() || !this.chat) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: this.input };
    this.messages.push(userMessage);
    const currentInput = this.input;
    this.input = '';
    this.isLoading = true;
    this.scrollToBottom();

    if (this.isWebSearchEnabled) {
      await this.handleSearchQuery(currentInput);
    } else {
      await this.handleStreamQuery(currentInput);
    }
  }

  private async handleStreamQuery(prompt: string) {
    if (!this.chat) return;
    let botMessage: Message | undefined;

    try {
      const stream = await this.chat.sendMessageStream({ message: prompt });

      this.isLoading = false;
      const botMessageId = (Date.now() + 1).toString();
      botMessage = { id: botMessageId, role: 'bot', text: '', isStreaming: true };
      this.messages.push(botMessage);
      this.cdr.detectChanges();
      this.scrollToBottom();

      let botResponseText = '';
      for await (const chunk of stream) {
        botResponseText += chunk.text;
        if (botMessage) {
          botMessage.text = botResponseText;
          this.cdr.detectChanges();
          this.scrollToBottom();
        }
      }

      this.promptLoggerService.logPrompt({ prompt, status: 'successful', context: 'Chatbot (Stream)' });
      if (botMessage) {
        botMessage.isStreaming = false;
        this.speak(botMessage.text);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      this.promptLoggerService.logPrompt({ prompt, status: 'unsuccessful', context: 'Chatbot (Stream)', errorMessage: (error as Error).message });
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." };
      this.messages.push(errorMessage);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.scrollToBottom();
    }
  }

  private async handleSearchQuery(prompt: string) {
    if (!this.chat) return;

    try {
      const response = await this.chat.sendMessage({ message: prompt });
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources = groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) as { uri: string; title: string }[];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: response.text,
        sources: sources?.length ? sources : undefined
      };
      this.messages.push(botMessage);
      this.speak(botMessage.text);

      this.promptLoggerService.logPrompt({ prompt, status: 'successful', context: 'Chatbot (Web Search)' });

    } catch (error) {
      console.error('Error sending message with search:', error);
      this.promptLoggerService.logPrompt({ prompt, status: 'unsuccessful', context: 'Chatbot (Web Search)', errorMessage: (error as Error).message });
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'bot', text: "I'm sorry, I encountered an error while searching the web. Please try again." };
      this.messages.push(errorMessage);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.scrollToBottom();
    }
  }

  toggleListening() {
    if (!this.isSpeechSupported) return;

    if (this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    } else {
      this.speechRecognition.start();
      this.isListening = true;
    }
  }

  toggleWebSearch() {
    this.isWebSearchEnabled = !this.isWebSearchEnabled;
    this.clearChat();
  }

  toggleVoiceReply() {
    this.isVoiceReplyEnabled = !this.isVoiceReplyEnabled;
    if (!this.isVoiceReplyEnabled) {
      this.stopSpeaking();
    }
  }

  speak(text: string) {
    if (!this.isVoiceReplyEnabled || !text || typeof window === 'undefined' || !window.speechSynthesis) return;

    this.stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.cdr.detectChanges();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.cdr.detectChanges();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.isSpeaking = false;
      this.cdr.detectChanges();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  copyToClipboard(message: Message) {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).then(() => {
      this.copiedMessageId = message.id;
      setTimeout(() => {
        if (this.copiedMessageId === message.id) {
          this.copiedMessageId = null;
        }
        this.cdr.detectChanges();
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
  async  clearChat() {
  this.stopSpeaking();
  this.chat = await this.geminiService.createChatSession(undefined, this.isWebSearchEnabled);
  this.messages = [
    { id: 'initial', role: 'bot', text: this.isWebSearchEnabled 
        ? "Jambo! Web search is enabled. I can now answer questions about recent events or provide sourced information. What would you like to know?"
        : "Jambo! I'm Babu, your guide to Kenyan heritage. Ask me again about anything you'd like to know!" }
  ];
  this.isLoading = false;
  this.input = '';
  this.copiedMessageId = null;
  this.scrollToBottom();
  }
}