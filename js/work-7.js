(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Reveal each editorial block as it enters the viewport.
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

  // Image lightbox shared by every chapter.
  const lightbox = document.getElementById('w7Lightbox');
  const lightboxImage = document.getElementById('w7LightboxImage');
  const lightboxClose = document.getElementById('w7LightboxClose');
  let lightboxReturnTarget = null;

  const closeLightbox = () => {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightboxImage.removeAttribute('src');
    document.body.style.overflow = '';
    if (lightboxReturnTarget) lightboxReturnTarget.focus({ preventScroll: true });
  };

  document.querySelectorAll('[data-w7-image]').forEach((button) => {
    button.addEventListener('click', () => {
      lightboxReturnTarget = button;
      lightboxImage.src = button.dataset.w7Image;
      lightboxImage.alt = button.querySelector('img')?.alt || 'Project image';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lightboxClose.focus();
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  // Muted hover previews; sound is reserved for the fullscreen player.
  const videoCards = document.querySelectorAll('[data-w7-video]');
  const player = document.getElementById('w7Player');
  const playerMedia = document.getElementById('w7PlayerMedia');
  const playerClose = document.getElementById('w7PlayerClose');
  let playerReturnTarget = null;

  const stopPreviews = () => {
    videoCards.forEach((card) => card.querySelector('video')?.pause());
  };

  const closePlayer = () => {
    playerMedia.pause();
    playerMedia.removeAttribute('src');
    playerMedia.load();
    if (player.open) player.close();
    if (playerReturnTarget) playerReturnTarget.focus({ preventScroll: true });
  };

  videoCards.forEach((card) => {
    const preview = card.querySelector('video');
    const openButton = card.querySelector('.w7-video-open');

    if (canHover && !reduceMotion) {
      card.addEventListener('mouseenter', () => preview?.play().catch(() => {}));
      card.addEventListener('mouseleave', () => {
        if (!preview) return;
        preview.pause();
        try { preview.currentTime = 0; } catch (error) { /* metadata may not be ready */ }
      });
    }

    openButton.addEventListener('click', () => {
      stopPreviews();
      playerReturnTarget = openButton;
      playerMedia.src = card.dataset.w7Video;
      if (typeof player.showModal === 'function') player.showModal();
      else player.setAttribute('open', '');
      playerMedia.play().catch(() => {});
    });
  });

  playerClose.addEventListener('click', closePlayer);
  player.addEventListener('click', (event) => {
    if (event.target === player) closePlayer();
  });
  player.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePlayer();
  });

  // Keep the chapter ribbon aware of the current section.
  const chapterLinks = Array.from(document.querySelectorAll('.w7-chapter-nav a'));
  const chapterMap = new Map(chapterLinks.map((link) => [link.getAttribute('href').slice(1), link]));

  // Use an immediate, deterministic chapter jump. This avoids a pending
  // dialog focus restoration competing with the site's global smooth scroll.
  chapterLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if (!section) return;
      event.preventDefault();
      history.replaceState(null, '', `#${id}`);
      section.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  });

  if ('IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      chapterLinks.forEach((link) => link.removeAttribute('aria-current'));
      const activeLink = chapterMap.get(visible.target.id);
      if (activeLink) activeLink.setAttribute('aria-current', 'true');
    }, { threshold: [0.18, 0.45], rootMargin: '-18% 0px -55% 0px' });

    chapterMap.forEach((link, id) => {
      const section = document.getElementById(id);
      if (section) chapterObserver.observe(section);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
  });
})();
