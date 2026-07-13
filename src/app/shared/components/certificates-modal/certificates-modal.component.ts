import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  NgZone,
  Renderer2,
  signal,
  computed,
  DOCUMENT,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface Certificate {
  id: string;
  title: string;
  institution: string;
  category: 'frontend' | 'backend' | 'cloud' | 'agile' | 'work';
  date: string;
  url: string;
  verifyUrl?: string;
  badge?: string;
  hours?: string;
}

@Component({
  selector: 'app-certificates-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './certificates-modal.component.html',
  styleUrl: './certificates-modal.component.scss',
})
export class CertificatesModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  private renderer = inject(Renderer2);
  private sanitizer = inject(DomSanitizer);
  private zone = inject(NgZone);
  private document = inject(DOCUMENT);

  // ── Modal grid signals ───────────────────────────────────────────────────────
  searchQuery = signal('');
  activeFilter = signal<'all' | Certificate['category']>('all');

  // ── PDF viewer signals ───────────────────────────────────────────────────────
  showPdfViewer = signal(false);
  pdfLoading = signal(false);
  pdfError = signal('');
  pdfBlobUrl = signal('');
  pdfTitle = signal('');

  safeIframeUrl = computed(
    (): SafeResourceUrl => this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl()),
  );

  // ── PDF viewer DOM portal ────────────────────────────────────────────────────
  // Creamos el viewer en document.body directamente para escapar de
  // overflow:hidden del body/html y de cualquier stacking context padre
  private viewerEl: HTMLElement | null = null;
  private iframeEl: HTMLIFrameElement | null = null;
  private loadingEl: HTMLElement | null = null;
  private errorEl: HTMLElement | null = null;

  private blobUrls: string[] = [];

  certificates: Certificate[] = [
    {
      id: 'c-aws',
      title: 'AWS Academy Graduate – Cloud Operations',
      institution: 'Amazon Web Services Academy',
      category: 'cloud',
      date: '2025-11',
      url: 'assets/certificates/aws-cloud-ops.pdf',
      verifyUrl: 'https://www.credly.com/go/i9heHHY5',
      badge: '◇',
      hours: '40h',
    },
    {
      id: 'c-scrum',
      title: 'Scrum Fundamentals Certified (SFC™)',
      institution: 'SCRUMstudy',
      category: 'agile',
      date: '2025-01',
      url: 'assets/certificates/scrum-sfc.pdf',
      verifyUrl: 'https://www.scrumstudy.com/certification/verify?type=SFC&number=1089379',
      badge: '◎',
    },
    {
      id: 'c-python-udemy',
      title: 'Back-End con Python',
      institution: 'Udemy',
      category: 'backend',
      date: '2025-01',
      url: 'assets/certificates/python-backend-udemy.pdf',
      badge: '◉',
    },
    {
      id: 'c-python-uni',
      title: 'Fundamentos de Python – Para la Ciencia de Datos',
      institution: 'CEPS UNI – Universidad Nacional de Ingeniería',
      category: 'backend',
      date: '2021-03',
      url: 'assets/certificates/python-ciencia-de-datos-ceps-uni.pdf',
      badge: '◉',
      hours: '24h',
    },
    {
      id: 'c-js-udemy',
      title: 'Aprende JavaScript y jQuery de 0 a 100',
      institution: 'Udemy',
      category: 'frontend',
      date: '2021-05',
      url: 'assets/certificates/js-jquery-udemy.pdf',
      badge: '◈',
      hours: '4h',
    },
    {
      id: 'c-css-udemy',
      title: 'Desarrollo Web – CSS desde Cero (Edición 2020)',
      institution: 'Udemy',
      category: 'frontend',
      date: '2021-04',
      url: 'assets/certificates/css-udemy.pdf',
      badge: '◈',
      hours: '13.5h',
    },
    {
      id: 'c-python-charla',
      title: 'Charla: Introducción al Lenguaje de Programación (Python)',
      institution: 'UPC – Universidad Peruana de Ciencias Aplicadas',
      category: 'frontend',
      date: '2021-05',
      url: 'assets/certificates/charla-python-upc.pdf',
      badge: '◈',
    },
    {
      id: 'c-idat',
      title: 'Diseño y Desarrollo Web',
      institution: 'I.E. IDAT',
      category: 'frontend',
      date: '2022-01',
      url: 'assets/certificates/idat-web.pdf',
      badge: '◈',
    },
    {
      id: 'c-excel',
      title: 'Especialista en Excel Empresarial',
      institution: 'CEPS UNI – Universidad Nacional de Ingeniería',
      category: 'agile',
      date: '2017-02',
      url: 'assets/certificates/ceps-excel-empresarial.pdf',
      badge: '◎',
      hours: '96h',
    },
    {
      id: 'c-cibertec',
      title: 'Constancia de Egresado – Computación e Informática',
      institution: 'I.E. CIBERTEC',
      category: 'work',
      date: '2025-02',
      url: 'assets/certificates/cibertec-egresado.pdf',
      badge: '▣',
    },
    {
      id: 'c-ses-trabajo',
      title: 'Certificado de Trabajo – Ingeniero de Fábrica de Software',
      institution: 'SOFTWARE ENTERPRISE SERVICES SAC (SES)',
      category: 'work',
      date: '2025-01',
      url: 'assets/certificates/ses-certificado-trabajo.pdf',
      badge: '▣',
    },
    {
      id: 'c-ses-practicas',
      title: 'Certificado de Prácticas Profesionales',
      institution: 'SOFTWARE ENTERPRISE SERVICES SAC (SES)',
      category: 'work',
      date: '2022-08',
      url: 'assets/certificates/ses-practicas-profesionales.pdf',
      badge: '▣',
    },
    {
      id: 'c-cibertec-carta',
      title: 'Carta de Presentación – Prácticas Profesionales',
      institution: 'I.E. CIBERTEC',
      category: 'work',
      date: '2021-07',
      url: 'assets/certificates/cibertec-carta-practicas.pdf',
      badge: '▣',
    },
  ];

  readonly categories = ['all', 'frontend', 'backend', 'cloud', 'agile', 'work'] as const;

  filteredCertificates = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const f = this.activeFilter();
    return this.certificates.filter((cert) => {
      const matchFilter = f === 'all' || cert.category === f;
      const matchSearch =
        !q || cert.title.toLowerCase().includes(q) || cert.institution.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  });

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, 'modal-open');
    this.document.addEventListener('keydown', this.onKeydown);
  }

  ngAfterViewInit(): void {
    this.buildViewerPortal();
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, 'modal-open');
    this.document.removeEventListener('keydown', this.onKeydown);
    this.destroyViewerPortal();
    this.blobUrls.forEach((u) => URL.revokeObjectURL(u));
  }

  private onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (this.viewerEl?.style.display !== 'none') {
        this.closePdfViewer();
      } else {
        this.onClose();
      }
    }
  };

  // ── Portal: crea el viewer directamente en document.body ──────────────────────
  // Esto escapa de CUALQUIER overflow:hidden, transform, o stacking context
  // que pueda existir en los componentes padre
  private buildViewerPortal(): void {
    const doc = this.document;

    // Contenedor principal
    const viewer = doc.createElement('div');
    viewer.id = 'cm-pdf-portal';
    viewer.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: #09090f;
      flex-direction: column;
      font-family: 'DM Sans', system-ui, sans-serif;
    `;

    // Topbar
    const topbar = doc.createElement('div');
    topbar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: rgba(201,168,76,0.04);
      border-bottom: 1px solid rgba(201,168,76,0.16);
      flex-shrink: 0;
      min-height: 48px;
    `;

    // Botón volver
    const backBtn = doc.createElement('button');
    backBtn.innerHTML = '&#8249; Volver';
    backBtn.style.cssText = `
      display: flex; align-items: center; gap: 5px;
      background: transparent;
      border: 1px solid rgba(201,168,76,0.3);
      color: #c9a84c;
      font-family: inherit;
      font-size: 11px;
      letter-spacing: 0.12em;
      padding: 6px 14px;
      cursor: pointer;
      flex-shrink: 0;
      white-space: nowrap;
    `;
    backBtn.addEventListener('click', () => this.closePdfViewer());

    // Título
    const titleEl = doc.createElement('span');
    titleEl.style.cssText = `
      flex: 1; text-align: center;
      font-size: 11px; letter-spacing: 0.08em;
      color: rgba(232,230,224,0.6);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    `;

    // Botón cerrar X
    const closeBtn = doc.createElement('button');
    closeBtn.innerHTML = '&#x2715;';
    closeBtn.style.cssText = `
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(232,230,224,0.5);
      font-size: 15px;
      cursor: pointer;
      flex-shrink: 0;
    `;
    closeBtn.addEventListener('click', () => this.closePdfViewer());

    topbar.appendChild(backBtn);
    topbar.appendChild(titleEl);
    topbar.appendChild(closeBtn);

    // Estado: loading
    const loadingEl = doc.createElement('div');
    loadingEl.style.cssText = `
      display: none; flex: 1;
      flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; color: rgba(232,230,224,0.6);
      font-size: 13px; font-family: monospace; letter-spacing: 0.1em;
    `;
    loadingEl.innerHTML = `
      <div style="
        width:36px;height:36px;
        border:2px solid rgba(201,168,76,0.15);
        border-top-color:#c9a84c;
        border-radius:50%;
        animation:cm-spin 0.8s linear infinite;
      "></div>
      <span>Cargando PDF...</span>
    `;

    // Estado: error
    const errorEl = doc.createElement('div');
    errorEl.style.cssText = `
      display: none; flex: 1;
      flex-direction: column; align-items: center; justify-content: center;
      gap: 14px; color: rgba(248,113,113,0.85);
      font-size: 13px; text-align: center; padding: 2rem;
    `;

    // iframe
    const iframe = doc.createElement('iframe');
    iframe.style.cssText = `
      display: none; flex: 1;
      width: 100%; height: 100%;
      border: none; background: #fff;
      min-height: 0;
    `;
    iframe.setAttribute('type', 'application/pdf');
    iframe.setAttribute('title', 'Visor PDF');

    // Keyframe animation para el spinner
    if (!doc.getElementById('cm-portal-styles')) {
      const style = doc.createElement('style');
      style.id = 'cm-portal-styles';
      style.textContent = `@keyframes cm-spin { to { transform: rotate(360deg); } }`;
      doc.head.appendChild(style);
    }

    viewer.appendChild(topbar);
    viewer.appendChild(loadingEl);
    viewer.appendChild(errorEl);
    viewer.appendChild(iframe);
    doc.body.appendChild(viewer);

    // Guardar referencias
    this.viewerEl = viewer;
    this.iframeEl = iframe;
    this.loadingEl = loadingEl;
    this.errorEl = errorEl;

    // Guardar referencia al título para actualizarlo después
    (viewer as any)._titleEl = titleEl;
  }

  private destroyViewerPortal(): void {
    if (this.viewerEl) {
      this.viewerEl.remove();
      this.viewerEl = null;
    }
  }

  private showLoading(title: string): void {
    if (!this.viewerEl) return;
    const titleEl = (this.viewerEl as any)._titleEl as HTMLElement;
    titleEl.textContent = title;
    this.viewerEl.style.display = 'flex';
    this.loadingEl!.style.display = 'flex';
    this.iframeEl!.style.display = 'none';
    this.errorEl!.style.display = 'none';
    this.iframeEl!.src = '';
  }

  private showIframe(blobUrl: string): void {
    if (!this.viewerEl) return;
    this.iframeEl!.src = blobUrl;
    this.loadingEl!.style.display = 'none';
    this.iframeEl!.style.display = 'flex';
    this.errorEl!.style.display = 'none';
  }

  private showError(msg: string): void {
    if (!this.viewerEl) return;
    this.errorEl!.innerHTML = `
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1" opacity="0.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style="margin:0">${msg}</p>
      <p style="font-size:11px;color:rgba(232,230,224,0.4);margin:0">
        Verifica que el archivo esté en <code style="color:#c9a84c">public/assets/certificates/</code>
      </p>
    `;
    this.loadingEl!.style.display = 'none';
    this.iframeEl!.style.display = 'none';
    this.errorEl!.style.display = 'flex';
  }

  closePdfViewer(): void {
    if (this.viewerEl) {
      this.viewerEl.style.display = 'none';
      this.iframeEl!.src = '';
    }
  }

  // ── Carga el PDF como blob y lo muestra en el portal ─────────────────────────
  async viewPdf(cert: Certificate): Promise<void> {
    this.showLoading(cert.title);

    try {
      const response = await fetch(cert.url, {
        method: 'GET',
        headers: { Accept: 'application/pdf,*/*' },
        credentials: 'omit',
        cache: 'no-cache',
      });

      if (!response.ok) throw new Error(`HTTP_${response.status}`);

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('text/html')) throw new Error('NOT_FOUND');

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      this.blobUrls.push(blobUrl);

      this.showIframe(blobUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'NOT_FOUND') {
        // Archivo no existe — cerrar silenciosamente
        this.closePdfViewer();
      } else {
        this.showError(`Error al cargar: ${msg}`);
      }
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('cm-overlay')) this.onClose();
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
    return cat === 'all' ? 'certificates.filter_all' : `certificates.filter_${cat}`;
  }

  verifyOnline(cert: Certificate): void {
    if (cert.verifyUrl) window.open(cert.verifyUrl, '_blank', 'noopener,noreferrer');
  }
}
