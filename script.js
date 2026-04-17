/* 加载页面后，隐藏加载页面并显示主页面 */
window.onload = function() {
    setTimeout(function() {
        // 隐藏加载页面
        document.getElementById("loading-screen").style.display = "none";

        // 设置主页面透明度为 1，确保显示
        const mainContent = document.getElementById("main-content");
        mainContent.classList.remove("hidden");
        mainContent.style.opacity = 1;
    }, 3000); // 3秒后加载完成，展示主页面
        
        // 获取播放按钮和音频元素
    const playButton = document.getElementById("play-button");
    const music = document.getElementById("background-music");

    // 添加图片点击事件，点击后切换播放/暂停
    playButton.addEventListener('click', function() {
        if (music.paused) {
            music.play();  // 如果音频已暂停，开始播放
        } else {
            music.pause();  // 如果音频正在播放，暂停音频
        }
    });
}

// 使书本页可交互放大
const pages = document.querySelectorAll('.page');

pages.forEach(page => {
    page.addEventListener('click', () => {
        gsap.to(page, { scale: 1.2, duration: 0.5 });  // 使用GSAP动画放大
    });

    page.addEventListener('dblclick', () => {
        gsap.to(page, { scale: 1, duration: 0.5 });  // 双击还原
    });
});

