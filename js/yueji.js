(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* Calm entrance rhythm */
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* Bamboo-ring cursor and a fading fibre trail */
  const cursor = document.getElementById('yjCursor');
  const cursorLabel = cursor?.querySelector('span');
  const canvas = document.getElementById('yjThreadCanvas');
  if (finePointer && cursor && canvas && !reducedMotion) {
    document.body.classList.add('yj-cursor-ready');
    const context = canvas.getContext('2d');
    const points = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let lastPoint = null;
    let frame = 0;

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    document.addEventListener('pointermove', (event) => {
      cursor.classList.add('is-visible');
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      const dx = lastPoint ? event.clientX - lastPoint.x : 99;
      const dy = lastPoint ? event.clientY - lastPoint.y : 99;
      if (Math.hypot(dx, dy) > 5) {
        points.push({ x: event.clientX, y: event.clientY, life: 1 });
        if (points.length > 42) points.shift();
        lastPoint = { x: event.clientX, y: event.clientY };
      }
      const interactive = event.target.closest('[data-cursor], a, button, [data-zoom]');
      const label = interactive?.dataset.cursor || (interactive?.matches('[data-zoom]') ? 'VIEW' : interactive ? 'OPEN' : 'WEAVE');
      if (cursorLabel) cursorLabel.textContent = label;
      cursor.classList.toggle('is-active', Boolean(interactive));
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));

    const drawThread = () => {
      context.clearRect(0, 0, width, height);
      if (points.length > 1) {
        for (let index = 1; index < points.length; index += 1) {
          const previous = points[index - 1];
          const point = points[index];
          context.beginPath();
          context.moveTo(previous.x, previous.y);
          context.quadraticCurveTo(previous.x, point.y, point.x, point.y);
          context.strokeStyle = `rgba(151, 108, 61, ${Math.max(0, point.life) * 0.26})`;
          context.lineWidth = 0.55 + point.life * 0.85;
          context.stroke();
          point.life -= 0.018;
        }
        while (points[0] && points[0].life <= 0) points.shift();
      }
      frame = window.requestAnimationFrame(drawThread);
    };
    drawThread();
    window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true });
  }

  /* Hero objects react to proximity without losing their full silhouette */
  const hero = document.querySelector('.yj-hero');
  if (hero && finePointer && !reducedMotion) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      hero.style.setProperty('--mx', x.toFixed(3));
      hero.style.setProperty('--my', y.toFixed(3));
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--mx', 0);
      hero.style.setProperty('--my', 0);
    });
  }

  /* Build Your Own: evidence-led structure switcher */
  const builderStage = document.getElementById('yjBuilderStage');
  const builderImage = document.getElementById('yjBuilderImage');
  const builderNumber = document.getElementById('yjBuilderNumber');
  const builderTitle = document.getElementById('yjBuilderTitle');
  const builderNote = document.getElementById('yjBuilderNote');
  const builderButtons = Array.from(document.querySelectorAll('[data-build-option]'));

  builderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.classList.contains('is-active') || !builderStage || !builderImage) return;
      builderButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      builderStage.classList.add('is-changing');
      const nextImage = new Image();
      nextImage.onload = () => {
        window.setTimeout(() => {
          builderImage.src = button.dataset.src;
          builderImage.alt = button.dataset.alt || button.dataset.title;
          if (builderNumber) builderNumber.textContent = button.dataset.number;
          if (builderTitle) builderTitle.textContent = button.dataset.title;
          if (builderNote) builderNote.textContent = button.dataset.note;
          builderStage.classList.remove('is-changing');
        }, 120);
      };
      nextImage.src = button.dataset.src;
    });
  });

  document.querySelectorAll('[data-palette]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-palette]').forEach((item) => item.classList.toggle('is-active', item === button));
      builderStage?.style.setProperty('--stage-wash', button.dataset.palette);
    });
  });

  /* Material cards become a soft inspection lens */
  document.querySelectorAll('[data-material]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((event.clientX - bounds.left) / bounds.width * 100).toFixed(2)}%`);
      card.style.setProperty('--my', `${((event.clientY - bounds.top) / bounds.height * 100).toFixed(2)}%`);
    }, { passive: true });
  });

  /* Three directions: the product follows the active story */
  const directionPanels = Array.from(document.querySelectorAll('[data-direction]'));
  const directionStage = document.querySelector('.yj-family-stage');
  const directionImage = document.getElementById('yjDirectionImage');
  const directionTitle = document.getElementById('yjDirectionTitle');
  const directionSub = document.getElementById('yjDirectionSub');
  const directionNumber = document.getElementById('yjDirectionNumber');

  const activateDirection = (panel) => {
    if (!panel || panel.classList.contains('is-active') || !directionStage || !directionImage) return;
    directionPanels.forEach((item) => item.classList.toggle('is-active', item === panel));
    directionStage.classList.add('is-changing');
    const preload = new Image();
    preload.onload = () => {
      window.setTimeout(() => {
        directionImage.src = panel.dataset.src;
        directionImage.alt = panel.dataset.alt || panel.dataset.title;
        if (directionTitle) directionTitle.textContent = panel.dataset.title;
        if (directionSub) directionSub.textContent = panel.dataset.sub;
        if (directionNumber) directionNumber.textContent = `${panel.dataset.number} / 03`;
        directionStage.classList.remove('is-changing');
      }, 90);
    };
    preload.src = panel.dataset.src;
  };

  if ('IntersectionObserver' in window && directionPanels.length) {
    const directionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activateDirection(visible.target);
    }, { rootMargin: '-28% 0px -34% 0px', threshold: [0.05, 0.25, 0.5] });
    directionPanels.forEach((panel) => directionObserver.observe(panel));
  }

  /* Sketch field is searched with light rather than a conventional gallery */
  const sketchField = document.getElementById('yjSketchField');
  if (sketchField && finePointer) {
    sketchField.addEventListener('pointermove', (event) => {
      const bounds = sketchField.getBoundingClientRect();
      sketchField.style.setProperty('--sx', `${((event.clientX - bounds.left) / bounds.width * 100).toFixed(2)}%`);
      sketchField.style.setProperty('--sy', `${((event.clientY - bounds.top) / bounds.height * 100).toFixed(2)}%`);
    }, { passive: true });
  }

  /* Production path grows as it enters the viewport */
  const journey = document.getElementById('yjJourney');
  const journeyProgress = document.getElementById('yjJourneyProgress');
  const journeySteps = Array.from(journey?.querySelectorAll('li') || []);
  let scrollQueued = false;

  const updateScrollEffects = () => {
    scrollQueued = false;
    if (!journey || !journeyProgress) return;
    const bounds = journey.getBoundingClientRect();
    const raw = (window.innerHeight * 0.78 - bounds.top) / Math.max(bounds.height * 0.92, 1);
    const progress = Math.min(1, Math.max(0, raw));
    journey.style.setProperty('--journey-progress', `${(progress * 100).toFixed(1)}%`);
    journeySteps.forEach((step, index) => {
      step.classList.toggle('is-active', progress >= index / Math.max(journeySteps.length - 1, 1) - 0.025);
    });
  };
  const queueScrollEffects = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollEffects);
  };
  updateScrollEffects();
  window.addEventListener('scroll', queueScrollEffects, { passive: true });
  window.addEventListener('resize', queueScrollEffects, { passive: true });

  /* Section rail */
  const railLinks = Array.from(document.querySelectorAll('.yj-chapter-rail a[href^="#"]'));
  const railSections = railLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && railSections.length) {
    const railObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        railLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-38% 0px -54% 0px', threshold: 0 });
    railSections.forEach((section) => railObserver.observe(section));
  }

  /* Reusable image inspection */
  const lightbox = document.getElementById('yjLightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('figcaption');
  const lightboxClose = lightbox?.querySelector('.yj-lightbox-close');
  let lastFocused = null;

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('yj-lightbox-open');
    window.setTimeout(() => lightboxImage?.removeAttribute('src'), 280);
    lastFocused?.focus?.();
  };
  const openLightbox = (trigger) => {
    const image = trigger.querySelector('img');
    if (!lightbox || !lightboxImage || !image) return;
    lastFocused = trigger;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || 'Expanded project image';
    if (lightboxCaption) lightboxCaption.textContent = trigger.querySelector('figcaption')?.textContent || image.alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('yj-lightbox-open');
    lightboxClose?.focus();
  };

  document.querySelectorAll('[data-zoom]').forEach((item) => {
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.addEventListener('click', () => openLightbox(item));
    item.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openLightbox(item);
    });
  });
  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && lightbox?.classList.contains('is-open')) closeLightbox(); });
})();
