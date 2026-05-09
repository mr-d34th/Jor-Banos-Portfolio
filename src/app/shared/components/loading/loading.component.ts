import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading-overlay" [class.hidden]="!visible()">
      <div class="spinner"></div>
      <p class="loading-text">Cargando...</p>
    </div>
  `,
  styles: [
    `
      .loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: #0f0f0f;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition:
          opacity 0.4s ease,
          visibility 0.4s ease;
      }
      .loading-overlay.hidden {
        opacity: 0;
        visibility: hidden;
      }
      .spinner {
        width: 48px;
        height: 48px;
        border: 3px solid #333;
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .loading-text {
        color: #888;
        font-size: 13px;
        margin-top: 16px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingComponent {
  visible = input<boolean>(true); // Angular 19: input() en lugar de @Input()
}
