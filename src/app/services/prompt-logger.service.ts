import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export type PromptStatus = 'successful' | 'unsuccessful';

export interface PromptLog {
  prompt: string;
  status: PromptStatus;
  context?: string;
  timestamp: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromptLoggerService {
  private http = inject(HttpClient);
  // This is the placeholder endpoint for your Node.js backend
  private readonly apiUrl = '/api/log-prompt';

  logPrompt(data: Omit<PromptLog, 'timestamp'>) {
    const logData: PromptLog = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // This is a "fire-and-forget" call. We don't need the component
    // to wait for this to complete. We'll handle errors silently in the console.
    this.http.post(this.apiUrl, logData).pipe(
      catchError(error => {
        console.error('Failed to log prompt to backend:', error.message);
        // Return a non-erroring observable to complete the stream
        return of(null);
      })
    ).subscribe();
  }
}
