/**
 * splash.ts — 3D Space Letters
 * Hyperspace warp stars → letters rush from infinite depth → slam into name
 * Single rAF loop. Hard 6.5 s escape. Cannot get stuck.
 */

interface LetterSlot {
  ch:          string;
  tx:          number;    // final X (screen)
  progress:    number;    // 0 = far/tiny, 1 = at camera
  locked:      boolean;
  current:     string;    // scrambled or final char
  scramble:    number;    // frame counter for scramble rate
  flash:       number;    // 0–1 glow flash on lock
  startDelay:  number;    // ms before flight begins
  flightTime:  number;    // ms to travel from z-depth to camera
}

interface WarpStar {
  x: number; y: number;
  z: number; pz: number;
}

export class SplashScreen {
  private el:     HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx:    CanvasRenderingContext2D;
  private W = 0; private H = 0;

  private slots: LetterSlot[] = [];
  private stars: WarpStar[]   = [];

  private startTime    = 0;
  private done         = false;
  private allLockedAt: number | null = null;
  private roleChars    = 0;

  private targetFS = 0;
  private finalY   = 0;

  private readonly NAME  = 'HARSHKUMAR PATEL';
  private readonly CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private readonly ROLE  = 'AI ENGINEER';
  private readonly FOCAL = 500;

  constructor() {
    this.el     = document.getElementById('splash')!;
    this.canvas = document.getElementById('splash-canvas') as HTMLCanvasElement;
    this.ctx    = this.canvas.getContext('2d')!;

    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;

    this.buildSlots();
    this.buildStars();

    // Hard escape — cannot get stuck
    setTimeout(() => this.finish(), 6500);

    this.startTime = performance.now();
    requestAnimationFrame(t => this.tick(t));
  }

  // ── Build ─────────────────────────────────────────────────
  private buildSlots() {
    const { ctx, NAME, CHARS, W, H } = this;
    const CX = W / 2, CY = H / 2;

    this.targetFS = Math.min(W / NAME.replace(' ', '').length * 1.55, 76);
    ctx.font = `900 ${this.targetFS}px Inter, sans-serif`;
    const totalW = ctx.measureText(NAME).width;
    let ox = (W - totalW) / 2;
    this.finalY = CY + this.targetFS * 0.35;

    this.slots = NAME.split('').map((ch, i) => {
      const cw = ch === ' ' ? this.targetFS * 0.38 : ctx.measureText(ch).width;
      const tx = ox;
      ox += cw;
      return {
        ch, tx,
        progress:   0,
        locked:     false,
        current:    ch === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)],
        scramble:   0,
        flash:      0,
        startDelay: 450 + i * 62 + Math.random() * 80,
        flightTime: 680 + Math.random() * 280,
      };
    });
  }

  private buildStars() {
    const { W, H } = this;
    this.stars = Array.from({ length: 200 }, () => ({
      x:  (Math.random() - 0.5) * W * 2.5,
      y:  (Math.random() - 0.5) * H * 2.5,
      z:  Math.random() * W,
      pz: W,
    }));
  }

  // ── Main loop ─────────────────────────────────────────────
  private tick(now: number) {
    if (this.done) return;

    const e = now - this.startTime;
    const { ctx, W, H, FOCAL, targetFS, finalY } = this;
    const CX = W / 2, CY = H / 2;

    // Clear — pure black first 300ms, then trail fade
    ctx.fillStyle = e < 300 ? '#000' : 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, 0, W, H);

    // ── Warp stars ────────────────────────────────────────
    // Speed decelerates as letters begin arriving
    const warpSpeed = Math.max(2.5, 14 * Math.max(0, 1 - e / 1800));
    for (const s of this.stars) {
      s.pz = s.z;
      s.z -= warpSpeed;
      if (s.z <= 0.5) {
        s.x  = (Math.random() - 0.5) * W * 2.5;
        s.y  = (Math.random() - 0.5) * H * 2.5;
        s.z  = W;
        s.pz = W;
        continue;
      }
      const sx  = s.x * (FOCAL / s.z)  + CX;
      const sy  = s.y * (FOCAL / s.z)  + CY;
      const psx = s.x * (FOCAL / s.pz) + CX;
      const psy = s.y * (FOCAL / s.pz) + CY;
      if (sx < 0 || sx > W || sy < 0 || sy > H) continue;

      const depth = 1 - s.z / W;
      const alpha = Math.min(depth * 0.85, 0.85);
      const thick = Math.max(0.5, depth * 2.2);

      ctx.beginPath();
      ctx.moveTo(psx, psy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = `rgba(160,170,215,${alpha.toFixed(2)})`;
      ctx.lineWidth = thick;
      ctx.stroke();
    }

    // ── Letters flying in from Z-depth ────────────────────
    ctx.textBaseline = 'alphabetic';
    let numLocked = 0;

    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];

      if (s.ch === ' ') { numLocked++; continue; }

      // Advance flight
      if (!s.locked) {
        const fe = e - s.startDelay;
        if (fe > 0) s.progress = Math.min(fe / s.flightTime, 1);
        if (s.progress >= 1) {
          s.locked  = true;
          s.flash   = 1;
          s.current = s.ch;
        }
      } else {
        numLocked++;
      }

      if (s.flash > 0) s.flash = Math.max(0, s.flash - 0.045);
      if (s.progress === 0) continue;   // not launched yet

      const ep       = this.easeOut(s.progress);
      const fontSize = targetFS * Math.max(0.03, ep);
      const x        = CX + (s.tx - CX) * ep;
      const y        = CY + (finalY - CY) * ep;

      ctx.font = `900 ${fontSize}px Inter, sans-serif`;

      // Scramble mid-flight
      if (!s.locked && s.progress > 0.05 && s.progress < 0.88) {
        s.scramble++;
        if (s.scramble % 2 === 0)
          s.current = this.CHARS[Math.floor(Math.random() * this.CHARS.length)];
      }

      // Glow flash when letter slams in
      if (s.flash > 0) {
        ctx.shadowBlur  = 30 * s.flash;
        ctx.shadowColor = i < 10 ? '#818CF8' : '#14F1D9';
      }

      if (s.locked) {
        // Gradient for locked letters
        const g = ctx.createLinearGradient(x, y - fontSize, x, y);
        if (i < 10) {             // HARSHKUMAR — white → indigo
          g.addColorStop(0, '#ffffff');
          g.addColorStop(1, '#818CF8');
        } else {                  // PATEL — indigo → teal
          g.addColorStop(0, '#4F46E5');
          g.addColorStop(1, '#14F1D9');
        }
        ctx.fillStyle   = g;
        ctx.globalAlpha = 1;
      } else {
        // In-flight: teal, semi-transparent
        ctx.fillStyle   = ep > 0.5 ? '#a5f3fc' : '#14F1D9';
        ctx.globalAlpha = 0.45 + ep * 0.55;
      }

      ctx.fillText(s.locked ? s.ch : s.current, x, y);
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }

    // ── Detect all letters landed ──────────────────────────
    // numLocked counts spaces (always) + locked non-spaces
    if (this.allLockedAt === null && numLocked === this.slots.length) {
      this.allLockedAt = e;
    }

    // ── Role types in after name complete ─────────────────
    if (this.allLockedAt !== null) {
      const re = e - this.allLockedAt - 280;
      if (re > 0) {
        this.roleChars = Math.min(Math.floor(re / 60), this.ROLE.length);
        const cursor = this.roleChars < this.ROLE.length ? '\u258c' : '';
        const shown  = this.ROLE.slice(0, this.roleChars) + cursor;
        const roleFontSize = Math.min(W * 0.022, 16);

        ctx.font        = `600 ${roleFontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign   = 'center';
        ctx.fillStyle   = '#14F1D9';
        ctx.globalAlpha = Math.min(re / 250, 1);
        // Space out letters manually (letterSpacing isn't universal in canvas)
        const spaced = shown.split('').join('\u2009');  // thin space
        ctx.fillText(spaced, CX, finalY + targetFS * 0.45);
        ctx.textAlign   = 'left';
        ctx.globalAlpha = 1;
      }
    }

    // ── Exit after hold ───────────────────────────────────
    if (this.allLockedAt !== null) {
      const holdEnd = this.allLockedAt + this.ROLE.length * 60 + 280 + 2200;
      if (e > holdEnd) { this.finish(); return; }
    }

    requestAnimationFrame(t => this.tick(t));
  }

  // ── Util ──────────────────────────────────────────────────
  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  // ── Finish (idempotent) ───────────────────────────────────
  private finish() {
    if (this.done) return;
    this.done = true;
    this.el.classList.add('exit');
    setTimeout(() => {
      this.el.remove();
      document.dispatchEvent(new Event('splashDone'));
    }, 880);
  }
}
