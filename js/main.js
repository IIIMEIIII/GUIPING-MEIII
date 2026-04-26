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

  // 视频正放→倒放→正放循环
  // 第54–99行
const vid = document.getElementById('loaderVideo');
if (vid) {
  let revTimer = null;

    function playForward() {                      // ← 缩进统一整理
      if (revTimer) { clearInterval(revTimer); revTimer = null; }
      vid.playbackRate = 1;
      vid.currentTime = 0;
      vid.play().catch(() => {});                 // ← 加了 .catch()，手机报错不崩溃
    }

    function playReverse() {
      vid.pause();
      let t = vid.duration || 0;
      revTimer = setInterval(() => {
        t -= 0.033;
        if (t <= 0) {
          clearInterval(revTimer);
          revTimer = null;
          playForward();
        } else {
          vid.currentTime = t;
        }
      }, 33);
    }

    vid.addEventListener('ended', playReverse);
    // 手机端：等 canplay 后再播，避免缓冲未就绪调用 play() 失败
    if (vid.readyState >= 3) {                    // ← 新增：先判断是否已缓冲好
      vid.play().catch(() => {});
    } else {
      vid.addEventListener('canplay', () => {     // ← 新增：没缓冲好就等事件再播
        vid.play().catch(() => {});
      }, { once: true });
    }
  }

// 加载完成后显示 EXPLORE 按钮
const enterBtn = document.getElementById('loaderEnterBtn');


setTimeout(() => {
  if (enterBtn) {
    enterBtn.style.visibility = 'visible';
    enterBtn.style.opacity = '1';
    enterBtn.addEventListener('click', () => {

  const W = window.innerWidth;
  const H = window.innerHeight;

  // ── 1. 用 html2canvas 思路：直接用视频帧截图 ──
  // 因跨域限制无法直接读视频像素，改用"纯色分块"模拟像素风粒子
  const canvas = document.getElementById('loaderParticles');
  const ctx    = canvas.getContext('2d');
  canvas.width  = W;
  canvas.height = H;
  canvas.style.opacity = '1';

  // ── 2. 把整个 loader 当前画面画进 snapshot canvas ──
  const snap    = document.getElementById('loaderSnapshot');
  const sCtx    = snap.getContext('2d');
  const TILE    = 8;                         // 每个粒子代表 8×8px 区块
  const cols    = Math.ceil(W / TILE);
  const rows    = Math.ceil(H / TILE);
  snap.width    = W;
  snap.height   = H;

  // 先把 loader 背景色填满（视频无法跨域读取，用暗色打底）
  sCtx.fillStyle = '#0a0a0a';
  sCtx.fillRect(0, 0, W, H);
  // 在中心区域画白色矩形代表 loader-inner 区域（签名+文字+按钮）
  sCtx.fillStyle = 'rgba(255,255,255,0.06)';
  sCtx.fillRect(W/2 - 200, H/2 - 160, 400, 320);

  const imgData = sCtx.getImageData(0, 0, W, H);

  // ── 3. 生成粒子 ──
  const particles = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = col * TILE + TILE / 2;
      const py = row * TILE + TILE / 2;

      // 从截图读取颜色
      const idx = (Math.floor(py) * W + Math.floor(px)) * 4;
      const r = imgData.data[idx];
      const g = imgData.data[idx + 1];
      const b = imgData.data[idx + 2];

      // 距屏幕中心的方向向量（3D 散开感）
      const dx   = px - W / 2;
      const dy   = py - H / 2;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd = 0.6 + Math.random() * 2 + dist * 0.003;



      particles.push({
        x:  px, y: py,
        vx: (dx / dist) * spd * (0.25 + Math.random() * 0.3),
        vy: (dy / dist) * spd * (0.25 + Math.random() * 0.3),


        vz: -(1 + Math.random() * 3),        // 模拟 z 轴向外飞
        scale: 1,
        alpha: 1,
        size: TILE * (0.7 + Math.random() * 0.5),
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.25,
        color: `rgb(${r},${g},${b})`,
        decay: 0.008 + Math.random() * 0.012,
        delay: dist * 0.0004               // 边缘粒子稍晚飞出
      });
    }
  }

  // ── 4. 动画循环 ──
  let elapsed = 0;
  let frame;
  function animParticles() {
    elapsed += 0.016;
    ctx.clearRect(0, 0, W, H);

    let alive = false;
    particles.forEach(p => {
      if (elapsed < p.delay) { alive = true; return; }
      if (p.alpha <= 0) return;
      alive = true;

      p.x     += p.vx;
      p.y     += p.vy;
      p.vx    *= 0.92;
      p.vy    *= 0.92;
      p.scale += p.vz * 0.015;            // z 运动缩放
      p.scale  = Math.max(0.05, p.scale);
      p.rot   += p.rotV;
      p.alpha -= p.decay;

      const s = p.size * p.scale;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
    });

    if (alive) {
      frame = requestAnimationFrame(animParticles);
    } else {
      cancelAnimationFrame(frame);
    }
  }
  animParticles();

  // ── 5. 粒子启动后 loader 背景迅速透明，露出主页面 ──
  setTimeout(() => {
    loader.style.transition = 'opacity 0.6s ease';
    loader.style.opacity    = '0';
    setTimeout(() => {
      cancelAnimationFrame(frame);
      loader.classList.add('hidden');
      canvas.style.opacity = '0';
      document.body.style.overflow = '';
    }, 650);
  }, 120);

}, { once: true });


  }
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
  // -------- WORKS GRID --------
function initWorksGrid() {
  const grid = document.getElementById('worksGrid');
  if (!grid) return;

  // 按分类分组，顺序即显示顺序
  const CATEGORIES = [
    {
      label: 'Fashion Design',
      works: [
        { num:'01', title:'The Sensitive Monsterology',  cat:'Fashion design · 2026',                    href:'work-5.html',  img:'images/work-5.jpg' },
        { num:'02', title:'Serotonin V: Selves',         cat:'Fashion design draping · 2026',            href:'work-1.html',  img:'images/work-1.jpg' },
        { num:'03', title:'Stay On Stage',               cat:'Fashion design · 2025',                    href:'work-2.html',  img:'images/work-2.jpg' },
      ]
    },
    {
      label: 'Accessory Design',
      works: [
        { num:'04', title:'Bliss Naked',                 cat:'Wearable Bag Design · 2024',               href:'work-3.html',  img:'images/work-3.jpg' },
        { num:'05', title:'Acupuncture',                 cat:'Wearable Bag And Accessory Design · 2024', href:'work-4.html',  img:'images/work-4.jpg' },
        { num:'10', title:'Help Me Out A Little!',       cat:'Bag Design · 2023',                        href:'work-10.html', img:'images/work-8.jpg' },
        { num:'11', title:'Infinite Loop',               cat:'Fashion Research · 2022',                  href:'work-11.html', img:'images/work-9.jpg' },
        { num:'12', title:'Leather Craftsmanship',       cat:'Craft · 2023',                             href:'work-12.html', img:'images/work-13.jpg' },
        { num:'13', title:'Metalworking',                cat:'Craft · 2026',                             href:'work-13.html', img:'images/work-12.jpg' },
      ]
    },
    {
      label: 'Virtual Digital Design',
      works: [
        { num:'06', title:'Am I Wasting The Cruelty?',   cat:'AI Video · 2026',  href:'work-6.html', img:'images/work-10-cover..png', video:'videos/work-6.mp4' },
        { num:'07', title:'AI Project × Martine Rose',   cat:'AI Video · 2025',  href:'work-7.html', img:'images/work-11-cover.jpg',  video:'videos/work-7.mp4' },
      ]
    },
    {
      label: 'Textile Design',
      works: [
        { num:'08', title:'Clang & Clattered',           cat:'Print Design · 2025',   href:'work-8.html', img:'images/work-6.jpg' },
        { num:'09', title:'Rust',                        cat:'Textile design · 2024', href:'work-9.html', img:'images/work-7.jpg' },
      ]
    },
  ];

  const isMobile = () => window.matchMedia('(hover: none)').matches;

  CATEGORIES.forEach((cat, catIdx) => {
    // ── 分类标题行（第一组不加顶部横线，后面的组加）
    const header = document.createElement('div');
    header.className = 'wg-category-header' + (catIdx > 0 ? ' wg-category-divider' : '');
    header.innerHTML = `<span class="wg-category-label">${cat.label}</span>`;
    grid.appendChild(header);

    // ── 该分类下的卡片容器（独立一行的子网格）
    const row = document.createElement('div');
    row.className = 'wg-category-row';
    grid.appendChild(row);

    cat.works.forEach(w => {
      const item = document.createElement('div');
      item.className = 'wg-item';

      const mediaHTML = w.video ? `
        <div style="position:relative;width:100%;height:100%;">
          <img src="${w.img}" alt="${w.title}"
            style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;transition:opacity 0.4s;" />
          <video muted loop playsinline preload="none" poster="${w.img}"
            style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;">
            <source src="${w.video}" type="video/mp4" />
          </video>
        </div>` : `<img src="${w.img}" alt="${w.title}" loading="lazy" />`;

      item.innerHTML = mediaHTML + `
        <div class="wg-overlay">
          <span class="wg-num">${w.num}</span>
          <div class="wg-title">${w.title}</div>
          <div class="wg-cat">${w.cat}</div>
        </div>`;

      if (w.video) {
        const vid = item.querySelector('video');
        const poster = item.querySelector('img');
        item.addEventListener('mouseenter', () => {
          if (vid.getAttribute('preload') === 'none') {
            vid.setAttribute('preload', 'auto');
            vid.load();
          }
          vid.play().then(() => { poster.style.opacity = '0'; }).catch(() => {});
        });
        item.addEventListener('mouseleave', () => {
          vid.pause();
          vid.currentTime = 0;
          poster.style.opacity = '1';
        });
      }

      if (isMobile()) {
        item.addEventListener('click', () => {
          if (item.classList.contains('tapped')) {
            window.location.href = w.href;
          } else {
            grid.querySelectorAll('.wg-item.tapped')
                .forEach(el => el.classList.remove('tapped'));
            item.classList.add('tapped');
          }
        });
      } else {
        item.addEventListener('click', () => {
          window.location.href = w.href;
        });
      }

      row.appendChild(item);
    });
  });
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
        if (swStatus) swStatus.textContent = '▶\uFE0E';
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
    initWorksGrid();
    initAlbumPlayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// 信封：滚动到contact区域时自动打开
const envWrap = document.getElementById('envelopeWrap');
const env = document.getElementById('envelope');
if (envWrap && env) {
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) env.classList.add('open');
  }, { threshold: 0.5 });
  observer.observe(envWrap);
}
