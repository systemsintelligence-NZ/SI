/* =========================================================================
   Systems Intelligence — Interactive layer
   - Nav scroll state + mobile menu
   - Mouse-tracking spotlights on .card
   - IntersectionObserver reveal-on-scroll
   - Scroll-linked hero parallax
   ========================================================================= */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nav: scroll state ---- */
  const nav = document.querySelector('.site-nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Nav: mobile menu toggle ---- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  const iconOpen = document.querySelector('.nav-toggle .icon-open');
  const iconClose = document.querySelector('.nav-toggle .icon-close');

  const setMenu = (open) => {
    if (!menu) return;
    menu.classList.toggle('open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (iconOpen && iconClose) {
      iconOpen.style.display = open ? 'none' : 'block';
      iconClose.style.display = open ? 'block' : 'none';
    }
    document.body.style.overflow = open ? 'hidden' : '';
  };

  toggle?.addEventListener('click', () => {
    setMenu(!menu?.classList.contains('open'));
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 768) setMenu(false); });

  /* ---- Mouse-tracking spotlight on cards ---- */
  if (!prefersReduced) {
    const cards = document.querySelectorAll('.card, .spotlight');
    cards.forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---- Reveal on scroll ---- */
  const targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && targets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(t => io.observe(t));
  } else {
    targets.forEach(t => t.classList.add('visible'));
  }

  /* ---- Hero visual: subtle cursor-tilt on the workflow mock ---- */
  const tilt = document.querySelector('[data-tilt]');
  if (tilt && !prefersReduced) {
    const damp = 25;
    tilt.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(1200px) rotateY(${cx * damp * 0.4}deg) rotateX(${-cy * damp * 0.3}deg)`;
    });
    tilt.addEventListener('pointerleave', () => {
      tilt.style.transform = 'perspective(1200px) rotateY(0) rotateX(0)';
    });
  }
})();
