import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { TranslationService } from './core/services/translation.service';

// Inicializa el idioma antes de que la app renderice
function initTranslations(svc: TranslationService) {
  return () => svc.init().catch(() => Promise.resolve());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideClientHydration(),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslationService],
      multi: true,
    },
  ],
};
