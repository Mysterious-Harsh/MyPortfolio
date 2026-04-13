/**
 * game.ts — Asteroid Zapper  v5
 *
 * Activate : Konami Code  ↑ ↑ ↓ ↓ ← → ← → B A
 * ESC      : exit early
 *
 * Performance-first 3-D perspective projection:
 *  – No shadowBlur on asteroids (most expensive canvas op — removed entirely)
 *  – Fake glow via double-stroke (wide+transparent, then thin+opaque)
 *  – Asteroids born near screen centre as tiny specks, zoom outward as z → 0
 *  – Hit detection: crosshair must be inside projected radius
 *  – Missed counter: asteroids that escape off-screen
 */

interface Asteroid {
  ax: number; ay: number;   // world-space x/y (origin = screen centre)
  z:  number;               // depth — high = far, decreases toward camera
  vz: number;               // approach speed (world units per 16ms frame)
  baseRadius: number;       // visual size at reference depth (= FOCAL)
  x: number; y: number;     // screen-projected (updated each frame)
  radius: number;           // screen-projected radius
  rotation: number;
  rotSpeed: number;
  verts: Array<{ a: number; r: number }>; // angles + radii (normalised to baseRadius=1)
  color: string;
  alive: boolean;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}

interface Laser {
  x1: number; y1: number;
  x2: number; y2: number;
  alpha: number;
}

interface Miss {
  x: number; y: number;
  alpha: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export class AsteroidGame {
  private canvas!: HTMLCanvasElement;
  private ctx!:    CanvasRenderingContext2D;

  private active  = false;
  private animId  = 0;

  private asteroids: Asteroid[]  = [];
  private particles: Particle[]  = [];
  private lasers:    Laser[]     = [];
  private misses:    Miss[]      = [];

  private score      = 0;
  private missed     = 0;
  private timeLeft   = 30;
  private lastTime   = 0;
  private spawnTimer = 0;
  private spawnEvery = 3000;
  private readonly MAX_ASTEROIDS = 10;
  private readonly FOCAL = 600;

  private countdown     = 3;   // 3-2-1 before game begins
  private countdownDone = false;

  private mx = -999; private my = -999;
  private clockId: ReturnType<typeof setInterval> | null = null;

  private readonly KONAMI = [
    'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
    'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a',
  ];
  private kSeq: string[] = [];

  private readonly COLORS = ['#4F46E5','#14F1D9','#818CF8','#9B5DE5','#ffffff'];

  // ── Init ──────────────────────────────────────────────────────────
  constructor() {
    this.buildCanvas();
    document.addEventListener('keydown', e => this.onKey(e));
    document.addEventListener('mousemove', e => {
      this.mx = e.clientX; this.my = e.clientY;
    }, { passive: true });
  }

  private buildCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    Object.assign(this.canvas.style, {
      position: 'fixed', inset: '0',
      pointerEvents: 'none',
      zIndex: '500', opacity: '0',
      transition: 'opacity .4s ease',
    });
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true })!;
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  private resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private onKey(e: KeyboardEvent) {
    this.kSeq.push(e.key);
    if (this.kSeq.length > this.KONAMI.length) this.kSeq.shift();
    if (this.kSeq.join(',') === this.KONAMI.join(',')) {
      this.kSeq = [];
      if (!this.active) this.start();
      return;
    }
    if (e.key === 'Escape' && this.active) this.end();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────
  private start() {
    this.active     = true;
    this.score      = 0;
    this.missed     = 0;
    this.timeLeft   = 30;
    this.spawnEvery = 1800;
    this.spawnTimer = 0;
    this.asteroids  = [];
    this.particles  = [];
    this.lasers     = [];
    this.misses     = [];

    this.countdown     = 3;
    this.countdownDone = false;
    this.spawnEvery    = 3000;

    this.canvas.style.pointerEvents = 'auto';
    this.canvas.style.opacity       = '1';
    document.body.style.cursor      = 'none';
    this.setCursorVis(false);

    this.lastTime = performance.now();
    this.animId   = requestAnimationFrame(t => this.tick(t));

    // Tick countdown: 3 → 2 → 1 → GO → game begins
    const tick = (n: number) => {
      this.countdown = n;
      if (n > 0) {
        setTimeout(() => tick(n - 1), 1000);
      } else {
        // "GO" frame — start spawning after one more second
        setTimeout(() => {
          this.countdownDone = true;
          this.spawnAsteroid(); // start with just one
          this.canvas.addEventListener('click', this.onShoot);
          this.clockId = setInterval(() => {
            if (--this.timeLeft <= 0) this.end();
          }, 1000);
        }, 800);
      }
    };
    tick(3);
  }

  private end() {
    this.active = false;
    if (this.clockId) { clearInterval(this.clockId); this.clockId = null; }
    this.canvas.removeEventListener('click', this.onShoot);
    document.body.style.cursor = '';
    this.setCursorVis(true);
    this.drawGameOver();
    setTimeout(() => {
      this.canvas.style.opacity = '0';
      setTimeout(() => {
        this.canvas.style.pointerEvents = 'none';
        cancelAnimationFrame(this.animId);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }, 500);
    }, 2800);
  }

  private setCursorVis(v: boolean) {
    ['cursor-dot','cursor-trail'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = v ? '1' : '0';
    });
  }

  // ── Spawn ─────────────────────────────────────────────────────────
  /**
   * Asteroids spawn with small world-space ax/ay so they project near the
   * screen centre at high z and fan outward as they approach.
   * seeding=true places them at random z so the field isn't empty at start.
   */
  private spawnAsteroid(seeding = false) {
    if (this.asteroids.length >= this.MAX_ASTEROIDS) return;

    const tier = Math.random();
    const vz = tier < 0.25
      ? 4  + Math.random() * 3     // slow heavy
      : tier < 0.65
        ? 7  + Math.random() * 4   // medium
        : 12 + Math.random() * 5;  // fast light

    const baseRadius = tier < 0.25
      ? 48 + Math.random() * 24
      : tier < 0.65
        ? 28 + Math.random() * 18
        : 14 + Math.random() * 12;

    // World offset — small so asteroid starts near centre, fans to edges
    // At startZ=1000, focal=600 → scale=0.6 → screenOffset = ax*0.6
    // max ax=250 → max screenOffset≈150px from centre at birth, grows as z→0
    const ax = (Math.random() - 0.5) * 500;
    const ay = (Math.random() - 0.5) * 400;

    const startZ = seeding
      ? 200 + Math.random() * 900
      : 900 + Math.random() * 400;

    const numV = 8 + Math.floor(Math.random() * 5);
    const verts = Array.from({ length: numV }, (_, i) => ({
      a: (i / numV) * Math.PI * 2,
      r: 0.65 + Math.random() * 0.45,   // normalised to baseRadius
    }));

    this.asteroids.push({
      ax, ay, z: startZ, vz, baseRadius,
      x: 0, y: 0, radius: 0,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      verts,
      color: this.COLORS[Math.floor(Math.random() * 4)],
      alive: true,
    });
  }

  private project(ast: Asteroid) {
    const scale = this.FOCAL / ast.z;
    ast.x      = this.canvas.width  / 2 + ast.ax * scale;
    ast.y      = this.canvas.height / 2 + ast.ay * scale;
    ast.radius = ast.baseRadius * scale;
  }

  // ── Shoot ─────────────────────────────────────────────────────────
  private onShoot = () => {
    let hit = false;
    for (const ast of this.asteroids) {
      const dx = ast.x - this.mx;
      const dy = ast.y - this.my;
      if (Math.sqrt(dx * dx + dy * dy) <= ast.radius) {
        this.lasers.push({ x1: this.mx, y1: this.my, x2: ast.x, y2: ast.y, alpha: 1 });
        this.explode(ast);
        ast.alive = false;
        this.score += 10;
        hit = true;
        break;
      }
    }
    this.asteroids = this.asteroids.filter(a => a.alive);
    if (!hit) this.misses.push({ x: this.mx, y: this.my, alpha: 1 });
  };

  private explode(ast: Asteroid) {
    const n = 8 + Math.floor(ast.radius * 0.25);   // fewer particles = faster
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
      const s = 2 + Math.random() * 5;
      this.particles.push({
        x: ast.x, y: ast.y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 1,
        color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
        size: 1.5 + Math.random() * 3,
      });
    }
  }

  // ── Game loop ─────────────────────────────────────────────────────
  private tick(now: number) {
    if (!this.active) return;
    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    if (this.countdownDone) {
      this.spawnTimer += dt;
      if (this.spawnTimer > this.spawnEvery) {
        this.spawnTimer = 0;
        this.spawnAsteroid();
        // Random interval: starts 1.5–4s, tightens to 0.8–2s over time
        const minInterval = Math.max(800,  1500 - (30 - this.timeLeft) * 25);
        const maxInterval = Math.max(2000, 4000 - (30 - this.timeLeft) * 65);
        this.spawnEvery = minInterval + Math.random() * (maxInterval - minInterval);
      }
      this.tickAsteroids(dt);
      this.tickParticles(dt);
      this.tickLasers(dt);
      this.tickMisses(dt);
    }

    this.draw();

    this.animId = requestAnimationFrame(t => this.tick(t));
  }

  private tickAsteroids(dt: number) {
    const { width: W, height: H } = this.canvas;
    const margin = 100;
    for (const ast of this.asteroids) {
      ast.z -= ast.vz * (dt / 16);
      ast.rotation += ast.rotSpeed * (dt / 16);
      this.project(ast);
      if (
        ast.z <= 25 ||
        ast.x < -margin || ast.x > W + margin ||
        ast.y < -margin || ast.y > H + margin
      ) {
        ast.alive = false;
        if (ast.radius > 6) this.missed++;
      }
    }
    this.asteroids = this.asteroids.filter(a => a.alive);
  }

  private tickParticles(dt: number) {
    const f = dt / 16;
    for (const p of this.particles) {
      p.x += p.vx * f; p.y += p.vy * f;
      p.vx *= 0.92; p.vy *= 0.92;
      p.life -= 0.03 * f;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  private tickLasers(dt: number) {
    for (const l of this.lasers) l.alpha -= 0.07 * (dt / 16);
    this.lasers = this.lasers.filter(l => l.alpha > 0);
  }

  private tickMisses(dt: number) {
    for (const m of this.misses) m.alpha -= 0.06 * (dt / 16);
    this.misses = this.misses.filter(m => m.alpha > 0);
  }

  // ── Draw ──────────────────────────────────────────────────────────
  private draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawLasers();
    this.drawAsteroids();
    this.drawParticles();
    this.drawMisses();
    this.drawCrosshair();
    this.drawHUD();
    if (!this.countdownDone) this.drawCountdown();
  }

  /**
   * Asteroids drawn with NO shadowBlur (expensive).
   * Fake glow = wide semi-transparent stroke + thin opaque stroke.
   */
  private drawAsteroids() {
    const { ctx } = this;
    for (const ast of this.asteroids) {
      if (ast.radius < 1) continue;

      // Fade in from deep space
      const alpha = Math.min(1, (1100 - ast.z) / 250);
      if (alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);

      // Build path once
      ctx.beginPath();
      const s = ast.radius;   // scale factor
      for (let i = 0; i < ast.verts.length; i++) {
        const v = ast.verts[i];
        const rx = Math.cos(v.a) * v.r * s;
        const ry = Math.sin(v.a) * v.r * s;
        if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      }
      ctx.closePath();

      // Fill
      ctx.fillStyle = 'rgba(6,7,20,0.78)';
      ctx.fill();

      // Wide glow stroke (cheap substitute for shadowBlur)
      ctx.strokeStyle = ast.color;
      ctx.lineWidth   = Math.max(2, ast.radius * 0.18);
      ctx.globalAlpha = alpha * 0.18;
      ctx.stroke();

      // Sharp outline
      ctx.lineWidth   = Math.max(0.8, ast.radius * 0.055);
      ctx.globalAlpha = alpha * 0.92;
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawLasers() {
    const { ctx } = this;
    for (const l of this.lasers) {
      ctx.save();
      ctx.globalAlpha = l.alpha;
      ctx.lineCap     = 'round';

      // Glow pass
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2);
      ctx.strokeStyle = '#14F1D9';
      ctx.lineWidth   = 4;
      ctx.globalAlpha = l.alpha * 0.45;
      ctx.stroke();

      // Core
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 1;
      ctx.globalAlpha = l.alpha;
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawParticles() {
    const { ctx } = this;
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMisses() {
    const { ctx } = this;
    for (const m of this.misses) {
      const s = 10;
      ctx.save();
      ctx.globalAlpha = m.alpha;
      ctx.strokeStyle = '#F87171';
      ctx.lineWidth   = 2;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x - s, m.y - s); ctx.lineTo(m.x + s, m.y + s);
      ctx.moveTo(m.x + s, m.y - s); ctx.lineTo(m.x - s, m.y + s);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawCrosshair() {
    const { ctx } = this;
    const x = this.mx; const y = this.my;
    if (x < -900) return;

    ctx.save();
    ctx.strokeStyle = '#14F1D9';
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.88;
    ctx.lineCap     = 'round';

    const size = 18; const gap = 6;
    ctx.beginPath();
    ctx.moveTo(x - size, y); ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap,  y); ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size); ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap);  ctx.lineTo(x, y + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, size * 0.68, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle   = '#14F1D9';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawHUD() {
    const { ctx, canvas } = this;
    const mono = `'JetBrains Mono', monospace`;
    const W = canvas.width; const H = canvas.height;

    ctx.save();
    ctx.textBaseline = 'bottom';
    ctx.textAlign    = 'right';

    ctx.font      = `700 1rem ${mono}`;
    ctx.fillStyle = '#14F1D9';
    ctx.fillText(`SCORE:  ${String(this.score).padStart(4, '0')}`, W - 24, H - 20);

    const mc = this.missed > 5 ? '#F87171' : '#818CF8';
    ctx.font      = `700 .85rem ${mono}`;
    ctx.fillStyle = mc;
    ctx.fillText(`MISSED: ${String(this.missed).padStart(4, '0')}`, W - 24, H - 46);

    const tc = this.timeLeft <= 10 ? '#F87171' : '#9B5DE5';
    ctx.font      = `700 .85rem ${mono}`;
    ctx.fillStyle = tc;
    ctx.fillText(`TIME:   ${String(this.timeLeft).padStart(2, '0')}s`, W - 24, H - 70);

    ctx.textAlign = 'left';
    ctx.font      = `500 .65rem ${mono}`;
    ctx.fillStyle = 'rgba(129,140,248,0.45)';
    ctx.fillText('// ASTEROID ZAPPER  ·  AIM on asteroid + CLICK  ·  ESC to exit', 24, H - 20);

    ctx.restore();
  }

  private drawCountdown() {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const mono = `'JetBrains Mono', monospace`;
    const label = this.countdown > 0 ? String(this.countdown) : 'GO!';
    const isGo  = this.countdown === 0;

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Outer glow ring
    const ring = ctx.createRadialGradient(cx, cy, 40, cx, cy, 160);
    ring.addColorStop(0,   isGo ? 'rgba(20,241,217,0.18)' : 'rgba(79,70,229,0.18)');
    ring.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(cx, cy, 160, 0, Math.PI * 2);
    ctx.fill();

    // Number / GO
    ctx.font      = `900 7rem ${mono}`;
    ctx.fillStyle = isGo ? '#14F1D9' : '#F8FAFC';
    ctx.globalAlpha = 0.95;
    ctx.fillText(label, cx, cy);

    // Sub-label
    ctx.font        = `600 0.75rem ${mono}`;
    ctx.fillStyle   = 'rgba(129,140,248,0.7)';
    ctx.globalAlpha = 1;
    ctx.fillText(isGo ? 'FIRE!' : '// GET READY', cx, cy + 72);

    ctx.restore();
  }

  private drawGameOver() {
    const { ctx, canvas } = this;
    const cx = canvas.width / 2; const cy = canvas.height / 2;
    const mono = `'JetBrains Mono', monospace`;

    roundRect(ctx, cx - 250, cy - 105, 500, 210, 18);
    ctx.fillStyle   = 'rgba(6,7,20,0.96)';
    ctx.fill();
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.font      = `800 2rem ${mono}`;
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText('GAME OVER', cx, cy - 52);

    ctx.textAlign = 'left';
    ctx.font      = `700 1rem ${mono}`;
    ctx.fillStyle = '#14F1D9';
    ctx.fillText(`SCORE:  ${String(this.score).padStart(4, '0')}`, cx - 120, cy - 10);

    const mc = this.missed > 5 ? '#F87171' : '#818CF8';
    ctx.fillStyle = mc;
    ctx.fillText(`MISSED: ${String(this.missed).padStart(4, '0')}`, cx - 120, cy + 18);

    const total = this.score / 10 + this.missed;
    const acc   = total > 0 ? Math.round((this.score / 10 / total) * 100) : 0;
    ctx.textAlign = 'center';
    ctx.font      = `700 .88rem ${mono}`;
    ctx.fillStyle = '#9B5DE5';
    ctx.fillText(`ACCURACY: ${acc}%`, cx, cy + 50);

    ctx.font      = `500 .7rem ${mono}`;
    ctx.fillStyle = 'rgba(156,163,175,0.7)';
    ctx.fillText('returning to normal space...', cx, cy + 80);

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}
