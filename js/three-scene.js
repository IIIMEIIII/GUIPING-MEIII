/**
 * three-scene.js
 * 3D放射式作品展示装置
 * 使用本地图片作为卡片纹理（images/work-1.jpg ~ work-4.jpg）
 * 若要更换图片，直接替换 images/ 目录下对应文件即可
 */

(function() {
  'use strict';

  // -------- CONFIG --------
  const RADIUS = 2.8;
  const CARD_W = 1.2;
  const CARD_H = 1.8;

  // ====================================================
  //  ★ 在这里直接修改你的作品数据 ★
  //  image: 对应 images/ 目录下的文件名
  //  若无图片，留空字符串 ''，将显示渐变色卡片
  // ====================================================
  const WORKS = [
    {
      title: 'The Sensitive Monsterology',
      category: 'Fashion design',
      year: '2026',
      desc: 'Telling the Story of the Monster as I See It.',
      image: 'images/work-5.jpg',
      href: 'work-5.html',
      color1: '#071525', color2: '#0d2a45',
    },
    {
      title: 'Serotonin V: Selves',
      category: 'Fashion design draping',
      year: '2026',
      desc: 'The hallucinations caused by serotonin led to a series of incidents triggered by a group of characters.',
      image: 'images/work-1.jpg',
      href: 'work-1.html',
      color1: '#0d1b2a', color2: '#1b2a4a',
    },
    {
      title: 'Stay On Stage',
      category: 'Fashion design',
      year: '2025',
      desc: 'Exploring the connections between drag queens and world cultures.',
      image: 'images/work-2.jpg',
      href: 'work-2.html',
      color1: '#120409', color2: '#3a0a1a',
    },
    {
      title: 'Bliss Naked',
      category: 'Wearable Bag Design',
      year: '2024',
      desc: 'Creating wearable accessories and handbag designs for characters using utopianism as the primary critical perspective',
      image: 'images/work-3.jpg',
      href: 'work-3.html',
      color1: '#1a1510', color2: '#3a2e22',
    },
    {
      title: 'Acupuncture',
      category: 'Wearable Bag And Accessory Design',
      year: '2024',
      desc: 'Exploring the relationship between acupuncture in traditional Chinese medicine and the healing of the mind, as well as the relationship between knot design and bodily movement.',
      image: 'images/work-4.jpg',
      href: 'work-4.html',
      color1: '#0e1210', color2: '#1e2e28',
    },
    {
      title: 'Am I Wasting The Cruelty?',
      category: 'AI Video',
      year: '2026',
      desc: 'Using fish as an example, discuss and reflect on your own project.',
      image: 'images/work-10-cover.png',
      video: 'videos/work-6.mp4',
      href: 'work-6.html',
      color1: '#0e0e14', color2: '#1e1e2e',
    },
    {
      title: 'AI Project × Martine Rose',
      category: 'AI Video',
      year: '2025',
      desc: 'An AI-powered collaborative imaging project in dialogue with the aesthetic of Martine Rose.',
      image: 'images/work-11-cover.jpg',
      video: 'videos/work-7.mp4',
      href: 'work-7.html',
      color1: '#0a1208', color2: '#1a2218',
    },
    {
      title: 'Clang & Clattered',
      category: 'Handkerchiefs and Kimono-Inspired Print Designs',
      year: '2025',
      desc: 'Featuring motifs of metal chains, insects, and leather, the handkerchiefs and kimono prints blend boldness with a touch of edginess.',
      image: 'images/work-6.jpg',
      href: 'work-8.html',
      color1: '#111216', color2: '#20222a',
    },
    {
      title: 'Rust',
      category: 'Textile design',
      year: '2024',
      desc: 'Textile remakes primarily using screen printing, foil, flour, burn-out, and bleaching techniques.',
      image: 'images/work-7.jpg',
      href: 'work-9.html',
      color1: '#0e0c08', color2: '#2a2418',
    },
    {
      title: 'Help Me Out A Little!',
      category: 'Bag Design',
      year: '2023',
      desc: 'Exploring the Relationship Between Handbags and Facial Expressions',
      image: 'images/work-8.jpg',
      href: 'work-10.html',
      color1: '#100808', color2: '#281818',
    },
    {
      title: 'Infinite Loop',
      category: 'Fashion Research',
      year: '2022',
      desc: 'The tension between the down jacket and the body; exploring cycles and deconstruction in bag design.',
      image: 'images/work-9.jpg',
      href: 'work-11.html',
      color1: '#080e14', color2: '#101e28',
    },
    {
      title: 'Leather Craftsmanship',
      category: 'Craft',
      year: '2023',
      desc: 'A collection of research on leather craftsmanship, offering a visual exploration of sewing techniques and material density.',
      image: 'images/work-13.jpg',
      href: 'work-12.html',
      color1: '#0a0a0a', color2: '#1a1a1a',
    },
    {
      title: 'Metalworking',
      category: 'Craft',
      year: '2026',
      desc: 'A Collection of Explorations in Metalwork: A Study of the Tension Between Materials and Craftsmanship.',
      image: 'images/work-12.jpg',
      href: 'work-13.html',
      color1: '#0c0c10', color2: '#1c1c24',
    },
  ];

  // -------- SCENE STATE --------
  let scene, camera, renderer, group;
  let cards = [];
  let isDragging = false;
  let previousMouseX = 0;
  let previousMouseY = 0;
  let targetRotationY  = 0;
  let targetRotationX  = 0;
  let currentRotationY = 0;
  let currentRotationX = 0;
  const autoRotateSpeed = 0.003;
  let isInteracting = false;
  let interactionTimeout = null;
  let activeCard = -1;
  let touchStartX = 0;
  let touchStartY = 0;
  let isMobile = window.innerWidth <= 768;

  const canvas    = document.getElementById('threeCanvas');
  const container = document.getElementById('canvasContainer');
  const counterEl = document.getElementById('activeCardIndex');

  // -------- INIT --------
  function init() {
    if (!canvas || !container || typeof THREE === 'undefined') return;

    const CARD_COUNT = WORKS.length;

    // Update counter total
    const totalEl = document.querySelector('.counter-total');
    if (totalEl) totalEl.textContent = String(CARD_COUNT).padStart(2, '0');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0.5, isMobile ? 8.5 : 7);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pointLight = new THREE.PointLight(0xffffff, 2.5, 20);
    pointLight.position.set(0, 3, 5);
    scene.add(pointLight);
    const rimLight = new THREE.PointLight(0xcc1111, 1.2, 15);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);
    const rimLight2 = new THREE.PointLight(0x4488ff, 0.8, 15);
    rimLight2.position.set(4, 2, -3);
    scene.add(rimLight2);

    // Group
    group = new THREE.Group();
    scene.add(group);

    // Particles + Cards
    createParticles();
    buildCards(CARD_COUNT);

    // Events & loop
    bindEvents();
    animate();
  }

  // -------- BUILD CARDS --------
  function buildCards(CARD_COUNT) {
    cards = [];
    while (group.children.length) group.remove(group.children[0]);

    WORKS.forEach((work, i) => {
      const angle = (i / CARD_COUNT) * Math.PI * 2;
      const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 1, 1);

      // Start with gradient texture
      const gradTex = makeGradientTexture(work, i);
      const matFront = new THREE.MeshStandardMaterial({
        map: gradTex, roughness: 0.3, metalness: 0.1, side: THREE.FrontSide,
      });
      const matBack = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a, roughness: 0.8, side: THREE.BackSide,
      });

      const meshFront = new THREE.Mesh(geo, matFront);
      const meshBack  = new THREE.Mesh(geo, matBack);

      const cardGroup = new THREE.Group();
      cardGroup.add(meshFront);
      cardGroup.add(meshBack);

      cardGroup.position.x = Math.sin(angle) * RADIUS;
      cardGroup.position.z = Math.cos(angle) * RADIUS;
      cardGroup.position.y = (Math.random() - 0.5) * 0.2;

      const tiltAngle = Math.atan2(cardGroup.position.x, cardGroup.position.z);
      cardGroup.rotation.y = tiltAngle;
      cardGroup.rotation.x = (Math.random() - 0.5) * 0.12;
      cardGroup.rotation.z = (Math.random() - 0.5) * 0.05;

      // Shadow
      const shadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(CARD_W + 0.1, CARD_H + 0.1),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false })
      );
      shadowMesh.position.z = -0.01;
      cardGroup.add(shadowMesh);

      group.add(cardGroup);
      cards.push({ group: cardGroup, meshFront, angle, data: work, index: i, hovered: false });

      // Load real image or video if provided
      if (work.video) {
        loadVideoTexture(work, matFront);
      } else if (work.image) {
        loadImageTexture(work, matFront);
      }
    });
  }

  // -------- GRADIENT TEXTURE --------
  function makeGradientTexture(work, index) {
    const size = 512;
    const cvs  = document.createElement('canvas');
    cvs.width  = size;
    cvs.height = Math.round(size * (CARD_H / CARD_W));
    const ctx  = cvs.getContext('2d');
    const ch   = cvs.height;

    const grad = ctx.createLinearGradient(0, 0, size, ch);
    grad.addColorStop(0, work.color1 || '#0f0c29');
    grad.addColorStop(1, work.color2 || '#302b63');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, ch);

    for (let n = 0; n < 3000; n++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
      ctx.fillRect(Math.random() * size, Math.random() * ch, 1, 1);
    }

    drawCardLabels(ctx, work, index, size, ch);
    return new THREE.CanvasTexture(cvs);
  }

  // -------- IMAGE TEXTURE --------
  function loadImageTexture(work, matFront) {
    const img = new Image();
    img.onload = () => {
      const size = 512;
      const cvs  = document.createElement('canvas');
      cvs.width  = size;
      cvs.height = Math.round(size * (CARD_H / CARD_W));
      const ctx  = cvs.getContext('2d');
      const ch   = cvs.height;

      // Cover crop
      const iA = img.width / img.height;
      const cA = size / ch;
      let sx, sy, sw, sh;
      if (iA > cA) {
        sh = img.height; sw = sh * cA;
        sx = (img.width - sw) / 2; sy = 0;
      } else {
        sw = img.width; sh = sw / cA;
        sx = 0; sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, ch);

      // Bottom gradient overlay
      const ov = ctx.createLinearGradient(0, ch * 0.3, 0, ch);
      ov.addColorStop(0, 'rgba(0,0,0,0)');
      ov.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = ov;
      ctx.fillRect(0, 0, size, ch);

      // Top fade
      const tv = ctx.createLinearGradient(0, 0, 0, ch * 0.2);
      tv.addColorStop(0, 'rgba(0,0,0,0.6)');
      tv.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tv;
      ctx.fillRect(0, 0, size, ch);

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 3;
      ctx.strokeRect(14, 14, size - 28, ch - 28);

      drawCardLabels(ctx, work, cards.findIndex(c => c.data === work), size, ch);

      matFront.map = new THREE.CanvasTexture(cvs);
      matFront.needsUpdate = true;
    };
    img.src = work.image;
  }

  // -------- VIDEO TEXTURE (center-crop, no squash) --------
  function loadVideoTexture(work, matFront) {
    const vid = document.createElement('video');
    vid.src = work.video;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.crossOrigin = 'anonymous';

    // Canvas size matches card aspect ratio (W:H = CARD_W:CARD_H)
    const TEX_W = 512;
    const TEX_H = Math.round(TEX_W * (CARD_H / CARD_W)); // 512 * 1.5 = 768
    const cvs = document.createElement('canvas');
    cvs.width  = TEX_W;
    cvs.height = TEX_H;
    const ctx  = cvs.getContext('2d');

    // Create CanvasTexture — we update it each animation frame
    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    function drawFrame() {
      if (vid.readyState < 2) return;
      const vw = vid.videoWidth  || 1;
      const vh = vid.videoHeight || 1;
      const cardAspect = TEX_W / TEX_H;   // target card ratio
      const vidAspect  = vw / vh;          // source video ratio

      let sx, sy, sw, sh;
      if (vidAspect > cardAspect) {
        // video is wider than card → crop left/right, keep full height
        sh = vh;
        sw = sh * cardAspect;
        sx = (vw - sw) / 2;
        sy = 0;
      } else {
        // video is taller than card → crop top/bottom, keep full width
        sw = vw;
        sh = sw / cardAspect;
        sx = 0;
        sy = (vh - sh) / 2;
      }
      // 1. 绘制视频帧（中心裁剪）
      ctx.drawImage(vid, sx, sy, sw, sh, 0, 0, TEX_W, TEX_H);

      // 2. 底部渐变遮罩（与图片卡片相同）
      const ov = ctx.createLinearGradient(0, TEX_H * 0.3, 0, TEX_H);
      ov.addColorStop(0, 'rgba(0,0,0,0)');
      ov.addColorStop(1, 'rgba(0,0,0,0.88)');
      ctx.fillStyle = ov;
      ctx.fillRect(0, 0, TEX_W, TEX_H);

      // 3. 顶部渐变遮罩
      const tv = ctx.createLinearGradient(0, 0, 0, TEX_H * 0.2);
      tv.addColorStop(0, 'rgba(0,0,0,0.55)');
      tv.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tv;
      ctx.fillRect(0, 0, TEX_W, TEX_H);

      // 4. 边框
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 3;
      ctx.strokeRect(14, 14, TEX_W - 28, TEX_H - 28);

      // 5. 标题文字（与 drawCardLabels 一致）
      const workIdx = cards.findIndex(c => c.data === work);

      // 大号序号水印
      ctx.font = '900 120px Space Grotesk, Inter, Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.textAlign = 'left';
      ctx.fillText(String(workIdx + 1).padStart(2, '0'), 28, 150);

      // 分类
      ctx.font = '600 21px Space Grotesk, Inter, Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'left';
      ctx.fillText((work.category || '').toUpperCase(), 36, 56);

      // 标题（自动换行）
      ctx.font = '700 48px Space Grotesk, Inter, Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      const words = (work.title || '').split(' ');
      let line = '', yy = TEX_H * 0.63;
      for (let n = 0; n < words.length; n++) {
        const test = line + words[n] + ' ';
        if (ctx.measureText(test).width > TEX_W - 72 && n > 0) {
          ctx.fillText(line.trim(), 36, yy); line = words[n] + ' '; yy += 58;
        } else { line = test; }
      }
      ctx.fillText(line.trim(), 36, yy);

      // 年份
      ctx.font = '400 26px Space Grotesk, Inter, Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'right';
      ctx.fillText(work.year || '', TEX_W - 36, TEX_H - 38);

      tex.needsUpdate = true;
    }

    vid.addEventListener('canplay', () => {
      vid.play().catch(() => {});
      matFront.map = tex;
      matFront.needsUpdate = true;

      // Hook into Three.js render loop via requestAnimationFrame
      function loop() {
        drawFrame();
        requestAnimationFrame(loop);
      }
      loop();
    }, { once: true });

    vid.load();
  }

  // -------- CARD LABELS --------
  function drawCardLabels(ctx, work, index, size, ch) {
    ctx.font = '900 120px Space Grotesk, Inter, Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.textAlign = 'left';
    ctx.fillText(String(index + 1).padStart(2, '0'), 28, 150);

    ctx.font = '600 21px Space Grotesk, Inter, Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText((work.category || '').toUpperCase(), 36, 56);

    ctx.font = '700 48px Space Grotesk, Inter, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const words = (work.title || '').split(' ');
    let line = '', yy = ch * 0.63;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > size - 72 && n > 0) {
        ctx.fillText(line.trim(), 36, yy); line = words[n] + ' '; yy += 58;
      } else { line = test; }
    }
    ctx.fillText(line.trim(), 36, yy);

    ctx.font = '400 26px Space Grotesk, Inter, Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'right';
    ctx.fillText(work.year || '', size - 36, ch - 38);

    ctx.font = '500 38px Arial';
    ctx.fillStyle = 'rgba(204,17,17,0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('↗', 36, ch - 38);
  }

  // -------- PARTICLES --------
  function createParticles() {
    const count = 800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 24;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.025, transparent: true, opacity: 0.35, sizeAttenuation: true,
    })));
  }

  // -------- ANIMATION LOOP --------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!isInteracting) targetRotationY -= autoRotateSpeed;
    currentRotationY += (targetRotationY - currentRotationY) * 0.05;
    currentRotationX += (targetRotationX - currentRotationX) * 0.05;
    group.rotation.y = currentRotationY;
    group.rotation.x = currentRotationX;

    cards.forEach((card, i) => {
      card.group.position.y = Math.sin(t * 0.6 + i * 0.8) * 0.12;
      const ts = card.hovered ? 1.07 : 1.0;
      card.group.scale.x += (ts - card.group.scale.x) * 0.08;
      card.group.scale.y += (ts - card.group.scale.y) * 0.08;
    });

    updateFrontCard();
    renderer.render(scene, camera);
  }

  function updateFrontCard() {
    if (!cards.length) return;
    let bestDot = -Infinity, bestIdx = 0;
    const camDir = new THREE.Vector3(0, 0, 1);
    cards.forEach((card, i) => {
      const wp = new THREE.Vector3();
      card.group.getWorldPosition(wp);
      wp.y = 0; wp.normalize();
      const dot = wp.dot(camDir);
      if (dot > bestDot) { bestDot = dot; bestIdx = i; }
    });
    if (activeCard !== bestIdx) {
      activeCard = bestIdx;
      if (counterEl) counterEl.textContent = String(bestIdx + 1).padStart(2, '0');
    }
  }

  // -------- RAYCASTING --------
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();

  function getIntersects(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouse.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(cards.map(c => c.meshFront));
  }

  function getCardFromMesh(mesh) { return cards.find(c => c.meshFront === mesh); }

  // -------- EVENTS --------
  function bindEvents() {
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd);
    canvas.addEventListener('click',      onClick);
    window.addEventListener('resize',     onResize);
  }

  function onMouseDown(e) {
    isDragging = true; isInteracting = true;
    previousMouseX = e.clientX; previousMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
    clearTimeout(interactionTimeout);
  }
  function onMouseMove(e) {
    const hits = getIntersects(e.clientX, e.clientY);
    cards.forEach(c => { c.hovered = false; });
    if (hits.length > 0) {
      const card = getCardFromMesh(hits[0].object);
      if (card) { card.hovered = true; canvas.style.cursor = 'pointer'; }
    } else {
      canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    }
    if (!isDragging) return;
    targetRotationY += (e.clientX - previousMouseX) * 0.008;
    targetRotationX  = Math.max(-0.5, Math.min(0.5, targetRotationX + (e.clientY - previousMouseY) * 0.004));
    previousMouseX = e.clientX; previousMouseY = e.clientY;
  }
  function onMouseUp() {
    isDragging = false; canvas.style.cursor = 'grab';
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => { isInteracting = false; }, 2000);
  }
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    isDragging = true; isInteracting = true;
    touchStartX = previousMouseX = e.touches[0].clientX;
    touchStartY = previousMouseY = e.touches[0].clientY;
    clearTimeout(interactionTimeout);
  }
  function onTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    targetRotationY += (e.touches[0].clientX - previousMouseX) * 0.01;
    targetRotationX  = Math.max(-0.5, Math.min(0.5, targetRotationX + (e.touches[0].clientY - previousMouseY) * 0.005));
    previousMouseX = e.touches[0].clientX; previousMouseY = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    isDragging = false;
    const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (dx < 5 && dy < 5) {
      const t = e.changedTouches[0];
      const hits = getIntersects(t.clientX, t.clientY);
      if (hits.length > 0) {
        const card = getCardFromMesh(hits[0].object);
        if (card) openWorkPage(card.index);
      }
    }
    clearTimeout(interactionTimeout);
    interactionTimeout = setTimeout(() => { isInteracting = false; }, 2000);
  }
  function onClick(e) {
    const hits = getIntersects(e.clientX, e.clientY);
    if (hits.length > 0) {
      const card = getCardFromMesh(hits[0].object);
      if (card) openWorkPage(card.index);
    }
  }
  function onResize() {
    if (!container || !renderer) return;
    isMobile = window.innerWidth <= 768;
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.position.z = isMobile ? 8.5 : 7;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // -------- NAVIGATE TO WORK PAGE --------
  function openWorkPage(index) {
    const work = WORKS[index];
    if (work && work.href) {
      window.location.href = work.href;
    } else {
      openModal(work);
    }
  }

  // -------- MODAL (fallback for works without dedicated pages) --------
  function openModal(data) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    if (!overlay || !content) return;
    content.innerHTML = `
      <div class="modal-work-tag">${esc(data.category)} · ${esc(data.year)}</div>
      <h3>${esc(data.title)}</h3>
      <p>${esc(data.desc || '')}</p>
      <div class="modal-tags">
        <span>${esc(data.category)}</span><span>${esc(data.year)}</span>
      </div>
    `;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // -------- START --------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
