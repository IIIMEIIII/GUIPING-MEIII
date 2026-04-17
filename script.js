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

// 使书本旋转通过鼠标拖动
let book = document.querySelector('.book');
let mouseDown = false;
let lastX = 0;

book.addEventListener('mousedown', (e) => {
    mouseDown = true;
    lastX = e.clientX;
});

window.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    let deltaX = e.clientX - lastX;
    let rotation = book.style.transform ? parseFloat(book.style.transform.replace('rotateY(', '').replace('deg)', '')) : 0;
    book.style.transform = `rotateY(${rotation + deltaX * 0.2}deg)`;  // 控制旋转速度
    lastX = e.clientX;
});

window.addEventListener('mouseup', () => {
    mouseDown = false;
});