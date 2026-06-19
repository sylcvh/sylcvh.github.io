document.addEventListener('DOMContentLoaded', function() {
    function initButtonEffects() {
        const buttons = document.querySelectorAll('.link-button');

        buttons.forEach((btn) => {
            const updateMagnet = (e) => {
                const rect = btn.getBoundingClientRect();
                const mx = (e.clientX - rect.left) / rect.width - 0.5;
                const my = (e.clientY - rect.top) / rect.height - 0.5;
                btn.style.setProperty('--mx', mx.toFixed(3));
                btn.style.setProperty('--my', my.toFixed(3));
            };

            btn.addEventListener('pointerenter', (e) => {
                btn.classList.add('is-hover');
                updateMagnet(e);
            });

            btn.addEventListener('pointermove', updateMagnet);

            btn.addEventListener('pointerleave', () => {
                btn.classList.remove('is-hover');
                btn.style.setProperty('--mx', '0');
                btn.style.setProperty('--my', '0');
            });

            btn.addEventListener('click', (e) => {
                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height) * 1.1;
                const ripple = document.createElement('span');
                ripple.className = 'button-ripple';
                ripple.style.width = `${size}px`;
                ripple.style.height = `${size}px`;
                ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
                ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
                btn.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        });
    }

    initButtonEffects();
});