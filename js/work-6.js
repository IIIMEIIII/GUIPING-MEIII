(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const heroVideo = $('.w6-hero-video');
  const soundButton = $('.w6-sound');
  if (heroVideo && soundButton) {
    soundButton.addEventListener('click', () => {
      heroVideo.muted = !heroVideo.muted;
      soundButton.setAttribute('aria-pressed', String(!heroVideo.muted));
      $('span', soundButton).textContent = heroVideo.muted ? 'SOUND OFF' : 'SOUND ON';
      $('small', soundButton).textContent = heroVideo.muted ? '声音关闭' : '声音开启';
      if (heroVideo.paused) heroVideo.play().catch(() => {});
    });
  }

  const ethics = $('#w6Ethics');
  const dilemmaStage = $('.w6-dilemma-stage');
  const dilemmaTitle = $('#w6DilemmaTitle');
  const dilemmaMessages = [
    [30, 'A BODY CANNOT BECOME NEUTRAL.'],
    [70, 'THE MATERIAL STILL REMEMBERS.'],
    [101, 'UTILITY CAN MAKE VIOLENCE INVISIBLE.']
  ];
  const setEthics = (value) => {
    if (!dilemmaStage || !dilemmaTitle) return;
    const amount = clamp(Number(value), 0, 100);
    dilemmaStage.style.setProperty('--split', `${amount}%`);
    dilemmaTitle.textContent = dilemmaMessages.find(([limit]) => amount < limit)[1];
    ethics.style.background = `linear-gradient(90deg,#111 ${amount}%,rgba(0,0,0,.18) ${amount}%)`;
  };
  if (ethics) {
    ethics.addEventListener('input', (event) => setEthics(event.target.value));
    setEthics(ethics.value);
  }

  const film = $('#w6FilmVideo');
  const screen = $('.w6-screen');
  const playButton = $('#w6Play');
  const playSmall = $('#w6PlaySmall');
  const timeline = $('#w6Timeline');
  const timeOutput = $('#w6Time');
  const formatTime = (seconds) => {
    const safe = Number.isFinite(seconds) ? seconds : 0;
    return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
  };
  const syncFilm = () => {
    if (!film || !timeline || !timeOutput) return;
    const progress = film.duration ? (film.currentTime / film.duration) * 1000 : 0;
    timeline.value = String(progress);
    timeline.style.background = `linear-gradient(90deg,#fff ${progress / 10}%,rgba(255,255,255,.18) ${progress / 10}%)`;
    timeOutput.value = `${formatTime(film.currentTime)} / ${formatTime(film.duration)}`;
    screen.classList.toggle('is-playing', !film.paused);
    playSmall.textContent = film.paused ? 'PLAY' : 'PAUSE';
  };
  const toggleFilm = () => {
    if (!film) return;
    if (film.paused) {
      if (heroVideo) heroVideo.pause();
      film.play().catch(() => {});
    } else film.pause();
  };
  if (film) {
    [playButton, playSmall, film].forEach((element) => element && element.addEventListener('click', toggleFilm));
    film.addEventListener('timeupdate', syncFilm);
    film.addEventListener('loadedmetadata', syncFilm);
    film.addEventListener('play', syncFilm);
    film.addEventListener('pause', syncFilm);
    film.addEventListener('ended', syncFilm);
    timeline.addEventListener('input', () => {
      if (film.duration) film.currentTime = (Number(timeline.value) / 1000) * film.duration;
    });
  }

  const archive = $('#w6ArchiveTrack');
  const archiveRange = $('#w6ArchiveRange');
  const prev = $('#w6ArchivePrev');
  const next = $('#w6ArchiveNext');
  let dragStart = 0;
  let dragScroll = 0;
  let dragging = false;
  let pointerMoved = false;
  const archiveMax = () => Math.max(0, archive.scrollWidth - archive.clientWidth);
  const syncArchive = () => {
    const max = archiveMax();
    const progress = max ? archive.scrollLeft / max : 0;
    archiveRange.value = String(progress * 1000);
    archiveRange.style.background = `linear-gradient(90deg,#fff ${progress * 100}%,rgba(255,255,255,.18) ${progress * 100}%)`;
  };
  const stepArchive = (direction) => archive.scrollBy({ left: archive.clientWidth * .8 * direction, behavior: 'smooth' });
  if (archive && archiveRange) {
    archive.addEventListener('scroll', syncArchive, { passive: true });
    archive.addEventListener('pointerdown', (event) => {
      dragging = true;
      pointerMoved = false;
      dragStart = event.clientX;
      dragScroll = archive.scrollLeft;
    });
    archive.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      if (Math.abs(event.clientX - dragStart) > 6) pointerMoved = true;
      archive.scrollLeft = dragScroll - (event.clientX - dragStart);
    });
    const stopDragging = () => { dragging = false; };
    archive.addEventListener('pointerup', stopDragging);
    archive.addEventListener('pointercancel', stopDragging);
    archive.addEventListener('pointerleave', stopDragging);
    archive.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') stepArchive(1);
      if (event.key === 'ArrowLeft') stepArchive(-1);
    });
    archiveRange.addEventListener('input', () => { archive.scrollLeft = archiveMax() * (Number(archiveRange.value) / 1000); });
    prev.addEventListener('click', () => stepArchive(-1));
    next.addEventListener('click', () => stepArchive(1));
    syncArchive();
  }

  const lensStage = $('#w6LensStage');
  const lens = $('.w6-lens');
  if (lensStage && lens) {
    lensStage.addEventListener('pointermove', (event) => {
      const rect = lensStage.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      lensStage.style.setProperty('--x', `${x * 100}%`);
      lensStage.style.setProperty('--y', `${y * 100}%`);
      lensStage.style.setProperty('--bx', `${x * 100}%`);
      lensStage.style.setProperty('--by', `${y * 100}%`);
    });
  }

  const lightbox = $('#w6Lightbox');
  const lightboxImage = $('img', lightbox);
  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  $$('.w6-archive-track figure').forEach((figure) => {
    figure.setAttribute('role', 'button');
    figure.setAttribute('tabindex', '0');
    const open = () => {
      const source = $('img', figure);
      const caption = $('figcaption', figure);
      lightboxImage.src = source.currentSrc || source.src;
      lightboxImage.alt = source.alt;
      $('p span', lightbox).textContent = $('span', caption).textContent;
      $('p small', lightbox).textContent = $('small', caption).textContent;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      $('.w6-lightbox-close', lightbox).focus();
    };
    figure.addEventListener('click', () => { if (!pointerMoved) open(); });
    figure.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  $('.w6-lightbox-close', lightbox).addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox(); });

  const sections = $$('.w6-reveal');
  const chapterLinks = $$('.w6-chapters a');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    }), { threshold: .08 });
    sections.forEach((section) => revealObserver.observe(section));
    const chapterObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      chapterLinks.forEach((link) => link.classList.toggle('is-active', link.hash === `#${entry.target.id}`));
    }), { rootMargin: '-40% 0px -50% 0px' });
    $$('#w6Opening,#w6Question,#w6Dilemma,#w6Film,#w6Archive,#w6Material').forEach((section) => chapterObserver.observe(section));
  } else sections.forEach((section) => section.classList.add('is-visible'));
})();
