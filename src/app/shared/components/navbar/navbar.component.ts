import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangSwitcherComponent } from '../lang-switcher/lang-switcher.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface NavLink {
  label: string; // clave i18n ej: "nav.home"
  target: string;
  delay: number;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LangSwitcherComponent, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  isScrolled = signal(false);
  menuOpen = signal(false);

  links: NavLink[] = [
    { label: 'nav.home', target: 'home', delay: 0 },
    { label: 'nav.experience', target: 'experience', delay: 60 },
    { label: 'nav.stack', target: 'stack', delay: 120 },
    { label: 'nav.about', target: 'about', delay: 180 },
    { label: 'nav.contact', target: 'contact', delay: 240 },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 40);
  }

  scrollTo(target: string): void {
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.menuOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  openWhatsapp(): void {
    window.open('https://wa.me/51997025331', '_blank');
  }
}
