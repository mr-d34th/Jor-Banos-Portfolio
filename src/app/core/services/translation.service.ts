import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Lang = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // ── State ──────────────────────────────────────────────────────────────────
  currentLang = signal<Lang>('es');
  private translations = signal<Record<string, any>>({});
  loading = signal(false);

  // ── Init (IMPORTANTE: ahora devuelve Promise) ──────────────────────────────
  async init(): Promise<void> {
    // 🚨 IMPORTANTE: evitar SSR
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let lang: Lang = 'es';

    const saved = localStorage.getItem('lang') as Lang | null;
    const browser = navigator.language.startsWith('en') ? 'en' : 'es';
    lang = saved ?? browser;

    await this.load(lang);
  }

  // ── Toggle ES ↔ EN ─────────────────────────────────────────────────────────
  async toggle(): Promise<void> {
    const next: Lang = this.currentLang() === 'es' ? 'en' : 'es';
    console.log('Cambiando idioma a:', next); // 👈 DEBUG
    await this.load(next);
  }

  // ── Carga el JSON (SIN subscribe, usando await) ────────────────────────────
  private async load(lang: Lang): Promise<void> {
    this.loading.set(true);

    try {
      const data = await firstValueFrom(
        this.http.get<Record<string, any>>(`/assets/i18n/${lang}.json`),
      );

      this.translations.set(data);
      this.currentLang.set(lang);

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
      }
    } catch (error) {
      console.error('Error loading translations', error);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Método translate: "hero.title" ─────────────────────────────────────────
  t(key: string, fallback = ''): string {
    const dict = this.translations(); // 👈 aquí sí detecta cambios

    const parts = key.split('.');
    let val: any = dict;

    for (const part of parts) {
      if (val == null) return fallback || key;
      val = val[part];
    }

    return typeof val === 'string' ? val : fallback || key;
  }
}
