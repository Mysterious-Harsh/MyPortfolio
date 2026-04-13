/**
 * cursor.ts — Meteorite cursor
 * Bright white-hot head + colour-shifting comet tail canvas
 * Tail colour: purple → indigo → teal → white (newest)
 *
 * Fixes vs v1:
 *  - Delta-time normalised lerp → smooth at any refresh rate (60/120/144Hz)
 *  - Quadratic bezier through midpoints → no kinks in the trail
 *  - Larger trail history (48 pts) for a longer, more fluid comet
 */
export class Cursor {
  private dot!:   HTMLElement;
  private trail!: HTMLCanvasElement;
  private ctx!:   CanvasRenderingContext2D;

  // Raw mouse pos (snaps instantly)
  private mx = -300; private my = -300;
  // Smoothed pos used for trail
  private lx = -300; private ly = -300;

  private positions: Array<{ x: number; y: number }> = [];
  private readonly TRAIL_LEN = 48;

  // Lerp base factor at 60fps — delta-time normalised in tick()
  private readonly LERP_BASE = 0.10;

  private hovering = false;
  private clicking  = false;
  private lastTime  = 0;

  constructor() {
    this.dot = document.getElementById('cursor-dot')!;
    const ring = document.getElementById('cursor-ring');
    if (ring) ring.style.display = 'none';

    if (!this.dot) return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.dot.style.display = 'none';
      return;
    }

    this.buildTrailCanvas();
    this.bindEvents();
    requestAnimationFrame((t) => this.tick(t));
  }

  // ── Setup ────────────────────────────────────────────────
  private buildTrailCanvas() {
    this.trail = document.createElement('canvas');
    this.trail.id = 'cursor-trail';
    this.trail.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:100000;';
    document.body.appendChild(this.trail);
    this.ctx = this.trail.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  private resize() {
    this.trail.width  = window.innerWidth;
    this.trail.height = window.innerHeight;
  }

  private bindEvents() {
    document.addEventListener('mousemove', e => {
      this.mx = e.clientX;
      this.my = e.clientY;
      this.dot.style.left = `${e.clientX}px`;
      this.dot.style.top  = `${e.clientY}px`;

      const el = (e.target as HTMLElement).closest(
        'a, button, .glass-card, .tile, .stat-mini, [role="button"], input, textarea, select'
      );
      this.hovering = !!el;
      this.dot.className = this.clicking ? 'clicking' : this.hovering ? 'hovering' : '';
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      this.mx = -300; this.my = -300;
    });

    document.addEventListener('mousedown', () => {
      this.clicking = true;
      this.dot.classList.add('clicking');
    });
    document.addEventListener('mouseup', () => {
      this.clicking = false;
      this.dot.classList.remove('clicking');
    });
  }

  // ── Main loop ────────────────────────────────────────────
  private tick(now: number) {
    // Delta time in ms, capped at 50ms to avoid jumps after tab switch
    const dt = this.lastTime ? Math.min(now - this.lastTime, 50) : 16.67;
    this.lastTime = now;

    // Frame-rate independent lerp: same feel at 60 / 120 / 144 Hz
    const alpha = 1 - Math.pow(1 - this.LERP_BASE, dt / 16.67);
    this.lx += (this.mx - this.lx) * alpha;
    this.ly += (this.my - this.ly) * alpha;

    this.positions.push({ x: this.lx, y: this.ly });
    if (this.positions.length > this.TRAIL_LEN) this.positions.shift();

    this.drawTrail();
    requestAnimationFrame((t) => this.tick(t));
  }

  // ── Draw trail ───────────────────────────────────────────
  private drawTrail() {
    const { ctx, positions } = this;
    const n = positions.length;
    ctx.clearRect(0, 0, this.trail.width, this.trail.height);

    if (n < 3) return;

    ctx.lineCap  = 'butt';
    ctx.lineJoin = 'round';

    // Draw smooth bezier curve through midpoints of consecutive positions.
    // Each segment i→i+1 uses the midpoint as anchor to avoid kinks.
    for (let i = 1; i < n - 1; i++) {
      const t  = i / n;            // 0 = oldest (tail end), 1 = newest (head)

      const p0 = positions[i - 1];
      const p1 = positions[i];
      const p2 = positions[i + 1];

      // Midpoints — bezier control points
      const mx0 = (p0.x + p1.x) / 2;
      const my0 = (p0.y + p1.y) / 2;
      const mx1 = (p1.x + p2.x) / 2;
      const my1 = (p1.y + p2.y) / 2;

      // Thickness: thin at tail, thick at head
      ctx.lineWidth = t * 5 + 0.3;

      // Colour: purple → indigo → teal → white (toward head)
      const alpha = t * 0.85;
      let r: number, g: number, b: number;
      if (t < 0.35) {
        const f = t / 0.35;
        r = Math.round(155 + (79  - 155) * f);
        g = Math.round(93  + (70  - 93)  * f);
        b = 229;
      } else if (t < 0.7) {
        const f = (t - 0.35) / 0.35;
        r = Math.round(79  + (20  - 79)  * f);
        g = Math.round(70  + (241 - 70)  * f);
        b = Math.round(229 + (217 - 229) * f);
      } else {
        const f = (t - 0.7) / 0.3;
        r = Math.round(20  + (255 - 20)  * f);
        g = Math.round(241 + (255 - 241) * f);
        b = Math.round(217 + (255 - 217) * f);
      }

      ctx.beginPath();
      ctx.moveTo(mx0, my0);
      ctx.quadraticCurveTo(p1.x, p1.y, mx1, my1);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
      ctx.stroke();
    }

    // Radial glow at the head
    const head = positions[n - 1];
    if (head.x < -200) return;
    const size = this.hovering ? 14 : this.clicking ? 7 : 10;
    const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, size);
    glow.addColorStop(0,    'rgba(255,255,255,0.95)');
    glow.addColorStop(0.3,  'rgba(20,241,217,0.6)');
    glow.addColorStop(1,    'rgba(20,241,217,0)');
    ctx.beginPath();
    ctx.arc(head.x, head.y, size, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }
}
