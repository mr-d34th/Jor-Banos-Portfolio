import { Component, inject } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  template: `
    <button
      class="lang-btn"
      (click)="svc.toggle()"
      [attr.aria-label]="'Switch to ' + (svc.currentLang() === 'es' ? 'English' : 'Español')"
    >
      <span class="lang-btn__current">{{ svc.currentLang().toUpperCase() }}</span>
      <span class="lang-btn__divider">/</span>
      <span class="lang-btn__next">{{ svc.currentLang() === 'es' ? 'EN' : 'ES' }}</span>
    </button>
  `,
  styles: [
    `
      .lang-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        background: transparent;
        border: 1px solid rgba(201, 168, 76, 0.25);
        border-radius: 2px;
        cursor: pointer;
        padding: 5px 10px;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 0.6875rem;
        font-weight: 500;
        letter-spacing: 0.12em;
        transition: all 0.25s ease;

        &:hover {
          border-color: #c9a84c;
          background: rgba(201, 168, 76, 0.08);
        }
      }
      .lang-btn__current {
        color: #c9a84c;
        font-weight: 600;
      }
      .lang-btn__divider {
        color: rgba(201, 168, 76, 0.3);
        font-size: 0.6rem;
      }
      .lang-btn__next {
        color: rgba(232, 230, 224, 0.35);
      }
    `,
  ],
})
export class LangSwitcherComponent {
  svc = inject(TranslationService);
}
