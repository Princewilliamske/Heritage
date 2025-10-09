import { Component, inject, signal, HostListener, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SiteService } from '../../services/site.service';
import { Site } from '../../types';
import { GeminiService } from '../../services/gemini.service';
import { PromptLoggerService } from '../../services/prompt-logger.service';
import { RatingService } from '../../services/rating.service';
import { ChatSession, GenerateContentStreamResult } from '@google/generative-ai';

interface Message {
  role: 'user' | 'bot';
  text: string;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-site-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './site-detail.html',
  styleUrls: ['./site-detail.css'],
  providers: [SiteService, GeminiService, PromptLoggerService, RatingService]
})
export class SiteDetailComponent {
  // Inject dependencies
  route = inject(ActivatedRoute);
  router = inject(Router);
  siteService = inject(SiteService);
  geminiService = inject(GeminiService);
  cdr = inject(ChangeDetectorRef);
  promptLoggerService = inject(PromptLoggerService);
  ratingService = inject(RatingService);

  // Signals
  site = signal<Site | undefined>(undefined);
  galleryImages = signal<string[]>([]);
  selectedImageUrl = signal<string | null>(null);
  aiConversation = signal<Message[]>([]);
  isGenerating = signal<boolean>(false);
  hoverRating = signal(0);

  // Local vars
  chat: ChatSession | null = null;
  followUpInput = '';

  userRating = computed(() => {
    const currentSite = this.site();
    return currentSite ? this.ratingService.userRatings()[currentSite.id] || 0 : 0;
  });

  displayData = computed(() => {
    const currentSite = this.site();
    if (!currentSite) return { average: 0, count: 0 };

    const userRatingValue = this.userRating();
    const baseTotal = currentSite.averageRating * currentSite.ratingCount;

    if (userRatingValue > 0) {
      const newTotal = baseTotal + userRatingValue;
      const newCount = currentSite.ratingCount + 1;
      return { average: parseFloat((newTotal / newCount).toFixed(1)), count: newCount };
    }

    return { average: currentSite.averageRating, count: currentSite.ratingCount };
  });

  // ✅ Fixed HostListener: ensure event is KeyboardEvent
  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.selectedImageUrl()) {
      this.closeModal();
    }
  }


  async ngOnInit() {
    const siteId = this.route.snapshot.paramMap.get('id');
    if (!siteId) return;

    const foundSite = this.siteService.getSiteById(Number(siteId));
    if (!foundSite) {
      this.router.navigate(['/sites']);
      return;
    }

    this.site.set(foundSite);
    const images = Array.from({ length: 3 }, (_, i) =>
      `https://picsum.photos/seed/${foundSite.id}_${i + 1}/400/300`
    );
    this.galleryImages.set(images);
    await this.initializeChat();
  }

  async initializeChat() {
    const currentSite = this.site();
    if (!currentSite) return;

    const context = `Site Name: ${currentSite.name}\nLocation: ${currentSite.location}\nDescription: "${currentSite.description}"`;
    this.chat = await this.geminiService.createChatSession(context);
  }

  async getAiEnrichment(promptType: 'expand' | 'summarize' | 'fact') {
    const currentSite = this.site();
    if (!this.chat || !currentSite) return;

    this.isGenerating.set(true);
    this.aiConversation.set([]);

    let prompt = '';
    switch (promptType) {
      case 'expand':
        prompt = `Tell me more about ${currentSite.name}. Here is a short description: "${currentSite.description}". Expand on this with more historical context, interesting details, or stories.`;
        break;
      case 'summarize':
        prompt = `Summarize the history and importance of ${currentSite.name} in one engaging paragraph. Description: "${currentSite.description}".`;
        break;
      case 'fact':
        prompt = `Share a surprising or little-known fact about ${currentSite.name}. Description: "${currentSite.description}".`;
        break;
    }

    await this.sendMessage(prompt);
  }

  async sendFollowUp() {
    const prompt = this.followUpInput.trim();
    if (!prompt) return;

    this.aiConversation.update(conv => [...conv, { role: 'user', text: prompt }]);
    this.followUpInput = '';
    await this.sendMessage(prompt);
  }

  private async sendMessage(prompt: string) {
    if (!this.chat) return;

    this.isGenerating.set(true);
    const botMessage: Message = { role: 'bot', text: '', isStreaming: true };
    this.aiConversation.update(conv => [...conv, botMessage]);

    try {
      const stream: GenerateContentStreamResult = await this.chat.sendMessageStream(prompt);
      let fullResponse = '';

      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          this.aiConversation.update(conv => [
            ...conv.slice(0, -1),
            { ...conv[conv.length - 1], text: fullResponse }
          ]);
          this.cdr.detectChanges();
        }
      }

      this.promptLoggerService.logPrompt({
        prompt,
        status: 'successful',
        context: `Site Detail: ${this.site()?.name ?? 'Unknown Site'}`
      });
    } catch (error) {
      console.error('Error fetching AI response:', error);
      this.promptLoggerService.logPrompt({
        prompt,
        status: 'unsuccessful',
        context: `Site Detail: ${this.site()?.name ?? 'Unknown Site'}`,
        errorMessage: (error as Error).message
      });
      this.aiConversation.update(conv => [
        ...conv,
        { role: 'bot', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }
      ]);
    } finally {
      this.aiConversation.update(conv => [
        ...conv.slice(0, -1),
        { ...conv[conv.length - 1], isStreaming: false }
      ]);
      this.isGenerating.set(false);
      this.cdr.detectChanges();
    }
  }

  resetAiInteraction(): void {
    this.aiConversation.set([]);
    this.isGenerating.set(false);
    this.initializeChat();
  }

  openModal(imageUrl: string): void {
    this.selectedImageUrl.set(imageUrl);
  }

  closeModal(): void {
    this.selectedImageUrl.set(null);
  }

  rate(rating: number): void {
    const currentSite = this.site();
    if (currentSite) {
      this.ratingService.rateSite(currentSite.id, rating);
    }
  }

  get stars() {
    return Array(5).fill(0);
  }
}
