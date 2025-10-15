import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; // if you have routing

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),     // ✅ Enables HttpClient globally
    provideRouter(routes)    // optional if you use routing
  ]
}).catch(err => console.error(err));
