/** animations.ts — Direction B: reveal, tilt, counters, parallax, nav */

// ── Scroll reveal ────────────────────────────────────────
export function initReveal() {
  const targets = document.querySelectorAll<HTMLElement>('.reveal, .reveal-left, .reveal-right');
  if (!targets.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => obs.observe(el));
}

// ── 3-D card tilt on all cards ───────────────────────────
export function initTilt() {
  document.querySelectorAll<HTMLElement>('.tile, .glass-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition =
        'transform 0.08s ease, border-color 0.3s ease, box-shadow 0.3s ease';
    });
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform =
        `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateZ(6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition =
        'transform 0.55s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease, box-shadow 0.3s ease';
      card.style.transform = '';
    });
  });
}

// ── Hero name parallax ───────────────────────────────────
export function initParallax() {
  const el = document.getElementById('parallax-name');
  if (!el) return;

  window.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - 0.5);
    const y = (e.clientY / window.innerHeight - 0.5);
    el.style.transform =
      `perspective(1200px) rotateY(${x * 5}deg) rotateX(${-y * 3}deg)`;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
}

// ── Count-up ─────────────────────────────────────────────
export function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!counters.length) return;

  const easeOut = (t: number) => 1 - (1 - t) ** 3;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target as HTMLElement;
      const target = parseFloat(el.dataset.count!);
      const suffix = el.dataset.suffix ?? '';
      const start  = performance.now();
      const dur    = 1100;

      const tick = (now: number) => {
        const t   = Math.min((now - start) / dur, 1);
        const val = Math.round(easeOut(t) * target);
        el.textContent = `${val}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = `${target}${suffix}`;
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => obs.observe(el));
}

// ── Nav shrink on scroll ─────────────────────────────────
export function initNav() {
  const nav = document.querySelector<HTMLElement>('nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  const burger = document.querySelector<HTMLElement>('.nav-hamburger');
  const menu   = document.querySelector<HTMLElement>('.nav-links');
  burger?.addEventListener('click', () => {
    burger.classList.toggle('open');
    menu?.classList.toggle('open');
  });
}

// ── Section scroll (direction-aware) ────────────────────
export function initSectionScroll() {
  const sections = document.querySelectorAll<HTMLElement>(
    '.stats-strip, .skills-marquee-section, .work-section, .career-section, .cta-section'
  );
  if (!sections.length) return;

  // Start all below viewport (invisible)
  sections.forEach(el => el.setAttribute('data-scroll', 'below'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
      const el = target as HTMLElement;
      if (isIntersecting) {
        el.setAttribute('data-scroll', 'visible');
      } else {
        // Above or below — determines direction on next entry
        el.setAttribute('data-scroll', boundingClientRect.top < 0 ? 'above' : 'below');
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(s => obs.observe(s));
}

// ── Active nav link ──────────────────────────────────────
export function initActiveNav() {
  const page = document.body.dataset.page ?? '';
  document.querySelectorAll<HTMLAnchorElement>('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') ?? '';
    if (
      (page === 'home'  && (href === '/' || href === '')) ||
      (page !== 'home'  && href.includes(page))
    ) {
      a.classList.add('active');
    }
  });
}
