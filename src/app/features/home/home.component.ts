import {
  Component,
  inject,
  signal,
  computed,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';
import { CertificatesModalComponent } from '../../shared/components/certificates-modal/certificates-modal.component';
import { PdfViewerModalComponent } from '../../shared/components/pdf-viewer-modal/pdf-viewer-modal.component';
import { ChatbotComponent } from '../../shared/components/chatbot/chatbot.component';

interface Project {
  title: string;
  description: string;
  tags: string[];
  link?: string;
  year: string;
}
interface Skill {
  category: string;
  icon: string;
  items: string[];
}

interface StackCube {
  // position in 3D space
  x: number;
  y: number;
  z: number;
  // velocity
  vx: number;
  vy: number;
  vz: number;
  // rotation angles
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  vrz: number;
  size: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1
  maxLife: number;
  size: number;
  angle: number;
  vAngle: number;
  color: string; // 'dark' | 'light'
}

const CV_CONFIG = {
  es: {
    url: 'assets/cv/cv-jorge-dev-es.pdf',
    fileName: 'CV-Jorge-Senior-Frontend-ES.pdf',
    label: 'Descargar CV',
  },
  en: {
    url: 'assets/cv/cv-jorge-dev-en.pdf',
    fileName: 'CV-Jorge-Senior-Frontend-EN.pdf',
    label: 'Download CV',
  },
} as const;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    CertificatesModalComponent,
    PdfViewerModalComponent,
    ChatbotComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stackCanvas') stackCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('smokeCanvas') smokeCanvasRef!: ElementRef<HTMLCanvasElement>;

  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private isBrowser = false;
  private translate = inject(TranslationService);
  // true en móvil/táctil o si el usuario pidió "reducir movimiento":
  // en esos casos NO iniciamos los canvas decorativos (cubos 3D + cursor de humo).
  private skipDecorativeCanvas = false;

  certModalOpen = signal(false);
  pdfViewerOpen = signal(false);

  cvConfig = computed(() => CV_CONFIG[this.translate.currentLang()]);
  get cvPdfUrl() {
    return this.cvConfig().url;
  }
  get cvFileName() {
    return this.cvConfig().fileName;
  }

  // ── Stack cube canvas ─────────────────────────────────────────────────────
  private stackAnimId = 0;
  private stackCubes: StackCube[] = [];
  private SW = 0;
  private SH = 0;
  private stackObserver!: IntersectionObserver;
  private stackAnimating = false;

  // ── Global smoke cursor canvas ─────────────────────────────────────────────
  private smokeAnimId = 0;
  private smokeParticles: SmokeParticle[] = [];
  private mouseX = 0;
  private mouseY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private currentSmokeColor = 'light'; // default on dark hero
  private boundMouseMove!: (e: MouseEvent) => void;
  private boundMouseEnter!: (e: MouseEvent) => void;

  // ── Sections map: which sections are dark/light ───────────────────────────
  // Detected by checking section background at runtime
  private readonly DARK_SECTIONS = ['home', 'experience', 'about'];
  private readonly LIGHT_SECTIONS = ['stack', 'contact'];

  projects: Project[] = [
    {
      title: 'projects.crm.title',
      description: 'projects.crm.description',
      tags: ['Angular', 'Java', 'Spring Boot', 'GitLab'],
      year: '2026',
    },
    {
      title: 'projects.scotiabank.title',
      description: 'projects.scotiabank.description',
      tags: ['React', 'React Hook Form', 'Axios', 'Bitbucket'],
      year: '2024',
    },
    {
      title: 'projects.sifa.title',
      description: 'projects.sifa.description',
      tags: ['DevOps', 'GitLab', 'Oracle', 'Cisco'],
      year: '2026',
    },
    {
      title: 'projects.wordpress.title',
      description: 'projects.wordpress.description',
      tags: ['WordPress', 'Magento', 'Elementor', 'HTML'],
      year: '2025',
    },
  ];

  stack: Skill[] = [
    {
      category: 'stack.frontend',
      icon: '◈',
      items: ['Angular', 'React', 'TypeScript', 'JavaScript', 'HTML / CSS', 'SCSS'],
    },
    {
      category: 'stack.backend',
      icon: '◉',
      items: ['Java (Spring Boot)', 'Python', 'Node.js', 'IntelliJ IDEA'],
    },
    { category: 'stack.data', icon: '◇', items: ['Oracle', 'SQL Server', 'MySQL', 'Firebase'] },
    {
      category: 'stack.devops',
      icon: '◎',
      items: ['GitLab', 'Bitbucket', 'Azure Repos', 'AWS Cloud Ops', 'Fortinet VPN'],
    },
    {
      category: 'stack.design',
      icon: '◈',
      items: ['Figma', 'WordPress', 'Magento', 'Elementor', 'VS Code'],
    },
    {
      category: 'stack.workflow',
      icon: '◉',
      items: ['SCRUM / Agile', 'Jira', 'Confluence', 'Git', 'Axios'],
    },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (!this.isBrowser) return;

    // pointer: coarse = dispositivo táctil (celular/tablet). Ahí no existe
    // un cursor real, así que el "humo" que sigue al mouse no tiene sentido,
    // y los cubos 3D de fondo son puramente decorativos: no vale la pena
    // pagar su costo de CPU/GPU mientras el usuario hace scroll.
    const isCoarsePointer =
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.skipDecorativeCanvas = isCoarsePointer || prefersReducedMotion;

    if (this.skipDecorativeCanvas) return;

    // Todo lo de aquí abajo corre FUERA del NgZone: son listeners de
    // mousemove/resize y loops de requestAnimationFrame que no tocan ningún
    // estado enlazado a la plantilla. Si se dejan dentro del zone, cada
    // movimiento de mouse y cada frame (60/seg) dispara un ciclo completo de
    // change detection en TODA la app — incluyendo los pipes de traducción,
    // que son "impure" y se recalculan en cada ciclo. Sacarlo del zone evita
    // ese costo invisible que se siente como lentitud general.
    this.ngZone.runOutsideAngular(() => {
      if (this.stackCanvasRef) this.initStackCanvas();
      if (this.smokeCanvasRef) this.initSmokeCanvas();
      window.addEventListener('resize', this.onResize);
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    if (this.stackAnimId) cancelAnimationFrame(this.stackAnimId);
    if (this.smokeAnimId) cancelAnimationFrame(this.smokeAnimId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.boundMouseMove);
    this.stackObserver?.disconnect();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SMOKE CURSOR — global, covers full page
  // ══════════════════════════════════════════════════════════════════════════
  private initSmokeCanvas(): void {
    const canvas = this.smokeCanvasRef.nativeElement;
    this.resizeSmokeCanvas(canvas);

    this.boundMouseMove = (e: MouseEvent) => {
      this.lastMouseX = this.mouseX;
      this.lastMouseY = this.mouseY;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      // Detect which section the cursor is over
      const el = document.elementFromPoint(e.clientX, e.clientY);
      this.currentSmokeColor = this.detectSectionColor(el);

      // Emit smoke particles proportional to mouse speed
      const speed = Math.hypot(e.clientX - this.lastMouseX, e.clientY - this.lastMouseY);
      const count = Math.min(5, Math.floor(speed * 0.25) + 1);
      for (let i = 0; i < count; i++) this.spawnSmoke(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', this.boundMouseMove, { passive: true });
    this.loopSmoke(canvas.getContext('2d')!);
  }

  private resizeSmokeCanvas(canvas: HTMLCanvasElement): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private detectSectionColor(el: Element | null): 'dark' | 'light' {
    if (!el) return 'light';
    // Walk up the DOM to find a section with known id
    let node: Element | null = el;
    while (node) {
      const id = node.id;
      if (id && this.DARK_SECTIONS.includes(id)) return 'dark';
      if (id && this.LIGHT_SECTIONS.includes(id)) return 'light';
      // Check class
      if (node.classList.contains('section--dark') || node.classList.contains('hero'))
        return 'dark';
      node = node.parentElement;
    }
    return 'light'; // default
  }

  private spawnSmoke(x: number, y: number): void {
    const spread = 6;
    const isDark = this.currentSmokeColor === 'dark';
    this.smokeParticles.push({
      x: x + this.rand(-spread, spread),
      y: y + this.rand(-spread, spread),
      vx: this.rand(-0.4, 0.4),
      vy: this.rand(-1.2, -0.3), // drifts upward
      life: 1,
      maxLife: this.rand(0.6, 1.0),
      size: this.rand(4, 14),
      angle: this.rand(0, Math.PI * 2),
      vAngle: this.rand(-0.04, 0.04),
      color: isDark ? 'light' : 'dark',
    });
    // Cap to avoid performance issues
    if (this.smokeParticles.length > 200) this.smokeParticles.splice(0, 10);
  }

  private loopSmoke(ctx: CanvasRenderingContext2D): void {
    const frame = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
        const p = this.smokeParticles[i];
        p.life -= 0.032 / p.maxLife;
        if (p.life <= 0) {
          this.smokeParticles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.97; // decelerate
        p.vx *= 0.96;
        p.size += 0.35; // expand as it fades
        p.angle += p.vAngle;

        const alpha = p.life * 0.45;
        const s = p.size;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = alpha;

        if (p.color === 'light') {
          // White smoke on dark backgrounds
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
          g.addColorStop(0, `rgba(255,255,255,${alpha})`);
          g.addColorStop(0.5, `rgba(220,220,230,${alpha * 0.5})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
        } else {
          // Dark/black smoke on light backgrounds
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
          g.addColorStop(0, `rgba(15,15,25,${alpha})`);
          g.addColorStop(0.5, `rgba(30,30,40,${alpha * 0.5})`);
          g.addColorStop(1, 'rgba(15,15,25,0)');
          ctx.fillStyle = g;
        }

        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      this.smokeAnimId = requestAnimationFrame(frame);
    };
    frame();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STACK CUBES CANVAS
  // ══════════════════════════════════════════════════════════════════════════
  private initStackCanvas(): void {
    const canvas = this.stackCanvasRef.nativeElement;
    const section = canvas.parentElement!;
    this.SW = canvas.width = section.offsetWidth;
    this.SH = canvas.height = section.offsetHeight;
    this.buildCubes();

    this.stackObserver = new IntersectionObserver(
      (entries) => {
        this.stackAnimating = entries[0].isIntersecting;
        const ctx = canvas.getContext('2d')!;
        if (this.stackAnimating) this.loopStack(ctx);
        else if (this.stackAnimId) cancelAnimationFrame(this.stackAnimId);
      },
      { threshold: 0.05 },
    );
    this.stackObserver.observe(section);
  }

  private onResize = (): void => {
    if (this.smokeCanvasRef) this.resizeSmokeCanvas(this.smokeCanvasRef.nativeElement);
    if (!this.stackCanvasRef) return;
    const canvas = this.stackCanvasRef.nativeElement;
    const section = canvas.parentElement!;
    this.SW = canvas.width = section.offsetWidth;
    this.SH = canvas.height = section.offsetHeight;
    this.buildCubes();
  };

  private buildCubes(): void {
    const count = Math.min(28, Math.floor((this.SW * this.SH) / 20000));
    this.stackCubes = Array.from({ length: count }, () => this.makeCube());
  }

  private rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private makeCube(): StackCube {
    return {
      x: this.rand(0, this.SW),
      y: this.rand(0, this.SH),
      z: this.rand(0.3, 1),
      vx: this.rand(-0.28, 0.28),
      vy: this.rand(-0.22, 0.22),
      vz: this.rand(-0.001, 0.001),
      rx: this.rand(0, Math.PI * 2),
      ry: this.rand(0, Math.PI * 2),
      rz: this.rand(0, Math.PI * 2),
      vrx: this.rand(-0.007, 0.007),
      vry: this.rand(-0.009, 0.009),
      vrz: this.rand(-0.005, 0.005),
      size: this.rand(14, 55),
      opacity: this.rand(0.05, 0.18),
      pulse: this.rand(0, Math.PI * 2),
      pulseSpeed: this.rand(0.01, 0.025),
    };
  }

  private loopStack(ctx: CanvasRenderingContext2D): void {
    const frame = () => {
      if (!this.stackAnimating) return;
      this.drawCubes(ctx);
      this.stackAnimId = requestAnimationFrame(frame);
    };
    frame();
  }

  // Project cube edges onto 2D canvas
  private drawCubes(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.SW, this.SH);

    for (const c of this.stackCubes) {
      // Update
      c.x += c.vx;
      c.y += c.vy;
      c.rx += c.vrx;
      c.ry += c.vry;
      c.rz += c.vrz;
      c.pulse += c.pulseSpeed;

      if (c.x < -c.size * 2) c.x = this.SW + c.size * 2;
      if (c.x > this.SW + c.size * 2) c.x = -c.size * 2;
      if (c.y < -c.size * 2) c.y = this.SH + c.size * 2;
      if (c.y > this.SH + c.size * 2) c.y = -c.size * 2;

      const pulse = Math.sin(c.pulse) * 0.5 + 0.5;
      const alpha = c.opacity * (0.5 + pulse * 0.5);
      const s = c.size;

      // 8 vertices of a cube centered at origin
      const v: [number, number, number][] = [
        [-s, -s, -s],
        [s, -s, -s],
        [s, s, -s],
        [-s, s, -s],
        [-s, -s, s],
        [s, -s, s],
        [s, s, s],
        [-s, s, s],
      ];

      // Rotate each vertex around rx, ry, rz
      const pts2d = v.map(([x, y, z]) => this.rotateProject(x, y, z, c.rx, c.ry, c.rz, c.x, c.y));

      // 12 edges of a cube
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0], // back face
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4], // front face
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7], // connectors
      ];

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgba(12,12,22,1)`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();

      for (const [a, b] of edges) {
        ctx.moveTo(pts2d[a][0], pts2d[a][1]);
        ctx.lineTo(pts2d[b][0], pts2d[b][1]);
      }
      ctx.stroke();

      // Face fill (very subtle)
      if (s > 30) {
        ctx.globalAlpha = alpha * 0.04;
        ctx.fillStyle = 'rgba(12,12,22,1)';
        // Fill front face
        ctx.beginPath();
        ctx.moveTo(pts2d[4][0], pts2d[4][1]);
        ctx.lineTo(pts2d[5][0], pts2d[5][1]);
        ctx.lineTo(pts2d[6][0], pts2d[6][1]);
        ctx.lineTo(pts2d[7][0], pts2d[7][1]);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Rotate 3D point and simple perspective project to 2D
  private rotateProject(
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz: number,
    cx: number,
    cy: number,
  ): [number, number] {
    // Rotate X
    let y1 = y * Math.cos(rx) - z * Math.sin(rx);
    let z1 = y * Math.sin(rx) + z * Math.cos(rx);
    // Rotate Y
    let x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
    let z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
    // Rotate Z
    let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
    let y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
    // Perspective
    const fov = 350;
    const d = fov / (fov + z2 + 200);
    return [cx + x3 * d, cy + y3 * d];
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  openTimeline(): void {
    this.router.navigate(['/line-time']);
  }
  openCertificates(): void {
    this.certModalOpen.set(true);
  }
  closeCertificates(): void {
    this.certModalOpen.set(false);
  }
  openPdfViewer(): void {
    this.pdfViewerOpen.set(true);
  }
  closePdfViewer(): void {
    this.pdfViewerOpen.set(false);
  }

  scrollTo(target: string): void {
    const el = document.getElementById(target);
    if (el)
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth',
      });
  }

  openWhatsapp(): void {
    window.open('https://wa.me/51997025331', '_blank');
  }
  openEmail(): void {
    window.open('mailto:tu@email.com');
  }
}
