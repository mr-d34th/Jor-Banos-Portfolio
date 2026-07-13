import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  inject,
  signal,
  computed,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

// ─── Canvas particle types ────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  type: 'node' | 'spark' | 'hex';
  pulse: number;
  pulseSpeed: number;
  colorIdx: number;
}

@Component({
  selector: 'app-line-time',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './line-time.component.html',
  styleUrl: './line-time.component.scss',
})
export class LineTimeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scrollContainer') scrollRef!: ElementRef<HTMLElement>;
  @ViewChild('gridEl') gridRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('nodeEl') nodeEls!: QueryList<ElementRef>;

  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private zone = inject(NgZone);
  readonly i18n = inject(TranslationService);

  // ── UI signals ───────────────────────────────────────────────────────────────
  flashActive = signal(false);
  muted = signal(true);
  activeNode = signal<number | null>(null);
  hudTime = signal('00:00:00');
  scrollPct = signal(0);
  heroRevealed = signal(false);
  eduRevealed = signal(false);
  visibleNodes = signal<boolean[]>([]);

  // ── Eyebrow / title char arrays — reactive to language ───────────────────────
  eyebrowChars = computed(() => {
    this.i18n.currentLang(); // reactive dep
    return this.i18n.t('timeline.hero_eyebrow').split('');
  });
  titleChars = computed(() => {
    this.i18n.currentLang();
    return this.i18n.t('timeline.hero_title').split('');
  });
  subtitleChars = computed(() => {
    this.i18n.currentLang();
    return this.i18n.t('timeline.hero_subtitle').split('');
  });

  // ── Data computed from translations ──────────────────────────────────────────
  memories = computed(() => {
    this.i18n.currentLang(); // reactive dep
    const t = (k: string) => this.i18n.t(k);
    return [
      {
        id: 0,
        type: t('timeline.mem_0_type'),
        company: t('timeline.mem_0_company'),
        role: t('timeline.mem_0_role'),
        period: t('timeline.mem_0_period'),
        location: t('timeline.mem_0_location'),
        contract: t('timeline.mem_0_contract'),
        context: t('timeline.mem_0_context'),
        achievements: [
          { metric: t('timeline.mem_0_ach_0_metric'), text: t('timeline.mem_0_ach_0_text') },
          { metric: t('timeline.mem_0_ach_1_metric'), text: t('timeline.mem_0_ach_1_text') },
          { metric: t('timeline.mem_0_ach_2_metric'), text: t('timeline.mem_0_ach_2_text') },
          { metric: t('timeline.mem_0_ach_3_metric'), text: t('timeline.mem_0_ach_3_text') },
        ],
        responsibilities: [
          t('timeline.mem_0_resp_0'),
          t('timeline.mem_0_resp_1'),
          t('timeline.mem_0_resp_2'),
          t('timeline.mem_0_resp_3'),
          t('timeline.mem_0_resp_4'),
          t('timeline.mem_0_resp_5'),
        ],
        skills: [
          'Angular',
          'Java',
          'Spring Boot',
          'GitLab',
          'Fortinet VPN',
          'Oracle',
          'SQL Server',
          'Figma',
          'WordPress',
          'DevOps',
          'REST APIs',
        ],
        primarySkills: ['Angular', 'Java', 'Spring Boot', 'GitLab', 'Oracle'],
      },
      {
        id: 1,
        type: t('timeline.mem_1_type'),
        company: t('timeline.mem_1_company'),
        role: t('timeline.mem_1_role'),
        period: t('timeline.mem_1_period'),
        location: t('timeline.mem_1_location'),
        contract: t('timeline.mem_1_contract'),
        context: t('timeline.mem_1_context'),
        achievements: [
          { metric: t('timeline.mem_1_ach_0_metric'), text: t('timeline.mem_1_ach_0_text') },
          { metric: t('timeline.mem_1_ach_1_metric'), text: t('timeline.mem_1_ach_1_text') },
          { metric: t('timeline.mem_1_ach_2_metric'), text: t('timeline.mem_1_ach_2_text') },
        ],
        responsibilities: [
          t('timeline.mem_1_resp_0'),
          t('timeline.mem_1_resp_1'),
          t('timeline.mem_1_resp_2'),
          t('timeline.mem_1_resp_3'),
          t('timeline.mem_1_resp_4'),
          t('timeline.mem_1_resp_5'),
        ],
        skills: [
          'React',
          'React Hook Form',
          'React Router',
          'Axios',
          'JavaScript',
          'TypeScript',
          'Git',
          'Bitbucket',
          'Jira',
          'SCRUM',
        ],
        primarySkills: ['React', 'React Hook Form', 'TypeScript', 'Bitbucket'],
      },
      {
        id: 2,
        type: t('timeline.mem_2_type'),
        company: t('timeline.mem_2_company'),
        role: t('timeline.mem_2_role'),
        period: t('timeline.mem_2_period'),
        location: t('timeline.mem_2_location'),
        contract: t('timeline.mem_2_contract'),
        context: t('timeline.mem_2_context'),
        achievements: [
          { metric: t('timeline.mem_2_ach_0_metric'), text: t('timeline.mem_2_ach_0_text') },
          { metric: t('timeline.mem_2_ach_1_metric'), text: t('timeline.mem_2_ach_1_text') },
        ],
        responsibilities: [
          t('timeline.mem_2_resp_0'),
          t('timeline.mem_2_resp_1'),
          t('timeline.mem_2_resp_2'),
          t('timeline.mem_2_resp_3'),
        ],
        skills: ['WordPress', 'Magento', 'Elementor', 'HTML', 'CSS', 'JavaScript', 'QA'],
        primarySkills: ['WordPress', 'Magento', 'Elementor'],
      },
    ];
  });

  education = computed(() => {
    this.i18n.currentLang();
    const t = (k: string) => this.i18n.t(k);
    return [
      {
        year: t('timeline.edu_0_year'),
        institution: t('timeline.edu_0_institution'),
        degree: t('timeline.edu_0_degree'),
        certs: [] as string[],
      },
      {
        year: t('timeline.edu_1_year'),
        institution: t('timeline.edu_1_institution'),
        degree: t('timeline.edu_1_degree'),
        certs: [],
      },
      {
        year: t('timeline.edu_2_year'),
        institution: t('timeline.edu_2_institution'),
        degree: t('timeline.edu_2_degree'),
        certs: t('timeline.edu_2_certs')
          .split(',')
          .map((s) => s.trim()),
      },
      {
        year: t('timeline.edu_3_year'),
        institution: t('timeline.edu_3_institution'),
        degree: t('timeline.edu_3_degree'),
        certs: [],
      },
    ];
  });

  // ── Canvas state ─────────────────────────────────────────────────────────────
  private animId = 0;
  private clockId!: ReturnType<typeof setInterval>;
  private W = 0;
  private H = 0;
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;
  private particles: Particle[] = [];
  private time = 0;

  // ── Audio ─────────────────────────────────────────────────────────────────────
  private audioCtx!: AudioContext;
  private gainNode!: GainNode;
  private audioReady = false;

  // ── Cyberpunk color palette ────────────────────────────────────────────────────
  private readonly COLORS = [
    { r: 139, g: 92, b: 246 },
    { r: 6, g: 182, b: 212 },
    { r: 168, g: 85, b: 247 },
    { r: 34, g: 211, b: 238 },
    { r: 99, g: 102, b: 241 },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.visibleNodes.set(new Array(3).fill(false));
    this.startClock();
    setTimeout(() => this.heroRevealed.set(true), 200);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => {
      this.initCanvas();
      window.addEventListener('resize', this.onResize);
      window.addEventListener('mousemove', this.onMouseMove);
    });
    this.setupNodeObservers();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    cancelAnimationFrame(this.animId);
    clearInterval(this.clockId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.audioCtx?.close();
  }

  // ── Clock ──────────────────────────────────────────────────────────────────────
  private startClock(): void {
    const tick = () => {
      const n = new Date();
      this.hudTime.set(
        [n.getHours(), n.getMinutes(), n.getSeconds()]
          .map((v) => String(v).padStart(2, '0'))
          .join(':'),
      );
    };
    tick();
    this.clockId = setInterval(tick, 1000);
  }

  // ── Canvas ────────────────────────────────────────────────────────────────────
  private initCanvas(): void {
    const c = this.canvasRef.nativeElement;
    this.W = c.width = window.innerWidth;
    this.H = c.height = window.innerHeight;
    this.buildParticles();
    this.loop(c.getContext('2d')!);
  }

  private onResize = (): void => {
    const c = this.canvasRef.nativeElement;
    this.W = c.width = window.innerWidth;
    this.H = c.height = window.innerHeight;
    this.buildParticles();
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.targetMouseX = e.clientX;
    this.targetMouseY = e.clientY;
    if (this.gridRef?.nativeElement) {
      const dx = (e.clientX / this.W - 0.5) * 22;
      const dy = (e.clientY / this.H - 0.5) * 12;
      this.gridRef.nativeElement.style.transform = `perspective(900px) rotateX(${72 + dy}deg) rotateY(${dx}deg) scale(2.2)`;
    }
  };

  private rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  private buildParticles(): void {
    const count = Math.min(90, Math.floor((this.W * this.H) / 9000));
    this.particles = Array.from({ length: count }, (_, i) => ({
      x: this.rand(0, this.W),
      y: this.rand(0, this.H),
      vx: this.rand(-0.25, 0.25),
      vy: this.rand(-0.18, 0.18),
      radius: this.rand(1.5, 4.5),
      opacity: this.rand(0.15, 0.55),
      type: (i % 5 === 0 ? 'hex' : i % 3 === 0 ? 'spark' : 'node') as Particle['type'],
      pulse: this.rand(0, Math.PI * 2),
      pulseSpeed: this.rand(0.012, 0.035),
      colorIdx: Math.floor(this.rand(0, this.COLORS.length)),
    }));
  }

  private loop(ctx: CanvasRenderingContext2D): void {
    const frame = () => {
      this.drawFrame(ctx);
      this.animId = requestAnimationFrame(frame);
    };
    frame();
  }

  private drawFrame(ctx: CanvasRenderingContext2D): void {
    this.time += 0.016;
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.06;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.06;

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.globalAlpha = 1;

    // Centre glow follows mouse
    const gr = ctx.createRadialGradient(
      this.mouseX || this.W / 2,
      this.mouseY || this.H / 2,
      0,
      this.mouseX || this.W / 2,
      this.mouseY || this.H / 2,
      Math.max(this.W, this.H) * 0.55,
    );
    gr.addColorStop(0, 'rgba(139,92,246,0.04)');
    gr.addColorStop(0.4, 'rgba(6,182,212,0.02)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, this.W, this.H);

    this.drawConnections(ctx);
    this.updateAndDrawParticles(ctx);

    // Mouse glow burst
    if (this.mouseX || this.mouseY) {
      const mg = ctx.createRadialGradient(
        this.mouseX,
        this.mouseY,
        0,
        this.mouseX,
        this.mouseY,
        80,
      );
      mg.addColorStop(0, `rgba(139,92,246,${0.06 + 0.04 * Math.sin(this.time * 3)})`);
      mg.addColorStop(0.5, 'rgba(6,182,212,0.03)');
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }

  private drawConnections(ctx: CanvasRenderingContext2D): void {
    const maxDist = Math.min(180, this.W * 0.15);
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const pa = this.particles[i];
        const pb = this.particles[j];
        const dx = pa.x - pb.x;
        const dy = pa.y - pb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= maxDist) continue;
        const proximity = 1 - dist / maxDist;
        const midX = (pa.x + pb.x) / 2;
        const midY = (pa.y + pb.y) / 2;
        const mdx = midX - this.mouseX;
        const mdy = midY - this.mouseY;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        const boost = mDist < 200 ? (1 - mDist / 200) * 0.6 : 0;
        const alpha = (proximity * 0.22 + boost) * (0.5 + 0.5 * Math.sin(this.time * 0.8 + i));
        if (alpha < 0.01) continue;
        const ca = this.COLORS[pa.colorIdx];
        const cb = this.COLORS[pb.colorIdx];
        const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
        grad.addColorStop(0, `rgba(${ca.r},${ca.g},${ca.b},${alpha})`);
        grad.addColorStop(1, `rgba(${cb.r},${cb.g},${cb.b},${alpha})`);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8 + boost;
        ctx.stroke();
      }
    }
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      // Mouse repulsion
      const dx = p.x - this.mouseX;
      const dy = p.y - this.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        const force = ((120 - dist) / 120) * 0.4;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 1.2) {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed;
      if (p.x < -10) p.x = this.W + 10;
      if (p.x > this.W + 10) p.x = -10;
      if (p.y < -10) p.y = this.H + 10;
      if (p.y > this.H + 10) p.y = -10;

      // Draw
      const col = this.COLORS[p.colorIdx];
      const pulse = (Math.sin(p.pulse) + 1) / 2;
      const mDist2 = Math.sqrt(dx * dx + dy * dy);
      const glow = mDist2 < 150 ? 1 - mDist2 / 150 : 0;
      const alpha = p.opacity * (0.4 + pulse * 0.6) + glow * 0.3;
      const r = p.radius * (0.8 + pulse * 0.4);

      ctx.save();
      ctx.translate(p.x, p.y);
      if (glow > 0.1) {
        ctx.shadowColor = `rgba(${col.r},${col.g},${col.b},${glow * 0.8})`;
        ctx.shadowBlur = 12 + glow * 20;
      }
      ctx.globalAlpha = alpha;

      if (p.type === 'hex') {
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k - Math.PI / 6 + this.time * 0.3;
          k === 0
            ? ctx.moveTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5)
            : ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},1)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},1)`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-r * 2, 0);
        ctx.lineTo(r * 2, 0);
        ctx.moveTo(0, -r * 2);
        ctx.lineTo(0, r * 2);
        ctx.stroke();
      } else {
        const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
        g2.addColorStop(0, `rgba(${col.r},${col.g},${col.b},${alpha})`);
        g2.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = g2;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── Scroll ────────────────────────────────────────────────────────────────────
  onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.round((el.scrollTop / max) * 100) : 0;
    this.scrollPct.set(pct);
    if (pct > 80 && !this.eduRevealed()) this.zone.run(() => this.eduRevealed.set(true));
  }

  private setupNodeObservers(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const nodes = this.nodeEls.toArray();
      const visible = [...this.visibleNodes()];
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            const idx = nodes.findIndex((n) => n.nativeElement === entry.target);
            if (idx >= 0 && entry.isIntersecting)
              this.zone.run(() => {
                visible[idx] = true;
                this.visibleNodes.set([...visible]);
              });
          }),
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
      );
      nodes.forEach((n) => io.observe(n.nativeElement));
    }, 300);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  getChars(text: string): string[] {
    return text.split('');
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  toggleNode(index: number): void {
    if (this.activeNode() === index) {
      this.activeNode.set(null);
    } else {
      this.triggerFlash();
      this.activeNode.set(index);
    }
  }

  private triggerFlash(): void {
    this.flashActive.set(true);
    setTimeout(() => this.flashActive.set(false), 180);
  }

  toggleAudio(): void {
    if (!this.audioReady) {
      this.createHum();
      this.audioReady = true;
    }
    this.muted.update((m) => !m);
    this.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      this.muted() ? 0 : 0.6,
      this.audioCtx.currentTime + 0.6,
    );
  }

  private createHum(): void {
    this.audioCtx = new AudioContext();
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.gainNode.connect(this.audioCtx.destination);
    (
      [
        [60, 0.025],
        [120, 0.015],
        [240, 0.008],
      ] as [number, number][]
    ).forEach(([freq, amp]) => {
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = this.audioCtx.createGain();
      g.gain.value = amp;
      osc.connect(g);
      g.connect(this.gainNode);
      osc.start();
    });
    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoG = this.audioCtx.createGain();
    lfoG.gain.value = 0.006;
    lfo.connect(lfoG);
    lfoG.connect(this.gainNode.gain);
    lfo.start();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
