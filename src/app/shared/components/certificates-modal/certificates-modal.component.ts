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
  private viewerEl: HTMLElement | null = null;
  private iframeEl: HTMLIFrameElement | null = null;
  private loadingEl: HTMLElement | null = null;
  private errorEl: HTMLElement | null = null;
  private openBtnEl: HTMLAnchorElement | null = null;

  private blobUrls: string[] = [];

  /** Detecta mobile/tablet — en estos dispositivos los blob: URL no se renderizan en iframe */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      this.document.defaultView?.navigator?.userAgent ?? '',
    );
  }

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

    // iframe (desktop)
    const iframe = doc.createElement('iframe');
    iframe.style.cssText = `
      display: none; flex: 1;
      width: 100%; height: 100%;
      border: none; background: #fff;
      min-height: 0;
    `;
    iframe.setAttribute('type', 'application/pdf');
    iframe.setAttribute('title', 'Visor PDF');

    // ── Fallback mobile: pantalla con botón "Abrir PDF" ──────────────────────
    const mobileEl = doc.createElement('div');
    mobileEl.style.cssText = `
      display: none; flex: 1;
      flex-direction: column; align-items: center; justify-content: center;
      gap: 24px; padding: 2rem; text-align: center;
    `;

    // Ícono PDF
    const pdfIcon = doc.createElement('div');
    pdfIcon.innerHTML = `
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
           stroke="rgba(201,168,76,0.7)" stroke-width="1.2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <text x="7" y="18" font-size="5" fill="rgba(201,168,76,0.7)"
              stroke="none" font-family="monospace" font-weight="bold">PDF</text>
      </svg>
    `;

    // Nombre del archivo (se actualiza dinámicamente)
    const mobileFilename = doc.createElement('p');
    mobileFilename.style.cssText = `
      margin: 0;
      font-size: 12px;
      color: rgba(232,230,224,0.4);
      letter-spacing: 0.06em;
      font-family: monospace;
      word-break: break-all;
      max-width: 280px;
    `;

    // Botón "Abrir PDF" → target _blank para que el browser mobile lo abra en su visor nativo
    const openBtn = doc.createElement('a');
    openBtn.textContent = 'Abrir PDF';
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    openBtn.style.cssText = `
      display: inline-flex; align-items: center; gap: 8px;
      background: #c9a84c;
      color: #09090f;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.1em;
      padding: 14px 32px;
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
      border: none;
    `;

    const hint = doc.createElement('p');
    hint.textContent = 'Tu navegador abrirá el PDF en una nueva pestaña';
    hint.style.cssText = `
      margin: 0;
      font-size: 11px;
      color: rgba(232,230,224,0.3);
      letter-spacing: 0.04em;
    `;

    mobileEl.appendChild(pdfIcon);
    mobileEl.appendChild(mobileFilename);
    mobileEl.appendChild(openBtn);
    mobileEl.appendChild(hint);

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
    viewer.appendChild(mobileEl);
    doc.body.appendChild(viewer);

    // Guardar referencias
    this.viewerEl = viewer;
    this.iframeEl = iframe;
    this.loadingEl = loadingEl;
    this.errorEl = errorEl;
    this.openBtnEl = openBtn;

    (viewer as any)._titleEl = titleEl;
    (viewer as any)._mobileEl = mobileEl;
    (viewer as any)._mobileFilename = mobileFilename;
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
    (this.viewerEl as any)._mobileEl.style.display = 'none';
    this.iframeEl!.src = '';
  }

  private showIframe(src: string): void {
    if (!this.viewerEl) return;
    this.iframeEl!.src = src;
    this.loadingEl!.style.display = 'none';
    this.iframeEl!.style.display = 'flex';
    this.errorEl!.style.display = 'none';
    (this.viewerEl as any)._mobileEl.style.display = 'none';
  }

  /**
   * Muestra la pantalla de fallback mobile con un link directo al PDF.
   * El browser mobile (Chrome Android, Safari iOS) abre el PDF en su
   * visor nativo al tocar "Abrir PDF".
   */
  private showMobileFallback(directUrl: string, filename: string): void {
    if (!this.viewerEl) return;
    const mobileEl = (this.viewerEl as any)._mobileEl as HTMLElement;
    const mobileFilename = (this.viewerEl as any)._mobileFilename as HTMLElement;

    this.openBtnEl!.href = directUrl;
    mobileFilename.textContent = filename;

    this.loadingEl!.style.display = 'none';
    this.iframeEl!.style.display = 'none';
    this.errorEl!.style.display = 'none';
    mobileEl.style.display = 'flex';
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
    (this.viewerEl as any)._mobileEl.style.display = 'none';
  }

  closePdfViewer(): void {
    if (this.viewerEl) {
      this.viewerEl.style.display = 'none';
      this.iframeEl!.src = '';
      if (this.openBtnEl) this.openBtnEl.href = '';
    }
  }

  // ── Carga el PDF ─────────────────────────────────────────────────────────────
  async viewPdf(cert: Certificate): Promise<void> {
    this.showLoading(cert.title);

    // En mobile NO usamos blob URL (no se renderizan en iframe).
    // Usamos la URL directa del asset y abrimos el visor nativo del browser.
    if (this.isMobileDevice()) {
      // Verificamos primero que el archivo existe con un HEAD request
      try {
        const check = await fetch(cert.url, { method: 'HEAD', cache: 'no-cache' });
        if (!check.ok) throw new Error(`HTTP_${check.status}`);
        const ct = check.headers.get('content-type') ?? '';
        if (ct.includes('text/html')) throw new Error('NOT_FOUND');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === 'NOT_FOUND' || msg.startsWith('HTTP_')) {
          this.closePdfViewer();
        } else {
          this.showError(`No se pudo verificar el archivo`);
        }
        return;
      }

      // Archivo existe → mostrar fallback con link directo
      const filename = cert.url.split('/').pop() ?? cert.title;
      this.showMobileFallback(cert.url, filename);
      return;
    }

    // Desktop: comportamiento original con blob URL
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
