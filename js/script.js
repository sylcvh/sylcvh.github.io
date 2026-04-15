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

    function initSlashSubtitle() {
        const subtitle = document.querySelector('.subtitle');
        if (!subtitle) return;

        const text = subtitle.textContent.trim();
        subtitle.textContent = '';

        const letters = [];
        const slashChars = ['/', '\\', '|'];
        const canHover = window.matchMedia('(pointer: fine)').matches;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'slash-letter';
            span.dataset.char = char;
            span.style.setProperty('--delay', `${index * 45}ms`);

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
                const totalCycles = 3 + Math.floor(Math.random() * 2);
                let cycles = 0;

                setTimeout(() => {
                    const interval = setInterval(() => {
                        cycles += 1;
                        if (cycles >= totalCycles) {
                            clearInterval(interval);
                            span.textContent = finalChar;
                            span.classList.add('locked');
                        } else {
                            span.textContent = slashChars[(cycles + idx) % slashChars.length];
                        }
                    }, 42);
                }, idx * 26);
            });
        };

        runSlashEffect();

        if (canHover) {
            subtitle.addEventListener('mouseenter', runSlashEffect);
        }

        if (!reducedMotion) {
            setInterval(runSlashEffect, 15000);
        }
    }

    const themeCheckbox = document.getElementById('theme-checkbox');
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('metalTheme', theme);

        if (themeCheckbox) {
            themeCheckbox.checked = theme === 'light';
        }

        // Keep mobile browser chrome in sync with the active theme
        if (themeMeta) {
            const bg = theme === 'light' ? '#f5f7fb' : '#0a0a0a';
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

        const themeSwitch = document.querySelector('.theme-switch');
        if (themeSwitch) {
            themeSwitch.addEventListener('click', (e) => {
                if (e.target === themeCheckbox) {
                    return;
                }
                e.preventDefault();
                themeCheckbox.checked = !themeCheckbox.checked;
                applyTheme(themeCheckbox.checked ? 'light' : 'dark');
            });

            themeSwitch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    themeCheckbox.checked = !themeCheckbox.checked;
                    applyTheme(themeCheckbox.checked ? 'light' : 'dark');
                }
            });
        }
    }

    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeLabel = document.getElementById('volume-label');
    const contactButton = document.getElementById('contact-button');
    
    let audioUnlocked = false;

    const updateVolumeUi = (percentage) => {
        if (!volumeSlider) return;
        const bounded = Math.min(Math.max(Number(percentage), 0), 100);
        volumeSlider.style.setProperty('--progress', `${bounded}%`);
        if (volumeLabel) {
            volumeLabel.textContent = `${Math.round(bounded)}%`;
        }
    };

    if (volumeSlider && bgMusic) {
        const savedVolume = localStorage.getItem('musicVolume');
        if (savedVolume !== null) {
            const volume = Math.min(Math.max(parseFloat(savedVolume), 0), 1);
            bgMusic.volume = volume;
            volumeSlider.value = Math.round(volume * 100);
            updateVolumeUi(volume * 100);
        } else {
            bgMusic.volume = 0.5;
            volumeSlider.value = 50;
            updateVolumeUi(50);
        }

        volumeSlider.addEventListener('input', (e) => {
            const percentage = parseInt(e.target.value, 10);
            const volume = percentage / 100;
            bgMusic.volume = volume;
            localStorage.setItem('musicVolume', volume);
            updateVolumeUi(percentage);
        });
    }

    if (contactButton) {
        contactButton.addEventListener('click', () => {
            window.location.href = 'mailto:xylcvh@gmail.com';
        });
    }

    if (bgMusic && musicToggle) {
        const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

        const setMusicUiState = (isActive) => {
            musicToggle.classList.toggle('active', isActive);
            musicToggle.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            musicToggle.setAttribute('aria-label', isActive ? 'Pause background music' : 'Play background music');
        };

        const toggleMusicPlayback = () => {
            if (bgMusic.paused) {
                bgMusic.play().then(() => {
                    setMusicUiState(true);
                    localStorage.setItem('musicEnabled', 'true');
                });
            } else {
                bgMusic.pause();
                setMusicUiState(false);
                localStorage.setItem('musicEnabled', 'false');
            }
        };

        const savedMusicEnabled = localStorage.getItem('musicEnabled');

        if (savedMusicEnabled !== 'false') {
            // Attempt autoplay if user didn't explicitly disable music.
            bgMusic.play().then(() => {
                setMusicUiState(true);
                localStorage.setItem('musicEnabled', 'true');
                audioUnlocked = true;
            }).catch((err) => {
                console.log('Autoplay prevented, waiting for user interaction:', err);

                function unlockAndPlayMusic() {
                    if (audioUnlocked) return;
                    audioUnlocked = true;

                    bgMusic.play().then(() => {
                        setMusicUiState(true);
                        localStorage.setItem('musicEnabled', 'true');
                    }).catch((playErr) => {
                        console.log('Audio play failed:', playErr);
                    });
                }

                document.body.addEventListener('click', unlockAndPlayMusic, { once: true });
                document.body.addEventListener('touchstart', unlockAndPlayMusic, { once: true });
            });
        } else {
            setMusicUiState(false);
        }

        const setExpanded = (expanded) => {
            musicToggle.classList.toggle('expanded', expanded);
        };

        if (isCoarsePointer) {
            // Touch devices have no hover, so keep the slider area available.
            setExpanded(true);
        } else {
            musicToggle.addEventListener('mouseenter', () => setExpanded(true));
            musicToggle.addEventListener('mouseleave', () => setExpanded(false));
            musicToggle.addEventListener('focusin', () => setExpanded(true));
            musicToggle.addEventListener('focusout', () => setExpanded(false));
        }

        musicToggle.addEventListener('click', (e) => {
            if (e.target instanceof Element && e.target.closest('.volume-control')) {
                return;
            }
            e.stopPropagation();
            toggleMusicPlayback();
        });

        musicToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMusicPlayback();
            }
        });

        if (volumeSlider) {
            volumeSlider.addEventListener('pointerdown', () => setExpanded(true));
            volumeSlider.addEventListener('blur', () => {
                if (!isCoarsePointer && !musicToggle.matches(':hover')) {
                    setExpanded(false);
                }
            });
        }
    }

    function setupMetalSoundEffects() {
        if (!window.matchMedia('(pointer: fine)').matches) {
            return;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            return;
        }

        const ctx = new AudioCtx();

        const elements = document.querySelectorAll('.link-button, .footer-link, .music-toggle');
        elements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (ctx.state === 'suspended') {
                    ctx.resume();
                }

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
    initSlashSubtitle();
    setupMetalSoundEffects();
});