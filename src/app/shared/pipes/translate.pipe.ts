import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // impure para reaccionar al cambio de idioma
})
export class TranslatePipe implements PipeTransform {
  private svc = inject(TranslationService);

  transform(key: string, fallback = ''): string {
    return this.svc.t(key, fallback);
  }
}
