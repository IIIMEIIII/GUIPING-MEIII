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

  const navLinks = Array.from(document.querySelectorAll('.bag-chapter-nav a[href^="#"]'));
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-34% 0px -58% 0px', threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }
})();
