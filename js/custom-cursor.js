document.addEventListener('DOMContentLoaded', function() {
    function initCustomCursor() {
        if (!window.matchMedia('(pointer: fine)').matches) {
            return;
        }

        const cursor = document.createElement('div');
        const cursorDot = document.createElement('div');
        cursor.classList.add('custom-cursor');
        cursorDot.classList.add('cursor-dot');
        document.body.appendChild(cursor);
        document.body.appendChild(cursorDot);

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let dotX = 0, dotY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dotX = e.clientX;
            dotY = e.clientY;
            cursorDot.style.left = dotX + 'px';
            cursorDot.style.top = dotY + 'px';
        });

        function animateCursor() {
            const diffX = mouseX - cursorX;
            const diffY = mouseY - cursorY;
            cursorX += diffX * 0.15;
            cursorY += diffY * 0.15;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        const interactiveElements = document.querySelectorAll('a, button, input, .link-button, .theme-switch, .music-toggle');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });

        document.addEventListener('mousedown', () => cursor.classList.add('click'));
        document.addEventListener('mouseup', () => cursor.classList.remove('click'));
    }

    initCustomCursor();
});