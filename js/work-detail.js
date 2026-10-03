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

  // ---- WORK 05 · FASHION BOOK READER ----
  function initFashionBookReader() {
    const reader = document.querySelector('[data-fashion-reader]');
    if (!reader) return;

    const image = reader.querySelector('.w5-reader-image');
    const book = reader.querySelector('.w5-reader-book');
    const turningPage = reader.querySelector('.w5-reader-turning-page');
    const stationaryPage = reader.querySelector('.w5-reader-stationary-page');
    const stage = reader.querySelector('.w5-reader-stage');
    const prev = reader.querySelector('.w5-reader-prev');
    const next = reader.querySelector('.w5-reader-next');
    const currentLabel = reader.querySelector('.w5-reader-count b');
    const range = reader.querySelector('.w5-reader-range');
    const scrubber = reader.querySelector('.w5-reader-scrubber');
    const rangePreview = reader.querySelector('.w5-reader-range-preview');
    const chapterButtons = Array.from(reader.querySelectorAll('[data-reader-chapter]'));
    const total = Number.parseInt(reader.dataset.pageCount, 10);
    const prefix = reader.dataset.imagePrefix || '';
    const extension = reader.dataset.imageExtension || '.jpg';

    if (!image || !book || !turningPage || !stationaryPage || !stage || !prev || !next || !currentLabel || !range || !scrubber || !Number.isInteger(total) || total < 1 || !prefix) return;

    const pageStorageKey = 'w5FashionBookLastPage';
    let currentPage = 1;
    let flipTimer = null;
    let pageRequest = 0;
    let pageAudioContext = null;
    let dragState = null;
    let suppressFullscreen = false;

    try {
      const rememberedPage = Number.parseInt(window.sessionStorage.getItem(pageStorageKey), 10);
      if (Number.isInteger(rememberedPage) && rememberedPage >= 1 && rememberedPage <= total) currentPage = rememberedPage;
    } catch (error) {
      // Private browsing can disable storage; the reader still works normally.
    }

    const pageSrc = (page) => `${prefix}${String(page).padStart(3, '0')}${extension}`;

    function preload(page) {
      if (page < 1 || page > total) return;
      const preloadImage = new Image();
      preloadImage.src = pageSrc(page);
    }

    const progressPercent = (page) => total === 1 ? 100 : ((page - 1) / (total - 1)) * 100;

    function updateChapterState(page) {
      let activeChapter = null;
      chapterButtons.forEach(button => {
        const chapterPage = Number.parseInt(button.dataset.readerPage, 10);
        if (Number.isInteger(chapterPage) && chapterPage <= page) activeChapter = button;
      });

      chapterButtons.forEach(button => {
        const isActive = button === activeChapter;
        button.classList.toggle('is-active', isActive);
        if (isActive) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    }

    function updateRange(page) {
      const pageLabel = String(page).padStart(3, '0');
      const percent = `${progressPercent(page)}%`;
      range.value = String(page);
      scrubber.style.setProperty('--reader-progress', percent);
      currentLabel.textContent = pageLabel;
      if (rangePreview) rangePreview.textContent = pageLabel;
      updateChapterState(page);
    }

    function updateControls() {
      updateRange(currentPage);
      prev.disabled = currentPage === 1;
      next.disabled = currentPage === total;
    }

    function playPageSound() {
      const musicToggle = document.getElementById('musicToggle');
      if (musicToggle && musicToggle.getAttribute('aria-pressed') === 'false') return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        pageAudioContext ||= new AudioContext();
        if (pageAudioContext.state === 'suspended') pageAudioContext.resume();
        const duration = 0.13;
        const buffer = pageAudioContext.createBuffer(1, pageAudioContext.sampleRate * duration, pageAudioContext.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < channel.length; i += 1) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
        const source = pageAudioContext.createBufferSource();
        const filter = pageAudioContext.createBiquadFilter();
        const gain = pageAudioContext.createGain();
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 0.6;
        gain.gain.setValueAtTime(0.0001, pageAudioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.032, pageAudioContext.currentTime + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, pageAudioContext.currentTime + duration);
        source.buffer = buffer;
        source.connect(filter).connect(gain).connect(pageAudioContext.destination);
        source.start();
      } catch (error) {
        // Sound is an enhancement and should never block page navigation.
      }
    }

    function showPage(page, immediate = false) {
      const targetPage = Math.max(1, Math.min(total, page));
      if (targetPage === currentPage && !immediate) return;

      const previousPage = currentPage;
      const previousSrc = image.currentSrc || image.src;
      const direction = targetPage > previousPage ? 'next' : 'prev';
      const request = ++pageRequest;
      const targetSrc = pageSrc(targetPage);

      currentPage = targetPage;
      try { window.sessionStorage.setItem(pageStorageKey, String(currentPage)); } catch (error) {}
      updateControls();
      preload(currentPage - 1);
      preload(currentPage + 1);

      if (immediate) {
        image.src = targetSrc;
        image.alt = `Guiping Mei Fashion Book page ${currentPage}`;
        return;
      }

      const incomingPage = new Image();
      incomingPage.onload = () => {
        if (request !== pageRequest) return;

        window.clearTimeout(flipTimer);
        book.classList.remove('is-flipping-next', 'is-flipping-prev');
        turningPage.src = previousSrc;
        stationaryPage.src = previousSrc;
        image.src = targetSrc;
        image.alt = `Guiping Mei Fashion Book page ${currentPage}`;

        // Restart the 3D page-turn animation even during quick navigation.
        void book.offsetWidth;
        book.classList.add(direction === 'next' ? 'is-flipping-next' : 'is-flipping-prev');
        playPageSound();

        flipTimer = window.setTimeout(() => {
          book.classList.remove('is-flipping-next', 'is-flipping-prev');
        }, 940);
      };
      incomingPage.src = targetSrc;
    }

    prev.addEventListener('click', (event) => {
      event.stopPropagation();
      showPage(currentPage - 1);
    });
    next.addEventListener('click', (event) => {
      event.stopPropagation();
      showPage(currentPage + 1);
    });

    range.max = String(total);
    range.addEventListener('pointerdown', () => scrubber.classList.add('is-scrubbing'));
    range.addEventListener('input', () => {
      const targetPage = Number.parseInt(range.value, 10);
      if (!Number.isInteger(targetPage)) return;
      scrubber.classList.add('is-scrubbing');
      updateRange(targetPage);
    });
    range.addEventListener('change', () => {
      const targetPage = Number.parseInt(range.value, 10);
      if (Number.isInteger(targetPage)) showPage(targetPage);
      scrubber.classList.remove('is-scrubbing');
    });
    range.addEventListener('pointerup', () => scrubber.classList.remove('is-scrubbing'));
    range.addEventListener('blur', () => {
      scrubber.classList.remove('is-scrubbing');
      updateControls();
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

    function finishDrag(commit = false) {
      if (!dragState) return;
      const direction = dragState.direction;
      const progress = dragState.progress || 0;
      dragState = null;
      book.classList.remove('is-dragging-next', 'is-dragging-prev');
      book.style.removeProperty('--w5-drag-angle');
      if (commit && progress > 0.28) showPage(currentPage + (direction === 'next' ? 1 : -1));
    }

    book.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      const rect = book.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const direction = localX > rect.width * 0.66 && currentPage < total
        ? 'next'
        : localX < rect.width * 0.34 && currentPage > 1 ? 'prev' : null;
      if (!direction) return;
      dragState = { direction, startX: event.clientX, width: rect.width, progress: 0 };
      suppressFullscreen = false;
      const currentSrc = image.currentSrc || image.src;
      turningPage.src = currentSrc;
      stationaryPage.src = currentSrc;
      book.classList.add(`is-dragging-${direction}`);
      book.setPointerCapture?.(event.pointerId);
    });

    book.addEventListener('pointermove', event => {
      if (!dragState) return;
      const distance = dragState.direction === 'next' ? dragState.startX - event.clientX : event.clientX - dragState.startX;
      const progress = Math.max(0, Math.min(1, distance / (dragState.width * 0.46)));
      dragState.progress = progress;
      if (progress > 0.04) suppressFullscreen = true;
      const angle = progress * 150 * (dragState.direction === 'next' ? -1 : 1);
      book.style.setProperty('--w5-drag-angle', `${angle}deg`);
    });

    book.addEventListener('pointerup', event => {
      if (!dragState) return;
      book.releasePointerCapture?.(event.pointerId);
      finishDrag(true);
    });
    book.addEventListener('pointercancel', () => finishDrag(false));

    image.addEventListener('click', () => {
      if (suppressFullscreen) {
        suppressFullscreen = false;
        return;
      }
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

    showPage(currentPage, true);
  }

  // ---- GHOST IMAGE LIGHTBOX (WORK 02 + WORK 05) ----
  function initLookLightbox() {
    const lightbox = document.getElementById('w5LookLightbox');
    const looks = Array.from(document.querySelectorAll('.w5-look, [data-ghost-item]'));
    if (!lightbox || looks.length === 0) return;

    const image = lightbox.querySelector('.w5-look-lightbox-image');
    const ghost = lightbox.querySelector('.w5-look-lightbox-ghost');
    const closeButton = lightbox.querySelector('.w5-look-lightbox-close');
    const captionEn = lightbox.querySelector('.w5-look-lightbox-caption span');
    const captionZh = lightbox.querySelector('.w5-look-lightbox-caption small');
    const inner = lightbox.querySelector('.w5-look-lightbox-inner');
    const previousButton = lightbox.querySelector('.w5-look-lightbox-prev');
    const nextButton = lightbox.querySelector('.w5-look-lightbox-next');
    const navigableLooks = document.body.classList.contains('work-2-page')
      ? looks.filter(figure => figure.hasAttribute('data-ghost-item'))
      : looks.filter(figure => figure.classList.contains('w5-look'));
    let activeLook = null;
    let closeTimer = null;
    let holdTimer = null;
    let detailStart = null;

    function captionParts(figure) {
      const caption = figure.querySelector('figcaption');
      const zh = caption?.querySelector('.w5-zh-inline, .w2-zh-inline')?.textContent.trim() || '';
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
      const collectionIndex = navigableLooks.indexOf(figure);
      lightbox.classList.toggle('has-look-navigation', collectionIndex !== -1);
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
      lightbox.classList.remove('is-detail-view', 'has-look-navigation');
    }

    function showAdjacent(delta) {
      const index = navigableLooks.indexOf(activeLook);
      if (index === -1 || navigableLooks.length < 2) return;
      openLook(navigableLooks[(index + delta + navigableLooks.length) % navigableLooks.length]);
    }

    looks.forEach((figure, index) => {
      const isEditorial = figure.hasAttribute('data-ghost-item');
      const itemNumber = String(index + 1).padStart(2, '0');
      figure.setAttribute('role', 'button');
      figure.setAttribute('tabindex', '0');
      figure.setAttribute(
        'aria-label',
        isEditorial
          ? `Open editorial image ${itemNumber} / 放大时装影像 ${itemNumber}`
          : `Open Look ${itemNumber} / 放大造型 ${itemNumber}`
      );
      figure.addEventListener('click', () => openLook(figure));
      figure.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLook(figure);
        }
      });
    });

    closeButton?.addEventListener('click', closeLook);
    previousButton?.addEventListener('click', event => { event.stopPropagation(); showAdjacent(-1); });
    nextButton?.addEventListener('click', event => { event.stopPropagation(); showAdjacent(1); });

    function clearDetailHold() {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }

    inner?.addEventListener('pointerdown', event => {
      if (!activeLook || navigableLooks.indexOf(activeLook) === -1) return;
      detailStart = { x: event.clientX, y: event.clientY, time: performance.now(), pointerId: event.pointerId };
      inner.setPointerCapture?.(event.pointerId);
      clearDetailHold();
      holdTimer = window.setTimeout(() => lightbox.classList.add('is-detail-view'), 340);
    });

    inner?.addEventListener('pointermove', event => {
      if (!detailStart) return;
      const dx = event.clientX - detailStart.x;
      const dy = event.clientY - detailStart.y;
      if (!lightbox.classList.contains('is-detail-view') && Math.hypot(dx, dy) > 12) clearDetailHold();
      if (lightbox.classList.contains('is-detail-view')) {
        const rect = inner.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        inner.style.setProperty('--detail-x', `${50 + (0.5 - x) * 32}%`);
        inner.style.setProperty('--detail-y', `${50 + (0.5 - y) * 32}%`);
      }
    });

    function finishDetail(event) {
      if (!detailStart) return;
      clearDetailHold();
      const dx = event.clientX - detailStart.x;
      const wasDetail = lightbox.classList.contains('is-detail-view');
      lightbox.classList.remove('is-detail-view');
      inner?.releasePointerCapture?.(detailStart.pointerId);
      detailStart = null;
      if (!wasDetail && Math.abs(dx) > 54) showAdjacent(dx < 0 ? 1 : -1);
    }

    inner?.addEventListener('pointerup', finishDetail);
    inner?.addEventListener('pointercancel', event => {
      clearDetailHold();
      lightbox.classList.remove('is-detail-view');
      detailStart = null;
    });
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLook();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLook();
      if (event.key === 'ArrowLeft' && lightbox.classList.contains('is-open')) showAdjacent(-1);
      if (event.key === 'ArrowRight' && lightbox.classList.contains('is-open')) showAdjacent(1);
    });
  }

  // ---- WORK 05 · SENSORY INTERACTIONS ----
  function initWork5SensoryInteractions() {
    if (!document.body.classList.contains('work-5-page')) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hero = document.querySelector('.w5-hero');
    const heroImage = hero?.querySelector('.w5-hero-visual img');
    const logo = hero?.querySelector('.w5-title-logo img');
    const filmFrame = document.querySelector('.w5-film-frame');
    const video = document.getElementById('projectVideo');
    const filmCue = document.querySelector('[data-scroll-lineup]');
    const lineup = document.querySelector('[data-w5-lineup]');
    const lineupCaption = lineup?.querySelector('.w5-lineup-caption');
    const hotspots = Array.from(lineup?.querySelectorAll('[data-look-index]') || []);

    if (!reducedMotion && finePointer && hero && heroImage) {
      hero.addEventListener('pointermove', event => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        heroImage.style.setProperty('--sense-x', `${(x - 0.5) * 16}px`);
        heroImage.style.setProperty('--sense-y', `${(y - 0.5) * 11}px`);
        hero.style.setProperty('--hero-glow-x', `${x * 100}%`);
        hero.style.setProperty('--hero-glow-y', `${y * 100}%`);
        if (logo) logo.style.setProperty('--logo-breath-speed', `${5.6 - Math.min(2.2, Math.hypot(x - 0.5, y - 0.5) * 4)}s`);
      });
      hero.addEventListener('pointerleave', () => {
        heroImage.style.setProperty('--sense-x', '0px');
        heroImage.style.setProperty('--sense-y', '0px');
      });
    }

    if (filmFrame && !reducedMotion) {
      new IntersectionObserver(entries => entries.forEach(entry => filmFrame.classList.toggle('is-in-view', entry.isIntersecting)), { threshold: 0.28 }).observe(filmFrame);
    } else filmFrame?.classList.add('is-in-view');

    video?.addEventListener('play', () => filmCue?.classList.remove('is-visible'));
    video?.addEventListener('ended', () => filmCue?.classList.add('is-visible'));
    filmCue?.addEventListener('click', () => lineup?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }));

    if (lineup && !reducedMotion) {
      new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-revealed', entry.isIntersecting)), { threshold: 0.24 }).observe(lineup);
    } else lineup?.classList.add('is-revealed');

    hotspots.forEach(hotspot => {
      const activate = () => {
        lineup?.classList.add('is-exploring');
        lineup?.style.setProperty('--lineup-x', hotspot.style.getPropertyValue('--spot-x'));
        lineup?.style.setProperty('--lineup-y', hotspot.style.getPropertyValue('--spot-y'));
        if (lineupCaption) {
          lineupCaption.querySelector('span').textContent = hotspot.dataset.label || 'LOOK';
          lineupCaption.querySelector('small').textContent = hotspot.dataset.description || '';
        }
      };
      hotspot.addEventListener('pointerenter', activate);
      hotspot.addEventListener('focus', activate);
      hotspot.addEventListener('click', () => {
        const target = document.querySelector(`.w5-look[data-look-index="${hotspot.dataset.lookIndex}"]`);
        target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center', inline: 'center' });
      });
    });
    lineup?.addEventListener('pointerleave', () => {
      lineup.classList.remove('is-exploring');
      if (lineupCaption) {
        lineupCaption.querySelector('span').textContent = 'MOVE ACROSS THE LINE UP';
        lineupCaption.querySelector('small').textContent = '移动探索六套造型';
      }
    });

    if (!reducedMotion && finePointer) {
      let lastTrail = 0;
      document.addEventListener('pointermove', event => {
        const now = performance.now();
        if (now - lastTrail < 52 || document.body.classList.contains('w5-look-open')) return;
        lastTrail = now;
        const mist = document.createElement('span');
        mist.className = 'w5-cursor-mist';
        mist.style.left = `${event.clientX}px`;
        mist.style.top = `${event.clientY}px`;
        document.body.appendChild(mist);
        mist.addEventListener('animationend', () => mist.remove(), { once: true });
      }, { passive: true });
    }
  }

  // ---- WORK 02 · DIGITAL STAGE ----
  function initWork2DigitalStage() {
    if (!document.body.classList.contains('work-2-page')) return;
    document.body.classList.add('w2-stage-ready');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hero = document.querySelector('.w2-hero');
    const heroBackdrop = hero?.querySelector('.w2-hero-backdrop img');
    const heroCopy = hero?.querySelector('.w2-hero-copy');
    const railLinks = Array.from(document.querySelectorAll('[data-w2-act-link]'));
    const actSections = Array.from(document.querySelectorAll('[data-w2-act-section]'));
    const lineup = document.querySelector('[data-w2-lineup]');
    const characterLabel = lineup?.querySelector('.w2-character-label');
    const characterButtons = Array.from(lineup?.querySelectorAll('[data-character]') || []);
    const editorialItems = Array.from(document.querySelectorAll('.w2-editorial-item'));
    const reveals = Array.from(document.querySelectorAll('.w2-act-marker, .w2-spread, .w2-lineup-intro, .w2-editorial-item'));

    if (hero && finePointer && !reducedMotion) {
      hero.addEventListener('pointermove', event => {
        const rect = hero.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        hero.style.setProperty('--stage-x', `${x * 100}%`);
        hero.style.setProperty('--stage-y', `${y * 100}%`);
        heroBackdrop?.style.setProperty('--stage-shift-x', `${(x - 0.5) * 10}px`);
        heroBackdrop?.style.setProperty('--stage-shift-y', `${(y - 0.5) * 6}px`);
      });
    }

    if (hero && !reducedMotion) {
      let ticking = false;
      const updateHeroScroll = () => {
        const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight * 0.8)));
        heroCopy?.style.setProperty('--w2-scroll', progress.toFixed(3));
        ticking = false;
      };
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateHeroScroll);
      }, { passive: true });
      updateHeroScroll();
    }

    const actObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const act = entry.target.dataset.w2ActSection;
        railLinks.forEach(link => {
          const active = link.dataset.w2ActLink === act;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    actSections.forEach(section => actObserver.observe(section));

    railLinks.forEach(link => link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }));

    if (!reducedMotion) {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-on-stage');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      reveals.forEach(element => revealObserver.observe(element));
    } else reveals.forEach(element => element.classList.add('is-on-stage'));

    characterButtons.forEach((button, index) => {
      const activate = () => {
        lineup?.classList.add('is-casting');
        lineup?.style.setProperty('--character-x', `${Number.parseFloat(button.style.getPropertyValue('--character-left')) || 50}%`);
        if (characterLabel) characterLabel.innerHTML = `CHARACTER ${button.dataset.character} <small>角色 ${button.dataset.character}</small>`;
      };
      button.addEventListener('pointerenter', activate);
      button.addEventListener('focus', activate);
      button.addEventListener('click', () => {
        const target = editorialItems[Math.min(editorialItems.length - 1, index + 2)];
        if (!target) return;
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        target.classList.add('is-character-target');
        window.setTimeout(() => target.classList.remove('is-character-target'), 1200);
      });
    });
    lineup?.addEventListener('pointerleave', () => {
      lineup.classList.remove('is-casting');
      if (characterLabel) characterLabel.innerHTML = 'SELECT A CHARACTER <small>选择一个角色</small>';
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
    initWork5SensoryInteractions();
    initWork2DigitalStage();
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
