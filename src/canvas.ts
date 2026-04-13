/**
 * canvas.ts — Direction B: Enhanced Starfield
 * Four star types: flyout (3D), static twinkle, sparkle, shooting stars
 */

interface FlyoutStar {
  x: number; y: number; z: number;
  speed: number;
  colorIdx: number;
  trailLen: number;   // randomised tail length in px (scales with depth)
}

interface StaticStar {
  px: number; py: number;
  size: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  colorIdx: number;
}

interface SparkStar {
  px: number; py: number;
  size: number;
  phase: number;
  speed: number;
  colorIdx: number;
}

interface ShootingStar {
  active: boolean;
  x: number; y: number;
  vx: number; vy: number;
  progress: number;   // 0 → 1
  duration: number;   // ms
  startTime: number;
  tailLen: number;
}

export class NeuralCanvas {
  private canvas: HTMLCanvasElement;
  private ctx:    CanvasRenderingContext2D;
  private W = 0; private H = 0;

  private flyouts:  FlyoutStar[]  = [];
  private statics:  StaticStar[]  = [];
  private sparks:   SparkStar[]   = [];
  private shooters: ShootingStar[] = [];

  private mx = 0.5; private my = 0.5;

  private nextShot = 0;   // timestamp when next shooting star may fire
  private lastNow  = 0;

  // Colour palettes (prefix strings for rgba())
  private readonly FLY_COLORS = [
    'rgba(255,255,255,',
    'rgba(255,255,255,',
    'rgba(255,255,255,',
    'rgba(129,140,248,',
    'rgba(20,241,217,',
    'rgba(155,93,229,',
  ];
  private readonly STATIC_COLORS = [
    'rgba(255,255,255,',
    'rgba(255,255,255,',
    'rgba(180,190,255,',
    'rgba(20,241,217,',
  ];

  constructor() {
    this.canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    this.ctx    = this.canvas.getContext('2d')!;
    this.resize();
    this.build();

    window.addEventListener('resize', () => { this.resize(); this.build(); }, { passive: true });
    window.addEventListener('mousemove', e => {
      this.mx = e.clientX / this.W;
      this.my = e.clientY / this.H;
    }, { passive: true });

    this.nextShot = performance.now() + this.randBetween(3000, 7000);
    requestAnimationFrame(t => this.tick(t));
  }

  // ── Build ───────────────────────────────────────────────
  private resize() {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
  }

  private build() {
    // 1. Flyout stars — 3D outward from centre
    this.flyouts = Array.from({ length: 160 }, () => this.newFlyout(true));

    // 2. Static twinkle stars — fixed positions
    this.statics = Array.from({ length: 80 }, () => ({
      px:        Math.random() * this.W,
      py:        Math.random() * this.H,
      size:      Math.random() * 1.4 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.15,
      phase:     Math.random() * Math.PI * 2,
      speed:     Math.random() * 0.0006 + 0.0003,
      colorIdx:  Math.floor(Math.random() * this.STATIC_COLORS.length),
    }));

    // 3. Sparkle stars — larger, 4-point cross glow
    this.sparks = Array.from({ length: 10 }, () => ({
      px:       Math.random() * this.W,
      py:       Math.random() * this.H,
      size:     Math.random() * 2.5 + 1.5,
      phase:    Math.random() * Math.PI * 2,
      speed:    Math.random() * 0.0004 + 0.0002,
      colorIdx: Math.floor(Math.random() * this.STATIC_COLORS.length),
    }));

    // 4. Shooting star pool (max 2 simultaneous)
    this.shooters = Array.from({ length: 2 }, () => ({ active: false } as ShootingStar));
  }

  // ── Star factories ──────────────────────────────────────
  private newFlyout(randomZ = false): FlyoutStar {
    return {
      x:        (Math.random() - 0.5) * 2,
      y:        (Math.random() - 0.5) * 2,
      z:        randomZ ? Math.random() * 0.95 + 0.05 : 1,
      speed:    Math.random() * 0.0025 + 0.0006,
      colorIdx: Math.floor(Math.random() * this.FLY_COLORS.length),
      trailLen: Math.random() * 38 + 14,   // 14–52 px, randomised per star
    };
  }

  private spawnShooter(now: number): ShootingStar {
    // Pick a random start point along the top or left edge
    const fromTop = Math.random() > 0.4;
    const x  = fromTop ? Math.random() * this.W * 0.7 : -10;
    const y  = fromTop ? -10 : Math.random() * this.H * 0.5;
    // Angle: roughly 25–50° downward-right
    const angle  = (Math.random() * 25 + 25) * (Math.PI / 180);
    const spd    = this.W * (Math.random() * 0.12 + 0.18); // px per second — slow drift
    return {
      active:    true,
      x, y,
      vx:        Math.cos(angle) * spd,
      vy:        Math.sin(angle) * spd,
      progress:  0,
      duration:  Math.random() * 1200 + 2800,  // 2.8–4.0 s
      startTime: now,
      tailLen:   Math.random() * 140 + 180,    // 180–320 px
    };
  }

  // ── Main loop ───────────────────────────────────────────
  private tick(now: number) {
    const dt = Math.min(now - (this.lastNow || now), 32);
    this.lastNow = now;

    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    const offX = (this.mx - 0.5) * 40;
    const offY = (this.my - 0.5) * 25;
    const cx   = W / 2 + offX;
    const cy   = H / 2 + offY;

    this.drawStatics(now);
    this.drawSparks(now);
    this.drawFlyouts(cx, cy, dt);
    this.drawShooters(now, dt);

    // Decide whether to fire a new shooting star
    if (now >= this.nextShot) {
      const free = this.shooters.find(s => !s.active);
      if (free) {
        Object.assign(free, this.spawnShooter(now));
      }
      this.nextShot = now + this.randBetween(4000, 9000);
    }

    requestAnimationFrame(t => this.tick(t));
  }

  // ── Draw: static twinkle ────────────────────────────────
  private drawStatics(now: number) {
    const { ctx } = this;
    for (const s of this.statics) {
      const twinkle = Math.sin(s.phase + now * s.speed) * 0.35 + 0.65;
      const alpha   = s.baseAlpha * twinkle;
      ctx.beginPath();
      ctx.arc(s.px, s.py, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `${this.STATIC_COLORS[s.colorIdx]}${alpha.toFixed(2)})`;
      ctx.fill();
    }
  }

  // ── Draw: sparkle (4-point cross) ──────────────────────
  private drawSparks(now: number) {
    const { ctx } = this;
    for (const s of this.sparks) {
      const breathe = Math.sin(s.phase + now * s.speed) * 0.3 + 0.7;
      const r       = s.size * breathe;
      const alpha   = 0.55 * breathe;
      const color   = this.STATIC_COLORS[s.colorIdx];

      // Centre dot
      ctx.beginPath();
      ctx.arc(s.px, s.py, r, 0, Math.PI * 2);
      ctx.fillStyle = `${color}${alpha.toFixed(2)})`;
      ctx.fill();

      // 4-point cross glow lines
      const armLen = r * 5;
      const armAlpha = (alpha * 0.35).toFixed(2);
      ctx.lineWidth = r * 0.7;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const grad = ctx.createLinearGradient(
          s.px, s.py,
          s.px + dx * armLen, s.py + dy * armLen,
        );
        grad.addColorStop(0, `${color}${armAlpha})`);
        grad.addColorStop(1, `${color}0)`);
        ctx.beginPath();
        ctx.moveTo(s.px, s.py);
        ctx.lineTo(s.px + dx * armLen, s.py + dy * armLen);
        ctx.strokeStyle = grad;
        ctx.stroke();
      }
    }
  }

  // ── Draw: flyout 3D ─────────────────────────────────────
  private drawFlyouts(cx: number, cy: number, _dt: number) {
    const { ctx, W, H } = this;
    for (const s of this.flyouts) {
      s.z -= s.speed;
      if (s.z <= 0.02) { Object.assign(s, this.newFlyout(false)); continue; }

      const px = cx + (s.x / s.z) * W * 0.7;
      const py = cy + (s.y / s.z) * H * 0.7;

      if (px < -20 || px > W + 20 || py < -20 || py > H + 20) {
        Object.assign(s, this.newFlyout(false)); continue;
      }

      const nearness = 1 - s.z;
      const size     = nearness * 2.2 + 0.2;
      const alpha    = nearness * 0.8 + 0.1;
      const color    = this.FLY_COLORS[s.colorIdx];

      // ── Directional tail (points back toward centre) ──
      // Direction from star toward centre = tail direction
      const dirX = cx - px;
      const dirY = cy - py;
      const dist = Math.hypot(dirX, dirY);
      if (dist > 0.1) {
        const nx = dirX / dist;
        const ny = dirY / dist;
        // Tail length grows with nearness so distant stars are barely streaked
        const tailLen = s.trailLen * nearness;
        const tailX   = px + nx * tailLen;
        const tailY   = py + ny * tailLen;

        const tGrad = ctx.createLinearGradient(px, py, tailX, tailY);
        tGrad.addColorStop(0, `${color}${(alpha * 0.65).toFixed(2)})`);
        tGrad.addColorStop(1, `${color}0)`);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = tGrad;
        ctx.lineWidth   = size * 0.65;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      // Star dot
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = `${color}${alpha.toFixed(2)})`;
      ctx.fill();

      // Bright core when close
      if (nearness > 0.6) {
        ctx.beginPath();
        ctx.arc(px, py, size * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.85).toFixed(2)})`;
        ctx.fill();
      }
    }
  }

  // ── Draw: shooting stars ────────────────────────────────
  private drawShooters(now: number, _dt: number) {
    const { ctx } = this;
    for (const s of this.shooters) {
      if (!s.active) continue;

      s.progress = (now - s.startTime) / s.duration;

      if (s.progress >= 1) { s.active = false; continue; }

      // Fade in first 15%, hold, fade out last 25%
      const fadeIn  = Math.min(s.progress / 0.15, 1);
      const fadeOut = s.progress > 0.75 ? 1 - (s.progress - 0.75) / 0.25 : 1;
      const alpha   = fadeIn * fadeOut;

      const headX = s.x + s.vx * (s.progress * s.duration / 1000);
      const headY = s.y + s.vy * (s.progress * s.duration / 1000);

      // Tail direction (opposite of velocity)
      const len   = Math.hypot(s.vx, s.vy);
      const nx    = -s.vx / len;
      const ny    = -s.vy / len;
      const tailX = headX + nx * s.tailLen;
      const tailY = headY + ny * s.tailLen;

      const grad = ctx.createLinearGradient(headX, headY, tailX, tailY);
      grad.addColorStop(0,    `rgba(255,255,255,${alpha.toFixed(2)})`);
      grad.addColorStop(0.15, `rgba(200,230,255,${(alpha * 0.85).toFixed(2)})`);
      grad.addColorStop(0.5,  `rgba(160,200,255,${(alpha * 0.45).toFixed(2)})`);
      grad.addColorStop(1,    `rgba(130,180,255,0)`);

      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 2.2;
      ctx.lineCap     = 'round';
      ctx.stroke();

      // Soft glow halo around tail
      const glowGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
      glowGrad.addColorStop(0,   `rgba(180,210,255,${(alpha * 0.25).toFixed(2)})`);
      glowGrad.addColorStop(0.4, `rgba(140,190,255,${(alpha * 0.1).toFixed(2)})`);
      glowGrad.addColorStop(1,   `rgba(130,180,255,0)`);
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = glowGrad;
      ctx.lineWidth   = 7;
      ctx.stroke();

      // Bright head dot with glow
      const headGlow = ctx.createRadialGradient(headX, headY, 0, headX, headY, 6);
      headGlow.addColorStop(0,   `rgba(255,255,255,${alpha.toFixed(2)})`);
      headGlow.addColorStop(0.4, `rgba(200,230,255,${(alpha * 0.5).toFixed(2)})`);
      headGlow.addColorStop(1,   `rgba(180,210,255,0)`);
      ctx.beginPath();
      ctx.arc(headX, headY, 6, 0, Math.PI * 2);
      ctx.fillStyle = headGlow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(headX, headY, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      ctx.fill();
    }
  }

  // ── Util ────────────────────────────────────────────────
  private randBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }
}
