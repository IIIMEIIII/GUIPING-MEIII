/**
 * about-scene.js  v5.0
 * About Me 3D 场景
 *  - model.glb 中的电视机模型（Meshopt 压缩）
 *  - 电视机屏幕显示 about-photo.jpg（正常照片质感，无 CRT 滤镜）
 *  - 黑色金属材质覆盖，屏幕保持原始照片颜色
 *  - 骷髅水杯（黑色金属）+ 热气泡
 *  - 鼠标拖拽 360° 自由旋转 + 惯性
 *  - 触屏支持
 *
 * 依赖：Three.js r148 UMD（页面已加载）
 *       GLTFLoader + MeshoptDecoder 动态注入
 */
(function () {
  'use strict';

  /* ── boot：等待 THREE + 动态注入加载器 ── */
  function boot() {
    if (typeof THREE === 'undefined') { setTimeout(boot, 50); return; }
    loadDeps(initAboutScene);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function loadDeps(cb) {
    const BASE = 'https://cdn.jsdelivr.net/npm/three@0.148.0/examples/js/';
    const list  = [BASE + 'libs/meshopt_decoder.js', BASE + 'loaders/GLTFLoader.js'];
    let done = 0;
    list.forEach(src => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = s.onerror = () => { if (++done === list.length) cb(); };
      document.head.appendChild(s);
    });
  }

  /* ══════════════════════════════════════════════
     主场景
  ══════════════════════════════════════════════ */
  function initAboutScene() {
    const container = document.getElementById('aboutCanvas3D');
    if (!container) return;

    const W = container.clientWidth  || 560;
    const H = container.clientHeight || 480;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled   = true;
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.outputEncoding      = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = null;

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 6.5);

    /* ── 环境贴图 ── */
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromScene(buildEnvScene(true)).texture;
    pmrem.dispose();

    /* ── 灯光 ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.30));

    const keyLight = new THREE.DirectionalLight(0xfff0d0, 2.6);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left   = -8; keyLight.shadow.camera.right  = 8;
    keyLight.shadow.camera.bottom = -8; keyLight.shadow.camera.top    = 8;
    scene.add(keyLight);

    // 冷白侧光（银色金属专属，提亮反射）
    const fillLight = new THREE.PointLight(0xddeeff, 1.6, 22);
    fillLight.position.set(-4.5, 1, 2);
    scene.add(fillLight);

    // 蓝紫 rim（银色表面色彩层次）
    const rimLight = new THREE.PointLight(0x8899cc, 1.0, 18);
    rimLight.position.set(3, -1, -5);
    scene.add(rimLight);

    // 顶部暖白光
    const topLight = new THREE.PointLight(0xfff8ee, 0.8, 14);
    topLight.position.set(0, 6, 1);
    scene.add(topLight);

    /* ── 地面阴影 ── */
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.20 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y  = -1.7;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    /* ══════════════════════════════════════════════
       银灰色金属材质库
    ══════════════════════════════════════════════ */
    const M = {
      // 主体：银灰哑光金属
      bodyBlack: new THREE.MeshStandardMaterial({
        color: 0xb8bcc4, roughness: 0.28, metalness: 0.88, envMapIntensity: 2.0,
      }),
      // 高光铬银（边框细节）
      chromeDark: new THREE.MeshStandardMaterial({
        color: 0xd8dce4, roughness: 0.06, metalness: 1.00, envMapIntensity: 3.5,
      }),
      // 中灰金属（把手、次级细节）
      gunmetal: new THREE.MeshStandardMaterial({
        color: 0x8c9099, roughness: 0.18, metalness: 0.95, envMapIntensity: 2.4,
      }),
      // 银白强反射（杯口高光圈）
      goldAccent: new THREE.MeshStandardMaterial({
        color: 0xe8ecf4, roughness: 0.05, metalness: 1.00, envMapIntensity: 3.8,
      }),
      // 深银灰（底部、缝隙）
      voidBlack: new THREE.MeshStandardMaterial({
        color: 0x505560, roughness: 0.45, metalness: 0.85, envMapIntensity: 1.5,
      }),
      // 自发光红眼
      redGlow: new THREE.MeshStandardMaterial({
        color: 0x0a0000, emissive: 0xff1100, emissiveIntensity: 3.0,
        roughness: 0.2, metalness: 0.0,
      }),
    };

    /* ── 场景根节点（被360°交互控制） ── */
    const sceneRoot = new THREE.Group();
    scene.add(sceneRoot);

    /* ══════════════════════════════════════════════
       屏幕纹理：about-photo.jpg（放大人脸，聚焦上半部分）
    ══════════════════════════════════════════════ */
    const screenW = 512, screenH = 512;   // 正方形画布，更大
    const screenCvs = document.createElement('canvas');
    screenCvs.width = screenW; screenCvs.height = screenH;
    const sCtx = screenCvs.getContext('2d');
    sCtx.fillStyle = '#080808'; sCtx.fillRect(0, 0, screenW, screenH);

    const screenTex = new THREE.CanvasTexture(screenCvs);
    screenTex.encoding = THREE.sRGBEncoding;

    /* 屏幕材质 —— MeshBasicMaterial：完全不受场景灯光影响，
       零反光、零高光，照片 1:1 原色显示                    */
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTex,
    });

    /* 加载照片：进一步放大，偏左裁剪聚焦人脸 */
    const photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';
    photoImg.onload = () => {
      const iW = photoImg.width;
      const iH = photoImg.height;

      // 只取上方 52% 高度（更放大），正方形裁剪
      const cropH = iH * 0.52;
      const cropW = cropH;
      // 水平偏右：从左边 18% 开始，往右移
      const sx = iW * 0.18;
      const sy = iH * 0.05;  // 往下移 5%

      sCtx.drawImage(photoImg, sx, sy, cropW, cropH, 0, 0, screenW, screenH);
      screenTex.needsUpdate = true;
    };
    photoImg.src = 'images/about-photo.jpg';

    /* screenGlow 保留（位置占位用，强度极低不影响照片观感） */
    const screenGlow = new THREE.PointLight(0xffffff, 0.0, 0.1);

    /* ══════════════════════════════════════════════
       GLB 模型加载（model.glb 中的电视机）
    ══════════════════════════════════════════════ */
    const tvGroup = new THREE.Group();
    tvGroup.position.set(0.4, 0.0, 0);
    sceneRoot.add(tvGroup);

    // 加载等待光环
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x444455, transparent: true, opacity: 0.6, wireframe: true });
    const loadRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 12, 64), ringMat);
    tvGroup.add(loadRing);

    let screenMeshRef = null; // 用于动画中控制屏幕发光

    if (typeof THREE.GLTFLoader !== 'undefined') {
      const gltfLoader = new THREE.GLTFLoader();
      if (typeof MeshoptDecoder !== 'undefined') {
        gltfLoader.setMeshoptDecoder(MeshoptDecoder);
      }

      gltfLoader.load('models/model.glb', (gltf) => {
        tvGroup.remove(loadRing);

        const model = gltf.scene;

        /* ── 自动居中 & 缩放 ── */
        const bbox   = new THREE.Box3().setFromObject(model);
        const size   = new THREE.Vector3();
        const center = new THREE.Vector3();
        bbox.getSize(size);
        bbox.getCenter(center);
        const scale = 2.8 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        bbox.setFromObject(model);
        bbox.getCenter(center);
        model.position.sub(center);
        model.position.y += 0.1;

        /* ── 遍历网格：覆盖银灰金属材质，识别屏幕区域 ── */
        model.traverse(child => {
          if (!child.isMesh) return;
          child.castShadow    = true;
          child.receiveShadow = true;

          const name    = (child.name    || '').toLowerCase();
          const matName = Array.isArray(child.material)
            ? (child.material[0]?.name || '').toLowerCase()
            : (child.material?.name    || '').toLowerCase();
          const combined = name + ' ' + matName;

          const isScreen =
            /screen|display|monitor|glass|lcd|face_front|crt|panel|tv_screen/.test(combined);

          if (isScreen) {
            child.material = screenMat;
            screenMeshRef  = child;
            screenGlow.position.copy(child.position);
            child.add(screenGlow);
          } else {
            // 其余部分：银灰金属
            const origMat = Array.isArray(child.material) ? child.material[0] : child.material;
            const nm = M.bodyBlack.clone();
            // 轻微随机变化粗糙度，让各面反射不完全一致
            nm.roughness = 0.12 + Math.random() * 0.20;
            nm.metalness = 0.92;
            if (origMat?.normalMap) nm.normalMap = origMat.normalMap;
            child.material = nm;
          }
        });

        /* 如果没找到屏幕，把所有 child 里最大的面赋予屏幕材质（fallback） */
        if (!screenMeshRef) {
          let maxArea = 0, candidate = null;
          model.traverse(child => {
            if (!child.isMesh) return;
            const bb = new THREE.Box3().setFromObject(child);
            const s  = new THREE.Vector3(); bb.getSize(s);
            const area = s.x * s.y;
            if (area > maxArea) { maxArea = area; candidate = child; }
          });
          if (candidate) {
            candidate.material = screenMat;
            screenMeshRef = candidate;
            candidate.add(screenGlow);
          }
        }

        tvGroup.add(model);
        tvGroup.userData.model = model;

      }, (xhr) => {
        if (loadRing.parent) loadRing.rotation.z -= 0.04;
      }, (err) => {
        console.warn('[about-scene] GLB failed, using built-in TV:', err.message || err);
        tvGroup.remove(loadRing);
        buildFallbackTV(tvGroup, M, screenMat, screenGlow);
      });

    } else {
      tvGroup.remove(loadRing);
      buildFallbackTV(tvGroup, M, screenMat, screenGlow);
    }

    /* ══════════════════════════════════════════════
       骷髅水杯（黑色金属）
    ══════════════════════════════════════════════ */
    const mugGroup = new THREE.Group();
    mugGroup.position.set(-2.1, -0.55, 0.5);
    sceneRoot.add(mugGroup);
    buildSkullMug(mugGroup, M);
    const bubbles = createBubbles(mugGroup);

    /* ══════════════════════════════════════════════
       360° 拖拽旋转交互
       - 左键拖拽 / 触摸滑动 → 旋转
       - 释放后惯性滑行
       - 无自动旋转（保留旋转状态）
       - 轻微自动摆动只在完全静止时激活
    ══════════════════════════════════════════════ */
    let rotX = 0.08;   // 当前水平旋转（rad）
    let rotY = 0.0;    // 当前垂直旋转（rad）
    let velX = 0.0;    // 旋转速度（惯性）
    let velY = 0.0;
    let isDragging  = false;
    let lastMouseX  = 0, lastMouseY = 0;
    let idleTimer   = 0;   // 静止计时，超过阈值才开始自动摇摆

    const ROT_SPEED = 0.005;   // 拖拽灵敏度
    const DAMPING   = 0.90;    // 惯性衰减
    const ROT_Y_MAX = Math.PI * 0.35;  // 垂直旋转上下限

    /* 鼠标 */
    const cvs = renderer.domElement;

    cvs.style.cursor = 'grab';

    cvs.addEventListener('mousedown', e => {
      isDragging = true; idleTimer = 0;
      lastMouseX = e.clientX; lastMouseY = e.clientY;
      velX = velY = 0;
      cvs.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX; lastMouseY = e.clientY;
      velX = dx * ROT_SPEED;
      velY = dy * ROT_SPEED;
      rotX += velX;
      rotY += velY;
      rotY = Math.max(-ROT_Y_MAX, Math.min(ROT_Y_MAX, rotY));
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
      cvs.style.cursor = 'grab';
    });

    /* 触屏 */
    let lastTouchX = 0, lastTouchY = 0;
    cvs.addEventListener('touchstart', e => {
      isDragging = true; idleTimer = 0;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      velX = velY = 0;
      e.preventDefault();
    }, { passive: false });
    cvs.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      velX = dx * ROT_SPEED;
      velY = dy * ROT_SPEED;
      rotX += velX;
      rotY += velY;
      rotY = Math.max(-ROT_Y_MAX, Math.min(ROT_Y_MAX, rotY));
      e.preventDefault();
    }, { passive: false });
    cvs.addEventListener('touchend', () => { isDragging = false; });

    /* ── Resize ── */
    try {
      new ResizeObserver(() => {
        const nW = container.clientWidth || W;
        const nH = container.clientHeight || H;
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
        renderer.setSize(nW, nH);
      }).observe(container);
    } catch(e) {
      window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      });
    }

    /* ══════════════════════════════════════════════
       动画循环
    ══════════════════════════════════════════════ */
    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.016;

      /* 占位环旋转 */
      if (loadRing.parent) {
        loadRing.rotation.z -= 0.025;
        loadRing.rotation.x  = Math.sin(t * 0.8) * 0.5;
      }

      /* 惯性衰减 */
      if (!isDragging) {
        velX *= DAMPING;
        velY *= DAMPING;
        rotX += velX;
        rotY += velY;
        rotY = Math.max(-ROT_Y_MAX, Math.min(ROT_Y_MAX, rotY));
        idleTimer += 0.016;
      }

      /* 应用旋转到场景根节点 */
      sceneRoot.rotation.y = rotX;
      sceneRoot.rotation.x = rotY;

      /* 电视机轻微漂浮（垂直位移，不影响旋转） */
      tvGroup.position.y = 0.0 + Math.sin(t * 0.42) * 0.05;

      /* 水杯漂浮 */
      mugGroup.position.y = -0.55 + Math.sin(t * 0.60) * 0.05;

      /* 灯光脉动（银色金属冷白闪烁） */
      fillLight.intensity = 1.6 + Math.sin(t * 1.9) * 0.28;
      rimLight.intensity  = 1.0 + Math.sin(t * 1.5 + 1.1) * 0.22;

      /* 屏幕无反光，screenGlow 保持关闭 */
      // screenGlow.intensity = 0;

      /* 气泡 */
      updateBubbles(bubbles, t);

      renderer.render(scene, camera);
    }
    animate();

    /* ── 交互提示 overlay ── */
    addDragHint(container);
  }

  /* ══════════════════════════════════════════════
     工具 A：环境穹顶
  ══════════════════════════════════════════════ */
  function buildEnvScene(silver) {
    const s   = new THREE.Scene();
    const geo = new THREE.SphereGeometry(10, 32, 32);
    const cols = [], pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const tt = (pos.getY(i) + 10) / 20;
      // 银色专用：明亮冷白穹顶，强化金属反射
      cols.push(
        THREE.MathUtils.lerp(0.32, 0.78, tt),
        THREE.MathUtils.lerp(0.34, 0.82, tt),
        THREE.MathUtils.lerp(0.38, 0.90, tt)
      );
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
    return s;
  }

  /* ══════════════════════════════════════════════
     工具 B：GLB 加载失败时的备用程序化电视机
  ══════════════════════════════════════════════ */
  function buildFallbackTV(tvGroup, M, screenMat, screenGlow) {
    function box(w, h, d, mat, px=0, py=0, pz=0) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(px, py, pz);
      m.castShadow = m.receiveShadow = true;
      return m;
    }
    tvGroup.add(box(2.22, 2.65, 2.02, M.bodyBlack, 0, 0.10, 0));
    const hump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.86, 0.62, 40, 1, false, 0, Math.PI),
      M.bodyBlack.clone()
    );
    hump.position.set(0, 1.36, -0.18); hump.castShadow = true; tvGroup.add(hump);
    tvGroup.add(box(1.58, 1.38, 0.09, M.chromeDark, 0, 0.30, 1.02));

    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.30, 1.30), screenMat);
    screenMesh.position.set(0, 0.30, 1.08);
    screenGlow.position.set(0, 0.30, 0.2);
    tvGroup.add(screenMesh); tvGroup.add(screenGlow);

    tvGroup.add(box(0.88, 0.048, 0.06, M.voidBlack, 0, -0.72, 1.02));
    tvGroup.add(box(0.13, 0.048, 0.05, M.gunmetal, 0.56, -0.72, 1.02));
    tvGroup.add(box(2.22, 0.42, 2.02, M.bodyBlack, 0, -1.08, 0));
    [-0.66, 0.66].forEach(x => {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 0.13, 20), M.voidBlack.clone()
      );
      foot.position.set(x, -1.38, 0.62); foot.castShadow = true; tvGroup.add(foot);
    });
    tvGroup.add(box(0.62, 0.09, 0.32, M.gunmetal, 0, 1.60, -0.58));
    [-1.08, 1.08].forEach(x => tvGroup.add(box(0.04, 2.40, 0.06, M.chromeDark, x, 0.10, 0.98)));

    const appleDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 32),
      new THREE.MeshStandardMaterial({ color: 0x8a6a10, emissive: 0xaa8820, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.9 })
    );
    appleDot.position.set(0, -0.94, 1.03); tvGroup.add(appleDot);
  }

  /* ══════════════════════════════════════════════
     工具 C：骷髅水杯
  ══════════════════════════════════════════════ */
  function buildSkullMug(group, M) {
    const mugBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.41, 0.34, 1.08, 56), M.bodyBlack.clone()
    );
    mugBody.castShadow = mugBody.receiveShadow = true; group.add(mugBody);

    const mugBot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.06, 32), M.voidBlack.clone()
    );
    mugBot.position.y = -0.57; group.add(mugBot);

    const mugRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.41, 0.034, 16, 64), M.goldAccent.clone()
    );
    mugRim.rotation.x = Math.PI / 2; mugRim.position.y = 0.54; group.add(mugRim);

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.23, 0.050, 14, 32, Math.PI), M.gunmetal.clone()
    );
    handle.position.set(0.58, 0, 0);
    handle.rotation.y = Math.PI / 2;
    handle.castShadow = true; group.add(handle);

    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.60, 0.60),
      new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(makeSkullCanvas()),
        roughness: 0.10, metalness: 0.50, transparent: true, alphaTest: 0.05,
      })
    );
    decal.position.set(0, 0.06, 0.43); group.add(decal);

    [-0.10, 0.10].forEach(x => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.030, 14, 14), M.redGlow.clone());
      eye.position.set(x, 0.17, 0.42); group.add(eye);
    });

    const innerGlow = new THREE.PointLight(0xaabbcc, 0.6, 2.0);
    innerGlow.position.set(0, 0.3, 0); group.add(innerGlow);
    group.userData.innerGlow = innerGlow;
  }

  /* ══════════════════════════════════════════════
     工具 D：骷髅 Canvas（银灰金属风）
  ══════════════════════════════════════════════ */
  function makeSkullCanvas() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    const c = cv.getContext('2d');
    c.clearRect(0, 0, 512, 512);

    // 银灰骷髅头部
    const g1 = c.createRadialGradient(256, 195, 10, 256, 195, 165);
    g1.addColorStop(0, '#d8d8e0'); g1.addColorStop(0.55, '#a8aab2'); g1.addColorStop(1, '#70727a');
    c.fillStyle = g1;
    c.beginPath(); c.ellipse(256, 192, 152, 162, 0, 0, Math.PI * 2); c.fill();

    // 下颞
    c.fillStyle = '#9a9ca4';
    c.beginPath(); c.roundRect(118, 310, 276, 108, [0, 0, 26, 26]); c.fill();

    [[162, 188], [350, 188]].forEach(([ex, ey]) => {
      c.fillStyle = '#1a1a1a';
      c.beginPath(); c.ellipse(ex, ey, 42, 50, 0, 0, Math.PI * 2); c.fill();
      const eg = c.createRadialGradient(ex, ey, 2, ex, ey, 42);
      eg.addColorStop(0, 'rgba(255,20,0,0.90)');
      eg.addColorStop(0.5, 'rgba(180,0,0,0.35)');
      eg.addColorStop(1, 'rgba(255,0,0,0)');
      c.fillStyle = eg;
      c.beginPath(); c.ellipse(ex, ey, 42, 50, 0, 0, Math.PI * 2); c.fill();
    });

    // 鼻腔
    c.fillStyle = '#303035';
    c.beginPath(); c.moveTo(236, 258); c.lineTo(276, 258); c.lineTo(256, 296); c.closePath(); c.fill();

    // 牙齿（银灰金属渐变）
    for (let tt = 0; tt < 6; tt++) {
      const tx = 130 + tt * 43;
      c.fillStyle = '#606068'; c.fillRect(tx, 325, 43, 82);
      const tg = c.createLinearGradient(tx+2, 327, tx+39, 327);
      tg.addColorStop(0, '#c8cad2'); tg.addColorStop(0.4, '#e8eaf2'); tg.addColorStop(1, '#a0a2aa');
      c.fillStyle = tg; c.fillRect(tx+2, 327, 37, 76);
    }

    // 骨裂纹（银白细线）
    c.strokeStyle = 'rgba(200,205,220,0.60)'; c.lineWidth = 2; c.lineCap = 'round';
    [[[256,58],[272,100],[254,128]], [[176,76],[156,118]], [[336,86],[348,130]]].forEach(pts => {
      c.beginPath(); c.moveTo(...pts[0]); pts.slice(1).forEach(p => c.lineTo(...p)); c.stroke();
    });

    // 银色高光反射
    const hl = c.createLinearGradient(145, 95, 295, 275);
    hl.addColorStop(0, 'rgba(255,255,255,0.38)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hl; c.beginPath(); c.ellipse(216, 158, 88, 118, -0.35, 0, Math.PI * 2); c.fill();
    return cv;
  }

  /* ══════════════════════════════════════════════
     工具 E：热气泡
  ══════════════════════════════════════════════ */
  function createBubbles(parent) {
    const arr = [];
    for (let i = 0; i < 22; i++) {
      const r   = 0.022 + Math.random() * 0.044;
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.0, metalness: 0.0,
        transmission: 0.90, thickness: r * 3, reflectivity: 0.85,
        transparent: true, opacity: 0.35 + Math.random() * 0.35,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), mat);
      const angle = Math.random() * Math.PI * 2, dist = Math.random() * 0.24;
      mesh.position.set(Math.cos(angle)*dist, 0.54 + Math.random()*0.35, Math.sin(angle)*dist*0.65);
      mesh.userData = {
        initY: mesh.position.y, speed: 0.005 + Math.random()*0.010,
        swayFreq: 0.7 + Math.random()*1.3, swayAmp: 0.018 + Math.random()*0.025,
        phase: Math.random()*Math.PI*2, maxY: mesh.position.y + 0.9 + Math.random()*0.6,
        baseOpacity: mat.opacity,
      };
      parent.add(mesh); arr.push(mesh);
    }
    return arr;
  }

  function updateBubbles(arr, t) {
    arr.forEach(b => {
      const d = b.userData;
      b.position.y += d.speed;
      b.position.x += Math.sin(t * d.swayFreq + d.phase) * d.swayAmp * 0.04;
      b.position.z += Math.cos(t * d.swayFreq * 0.65 + d.phase) * d.swayAmp * 0.025;
      const prog = Math.min(1, (b.position.y - d.initY) / (d.maxY - d.initY));
      b.material.opacity = d.baseOpacity * (1 - Math.pow(prog, 1.6));
      b.scale.setScalar(1 + prog * 0.55);
      if (b.position.y >= d.maxY) {
        const angle = Math.random()*Math.PI*2, dist = Math.random()*0.22;
        b.position.set(Math.cos(angle)*dist, d.initY, Math.sin(angle)*dist*0.65);
        b.scale.setScalar(1); b.material.opacity = d.baseOpacity;
      }
    });
  }

  /* ══════════════════════════════════════════════
     工具 F：拖拽提示 overlay
  ══════════════════════════════════════════════ */
  function addDragHint(container) {
    container.style.position = 'relative';
    const hint = document.createElement('div');
    hint.style.cssText = `
      position:absolute; bottom:14px; left:50%; transform:translateX(-50%);
      background:rgba(0,0,0,0.50); color:rgba(255,255,255,0.75);
      font-size:11px; padding:5px 14px; border-radius:20px;
      pointer-events:none; font-family:'Space Grotesk',sans-serif;
      letter-spacing:0.10em; backdrop-filter:blur(6px);
      transition:opacity 1s ease; opacity:1;
    `;
    hint.textContent = '⟳  DRAG TO ROTATE 360°';
    container.appendChild(hint);
    // 3秒后淡出
    setTimeout(() => { hint.style.opacity = '0'; }, 3000);
    setTimeout(() => { hint.remove(); }, 4200);
  }

})();
