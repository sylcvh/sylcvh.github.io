document.addEventListener('DOMContentLoaded', () => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cursor = document.createElement('div');
    const dot = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = '<span class="cursor-cross-h"></span><span class="cursor-cross-v"></span>';
    dot.className = 'cursor-dot';
    document.body.appendChild(cursor);
    document.body.appendChild(dot);
    document.body.classList.add('has-custom-cursor');

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;
    });

    function loop() {
        cursorX += (mouseX - cursorX) * 0.18;
        cursorY += (mouseY - cursorY) * 0.18;
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        requestAnimationFrame(loop);
    }
    loop();

    const hoverSelector = 'a, button, input, .link-button, .theme-switch__track, .music-toggle, .menu-btn, .lanyard-card, .presence-stage__hint, #scroll-top, .header__link, .nav-panel__link';
    document.querySelectorAll(hoverSelector).forEach((el) => {
        el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });

    document.addEventListener('mousedown', () => cursor.classList.add('is-click'));
    document.addEventListener('mouseup', () => cursor.classList.remove('is-click'));
});