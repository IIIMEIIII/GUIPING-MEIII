/**
 * work-detail.js
 * 作品详情页通用交互逻辑
 * - 导航滚动效果
 * - 滚动显现动画
 * - 视差主图
 */

(function() {
  'use strict';

  // ---- NAV SCROLL ----
  const nav = document.getElementById('detailNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  // ---- SCROLL REVEAL ----
  function initReveal() {
    const targets = [
      '.work-info-item',
      '.work-lead',
      '.work-text',
      '.work-tags-col',
      '.process-item',
      '.work-section-label',
      '.next-label',
      '.next-title',
      '.w5-statement-quote',
      '.w5-statement-copy',
      '.w5-film-heading',
      '.w5-film-frame',
      '.w5-section-heading',
      '.w5-selected-page',
      '.w5-reader-heading',
    ];
    targets.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.add('reveal');
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 5) * 0.08}s`;
      io.observe(el);
    });
  }

  // ---- HERO PARALLAX ----
  function initParallax() {
    const heroImg = document.querySelector('.work-hero-img img');
    if (!heroImg || 'ontouchstart' in window) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroH   = document.querySelector('.work-hero').offsetHeight;
      if (scrollY > heroH) return;
      const pct = scrollY / heroH;
      heroImg.style.transform = `scale(1) translateY(${pct * 12}%)`;
    });
  }

  // ---- FULL IMAGE REVEAL ON SCROLL ----
  function initFullImg() {
    const fullImg = document.querySelector('.work-full-img img');
    if (!fullImg) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'scale(1)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    fullImg.style.opacity = '0';
    fullImg.style.transform = 'scale(1.04)';
    fullImg.style.transition = 'opacity 1s ease, transform 1.2s ease';
    io.observe(fullImg);
  }

  // ---- PDF PAGE GALLERY ----
  // Turns a compact page definition in the HTML into a lazy-loaded image list.
  function initPdfGallery() {
    document.querySelectorAll('[data-pdf-gallery]').forEach(gallery => {
      const pageCount = Number.parseInt(gallery.dataset.pageCount, 10);
      const prefix = gallery.dataset.imagePrefix || '';
      const extension = gallery.dataset.imageExtension || '.jpg';
      const altPrefix = gallery.dataset.altPrefix || 'PDF page';

      if (!Number.isInteger(pageCount) || pageCount < 1 || !prefix) return;

      const fragment = document.createDocumentFragment();

      for (let page = 1; page <= pageCount; page += 1) {
        const image = document.createElement('img');
        const pageNumber = String(page).padStart(3, '0');

        image.src = `${prefix}${pageNumber}${extension}`;
        image.alt = `${altPrefix} ${page}`;
        image.loading = page <= 2 ? 'eager' : 'lazy';
        image.decoding = 'async';

        fragment.appendChild(image);
      }

      gallery.appendChild(fragment);
    });
  }

  // ---- WORK 05 · COMPLETE FASHION BOOK READER ----
  function initFashionBookReader() {
    const reader = document.querySelector('[data-fashion-reader]');
    if (!reader) return;

    const image = reader.querySelector('.w5-reader-image');
    const stage = reader.querySelector('.w5-reader-stage');
    const prev = reader.querySelector('.w5-reader-prev');
    const next = reader.querySelector('.w5-reader-next');
    const currentLabel = reader.querySelector('.w5-reader-count b');
    const progress = reader.querySelector('.w5-reader-progress span');
    const total = Number.parseInt(reader.dataset.pageCount, 10);
    const prefix = reader.dataset.imagePrefix || '';
    const extension = reader.dataset.imageExtension || '.jpg';

    if (!image || !stage || !prev || !next || !Number.isInteger(total) || total < 1 || !prefix) return;

    let currentPage = 1;
    let changeTimer = null;

    const pageSrc = (page) => `${prefix}${String(page).padStart(3, '0')}${extension}`;

    function preload(page) {
      if (page < 1 || page > total) return;
      const preloadImage = new Image();
      preloadImage.src = pageSrc(page);
    }

    function updateControls() {
      currentLabel.textContent = String(currentPage).padStart(3, '0');
      progress.style.width = `${(currentPage / total) * 100}%`;
      prev.disabled = currentPage === 1;
      next.disabled = currentPage === total;
    }

    function showPage(page, immediate = false) {
      const targetPage = Math.max(1, Math.min(total, page));
      if (targetPage === currentPage && !immediate) return;

      window.clearTimeout(changeTimer);
      if (!immediate) image.classList.add('is-changing');

      changeTimer = window.setTimeout(() => {
        currentPage = targetPage;
        image.onload = () => image.classList.remove('is-changing');
        image.src = pageSrc(currentPage);
        image.alt = `Guiping Mei Fashion Book page ${currentPage}`;
        updateControls();
        preload(currentPage - 1);
        preload(currentPage + 1);

        if (image.complete) image.classList.remove('is-changing');
      }, immediate ? 0 : 170);
    }

    prev.addEventListener('click', (event) => {
      event.stopPropagation();
      showPage(currentPage - 1);
    });
    next.addEventListener('click', (event) => {
      event.stopPropagation();
      showPage(currentPage + 1);
    });

    stage.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPage(currentPage - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showPage(currentPage + 1);
      }
    });

    image.addEventListener('click', () => {
      const requestFullscreen = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (!requestFullscreen) return;
      const fullscreenResult = requestFullscreen.call(stage);
      fullscreenResult?.catch?.(() => {});
    });

    document.querySelectorAll('[data-reader-page]').forEach(button => {
      button.addEventListener('click', () => {
        const page = Number.parseInt(button.dataset.readerPage, 10);
        if (!Number.isInteger(page)) return;
        showPage(page);
        reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    updateControls();
    preload(2);
  }

  // ---- WORK 05 · GHOST LOOK LIGHTBOX ----
  function initLookLightbox() {
    const lightbox = document.getElementById('w5LookLightbox');
    const looks = Array.from(document.querySelectorAll('.w5-look'));
    if (!lightbox || looks.length === 0) return;

    const image = lightbox.querySelector('.w5-look-lightbox-image');
    const ghost = lightbox.querySelector('.w5-look-lightbox-ghost');
    const closeButton = lightbox.querySelector('.w5-look-lightbox-close');
    const captionEn = lightbox.querySelector('.w5-look-lightbox-caption span');
    const captionZh = lightbox.querySelector('.w5-look-lightbox-caption small');
    let activeLook = null;
    let closeTimer = null;

    function captionParts(figure) {
      const caption = figure.querySelector('figcaption');
      const zh = caption?.querySelector('.w5-zh-inline')?.textContent.trim() || '';
      const en = caption
        ? Array.from(caption.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent.trim())
            .filter(Boolean)
            .join(' ')
        : '';
      return { en, zh };
    }

    function openLook(figure) {
      const source = figure.querySelector('img');
      if (!source || !image || !ghost) return;

      window.clearTimeout(closeTimer);
      activeLook = figure;
      const src = source.currentSrc || source.src;
      const captions = captionParts(figure);

      image.src = src;
      image.alt = source.alt;
      ghost.src = src;
      if (captionEn) captionEn.textContent = captions.en;
      if (captionZh) captionZh.textContent = captions.zh;

      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('w5-look-open');
      closeButton?.focus({ preventScroll: true });
    }

    function closeLook() {
      if (!lightbox.classList.contains('is-open')) return;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('w5-look-open');

      closeTimer = window.setTimeout(() => {
        image?.removeAttribute('src');
        ghost?.removeAttribute('src');
      }, 500);

      activeLook?.focus({ preventScroll: true });
      activeLook = null;
    }

    looks.forEach((figure, index) => {
      figure.setAttribute('role', 'button');
      figure.setAttribute('tabindex', '0');
      figure.setAttribute('aria-label', `Open Look ${String(index + 1).padStart(2, '0')} / 放大造型 ${String(index + 1).padStart(2, '0')}`);
      figure.addEventListener('click', () => openLook(figure));
      figure.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLook(figure);
        }
      });
    });

    closeButton?.addEventListener('click', closeLook);
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLook();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLook();
    });
  }

  // ---- BACKGROUND MUSIC + VIDEO HANDOFF ----
  function initBackgroundMusic() {
    const music = document.getElementById('workBackgroundMusic');
    const toggle = document.getElementById('musicToggle');
    const videos = Array.from(document.querySelectorAll('.work-video-section video'));

    if (!music || !toggle) return;

    const targetVolume = 0.28;
    const fadeInDuration = 850;
    const fadeOutDuration = 650;
    const playingVideos = new Set();
    let musicEnabled = true;
    let fadeFrame = null;
    let unlockArmed = false;

    function cancelFade() {
      if (fadeFrame !== null) {
        window.cancelAnimationFrame(fadeFrame);
        fadeFrame = null;
      }
    }

    function fadeTo(target, duration, onComplete) {
      cancelFade();

      const startVolume = music.volume;
      const startedAt = performance.now();

      function step(now) {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = progress * (2 - progress);
        music.volume = Math.max(0, Math.min(1,
          startVolume + ((target - startVolume) * eased)
        ));

        if (progress < 1) {
          fadeFrame = window.requestAnimationFrame(step);
        } else {
          fadeFrame = null;
          if (onComplete) onComplete();
        }
      }

      fadeFrame = window.requestAnimationFrame(step);
    }

    function updateToggle() {
      toggle.classList.toggle('is-off', !musicEnabled);
      toggle.setAttribute('aria-pressed', String(musicEnabled));
      toggle.setAttribute(
        'aria-label',
        musicEnabled ? 'Turn off background music' : 'Turn on background music'
      );
    }

    function disarmUnlock() {
      if (!unlockArmed) return;
      document.removeEventListener('pointerdown', unlockAudio, true);
      document.removeEventListener('keydown', unlockAudio, true);
      unlockArmed = false;
      toggle.classList.remove('is-waiting');
    }

    function armUnlock() {
      if (unlockArmed || !musicEnabled) return;
      unlockArmed = true;
      toggle.classList.add('is-waiting');
      document.addEventListener('pointerdown', unlockAudio, true);
      document.addEventListener('keydown', unlockAudio, true);
    }

    async function startMusic() {
      if (!musicEnabled || playingVideos.size > 0) return false;

      cancelFade();
      if (music.paused) music.volume = 0;

      try {
        await music.play();
        disarmUnlock();

        if (!musicEnabled || playingVideos.size > 0) {
          music.pause();
          music.volume = 0;
          return true;
        }

        fadeTo(targetVolume, fadeInDuration);
        return true;
      } catch (error) {
        armUnlock();
        return false;
      }
    }

    function unlockAudio() {
      startMusic();
    }

    function pauseMusicWithFade() {
      cancelFade();

      if (music.paused) {
        music.volume = 0;
        return;
      }

      fadeTo(0, fadeOutDuration, () => {
        music.pause();
      });
    }

    videos.forEach(video => {
      video.addEventListener('play', () => {
        playingVideos.add(video);
        pauseMusicWithFade();
      });

      const resumeMusic = () => {
        const wasPlaying = playingVideos.delete(video);
        if (wasPlaying && playingVideos.size === 0) startMusic();
      };

      video.addEventListener('pause', resumeMusic);
      video.addEventListener('ended', resumeMusic);
    });

    toggle.addEventListener('click', () => {
      musicEnabled = !musicEnabled;
      updateToggle();

      if (musicEnabled) {
        startMusic();
      } else {
        disarmUnlock();
        pauseMusicWithFade();
      }
    });

    music.volume = 0;
    updateToggle();
    startMusic();
  }

  // ---- INIT ----
  function init() {
    initPdfGallery();
    initFashionBookReader();
    initLookLightbox();
    initBackgroundMusic();
    initReveal();
    initParallax();
    initFullImg();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
