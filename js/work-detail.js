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
