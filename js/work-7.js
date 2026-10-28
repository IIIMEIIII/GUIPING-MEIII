(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Reveal editorial blocks as the visitor moves through the archive.
  const revealItems = document.querySelectorAll('.w7-reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Shared image lightbox.
  const lightbox = document.getElementById('w7Lightbox');
  const lightboxImage = document.getElementById('w7LightboxImage');
  const lightboxClose = document.getElementById('w7LightboxClose');
  let lightboxReturnTarget = null;

  const closeLightbox = () => {
    if (!lightbox?.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightboxImage.removeAttribute('src');
    document.body.style.overflow = '';
    lightboxReturnTarget?.focus({ preventScroll: true });
  };

  document.querySelectorAll('[data-w7-image]').forEach((button) => {
    button.addEventListener('click', () => {
      lightboxReturnTarget = button;
      lightboxImage.src = button.dataset.w7Image;
      lightboxImage.alt = button.querySelector('img')?.alt || 'Project image';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lightboxClose?.focus();
    });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  // Full-screen player used by the moving-look console.
  const player = document.getElementById('w7Player');
  const playerMedia = document.getElementById('w7PlayerMedia');
  const playerClose = document.getElementById('w7PlayerClose');
  let playerReturnTarget = null;

  const stopPreviews = () => {
    document.querySelectorAll('.w7-motion-chip video').forEach((video) => video.pause());
  };

  const openPlayer = (src, returnTarget) => {
    if (!src || !player || !playerMedia) return;
    stopPreviews();
    playerReturnTarget = returnTarget;
    playerMedia.src = src;
    if (typeof player.showModal === 'function') player.showModal();
    else player.setAttribute('open', '');
    playerMedia.play().catch(() => {});
  };

  const closePlayer = () => {
    if (!playerMedia || !player) return;
    playerMedia.pause();
    playerMedia.removeAttribute('src');
    playerMedia.load();
    if (player.open && typeof player.close === 'function') player.close();
    else player.removeAttribute('open');
    playerReturnTarget?.focus({ preventScroll: true });
  };

  playerClose?.addEventListener('click', closePlayer);
  player?.addEventListener('click', (event) => {
    if (event.target === player) closePlayer();
  });
  player?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePlayer();
  });

  // Interactive moving-look console.
  const motionStage = document.querySelector('.w7-motion-stage');
  const motionFeature = document.getElementById('w7MotionFeature');
  const motionCounter = document.getElementById('w7MotionCounter');
  const motionLabel = document.getElementById('w7MotionLabel');
  const motionPrev = document.getElementById('w7MotionPrev');
  const motionNext = document.getElementById('w7MotionNext');
  const motionOpen = document.querySelector('.w7-feature-open');
  const motionStrip = document.querySelector('.w7-motion-strip');
  const motionChips = Array.from(document.querySelectorAll('.w7-motion-chip'));
  let activeMotionIndex = 0;

  const selectMotion = (requestedIndex, options = {}) => {
    if (!motionChips.length || !motionFeature || !motionStage) return;
    const nextIndex = (requestedIndex + motionChips.length) % motionChips.length;
    const chip = motionChips[nextIndex];
    const src = chip.dataset.src;
    if (!src) return;

    activeMotionIndex = nextIndex;
    motionStage.classList.add('is-switching');
    motionStage.dataset.w7Video = src;
    motionFeature.src = src;
    motionFeature.load();
    motionFeature.play().catch(() => {});

    motionChips.forEach((item, index) => {
      const isActive = index === activeMotionIndex;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-selected', String(isActive));
      item.tabIndex = isActive ? 0 : -1;
    });

    const displayIndex = String(activeMotionIndex + 1).padStart(2, '0');
    if (motionCounter) motionCounter.textContent = `${displayIndex} / ${String(motionChips.length).padStart(2, '0')}`;
    if (motionLabel) motionLabel.textContent = `MOVING LOOK ${displayIndex}`;
    if (options.keepChipVisible) chip.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });

    window.setTimeout(() => motionStage.classList.remove('is-switching'), reduceMotion ? 0 : 220);
  };

  motionChips.forEach((chip, index) => {
    chip.tabIndex = index === 0 ? 0 : -1;
    chip.addEventListener('click', () => selectMotion(index, { keepChipVisible: true }));
    chip.addEventListener('focus', () => selectMotion(index));

    if (canHover && !reduceMotion) {
      chip.addEventListener('mouseenter', () => {
        selectMotion(index);
        chip.querySelector('video')?.play().catch(() => {});
      });
      chip.addEventListener('mouseleave', () => chip.querySelector('video')?.pause());
    }
  });

  motionPrev?.addEventListener('click', () => selectMotion(activeMotionIndex - 1, { keepChipVisible: true }));
  motionNext?.addEventListener('click', () => selectMotion(activeMotionIndex + 1, { keepChipVisible: true }));
  motionOpen?.addEventListener('click', () => openPlayer(motionStage?.dataset.w7Video, motionOpen));
  motionStrip?.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    selectMotion(activeMotionIndex + direction, { keepChipVisible: true });
    motionChips[activeMotionIndex]?.focus({ preventScroll: true });
  });

  // Subtle perspective response on the five look cards.
  if (canHover && !reduceMotion) {
    document.querySelectorAll('[data-w7-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 3;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -3;
        card.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Chapter ribbon: current section plus overall reading progress.
  const chapterLinks = Array.from(document.querySelectorAll('.w7-chapter-nav a'));
  const chapterMap = new Map(chapterLinks.map((link) => [link.getAttribute('href').slice(1), link]));
  const progressBar = document.querySelector('.w7-progress i');

  chapterLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if (!section) return;
      event.preventDefault();
      history.replaceState(null, '', `#${id}`);
      section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  if ('IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      chapterLinks.forEach((link) => link.removeAttribute('aria-current'));
      chapterMap.get(visible.target.id)?.setAttribute('aria-current', 'true');
    }, { threshold: [0.18, 0.45], rootMargin: '-18% 0px -55% 0px' });

    chapterMap.forEach((link, id) => {
      const section = document.getElementById(id);
      if (section) chapterObserver.observe(section);
    });
  }

  let progressTicking = false;
  const updateProgress = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? Math.min(100, Math.max(0, (window.scrollY / available) * 100)) : 0;
    if (progressBar) progressBar.style.width = `${progress}%`;
    progressTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (progressTicking) return;
    progressTicking = true;
    window.requestAnimationFrame(updateProgress);
  }, { passive: true });
  updateProgress();

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
  });
})();
