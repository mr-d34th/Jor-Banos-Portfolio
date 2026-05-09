import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  Renderer2,
  signal,
  computed,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';

const CV = {
  es: {
    url: 'assets/cv/cv-jorge-dev-es.pdf',
    fileName: 'CV-Jorge-Baños-ES.pdf',
    langBadge: 'VERSIÓN ESPAÑOL',
  },
  en: {
    url: 'assets/cv/cv-jorge-dev-en.pdf',
    fileName: 'CV-Jorge-Baños-EN.pdf',
    langBadge: 'ENGLISH VERSION',
  },
} as const;

@Component({
  selector: 'app-pdf-viewer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrl: './pdf-viewer-modal.component.scss',
})
export class PdfViewerModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild('pdfCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfContainer') containerRef!: ElementRef<HTMLDivElement>;

  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);
  private translate = inject(TranslationService);

  isBrowser = false;
  loading = signal(true);
  loadError = signal(false);
  currentPage = signal(1);
  totalPages = signal(0);
  zoom = signal(1.2); // escala por defecto

  cvConfig = computed(() => CV[this.translate.currentLang()]);
  get pdfUrl(): string {
    return this.cvConfig().url;
  }
  get fileName(): string {
    return this.cvConfig().fileName;
  }
  get langBadge(): string {
    return this.cvConfig().langBadge;
  }
  get isES(): boolean {
    return this.translate.currentLang() === 'es';
  }
  get zoomPct(): number {
    return Math.round(this.zoom() * 100);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pdfDoc: any = null;
  private renderTask: any = null;
  private pdfjsLib: any = null;

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.renderer.addClass(document.body, 'modal-open');
      document.addEventListener('keydown', this.onKeydown);
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;
    await this.loadPdfJs();
    await this.loadPdf();
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.renderer.removeClass(document.body, 'modal-open');
      document.removeEventListener('keydown', this.onKeydown);
    }
    this.renderTask?.cancel();
  }

  // ── Carga pdf.js desde CDN ────────────────────────────────────────────────
  private async loadPdfJs(): Promise<void> {
    if ((window as any)['pdfjsLib']) {
      this.pdfjsLib = (window as any)['pdfjsLib'];
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('pdf.js no cargó'));
      document.head.appendChild(script);
    });
    this.pdfjsLib = (window as any)['pdfjsLib'];
    this.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // ── Carga y renderiza el PDF ──────────────────────────────────────────────
  private async loadPdf(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadError.set(false);

      const loadingTask = this.pdfjsLib.getDocument(this.pdfUrl);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages.set(this.pdfDoc.numPages);
      this.currentPage.set(1);

      await this.renderPage(1);
      this.loading.set(false);
    } catch (err) {
      console.error('Error cargando PDF:', err);
      this.loading.set(false);
      this.loadError.set(true);
    }
  }

  // ── Renderiza una página en el canvas ────────────────────────────────────
  private async renderPage(pageNum: number): Promise<void> {
    if (!this.pdfDoc || !this.canvasRef) return;

    this.renderTask?.cancel();

    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: this.zoom() });
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    // Ajusta el canvas al tamaño de la página
    const ratio = window.devicePixelRatio || 1;
    canvas.width = viewport.width * ratio;
    canvas.height = viewport.height * ratio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(ratio, ratio);

    this.renderTask = page.render({ canvasContext: ctx, viewport });
    await this.renderTask.promise;
  }

  // ── Navegación de páginas ─────────────────────────────────────────────────
  async prevPage(): Promise<void> {
    if (this.currentPage() <= 1) return;
    this.currentPage.update((p) => p - 1);
    await this.renderPage(this.currentPage());
    this.containerRef.nativeElement.scrollTop = 0;
  }

  async nextPage(): Promise<void> {
    if (this.currentPage() >= this.totalPages()) return;
    this.currentPage.update((p) => p + 1);
    await this.renderPage(this.currentPage());
    this.containerRef.nativeElement.scrollTop = 0;
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────
  async zoomIn(): Promise<void> {
    if (this.zoom() >= 2.5) return;
    this.zoom.update((z) => Math.round((z + 0.2) * 10) / 10);
    await this.renderPage(this.currentPage());
  }

  async zoomOut(): Promise<void> {
    if (this.zoom() <= 0.5) return;
    this.zoom.update((z) => Math.round((z - 0.2) * 10) / 10);
    await this.renderPage(this.currentPage());
  }

  async resetZoom(): Promise<void> {
    this.zoom.set(1.2);
    await this.renderPage(this.currentPage());
  }

  // ── Acciones ──────────────────────────────────────────────────────────────
  download(): void {
    const a = document.createElement('a');
    a.href = this.pdfUrl;
    a.download = this.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  openInNewTab(): void {
    window.open(this.pdfUrl, '_blank', 'noopener');
  }
  print(): void {
    window.open(this.pdfUrl, '_blank', 'noopener')?.print();
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('pv-overlay')) this.onClose();
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') this.onClose();
    if (e.key === 'ArrowRight') this.nextPage();
    if (e.key === 'ArrowLeft') this.prevPage();
  };
}
