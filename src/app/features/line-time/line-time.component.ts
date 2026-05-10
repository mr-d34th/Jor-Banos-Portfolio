import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface MemoryI18n {
  roleKey: string;
  originKey: string;
  yearKey: string;
  dnaKeys: string[];
  skills: string[];
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

  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  flashActive = signal(false);
  muted = signal(true);
  activeIndex = signal<number | null>(null);
  hudTime = signal('00:00:00');

  private animId!: number;
  private clockId!: ReturnType<typeof setInterval>;
  private W = 0;
  private H = 0;
  private particles: Particle[] = [];
  private boxes: FloatingBox[] = [];

  private audioCtx!: AudioContext;
  private gainNode!: GainNode;
  private audioReady = false;

  memories: MemoryI18n[] = [
    {
      roleKey: 'timeline.mem_0_role',
      originKey: 'timeline.mem_0_origin',
      yearKey: 'timeline.mem_0_year',
      dnaKeys: [
        'timeline.mem_0_dna_0',
        'timeline.mem_0_dna_1',
        'timeline.mem_0_dna_2',
        'timeline.mem_0_dna_3',
      ],
      skills: ['Angular', 'Java (Spring Boot)', 'GitLab', 'Fortinet VPN', 'Oracle', 'Figma'],
    },
    {
      roleKey: 'timeline.mem_1_role',
      originKey: 'timeline.mem_1_origin',
      yearKey: 'timeline.mem_1_year',
      dnaKeys: [
        'timeline.mem_1_dna_0',
        'timeline.mem_1_dna_1',
        'timeline.mem_1_dna_2',
        'timeline.mem_1_dna_3',
      ],
      skills: ['React', 'React Hook Form', 'React Router', 'Axios', 'Git', 'Bitbucket', 'Jira'],
    },
    {
      roleKey: 'timeline.mem_2_role',
      originKey: 'timeline.mem_2_origin',
      yearKey: 'timeline.mem_2_year',
      dnaKeys: [
        'timeline.mem_2_dna_0',
        'timeline.mem_2_dna_1',
        'timeline.mem_2_dna_2',
        'timeline.mem_2_dna_3',
      ],
      skills: ['WordPress', 'Magento', 'Elementor', 'HTML', 'CSS'],
    },
    {
      roleKey: 'timeline.mem_3_role',
      originKey: 'timeline.mem_3_origin',
      yearKey: 'timeline.mem_3_year',
      dnaKeys: [
        'timeline.mem_3_dna_0',
        'timeline.mem_3_dna_1',
        'timeline.mem_3_dna_2',
        'timeline.mem_3_dna_3',
      ],
      skills: ['HTML', 'CSS', 'JavaScript', 'Angular', 'React', 'APIs REST'],
    },
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.startClock();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initCanvas();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    cancelAnimationFrame(this.animId);
    clearInterval(this.clockId);
    window.removeEventListener('resize', this.onResize);
    this.audioCtx?.close();
  }

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

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.W = canvas.width = window.innerWidth;
    this.H = canvas.height = window.innerHeight;
    this.buildParticles();
    this.buildBoxes();
    this.loop(canvas.getContext('2d')!);
  }

  private onResize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    this.W = canvas.width = window.innerWidth;
    this.H = canvas.height = window.innerHeight;
    this.buildParticles();
    this.buildBoxes();
  };

  private buildParticles(): void {
    const count = Math.min(140, Math.floor((this.W * this.H) / 7000));
    this.particles = Array.from({ length: count }, () => this.makeParticle());
  }

  // ─── FLOATING BOXES (nuevo: más recuadros con movimiento) ─────────────────
  private buildBoxes(): void {
    const count = Math.min(60, Math.floor((this.W * this.H) / 9000));
    this.boxes = Array.from({ length: count }, () => this.makeBox());
  }

  private makeBox(): FloatingBox {
    // 3 size tiers: small / medium / large for visual depth
    const tier = Math.random();
    const size =
      tier < 0.5
        ? this.rand(10, 35) // small — many, fast
        : tier < 0.85
          ? this.rand(35, 80) // medium — standard
          : this.rand(80, 140); // large — few, slow, dramatic
    const speedScale = size < 35 ? 1.6 : size < 80 ? 1.0 : 0.4;
    return {
      x: this.rand(-size, this.W + size),
      y: this.rand(-size, this.H + size),
      w: size,
      h: size * this.rand(0.4, 1.8),
      vx: this.rand(-0.5, 0.5) * speedScale,
      vy: this.rand(-0.4, 0.4) * speedScale,
      opacity:
        size < 35
          ? this.rand(0.06, 0.2) // small: more visible
          : size < 80
            ? this.rand(0.04, 0.14)
            : this.rand(0.02, 0.08), // large: subtle
      rot: this.rand(0, Math.PI * 2),
      vrot: this.rand(-0.004, 0.004) * speedScale,
      pulse: this.rand(0, Math.PI * 2),
      pulseSpeed: this.rand(0.012, 0.035),
      filled: Math.random() > 0.55,
    };
  }

  private rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private makeParticle(): Particle {
    return {
      x: this.rand(-this.W * 0.5, this.W * 1.5),
      y: this.rand(-this.H * 0.5, this.H * 1.5),
      z: this.rand(0.15, 1),
      vz: this.rand(0.0006, 0.003),
      type: Math.random() > 0.5 ? 'tri' : 'sq',
      rot: this.rand(0, Math.PI * 2),
      vrot: this.rand(-0.006, 0.006),
      size: this.rand(4, 28),
      opacity: this.rand(0.05, 0.22),
    };
  }

  private loop(ctx: CanvasRenderingContext2D): void {
    const frame = () => {
      this.drawFrame(ctx);
      this.animId = requestAnimationFrame(frame);
    };
    frame();
  }

  private drawFrame(ctx: CanvasRenderingContext2D): void {
    // Motion blur trail: semi-transparent fill instead of full clearRect.
    // This leaves a fading ghost of previous frames → smoother fluid feel.
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#07070b'; // matches line-time background
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.globalAlpha = 1;

    // Radial vignette (darker edges)
    const g = ctx.createRadialGradient(
      this.W / 2,
      this.H / 2,
      0,
      this.W / 2,
      this.H / 2,
      Math.max(this.W, this.H) * 0.65,
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    g.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);

    // Draw floating boxes (background layer)
    for (const b of this.boxes) {
      this.updateBox(b);
      this.drawBox(ctx, b);
    }

    // Draw depth particles (zoom-in effect)
    for (const p of this.particles) {
      p.z -= p.vz;
      p.rot += p.vrot;
      if (p.z <= 0.04) {
        Object.assign(p, this.makeParticle());
        p.z = this.rand(0.8, 1.0); // respawn far
      }
      this.drawParticle(ctx, p);
    }
  }

  private updateBox(b: FloatingBox): void {
    b.x += b.vx;
    b.y += b.vy;
    b.rot += b.vrot;
    b.pulse += b.pulseSpeed;

    // Bounce off edges softly
    if (b.x < -b.w) b.x = this.W + b.w;
    if (b.x > this.W + b.w) b.x = -b.w;
    if (b.y < -b.h) b.y = this.H + b.h;
    if (b.y > this.H + b.h) b.y = -b.h;
  }

  private drawBox(ctx: CanvasRenderingContext2D, b: FloatingBox): void {
    // Smooth sin pulse — softer easing
    const pulse = (Math.sin(b.pulse) + 1) / 2; // 0..1
    const pulse2 = (Math.sin(b.pulse * 0.7 + 1) + 1) / 2; // offset for variety
    const alpha = b.opacity * (0.35 + pulse * 0.65);

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    ctx.globalAlpha = alpha;

    const isLarge = b.w >= 80;
    const isMedium = b.w >= 35 && b.w < 80;

    // Glow on large boxes (shadowBlur is expensive — only for large)
    if (isLarge) {
      ctx.shadowColor = 'rgba(201,168,76,0.45)';
      ctx.shadowBlur = 8 + pulse * 12;
    }

    ctx.strokeStyle = `rgba(201,168,76,1)`;
    ctx.lineWidth = isLarge ? 1.0 : isMedium ? 0.7 : 0.5;

    if (b.filled) {
      ctx.fillStyle = `rgba(201,168,76,${alpha * 0.1})`;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    }
    ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);

    // Reset shadow before inner details
    if (isLarge) ctx.shadowBlur = 0;

    // Inner cross for medium+
    if (isMedium || isLarge) {
      ctx.globalAlpha = alpha * (0.15 + pulse2 * 0.2);
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(-b.w / 2, 0);
      ctx.lineTo(b.w / 2, 0);
      ctx.moveTo(0, -b.h / 2);
      ctx.lineTo(0, b.h / 2);
      ctx.stroke();
    }

    // Corner dots for large boxes
    if (isLarge) {
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = 'rgba(201,168,76,1)';
      const corners: [number, number][] = [
        [-b.w / 2, -b.h / 2],
        [b.w / 2, -b.h / 2],
        [-b.w / 2, b.h / 2],
        [b.w / 2, b.h / 2],
      ];
      for (const [cx, cy] of corners) {
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    const px = this.W / 2 + (p.x - this.W / 2) / p.z;
    const py = this.H / 2 + (p.y - this.H / 2) / p.z;
    const s = p.size / p.z;
    if (s < 1 || s > 200) return;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.opacity * Math.min(1, (1 - p.z) * 3);
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 0.6;
    if (p.type === 'tri') {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.866, s * 0.5);
      ctx.lineTo(-s * 0.866, s * 0.5);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(-s / 2, -s / 2, s, s);
    }
    ctx.restore();
  }

  toggleAudio(): void {
    if (!this.audioReady) {
      this.createHum();
      this.audioReady = true;
    }
    this.muted.update((m) => !m);
    const target = this.muted() ? 0 : 1;
    this.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(target, this.audioCtx.currentTime + 0.5);
  }

  private createHum(): void {
    this.audioCtx = new AudioContext();
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.gainNode.connect(this.audioCtx.destination);

    (
      [
        [55, 0.04],
        [110, 0.03],
        [220, 0.015],
        [440, 0.008],
      ] as [number, number][]
    ).forEach(([freq, amp]) => {
      const osc = this.audioCtx.createOscillator();
      osc.type = freq < 100 ? 'sawtooth' : 'sine';
      osc.frequency.value = freq;
      const g = this.audioCtx.createGain();
      g.gain.value = amp;
      osc.connect(g);
      g.connect(this.gainNode);
      osc.start();
    });

    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoG = this.audioCtx.createGain();
    lfoG.gain.value = 0.008;
    lfo.connect(lfoG);
    lfoG.connect(this.gainNode.gain);
    lfo.start();
  }

  private triggerFlash(): void {
    this.flashActive.set(true);
    setTimeout(() => this.flashActive.set(false), 200);
  }

  toggleMemory(index: number): void {
    if (this.activeIndex() === index) {
      this.activeIndex.set(null);
    } else {
      this.triggerFlash();
      this.activeIndex.set(index);
    }
  }

  closeActive(): void {
    this.activeIndex.set(null);
  }
  goBack(): void {
    this.router.navigate(['/']);
  }
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vz: number;
  type: 'tri' | 'sq';
  rot: number;
  vrot: number;
  size: number;
  opacity: number;
}

interface FloatingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  opacity: number;
  rot: number;
  vrot: number;
  pulse: number;
  pulseSpeed: number;
  filled: boolean;
}
