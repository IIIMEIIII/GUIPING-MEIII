/**
 * main.js — GUIPING MEI Portfolio
 * - Loader
 * - Nav (always transparent)
 * - GUIPING MEI name 3D mouse-follow rotation
 * - Works carousel (dial-style)
 * - Album box + audio player
 * - Scroll reveal
 * - Custom cursor
 * - Parallax / magnetic button
 */

(function() {
  'use strict';

  // -------- CURSOR --------
  function initCursor() {
    if ('ontouchstart' in window) return;
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(cursor);
    document.body.appendChild(ring);

    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });
    (function moveRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(moveRing);
    })();

    const hoverEls = document.querySelectorAll('a, button, .vtl-item, .vinyl-wrap, .dial-item, #threeCanvas');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); ring.classList.add('hover'); });
      el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); ring.classList.remove('hover'); });
    });
  }

  // -------- LOADER --------
  function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
    }, 2200);
  }

  // -------- NAV (always transparent, only mobile menu) --------
  function initNav() {
    const nav = document.getElementById('nav');
    const menuBtn = document.getElementById('navMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    if (!nav) return;

    // Keep scrolled class for JS consumers but nav CSS ignores bg
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));

    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        menuBtn.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          menuBtn.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }
  }

  // -------- NAME 3D ROTATION --------
  function initName3D() {
    const nameEl = document.getElementById('heroName3d');
    if (!nameEl || 'ontouchstart' in window) return;

    const chars = nameEl.querySelectorAll('span');
    const heroSection = document.getElementById('hero');

    window.addEventListener('mousemove', (e) => {
      if (!heroSection) return;
      const rect = heroSection.getBoundingClientRect();
      // Only when mouse is over hero
      if (e.clientY > rect.bottom) return;
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2); // -1 to 1
      const dy = (e.clientY - cy) / (rect.height / 2); // -1 to 1

      chars.forEach((ch, i) => {
        const offset = (i - chars.length / 2) * 0.08;
        const rotY = dx * 30 + offset * 10;
        const rotX = -dy * 20;
        ch.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
      });
    });

    // Reset on mouse leave
    heroSection && heroSection.addEventListener('mouseleave', () => {
      chars.forEach(ch => { ch.style.transform = 'rotateY(0deg) rotateX(0deg)'; });
    });
  }

  // -------- WORKS DIAL --------
  function initWorksDial() {
    const stage    = document.getElementById('dialStage');
    const dotsEl   = document.getElementById('dialDots');
    const dipNum   = document.getElementById('dipNum');
    const dipTitle = document.getElementById('dipTitle');
    const dipCat   = document.getElementById('dipCat');
    if (!stage) return;

    const WORKS = [
      { num:'01', title:'The Sensitive Monsterology',   cat:'Fashion design · 2026',                          href:'work-5.html',  img:'images/work-5.jpg' },
      { num:'02', title:'Serotonin V: Selves',          cat:'Fashion design draping · 2026',                  href:'work-1.html',  img:'images/work-1.jpg' },
      { num:'03', title:'Stay On Stage',                cat:'Fashion design · 2025',                          href:'work-2.html',  img:'images/work-2.jpg' },
      { num:'04', title:'Bliss Naked',                  cat:'Wearable Bag Design · 2024',                     href:'work-3.html',  img:'images/work-3.jpg' },
      { num:'05', title:'Acupuncture',                  cat:'Wearable Bag And Accessory Design · 2024',       href:'work-4.html',  img:'images/work-4.jpg' },
      { num:'06', title:'Am I Wasting The Cruelty?',   cat:'AI Video · 2026',                                href:'work-6.html',  img:'images/work-6-cover.jpg',  video:'videos/work-6.mp4' },
      { num:'07', title:'AI Project × Martine Rose',   cat:'AI Video · 2025',                                href:'work-7.html',  img:'images/work-7.jpg',  video:'videos/work-7.mp4' },
      { num:'08', title:'Clang & Clattered',            cat:'Handkerchiefs and Kimono-Inspired Print · 2025', href:'work-8.html',  img:'images/work-6.jpg' },
      { num:'09', title:'Rust',                         cat:'Textile design · 2024',                          href:'work-9.html',  img:'images/work-7.jpg' },
      { num:'10', title:'Help Me Out A Little!',        cat:'Bag Design · 2023',                              href:'work-10.html', img:'images/work-8.jpg' },
      { num:'11', title:'Infinite Loop',                cat:'Fashion Research · 2022',                        href:'work-11.html', img:'images/work-9.jpg' },
      { num:'12', title:'Leather Craftsmanship',        cat:'Craft · 2023',                                   href:'work-12.html', img:'images/work-13.jpg' },
      { num:'13', title:'Metalworking',                 cat:'Craft · 2026',                                   href:'work-13.html', img:'images/work-12.jpg' },
    ];
    const N = WORKS.length;

    // offset: 当前选中的 index（可以是小数，用于平滑过渡）
    // offset=0 → item0 在正中央
    let offset = 0;   // current displayed (float)
    let targetOffset = 0;
    let raf = null;
    let dragging = false;
    let dragDelta = 0;
    let velY = 0, lastY = 0, lastT = 0;

    // ── 创建图片/视频元素 ──
    const els = WORKS.map((w, i) => {
      const el = document.createElement('div');
      el.className = 'dial-item';
      if (w.video) {
  // 视频封面：叠加img作为poster兜底（解决iOS黑屏问题）
  el.innerHTML = `<div class="dial-item-img" style="position:relative;">
    <video src="${w.video}" muted loop playsinline webkit-playsinline
      poster="${w.img}"
      style="width:100%;height:100%;object-fit:cover;display:block;border-radius:4px;position:absolute;inset:0;"
    ></video>
    <img src="${w.img}" alt="${w.title}"
      class="dial-video-poster"
      style="width:100%;height:100%;object-fit:cover;display:block;border-radius:4px;position:absolute;inset:0;transition:opacity 0.3s;"
    />
  </div>`;

      } else {
        el.innerHTML = `<div class="dial-item-img"><img src="${w.img}" alt="${w.title}" loading="eager"/></div>`;
      }
      el.addEventListener('click', () => {
        if (dragDelta < 8) window.location.href = w.href;
      });
      stage.appendChild(el);
      return el;
    });

    // ── dots ──
    if (dotsEl) {
      dotsEl.innerHTML = '';
      WORKS.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'dial-dot';
        d.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(d);
      });
    }
    const getDots = () => dotsEl ? Array.from(dotsEl.querySelectorAll('.dial-dot')) : [];

    // ── 渲染核心 ──
    // 思路：以 stage 为坐标系
    //   - 圆心在 stage 右侧之外：cx = sw + R*0.3
    //   - 图片排在圆的左半弧（cos<0 区域），即 stage 左侧可见区域
    //   - item i 的角度 = π - (i - offset) * arcStep
    //     当 i=offset 时 angle=π → cos(π)=-1 → px = cx - R （最左，最大最亮）
    //     其他 item 角度偏离π，cos 变大，px 向右移动，透明度减小
    function render() {
      const sw = stage.offsetWidth  || window.innerWidth;
      const sh = stage.offsetHeight || window.innerHeight * 0.7;

      // 圆盘半径
      const R = sh * 0.95;
      // 圆心在 stage 右侧之外
      const cx = sw + R * 0.12;
      const cy = sh * 0.5;

      // 相邻 item 间的角间距（弧度）
      const arcStep = Math.PI / 5; // 36°

      // 基础图片尺寸 — 竖构图（宽:高 = 1:1.45），缩小到 2/3
      const baseW = Math.min(sw * 0.85 * (2/3), 427);
      const baseH = baseW * 1.45;

      let activeIdx = Math.round(offset);
      activeIdx = ((activeIdx % N) + N) % N;

      els.forEach((el, i) => {
        // item i 相对于当前 offset 的偏移量（带方向）
        // 取最短绕行距离
        let d = i - offset;
        // 归一化到 [-N/2, N/2]
        while (d >  N / 2) d -= N;
        while (d < -N / 2) d += N;

        // 只渲染距离中心 ±1.5 格以内的 item
        if (Math.abs(d) > 1.8) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.classList.remove('active');
          return;
        }

        // 角度：d=0 → angle=π（正左）；d>0 → angle>π（偏下）；d<0 → angle<π（偏上）
        const angle = Math.PI - d * arcStep;

        // 圆弧坐标（以 stage 为原点）
        const px = cx + R * Math.cos(angle);  // 因 cos(π)=-1，px = cx-R （在stage左侧）
        const py = cy + R * Math.sin(angle);  // sin(π)=0，中心竖直居中

        // 缩放和透明度：d=0 最大
        const absd = Math.abs(d);
        const t = Math.max(0, 1 - absd);      // 1 → 0
        const sc = 0.52 + 0.48 * t;
        const al = 0.15 + 0.85 * t;

        const imgW = baseW * sc;
        const imgH = baseH * sc;

        el.style.opacity       = al.toFixed(3);
        el.style.pointerEvents = al > 0.25 ? 'all' : 'none';
        el.style.width         = imgW + 'px';
        el.style.left          = (px - imgW / 2) + 'px';
        el.style.top           = (py - imgH / 2) + 'px';
        el.style.zIndex        = Math.round(t * 10);
        el.querySelector('.dial-item-img').style.width  = imgW + 'px';
        el.querySelector('.dial-item-img').style.height = imgH + 'px';
        const isActive = absd < 0.5;
        el.classList.toggle('active', isActive);

        // 视频：active时播放并隐藏poster图，否则暂停并显示poster图（解决iOS黑屏）
        const vid = el.querySelector('video');
        const posterImg = el.querySelector('.dial-video-poster');
        if (vid) {
          if (isActive) {
            vid.play().catch(() => {});
            if (posterImg) posterImg.style.opacity = '0';
          } else {
            vid.pause();
            vid.currentTime = 0;
            if (posterImg) posterImg.style.opacity = '1';
          }
        }

      });

      // info panel
      const wi = WORKS[activeIdx];
      if (dipNum)   dipNum.textContent   = wi.num;
      if (dipTitle) dipTitle.textContent = wi.title;
      if (dipCat)   dipCat.textContent   = wi.cat;
      getDots().forEach((dot, i) => dot.classList.toggle('active', i === activeIdx));
    }

    // ── easing 动画 ──
    function animate() {
      const diff = targetOffset - offset;
      offset += diff * 0.1;
      render();
      if (Math.abs(diff) > 0.002) {
        raf = requestAnimationFrame(animate);
      } else {
        offset = targetOffset;
        render();
      }
    }
    function kick() { cancelAnimationFrame(raf); raf = requestAnimationFrame(animate); }

    function snapNearest() {
      targetOffset = Math.round(offset);
      kick();
    }

    function goTo(idx) {
      let diff = idx - targetOffset;
      while (diff >  N / 2) diff -= N;
      while (diff < -N / 2) diff += N;
      targetOffset += diff;
      kick();
    }

    // ── 拖拽（上下拖动 → 转动） ──
    function pDown(y) {
      dragging  = true;
      dragDelta = 0;
      velY = 0; lastY = y; lastT = performance.now();
      cancelAnimationFrame(raf);
    }
    function pMove(y) {
      if (!dragging) return;
      const now = performance.now();
      const dy  = y - lastY;
      velY = dy / Math.max(now - lastT, 1);
      dragDelta += Math.abs(dy);
      // 向下拖 → offset 增大（往下一项）
      offset        += dy * 0.008;
      targetOffset   = offset;
      lastY = y; lastT = now;
      render();
    }
    function pUp() {
      if (!dragging) return;
      dragging = false;
      targetOffset = offset - velY * 80 * 0.008;
      kick();
      setTimeout(snapNearest, 550);
    }

    stage.addEventListener('mousedown',  e => { pDown(e.clientY); e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (dragging) pMove(e.clientY); });
    window.addEventListener('mouseup',   () => pUp());
    stage.addEventListener('touchstart', e => pDown(e.touches[0].clientY), { passive: true });
    stage.addEventListener('touchmove',  e => { pMove(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
    stage.addEventListener('touchend',   () => pUp());

    // 滚轮
    const wrap = document.getElementById('worksDialWrap');
    if (wrap) {
      let wt = 0;
      wrap.addEventListener('wheel', e => {
        e.preventDefault();
        const d = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
        targetOffset += d * 0.004;
        kick();
        clearTimeout(wt);
        wt = setTimeout(snapNearest, 400);
      }, { passive: false });
    }

    // 键盘
    window.addEventListener('keydown', e => {
      const sec = document.getElementById('works');
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) return;
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  goTo(Math.round(targetOffset) - 1);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goTo(Math.round(targetOffset) + 1);
    });

    window.addEventListener('resize', render);

    // ── 初始化 ──
    goTo(0);
  }

  // -------- SOUND WIDGET · 黑胶唱片版 --------
  function initAlbumPlayer() {
    const ALBUMS = [
      { title: 'NANCY TRIES TO TAKE THE NIGHT', src: 'audio/track-01.mp3', img: 'images/album/album-2.jpg' },
      { title: 'MEMORIES AND DREAMS',           src: 'audio/track-02.mp3', img: 'images/album/album-1.jpg' },
      { title: 'BIOSPHERE',                     src: 'audio/biosphere-ha.mp3', img: 'images/album/album-3.jpg' },
      { title: '暗叫',                           src: 'audio/track-04.mp3', img: 'images/album/album-4.jpg' },
    ];

    const audio      = document.getElementById('albumAudio');
    const vinylDisc  = document.getElementById('vinylDisc');
    const vinylArmWrap = document.getElementById('vinylArmWrap');
    const vinylLabelImg = document.getElementById('vinylLabelImg');
    const tracklist  = document.getElementById('vinylTracklist');
    const vtlItems   = document.querySelectorAll('.vtl-item');
    const swStatus   = document.getElementById('swStatus');
    const swFill     = document.getElementById('swProgFill');
    const swBar      = document.getElementById('swProgBar');
    const swCur      = document.getElementById('swCurTime');
    const swTot      = document.getElementById('swTotTime');

    if (!audio || !vinylDisc) return;

    let currentIdx  = -1;
    let isPlaying   = false;
    let listOpen    = false;
    let spinAngle   = 0;
    let spinRaf     = null;

    function formatTime(s) {
      const m = Math.floor(s / 60);
      return `${m}:${Math.floor(s % 60).toString().padStart(2,'0')}`;
    }

    // 唱片持续旋转
    function startSpin() {
      if (spinRaf) return;
      let last = performance.now();
      function step(now) {
        const dt = now - last; last = now;
        spinAngle = (spinAngle + dt * 0.06) % 360;   // ~1 转/10s
        vinylDisc.style.transform = `rotate(${spinAngle}deg)`;
        spinRaf = requestAnimationFrame(step);
      }
      spinRaf = requestAnimationFrame(step);
      vinylDisc.classList.add('spinning');
    }
    function stopSpin() {
      if (spinRaf) { cancelAnimationFrame(spinRaf); spinRaf = null; }
      vinylDisc.classList.remove('spinning');
    }

    // 唱针落下/抬起
    function needleDrop()  { vinylArmWrap && vinylArmWrap.classList.add('dropped'); }
    function needleLift()  { vinylArmWrap && vinylArmWrap.classList.remove('dropped'); }

    // 切换曲目列表
    function toggleList() {
      listOpen = !listOpen;
      if (tracklist) tracklist.classList.toggle('open', listOpen);
    }

    // 更新封面
    function updateLabel(img) {
      if (vinylLabelImg) vinylLabelImg.src = img;
    }

    // 高亮当前曲目
    function setActiveTrack(idx) {
      vtlItems.forEach(item => {
        item.classList.toggle('vtl-active', parseInt(item.dataset.idx) === idx);
      });
    }

    function doPlay() {
      if (!ALBUMS[currentIdx] || !ALBUMS[currentIdx].src) return;
      audio.play().then(() => {
        isPlaying = true;
        startSpin();
        needleDrop();
        if (swStatus) swStatus.textContent = '▶';
      }).catch(() => {});
    }

    function playAlbum(idx) {
      const alb = ALBUMS[idx];
      if (idx === currentIdx) {
        if (isPlaying) {
          audio.pause(); isPlaying = false;
          stopSpin(); needleLift();
          if (swStatus) swStatus.textContent = '';
        } else { doPlay(); }
        return;
      }
      audio.pause(); isPlaying = false;
      stopSpin(); needleLift();
      currentIdx = idx;
      if (swFill) swFill.style.width = '0%';
      if (swCur)  swCur.textContent  = '0:00';
      if (swTot)  swTot.textContent  = '0:00';
      if (swStatus) swStatus.textContent = '';
      updateLabel(alb.img);
      setActiveTrack(idx);

      if (alb.src) {
        audio.src = alb.src; audio.load(); doPlay();
      } else {
        audio.src = '';
        if (swStatus) { swStatus.style.color = 'rgba(204,17,17,0.9)'; swStatus.textContent = 'SOON'; }
        setTimeout(() => { if (swStatus) swStatus.textContent = ''; }, 1600);
      }
    }

    // 点击唱片本体 → 展开/收起曲目列表
    const vinylWrap = document.getElementById('vinylWrap');
    vinylWrap && vinylWrap.addEventListener('click', (e) => {
      // 如果点在 tracklist 上则不触发
      if (tracklist && tracklist.contains(e.target)) return;
      toggleList();
    });

    // 点击曲目条目
    vtlItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        playAlbum(parseInt(item.dataset.idx));
      });
    });

    // 进度条点击
    swBar && swBar.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!audio.duration) return;
      const rect = swBar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      if (swFill) swFill.style.width = pct + '%';
      if (swCur)  swCur.textContent  = formatTime(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => {
      if (swTot) swTot.textContent = formatTime(audio.duration);
    });
    audio.addEventListener('ended', () => {
      isPlaying = false; stopSpin(); needleLift();
      if (swStatus) swStatus.textContent = '';
      if (swFill) swFill.style.width = '0%';
    });
  }

  // -------- ABOUT PHOTO · 3D tilt + film grain --------
  function initAboutPhoto() {
    const wrap  = document.getElementById('aboutPhotoWrap');
    const frame = document.getElementById('apFrame');
    const img   = document.getElementById('apImg');
    const grain = document.getElementById('apGrain');
    if (!wrap || !frame || !grain) return;

    // ── Film grain canvas ──
    const gctx = grain.getContext('2d');
    function resizeGrain() {
      grain.width  = wrap.offsetWidth;
      grain.height = wrap.offsetHeight;
    }
    resizeGrain();
    window.addEventListener('resize', resizeGrain);

    function drawGrain() {
      const w = grain.width, h = grain.height;
      const imgData = gctx.createImageData(w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255 | 0;
        data[i] = data[i+1] = data[i+2] = v;
        data[i+3] = 28;  // very subtle
      }
      gctx.putImageData(imgData, 0, 0);
      requestAnimationFrame(drawGrain);
    }
    drawGrain();

    // ── 3D tilt on mouse move ──
    const MAX_TILT = 10; // degrees
    wrap.addEventListener('mousemove', e => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);  // -1 … 1
      const dy = (e.clientY - cy) / (rect.height / 2);  // -1 … 1
      const rotX = -dy * MAX_TILT;
      const rotY =  dx * MAX_TILT;
      frame.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
      // subtle inner-image parallax shift
      if (img) img.style.transform = `translate(${dx * -6}px, ${dy * -6}px) scale(1.07)`;
    });
    wrap.addEventListener('mouseleave', () => {
      frame.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
      if (img) img.style.transform = 'translate(0,0) scale(1)';
    });
  }

  // -------- SCROLL REVEAL --------
  function initScrollReveal() {
    const targets = [
      '.section-header', '.about-text', '.about-3d-wrap',
      '.contact-cta', '.contact-social',
    ];
    targets.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.classList.add('reveal'));
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 6) * 0.07}s`;
      io.observe(el);
    });
  }

  // -------- MODAL (fallback for 3D card click on works 5-8) --------
  function initModal() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    if (!overlay) return;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    closeBtn && closeBtn.addEventListener('click', closeModal);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    function closeModal() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
    // Expose for three-scene
    window.__openModal = (data) => {
      const content = document.getElementById('modalContent');
      if (!content) return;
      content.innerHTML = `
        <div class="modal-work-tag">${esc(data.category)} · ${esc(data.year)}</div>
        <h3>${esc(data.title)}</h3>
        <p>${esc(data.desc || '')}</p>
        <div class="modal-tags"><span>${esc(data.category)}</span><span>${esc(data.year)}</span></div>
      `;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  }

  // -------- MAGNETIC CONTACT BUTTON --------
  function initMagneticBtn() {
    const btn = document.querySelector('.contact-btn');
    if (!btn || 'ontouchstart' in window) return;
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width  / 2;
      const y = e.clientY - r.top  - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  }

  // -------- EXTRA CSS (modal tags etc.) --------
  function addExtraCSS() {
    const s = document.createElement('style');
    s.textContent = `
      .modal-work-tag { font-size:.65rem;letter-spacing:.2em;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:16px;font-weight:600; }
      .modal-tags { display:flex;gap:10px;margin-top:28px; }
      .modal-tags span { font-size:.65rem;letter-spacing:.12em;padding:6px 14px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.45); }
    `;
    document.head.appendChild(s);
  }

  // -------- INIT --------
  function init() {
    addExtraCSS();
    initLoader();
    initNav();
    initName3D();
    initScrollReveal();
    initModal();
    initCursor();
    initMagneticBtn();
    initWorksDial();
    initAlbumPlayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
