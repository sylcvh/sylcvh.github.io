document.addEventListener('DOMContentLoaded', function() {
    function initSlashSubtitle() {
        const subtitle = document.querySelector('.subtitle');
        if (!subtitle) return;

        const text = subtitle.textContent.trim();
        subtitle.textContent = '';

        const letters = [];
        const slashChars = ['/', '\\', '|', '-', '_', '·'];
        const canHover = window.matchMedia('(pointer: fine)').matches;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'slash-letter';
            span.dataset.char = char;
            span.style.setProperty('--delay', `${index * 45}ms`);
            span.style.setProperty('--symbol-variance', `${Math.random() * 18 - 9}deg`);

            if (char === ' ') {
                span.classList.add('is-space');
                span.textContent = '\u00A0';
            } else {
                span.textContent = '/';
                letters.push(span);
            }

            subtitle.appendChild(span);
        });

        const runSlashEffect = () => {
            letters.forEach((span, idx) => {
                const finalChar = span.dataset.char;
                span.classList.remove('locked');
                span.classList.remove('is-revealing');
                const totalCycles = 3 + Math.floor(Math.random() * 2);
                let cycles = 0;

                setTimeout(() => {
                    const interval = setInterval(() => {
                        cycles += 1;
                        if (cycles >= totalCycles) {
                            clearInterval(interval);
                            span.textContent = finalChar;
                            span.classList.add('locked');
                            span.classList.add('is-revealing');
                            window.setTimeout(() => {
                                span.classList.remove('is-revealing');
                            }, 600);
                        } else {
                            const symbolIndex = (cycles * 2 + idx + Math.floor(Math.random() * slashChars.length)) % slashChars.length;
                            span.textContent = slashChars[symbolIndex];
                        }
                    }, 34 + (idx % 3) * 8);
                }, idx * 26);
            });
        };

        runSlashEffect();

        if (canHover) {
            subtitle.addEventListener('mouseenter', runSlashEffect);
        }

        if (!reducedMotion) {
            setInterval(runSlashEffect, 12000);
        }
    }

    initSlashSubtitle();
});