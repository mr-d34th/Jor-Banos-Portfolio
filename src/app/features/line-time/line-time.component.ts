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

// ─────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────
interface MemoryI18n {
  roleKey: string;
  originKey: string;
  yearKey: string;
  dnaKeys: string[];
  skills: string[];
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

interface EnergyOrb {
  x: number;
  y: number;

  r: number;

  vx: number;
  vy: number;

  alpha: number;

  pulse: number;
  pulseSpeed: number;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-line-time',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './line-time.component.html',
  styleUrl: './line-time.component.scss',
})
export class LineTimeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas')
  canvasRef!: ElementRef<HTMLCanvasElement>;

  // ───────────────────────────────────────────────────────────
  // INJECTS
  // ───────────────────────────────────────────────────────────
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  // ───────────────────────────────────────────────────────────
  // SIGNALS
  // ───────────────────────────────────────────────────────────
  flashActive = signal(false);

  muted = signal(true);

  activeIndex = signal<number | null>(null);

  hudTime = signal('00:00:00');

  // ───────────────────────────────────────────────────────────
  // CANVAS
  // ───────────────────────────────────────────────────────────
  private animId!: number;

  private clockId!: ReturnType<typeof setInterval>;

  private W = 0;
  private H = 0;

  private particles: Particle[] = [];

  private boxes: FloatingBox[] = [];

  private orbs: EnergyOrb[] = [];

  // ───────────────────────────────────────────────────────────
  // MOUSE
  // ───────────────────────────────────────────────────────────
  private mouseX = 0;
  private mouseY = 0;

  // ───────────────────────────────────────────────────────────
  // AUDIO
  // ───────────────────────────────────────────────────────────
  private audioCtx!: AudioContext;

  private gainNode!: GainNode;

  private audioReady = false;

  // ───────────────────────────────────────────────────────────
  // MEMORIES
  // ───────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────
  // LIFECYCLE
  // ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.startClock();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initCanvas();

    window.addEventListener('resize', this.onResize);

    window.addEventListener('mousemove', this.onMouseMove);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    cancelAnimationFrame(this.animId);

    clearInterval(this.clockId);

    window.removeEventListener('resize', this.onResize);

    window.removeEventListener('mousemove', this.onMouseMove);

    this.audioCtx?.close();
  }

  // ───────────────────────────────────────────────────────────
  // CLOCK
  // ───────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────
  // CANVAS INIT
  // ───────────────────────────────────────────────────────────
  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;

    this.W = canvas.width = window.innerWidth;
    this.H = canvas.height = window.innerHeight;

    this.buildParticles();

    this.buildBoxes();

    this.buildOrbs();

    this.loop(canvas.getContext('2d')!);
  }

  // ───────────────────────────────────────────────────────────
  // RESIZE
  // ───────────────────────────────────────────────────────────
  private onResize = (): void => {
    const canvas = this.canvasRef.nativeElement;

    this.W = canvas.width = window.innerWidth;
    this.H = canvas.height = window.innerHeight;

    this.buildParticles();

    this.buildBoxes();

    this.buildOrbs();
  };

  // ───────────────────────────────────────────────────────────
  // MOUSE
  // ───────────────────────────────────────────────────────────
  private onMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  };

  // ───────────────────────────────────────────────────────────
  // BUILD PARTICLES
  // ───────────────────────────────────────────────────────────
  private buildParticles(): void {
    const count = Math.min(80, Math.floor((this.W * this.H) / 14000));

    this.particles = Array.from({ length: count }, () => this.makeParticle());
  }

  // ───────────────────────────────────────────────────────────
  // BUILD BOXES
  // ───────────────────────────────────────────────────────────
  private buildBoxes(): void {
    const count = Math.min(28, Math.floor((this.W * this.H) / 22000));

    this.boxes = Array.from({ length: count }, () => this.makeBox());
  }

  // ───────────────────────────────────────────────────────────
  // BUILD ORBS
  // ───────────────────────────────────────────────────────────
  private buildOrbs(): void {
    const count = Math.min(18, Math.floor((this.W * this.H) / 90000));

    this.orbs = Array.from({ length: count }, () => ({
      x: this.rand(0, this.W),

      y: this.rand(0, this.H),

      r: this.rand(80, 240),

      vx: this.rand(-0.08, 0.08),

      vy: this.rand(-0.08, 0.08),

      alpha: this.rand(0.03, 0.08),

      pulse: this.rand(0, Math.PI * 2),

      pulseSpeed: this.rand(0.004, 0.012),
    }));
  }

  // ───────────────────────────────────────────────────────────
  // RANDOM
  // ───────────────────────────────────────────────────────────
  private rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  // ───────────────────────────────────────────────────────────
  // PARTICLE FACTORY
  // ───────────────────────────────────────────────────────────
  private makeParticle(): Particle {
    return {
      x: this.rand(-this.W, this.W * 2),

      y: this.rand(-this.H, this.H * 2),

      z: this.rand(0.1, 1),

      vz: this.rand(0.0008, 0.0025),

      type: Math.random() > 0.5 ? 'tri' : 'sq',

      rot: this.rand(0, Math.PI * 2),

      vrot: this.rand(-0.004, 0.004),

      size: this.rand(6, 22),

      opacity: this.rand(0.04, 0.18),
    };
  }

  // ───────────────────────────────────────────────────────────
  // BOX FACTORY
  // ───────────────────────────────────────────────────────────
  private makeBox(): FloatingBox {
    const size = this.rand(20, 90);

    return {
      x: this.rand(0, this.W),

      y: this.rand(0, this.H),

      w: size,

      h: size * this.rand(0.5, 1.5),

      vx: this.rand(-0.22, 0.22),

      vy: this.rand(-0.18, 0.18),

      opacity: this.rand(0.03, 0.12),

      rot: this.rand(0, Math.PI * 2),

      vrot: this.rand(-0.002, 0.002),

      pulse: this.rand(0, Math.PI * 2),

      pulseSpeed: this.rand(0.008, 0.025),

      filled: Math.random() > 0.7,
    };
  }

  // ───────────────────────────────────────────────────────────
  // LOOP
  // ───────────────────────────────────────────────────────────
  private loop(ctx: CanvasRenderingContext2D): void {
    const frame = () => {
      this.drawFrame(ctx);

      this.animId = requestAnimationFrame(frame);
    };

    frame();
  }

  // ───────────────────────────────────────────────────────────
  // DRAW FRAME
  // ───────────────────────────────────────────────────────────
  private drawFrame(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.W, this.H);

    // vignette
    const g = ctx.createRadialGradient(
      this.W / 2,
      this.H / 2,
      0,
      this.W / 2,
      this.H / 2,
      Math.max(this.W, this.H) * 0.7,
    );

    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');

    ctx.fillStyle = g;

    ctx.fillRect(0, 0, this.W, this.H);

    // ORBS
    for (const orb of this.orbs) {
      this.updateOrb(orb);

      this.drawOrb(ctx, orb);
    }

    // BOXES
    for (const b of this.boxes) {
      this.updateBox(b);

      this.drawBox(ctx, b);
    }

    // PARTICLES
    for (const p of this.particles) {
      p.z -= p.vz;

      p.rot += p.vrot;

      if (p.z <= 0.05) {
        Object.assign(p, this.makeParticle());

        p.z = 1;
      }

      this.drawParticle(ctx, p);
    }

    // MICRO PARTICLES
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * this.W;

      const y = Math.random() * this.H;

      ctx.fillStyle = 'rgba(255,255,255,0.015)';

      ctx.fillRect(x, y, 1, 1);
    }
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE BOX
  // ───────────────────────────────────────────────────────────
  private updateBox(b: FloatingBox): void {
    b.x += b.vx;

    b.y += b.vy;

    b.rot += b.vrot;

    b.pulse += b.pulseSpeed;

    if (b.x < -b.w) b.x = this.W + b.w;

    if (b.x > this.W + b.w) b.x = -b.w;

    if (b.y < -b.h) b.y = this.H + b.h;

    if (b.y > this.H + b.h) b.y = -b.h;
  }

  // ───────────────────────────────────────────────────────────
  // DRAW BOX
  // ───────────────────────────────────────────────────────────
  private drawBox(ctx: CanvasRenderingContext2D, b: FloatingBox): void {
    const pulse = Math.sin(b.pulse) * 0.5 + 0.5;

    const alpha = b.opacity * (0.5 + pulse * 0.5);

    ctx.save();

    ctx.translate(b.x, b.y);

    ctx.rotate(b.rot);

    ctx.globalAlpha = alpha;

    ctx.strokeStyle = `rgba(201,168,76,${alpha})`;

    ctx.lineWidth = 0.6;

    if (b.filled) {
      ctx.fillStyle = `rgba(201,168,76,${alpha * 0.08})`;

      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    }

    ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);

    if (b.w > 50) {
      ctx.globalAlpha = alpha * 0.3;

      ctx.beginPath();

      ctx.moveTo(-b.w / 2, 0);

      ctx.lineTo(b.w / 2, 0);

      ctx.moveTo(0, -b.h / 2);

      ctx.lineTo(0, b.h / 2);

      ctx.stroke();
    }

    ctx.restore();
  }

  // ───────────────────────────────────────────────────────────
  // UPDATE ORB
  // ───────────────────────────────────────────────────────────
  private updateOrb(o: EnergyOrb): void {
    o.x += o.vx;

    o.y += o.vy;

    o.pulse += o.pulseSpeed;

    if (o.x < -o.r) o.x = this.W + o.r;

    if (o.x > this.W + o.r) o.x = -o.r;

    if (o.y < -o.r) o.y = this.H + o.r;

    if (o.y > this.H + o.r) o.y = -o.r;
  }

  // ───────────────────────────────────────────────────────────
  // DRAW ORB
  // ───────────────────────────────────────────────────────────
  private drawOrb(ctx: CanvasRenderingContext2D, o: EnergyOrb): void {
    const pulse = Math.sin(o.pulse) * 0.5 + 0.5;

    const dx = this.mouseX - o.x;

    const dy = this.mouseY - o.y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    const influence = Math.max(0, 1 - dist / 300);

    const r = o.r + influence * 60;

    const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);

    g.addColorStop(0, `rgba(201,168,76,${o.alpha * (1 + pulse)})`);

    g.addColorStop(1, 'rgba(201,168,76,0)');

    ctx.fillStyle = g;

    ctx.beginPath();

    ctx.arc(o.x, o.y, r, 0, Math.PI * 2);

    ctx.fill();
  }

  // ───────────────────────────────────────────────────────────
  // DRAW PARTICLE
  // ───────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────
  // AUDIO
  // ───────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────
  // FLASH
  // ───────────────────────────────────────────────────────────
  private triggerFlash(): void {
    this.flashActive.set(true);

    setTimeout(() => {
      this.flashActive.set(false);
    }, 200);
  }

  // ───────────────────────────────────────────────────────────
  // TIMELINE ACTIONS
  // ───────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────
  // ROUTING
  // ───────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/']);
  }
}
