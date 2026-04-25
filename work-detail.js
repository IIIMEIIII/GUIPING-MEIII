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

  // ---- INIT ----
  function init() {
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
