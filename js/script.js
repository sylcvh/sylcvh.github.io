document.addEventListener('DOMContentLoaded', function() {
    function typeWriter() {
        const textElement = document.getElementById('typing-text');
        const cursor = document.getElementById('typing-cursor');
        const text = "Sylco™";
        let i = 0;
        
        textElement.textContent = '';
        
        function type() {
            if (i < text.length) {
                textElement.textContent += text.charAt(i);
                i++;
                setTimeout(type, 150);
            } else {
                cursor.style.animation = 'blink 1s infinite';
            }
        }
        
        setTimeout(type, 500);
    }

    function initCustomCursor() {
        // Only enable custom cursor on devices with mouse (not touch)
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

    function initBinarySubtitle() {
        const subtitle = document.querySelector('.subtitle');
        if (!subtitle) return;

        const text = subtitle.textContent.trim();
        subtitle.textContent = '';

        const letters = [];

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'rolling-letter';
            span.dataset.char = char;
            span.style.setProperty('--delay', `${index * 65}ms`);

            if (char === ' ') {
                span.classList.add('is-space');
                span.textContent = '\u00A0';
            } else {
                span.textContent = Math.random() > 0.5 ? '0' : '1';
                letters.push(span);
            }

            subtitle.appendChild(span);
        });

        const rollLetters = () => {
            letters.forEach((span, idx) => {
                const finalChar = span.dataset.char;
                span.classList.remove('locked');
                const totalCycles = 12 + Math.floor(Math.random() * 6);
                let cycles = totalCycles;

                setTimeout(() => {
                    const interval = setInterval(() => {
                        span.textContent = Math.random() > 0.5 ? '1' : '0';
                        cycles -= 1;
                        if (cycles <= 0) {
                            clearInterval(interval);
                            span.textContent = finalChar;
                            span.classList.add('locked');
                        }
                    }, 34 + Math.random() * 18);
                }, idx * 55);
            });
        };

        rollLetters();

        subtitle.addEventListener('mouseenter', () => {
            rollLetters();
        });

        setInterval(rollLetters, 9000);
    }

    const themeCheckbox = document.getElementById('theme-checkbox');
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('metalTheme', theme);

        if (themeCheckbox) {
            themeCheckbox.checked = theme === 'light';
        }

        // Trigger wavy transition on theme change
        document.documentElement.classList.add('theme-transition');
        const waveOverlay = document.querySelector('.theme-wave-overlay');
        if (waveOverlay) {
            waveOverlay.classList.add('active');
            setTimeout(() => {
                waveOverlay.classList.remove('active');
            }, 400);
        }
        
        // Shake background layers
        const bgLayers = document.querySelectorAll('.bg-layer');
        bgLayers.forEach((layer, index) => {
            layer.style.animation = 'none';
            setTimeout(() => {
                layer.style.animation = '';
            }, 50 + index * 20);
        });
        
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 600);

        // Keep mobile browser chrome in sync with the active theme
        if (themeMeta) {
            const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0a0a0a';
            themeMeta.setAttribute('content', bg);
        }
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('metalTheme');
    const initialTheme = savedTheme || (prefersDark.matches ? 'dark' : 'light');
    applyTheme(initialTheme);

    if (prefersDark.addEventListener) {
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('metalTheme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    if (themeCheckbox) {
        themeCheckbox.addEventListener('change', function() {
            applyTheme(this.checked ? 'light' : 'dark');
        });
    }

    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeLabel = document.getElementById('volume-label');
    
    let audioUnlocked = false;

    if (volumeSlider && bgMusic) {
        const savedVolume = localStorage.getItem('musicVolume');
        if (savedVolume) {
            const volume = Math.min(Math.max(parseFloat(savedVolume), 0), 1);
            bgMusic.volume = volume;
            volumeSlider.value = Math.round(volume * 100);
            if (volumeLabel) volumeLabel.textContent = `${Math.round(volume * 100)}%`;
        } else {
            bgMusic.volume = 0.5;
            volumeSlider.value = 50;
            if (volumeLabel) volumeLabel.textContent = '50%';
        }

        volumeSlider.addEventListener('input', (e) => {
            const percentage = parseInt(e.target.value);
            const volume = percentage / 100;
            bgMusic.volume = volume;
            localStorage.setItem('musicVolume', volume);
            if (volumeLabel) volumeLabel.textContent = `${percentage}%`;
        });
    }

    if (bgMusic && musicToggle) {
        // Attempt to autoplay on page load
        bgMusic.play().then(() => {
            musicToggle.classList.add('active');
            localStorage.setItem('musicEnabled', 'true');
            audioUnlocked = true;
        }).catch((err) => {
            console.log('Autoplay prevented, waiting for user interaction:', err);
            // Fallback: wait for user interaction if autoplay is blocked
            function unlockAndPlayMusic() {
                if (audioUnlocked) return;
                audioUnlocked = true;

                bgMusic.play().then(() => {
                    musicToggle.classList.add('active');
                    localStorage.setItem('musicEnabled', 'true');
                }).catch((err) => {
                    console.log('Audio play failed:', err);
                });
            }

            document.body.addEventListener('click', unlockAndPlayMusic, { once: true });
            document.body.addEventListener('touchstart', unlockAndPlayMusic, { once: true });
        });

        musicToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (bgMusic.paused) {
                bgMusic.play().then(() => {
                    musicToggle.classList.add('active');
                    localStorage.setItem('musicEnabled', 'true');
                });
            } else {
                bgMusic.pause();
                musicToggle.classList.remove('active');
                localStorage.setItem('musicEnabled', 'false');
            }
        });
    }

    function setupMetalSoundEffects() {
        const elements = document.querySelectorAll('.link-button, .footer-link, .music-toggle');
        elements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.value = 600 + Math.random() * 200; // Higher pitch for metallic ring
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            });
        });
    }

    typeWriter();
    initCustomCursor();
    initButtonEffects();
    initBinarySubtitle();
    setupMetalSoundEffects();
});