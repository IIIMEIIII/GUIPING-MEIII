(function () {
  const revealItems = document.querySelectorAll('.bag-reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const lightbox = document.createElement('div');
  lightbox.className = 'bag-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = '<div class="bag-lightbox-bar"><span>Portfolio spread · scroll to inspect</span><button class="bag-lightbox-close" type="button">CLOSE ×</button></div><div class="bag-lightbox-stage"><img alt="Expanded portfolio spread" /></div>';
  document.body.appendChild(lightbox);
  const lightboxImg = lightbox.querySelector('img');
  const closeButton = lightbox.querySelector('.bag-lightbox-close');

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('bag-lightbox-open');
    window.setTimeout(() => { lightboxImg.removeAttribute('src'); }, 260);
  };
  document.querySelectorAll('[data-bag-zoom]').forEach((item) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    const open = () => {
      const image = item.querySelector('img');
      if (!image) return;
      lightboxImg.src = image.currentSrc || image.src;
      lightboxImg.alt = image.alt || 'Expanded portfolio spread';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('bag-lightbox-open');
      closeButton.focus();
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });
  closeButton.addEventListener('click', closeLightbox);
  lightboxImg.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeLightbox(); });

  document.querySelectorAll('[data-bag-rail]').forEach((rail) => {
    const wrap = rail.closest('.bag-process-wrap') || rail.parentElement;
    const previous = wrap.querySelector('[data-rail-prev]');
    const next = wrap.querySelector('[data-rail-next]');
    const step = () => {
      const card = rail.querySelector('.bag-process-card');
      return card ? card.getBoundingClientRect().width + 26 : rail.clientWidth * 0.72;
    };
    previous?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  });

  document.querySelectorAll('[data-bag-switcher]').forEach((switcher) => {
    const stage = switcher.querySelector('.bag-switcher-stage');
    const image = stage?.querySelector('img');
    const caption = stage?.querySelector('.bag-switcher-caption');
    const note = stage?.querySelector('.bag-switcher-note');
    const buttons = Array.from(switcher.querySelectorAll('.bag-switcher-button'));
    if (!stage || !image || !buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.classList.contains('is-active')) return;
        buttons.forEach((item) => item.classList.toggle('is-active', item === button));
        stage.classList.add('is-changing');
        window.setTimeout(() => {
          image.src = button.dataset.switchSrc || image.src;
          image.alt = button.dataset.switchAlt || button.textContent.trim();
          if (caption) caption.textContent = button.dataset.switchCaption || button.textContent.trim();
          if (note) note.textContent = button.dataset.switchNote || '';
          stage.classList.remove('is-changing');
        }, 160);
      });
    });
  });

  const navLinks = Array.from(document.querySelectorAll('.bag-chapter-nav a[href^="#"]'));
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const indicator = document.createElement('div');
  indicator.className = 'bag-section-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  indicator.innerHTML = '<div class="bag-section-indicator-track"><div class="bag-section-indicator-fill"></div></div><div class="bag-section-indicator-copy"><strong>01 / ' + String(Math.max(sections.length, 1)).padStart(2, '0') + '</strong><span>' + (navLinks[0]?.textContent.replace(/^\s*\d+\s*/, '') || 'Project') + '</span></div>';
  document.body.appendChild(indicator);
  const indicatorNumber = indicator.querySelector('strong');
  const indicatorLabel = indicator.querySelector('span');

  const updatePageProgress = () => {
    const hero = document.querySelector('.work-hero');
    const start = hero ? hero.offsetHeight * 0.72 : 320;
    const range = Math.max(document.documentElement.scrollHeight - window.innerHeight - start, 1);
    const progress = Math.min(1, Math.max(0, (window.scrollY - start) / range));
    indicator.style.setProperty('--bag-page-progress', progress.toFixed(4));
    indicator.classList.toggle('is-visible', window.scrollY > start);
  };
  updatePageProgress();
  window.addEventListener('scroll', updatePageProgress, { passive: true });

  if (sections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeIndex = sections.indexOf(entry.target);
        navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id));
        if (indicatorNumber) indicatorNumber.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(sections.length).padStart(2, '0');
        if (indicatorLabel) indicatorLabel.textContent = navLinks[activeIndex]?.textContent.replace(/^\s*\d+\s*/, '') || entry.target.id;
      });
    }, { rootMargin: '-34% 0px -58% 0px', threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }
})();
