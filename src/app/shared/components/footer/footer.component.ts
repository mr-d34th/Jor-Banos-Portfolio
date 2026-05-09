import { Component } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  links = [
    { label: 'footer.github', href: 'https://github.com/tu-usuario' },
    { label: 'footer.linkedin', href: 'https://linkedin.com/in/tu-usuario' },
    { label: 'footer.email', href: 'mailto:tu@email.com' },
  ];

  open(href: string): void {
    window.open(href, '_blank', 'noopener');
  }
}
