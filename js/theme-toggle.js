document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('theme-checkbox');
    const themeSwitch = document.querySelector('.theme-switch');
    const themeTrack = document.querySelector('.theme-switch__track');
    const themeThumb = document.querySelector('.theme-switch__thumb');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!checkbox) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colors = { dark: '#09090e', light: '#f7f5f0' };
    let swapping = false;

    function readTheme() {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function syncCheckbox() {
        checkbox.checked = readTheme() === 'light';
    }

    function commitTheme(next) {
        document.documentElement.setAttribute('data-theme', next);
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('metalTheme', next);
        syncCheckbox();

        if (themeMeta) {
            themeMeta.setAttribute('content', colors[next]);
        }

        document.documentElement.dispatchEvent(new CustomEvent('theme:change', {
            detail: { theme: next },
        }));
    }

    function setSwapping(active) {
        swapping = active;
        document.documentElement.classList.toggle('is-theme-swapping', active);
    }

    function rippleOrigin() {
        const el = themeTrack || themeSwitch;
        if (!el) {
            return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
        }
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    function rippleRadius(x, y) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const corners = [[0, 0], [w, 0], [0, h], [w, h]];
        return Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - x, cy - y))) + 32;
    }

    function spawnToggleRipple() {
        if (!themeTrack || !themeThumb) return;

        themeSwitch?.classList.add('is-rippling');
        window.setTimeout(() => themeSwitch?.classList.remove('is-rippling'), 560);

        const trackRect = themeTrack.getBoundingClientRect();
        const thumbRect = themeThumb.getBoundingClientRect();
        const size = Math.max(trackRect.width, trackRect.height) * 2.6;
        const droplet = document.createElement('span');
        droplet.className = 'theme-switch__droplet';
        droplet.style.width = `${size}px`;
        droplet.style.height = `${size}px`;
        droplet.style.left = `${thumbRect.left - trackRect.left + thumbRect.width / 2 - size / 2}px`;
        droplet.style.top = `${thumbRect.top - trackRect.top + thumbRect.height / 2 - size / 2}px`;
        themeTrack.appendChild(droplet);
        droplet.addEventListener('animationend', () => droplet.remove(), { once: true });
    }

    function cleanupVeil(veil) {
        veil.remove();
        setSwapping(false);
    }

    function revealTheme(next) {
        if (swapping) return;

        const current = readTheme();
        if (current === next) {
            syncCheckbox();
            return;
        }

        if (reduced.matches) {
            commitTheme(next);
            return;
        }

        const { x, y } = rippleOrigin();
        const radius = rippleRadius(x, y);
        spawnToggleRipple();
        setSwapping(true);

        const veil = document.createElement('div');
        veil.className = 'theme-veil';
        veil.setAttribute('aria-hidden', 'true');
        veil.style.setProperty('--veil-bg', colors[current]);
        veil.style.setProperty('--ripple-x', `${x}px`);
        veil.style.setProperty('--ripple-y', `${y}px`);
        veil.style.setProperty('--theme-hole', '0px');
        document.body.appendChild(veil);

        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            cleanupVeil(veil);
        };

        const startReveal = () => {
            commitTheme(next);

            if (typeof veil.animate === 'function') {
                const animation = veil.animate(
                    [
                        { '--theme-hole': '0px' },
                        { '--theme-hole': `${radius}px` },
                    ],
                    {
                        duration: 560,
                        easing: 'cubic-bezier(0.33, 1, 0.38, 1)',
                        fill: 'forwards',
                    },
                );
                animation.onfinish = finish;
                animation.oncancel = finish;
                return;
            }

            veil.classList.add('is-revealing');
            veil.style.setProperty('--theme-hole', `${radius}px`);
            veil.addEventListener('transitionend', (e) => {
                if (e.propertyName === '--theme-hole') finish();
            }, { once: true });
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(startReveal);
        });

        window.setTimeout(finish, 640);
    }

    function applyTheme(theme, animate = true) {
        const next = theme === 'light' ? 'light' : 'dark';
        if (!animate) {
            commitTheme(next);
            return;
        }
        revealTheme(next);
    }

    checkbox.addEventListener('change', () => {
        applyTheme(checkbox.checked ? 'light' : 'dark', true);
    });

    const saved = localStorage.getItem('metalTheme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const initial = saved === 'light' || saved === 'dark'
        ? saved
        : (prefersDark.matches ? 'dark' : 'light');

    commitTheme(initial);
    syncCheckbox();

    prefersDark.addEventListener?.('change', (e) => {
        if (!localStorage.getItem('metalTheme')) {
            applyTheme(e.matches ? 'dark' : 'light', true);
        }
    });
});