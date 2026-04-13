/**
 * main.ts — Direction B: Cognitive Space
 * Entry point — orchestrates all modules
 */
import { SplashScreen }        from './splash';
import { Cursor }               from './cursor';
import { NeuralCanvas }         from './canvas';
import { Typewriter }           from './typewriter';
import { AsteroidGame }         from './game';
import {
  initReveal, initTilt, initCounters,
  initNav, initActiveNav, initParallax,
  initSectionScroll,
} from './animations';

function boot() {
  // Cursor always-on
  new Cursor();

  // Easter egg — Konami code activates Asteroid Zapper
  new AsteroidGame();

  // Nav
  initNav();
  initActiveNav();

  const hasSplash = !!document.getElementById('splash');

  if (hasSplash) {
    new SplashScreen();

    document.addEventListener('splashDone', () => {
      document.body.classList.add('ready');
      new NeuralCanvas();
      initTypewriter();
      initReveal();
      initTilt();
      initCounters();
      initParallax();
      initSectionScroll();
    }, { once: true });
  } else {
    document.body.classList.add('ready');
    new NeuralCanvas();
    initReveal();
    initTilt();
    initCounters();
  }
}

function initTypewriter() {
  const el = document.getElementById('typed-text');
  if (!el) return;
  new Typewriter('typed-text', [
    'AI Engineer',
    'LLM Developer',
    'Deep Learning Engineer',
    'Cognitive Systems Builder',
    'Full-Stack AI Developer',
    'ML Researcher',
  ]);
}

document.addEventListener('DOMContentLoaded', boot);
