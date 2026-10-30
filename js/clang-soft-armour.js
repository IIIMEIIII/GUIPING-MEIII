(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  window.requestAnimationFrame(() => {
    window.setTimeout(() => document.body.classList.add('is-ready'), reducedMotion ? 0 : 90);
  });

  /* Reveal only the elements that belong to this page. */
  const revealItems = document.querySelectorAll('[data-clang-reveal]');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* Optional interface sound: never autoplays. */
  const soundButton = document.querySelector('.clang-sound');
  const soundLabel = document.querySelector('[data-sound-label]');
  let soundEnabled = false;
  let audioContext = null;

  function playMetal(type = 'light') {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioContext ||= new AudioContext();
      if (audioContext.state === 'suspended') audioContext.resume();

      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const second = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      const duration = type === 'heavy' ? 0.28 : 0.14;

      oscillator.type = 'triangle';
      second.type = 'sine';
      oscillator.frequency.setValueAtTime(type === 'heavy' ? 118 : 310, now);
      oscillator.frequency.exponentialRampToValueAtTime(type === 'heavy' ? 72 : 190, now + duration);
      second.frequency.setValueAtTime(type === 'heavy' ? 940 : 1320, now);
      second.frequency.exponentialRampToValueAtTime(type === 'heavy' ? 430 : 780, now + duration);
      filter.type = 'bandpass';
      filter.frequency.value = type === 'heavy' ? 620 : 1180;
      filter.Q.value = 1.1;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(type === 'heavy' ? 0.035 : 0.018, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(filter);
      second.connect(filter);
      filter.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      second.start(now);
      oscillator.stop(now + duration);
      second.stop(now + duration);
    } catch (error) {
      // Audio is a non-blocking enhancement.
    }
  }

  soundButton?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', soundEnabled ? 'Disable interface sound' : 'Enable interface sound');
    if (soundLabel) soundLabel.textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
    if (soundEnabled) playMetal('heavy');
  });

  /* Fixed chapter chain. */
  const progress = document.querySelector('.clang-progress');
  const progressLinks = Array.from(document.querySelectorAll('[data-progress-link]'));
  const sections = progressLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function updateProgress() {
    const threshold = window.innerHeight * 0.46;
    let activeIndex = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= threshold) activeIndex = index;
    });
    progressLinks.forEach((link, index) => link.classList.toggle('is-active', index === activeIndex));
    progress?.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.72);
  }

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* Motif laboratory. */
  const lab = document.querySelector('[data-clang-lab]');
  if (lab) {
    const stage = lab.querySelector('.clang-lab-stage');
    const image = lab.querySelector('[data-lab-image]');
    const number = lab.querySelector('[data-lab-number]:not(button)');
    const title = lab.querySelector('[data-lab-title]:not(button)');
    const copy = lab.querySelector('[data-lab-copy]:not(button)');
    const buttons = Array.from(lab.querySelectorAll('.clang-lab-controls button'));
    let switchTimer = null;

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.classList.contains('is-active') || !image || !stage) return;
        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', String(active));
        });
        stage.classList.add('is-changing');
        window.clearTimeout(switchTimer);
        const incoming = new Image();
        incoming.onload = () => {
          image.src = incoming.src;
          image.alt = `${button.dataset.labTitle || 'Motif'} research and development board`;
          if (number) number.textContent = button.dataset.labNumber || '';
          if (title) title.textContent = button.dataset.labTitle || '';
          if (copy) copy.textContent = button.dataset.labCopy || '';
          switchTimer = window.setTimeout(() => stage.classList.remove('is-changing'), 60);
        };
        incoming.src = button.dataset.labSrc || image.src;
        playMetal();
      });
    });

    stage?.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = stage.getBoundingClientRect();
      stage.style.setProperty('--scan-x', `${clamp(event.clientX - rect.left, 0, rect.width)}px`);
    });
  }

  /* Drag-to-scan collection rail. */
  const lookViewport = document.querySelector('[data-look-viewport]');
  const lookCount = document.querySelector('[data-look-count]');
  if (lookViewport) {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    function updateLookCount() {
      const maxScroll = Math.max(lookViewport.scrollWidth - lookViewport.clientWidth, 1);
      const ratio = lookViewport.scrollLeft / maxScroll;
      const current = Math.round(ratio * 19) + 1;
      if (lookCount) lookCount.textContent = String(current).padStart(2, '0');
    }

    lookViewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = lookViewport.scrollLeft;
      lookViewport.classList.add('is-dragging');
      lookViewport.setPointerCapture?.(event.pointerId);
    });

    lookViewport.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 4) moved = true;
      lookViewport.scrollLeft = startScroll - delta * 1.18;
    });

    const stopDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      lookViewport.classList.remove('is-dragging');
      lookViewport.releasePointerCapture?.(event.pointerId);
      if (moved) playMetal();
    };

    lookViewport.addEventListener('pointerup', stopDrag);
    lookViewport.addEventListener('pointercancel', stopDrag);
    lookViewport.addEventListener('scroll', updateLookCount, { passive: true });
    lookViewport.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      lookViewport.scrollBy({ left: event.key === 'ArrowRight' ? 240 : -240, behavior: 'smooth' });
      playMetal();
    });
    lookViewport.addEventListener('click', (event) => {
      if (moved) event.preventDefault();
      moved = false;
    }, true);
    updateLookCount();
  }

  /* Scarf object modes and rotation. */
  const scarfStage = document.querySelector('[data-scarf-stage]');
  const scarfImage = document.querySelector('[data-scarf-image]');
  const scarfCaption = document.querySelector('[data-scarf-caption]');
  const scarfButtons = Array.from(document.querySelectorAll('[data-scarf-src]'));
  let scarfRotation = 0;

  scarfButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.classList.contains('is-active') || !scarfImage || !scarfStage) return;
      scarfButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      scarfStage.classList.add('is-changing');
      const incoming = new Image();
      incoming.onload = () => {
        scarfImage.src = incoming.src;
        scarfImage.alt = button.dataset.scarfLabel || button.textContent.trim();
        if (scarfCaption) scarfCaption.textContent = button.dataset.scarfLabel || '';
        window.setTimeout(() => scarfStage.classList.remove('is-changing'), 70);
      };
      incoming.src = button.dataset.scarfSrc || scarfImage.src;
      playMetal();
    });
  });

  document.querySelectorAll('[data-scarf-rotate]').forEach((button) => {
    button.addEventListener('click', () => {
      scarfRotation += Number.parseInt(button.dataset.scarfRotate || '0', 10);
      scarfStage?.style.setProperty('--scarf-rotation', `${scarfRotation}deg`);
      playMetal('heavy');
    });
  });

  /* Plan/body comparison. */
  const compare = document.querySelector('[data-clang-compare]');
  const compareRange = document.querySelector('[data-compare-range]');
  if (compare && compareRange) {
    compareRange.addEventListener('input', () => {
      compare.style.setProperty('--compare', `${compareRange.value}%`);
    });
    compareRange.addEventListener('change', () => playMetal());
  }

  /* Campaign scroll reveal. */
  const campaign = document.querySelector('.clang-campaign');
  const campaignSticky = document.querySelector('.clang-campaign-sticky');
  let campaignTicking = false;

  function updateCampaign() {
    campaignTicking = false;
    if (!campaign || !campaignSticky) return;
    const rect = campaign.getBoundingClientRect();
    const range = Math.max(campaign.offsetHeight - window.innerHeight, 1);
    const progressValue = clamp(-rect.top / range, 0, 1);
    campaignSticky.style.setProperty('--campaign-progress', `${(progressValue * 100).toFixed(2)}%`);
  }

  window.addEventListener('scroll', () => {
    if (campaignTicking) return;
    campaignTicking = true;
    window.requestAnimationFrame(updateCampaign);
  }, { passive: true });
  updateCampaign();

  /* Specimen-view lightbox. */
  const lightbox = document.querySelector('[data-clang-lightbox]');
  const lightboxImage = lightbox?.querySelector('img');
  const closeButton = lightbox?.querySelector('[data-lightbox-close]');

  function resolveExpandImage(trigger) {
    if (trigger.tagName === 'IMG') return trigger;
    return trigger.closest('.clang-lab-stage, .clang-scarf-stage')?.querySelector('img') || null;
  }

  function openLightbox(trigger) {
    if (!lightbox || !lightboxImage) return;
    const image = resolveExpandImage(trigger);
    if (!image) return;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || 'Expanded project image';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('clang-lightbox-open');
    closeButton?.focus();
    playMetal('heavy');
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('clang-lightbox-open');
    window.setTimeout(() => lightboxImage.removeAttribute('src'), 300);
  }

  document.querySelectorAll('[data-clang-expand]').forEach((trigger) => {
    if (trigger.closest('[data-look-viewport]')) {
      trigger.addEventListener('dblclick', () => openLightbox(trigger));
      return;
    }
    trigger.addEventListener('click', () => openLightbox(trigger));
  });
  closeButton?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.classList.contains('clang-lightbox-stage')) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox?.classList.contains('is-open')) closeLightbox();
  });

  /* A restrained impact ring for pointer interactions. */
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || reducedMotion) return;
    if (!event.target.closest('button, a, input, [data-look-viewport], [data-clang-expand]')) return;
    const ring = document.createElement('span');
    ring.className = 'clang-impact';
    ring.style.left = `${event.clientX}px`;
    ring.style.top = `${event.clientY}px`;
    document.body.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove(), { once: true });
  });
})();
