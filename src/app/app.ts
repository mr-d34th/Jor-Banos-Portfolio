import { Component, inject, signal, computed } from '@angular/core';
import {
  Router,
  RouterOutlet,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';

import { LoadingComponent } from './shared/components/loading/loading.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ScrollTopComponent } from './shared/components/scroll-top/scroll top.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent, NavbarComponent, FooterComponent, ScrollTopComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('portfolio');
  protected isLoading = signal(true);
  private currentUrl = signal('');

  protected isAnimusRoute = computed(() => this.currentUrl().startsWith('/line-time'));

  private router = inject(Router);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isLoading.set(true);
        this.currentUrl.set(event.url);
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        setTimeout(() => this.isLoading.set(false), 300);
      }
    });
  }
}
