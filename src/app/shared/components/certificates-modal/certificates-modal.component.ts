import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  Renderer2,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface Certificate {
  id: string;
  title: string;
  institution: string;
  category: 'frontend' | 'backend' | 'cloud' | 'agile';
  date: string;
  url: string; // URL al PDF
  badge?: string; // emoji o ícono
}

@Component({
  selector: 'app-certificates-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './certificates-modal.component.html',
  styleUrl: './certificates-modal.component.scss',
})
export class CertificatesModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  private renderer = inject(Renderer2);

  searchQuery = signal('');
  activeFilter = signal<'all' | Certificate['category']>('all');

  certificates: Certificate[] = [
    {
      id: 'c1',
      title: 'Scrum Fundamentals Certified (SFC)',
      institution: 'SCRUMstudy',
      category: 'agile',
      date: '2025-01',
      url: 'assets/certificates/scrum-sfc.pdf',
      badge: '◎',
    },
    {
      id: 'c2',
      title: 'AWS Academy Graduate – Cloud Operations',
      institution: 'Amazon Web Services',
      category: 'cloud',
      date: '2025-01',
      url: 'assets/certificates/aws-cloud-ops.pdf',
      badge: '◇',
    },
    {
      id: 'c3',
      title: 'Back-End con Python',
      institution: 'Udemy',
      category: 'backend',
      date: '2025-01',
      url: 'assets/certificates/python-backend-udemy.pdf',
      badge: '◉',
    },
    {
      id: 'c4',
      title: 'Diseño y Desarrollo Web',
      institution: 'I.E. IDAT',
      category: 'frontend',
      date: '2022-01',
      url: 'assets/certificates/idat-web.pdf',
      badge: '◈',
    },
    {
      id: 'c5',
      title: 'Fundamentos de Python',
      institution: 'CEPS UNI',
      category: 'backend',
      date: '2021-01',
      url: 'assets/certificates/ceps-python.pdf',
      badge: '◉',
    },
    {
      id: 'c6',
      title: 'Especialista de Excel Empresarial',
      institution: 'CEPS UNI',
      category: 'agile',
      date: '2017-01',
      url: 'assets/certificates/ceps-excel.pdf',
      badge: '◎',
    },
    {
      id: 'c7',
      title: 'Computación e Informática',
      institution: 'I.E. CIBERTEC',
      category: 'frontend',
      date: '2020-01',
      url: 'assets/certificates/cibertec-computacion.pdf',
      badge: '◈',
    },
    {
      id: 'c8',
      title: 'Ingeniería de Sistemas Computacionales',
      institution: 'Universidad Privada del Norte (UPN)',
      category: 'frontend',
      date: '2023-01',
      url: 'assets/certificates/upn-ingenieria.pdf',
      badge: '◈',
    },
  ];

  readonly categories = ['all', 'frontend', 'backend', 'cloud', 'agile'] as const;

  filteredCertificates = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const f = this.activeFilter();

    return this.certificates.filter((cert) => {
      const matchesFilter = f === 'all' || cert.category === f;
      const matchesSearch =
        !q ||
        cert.title.toLowerCase().includes(q) ||
        cert.institution.toLowerCase().includes(q) ||
        cert.category.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'modal-open');
    document.addEventListener('keydown', this.onKeydown);
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'modal-open');
    document.removeEventListener('keydown', this.onKeydown);
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') this.onClose();
  };

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('cm-overlay')) {
      this.onClose();
    }
  }

  setFilter(f: (typeof this.categories)[number]): void {
    this.activeFilter.set(f);
  }

  formatDate(dateStr: string): string {
    const [y, m] = dateStr.split('-');
    const months: Record<string, string> = {
      '01': 'Ene',
      '02': 'Feb',
      '03': 'Mar',
      '04': 'Abr',
      '05': 'May',
      '06': 'Jun',
      '07': 'Jul',
      '08': 'Ago',
      '09': 'Sep',
      '10': 'Oct',
      '11': 'Nov',
      '12': 'Dic',
    };
    return `${months[m] ?? m} ${y}`;
  }

  getCategoryFilterKey(cat: string): string {
    if (cat === 'all') return 'certificates.filter_all';
    return `certificates.filter_${cat}`;
  }
}
