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

    function createMetalDrops() {
        const container = document.getElementById('metal-drops');
        const dropCount = 25;
        
        for (let i = 0; i < dropCount; i++) {
            const drop = document.createElement('div');
            drop.classList.add('metal-drop');
            
            drop.style.left = `${Math.random() * 100}vw`;
            
            const size = Math.random() * 6 + 4;
            drop.style.width = `${size}px`;
            drop.style.height = `${size}px`;
            
            const duration = Math.random() * 8 + 8;
            drop.style.animationDuration = `${duration}s`;
            drop.style.animationDelay = `${Math.random() * 5}s`;
            
            drop.style.background = getComputedStyle(document.documentElement).getPropertyValue('--metal-primary');
            drop.style.boxShadow = `
                0 0 ${size * 2}px rgba(160, 160, 180, 0.5),
                inset 0 0 ${size}px rgba(255, 255, 255, 0.4)
            `;
            
            container.appendChild(drop);
        }
    }

    function createMetalRippleEffect() {
        document.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            ripple.classList.add('metal-ripple');
            ripple.style.left = `${e.clientX}px`;
            ripple.style.top = `${e.clientY}px`;
            
            const size = Math.random() * 50 + 50;
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            
            document.body.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 1000);
        });
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

    // Lightweight Three.js scene for a metallic hero object
    function initLiquidMetalScene() {
        const canvas = document.getElementById('liquid-metal-canvas');
        if (!canvas || !window.THREE) return;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0.6, 4);
        scene.add(camera);

        const light1 = new THREE.DirectionalLight(0xffffff, 1.1);
        light1.position.set(2, 3, 4);
        scene.add(light1);

        const light2 = new THREE.PointLight(0x9fc9d6, 0.8, 10);
        light2.position.set(-3, -1, 2);
        scene.add(light2);

        const ambient = new THREE.HemisphereLight(0xdde6ff, 0x0a0a0a, 0.65);
        scene.add(ambient);

        const geometry = new THREE.TorusKnotGeometry(0.9, 0.26, 220, 32, 2, 3);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xc8d4e0,
            metalness: 1,
            roughness: 0.18,
            clearcoat: 0.6,
            clearcoatRoughness: 0.15,
            envMapIntensity: 1.1,
            sheen: 0.25,
            sheenRoughness: 0.4,
            transmission: 0,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.set(0.4, 0.2, 0);
        scene.add(mesh);

        function handleResize() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }

        window.addEventListener('resize', handleResize);

        function animate() {
            mesh.rotation.y += 0.005;
            mesh.rotation.x += 0.0025;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

        animate();
    }

    const overlay = document.querySelector('.refraction-overlay');
    if (overlay) {
        window.addEventListener('mousemove', function(e) {
            const moveX = (e.clientX / window.innerWidth - 0.5) * 30;
            const moveY = (e.clientY / window.innerHeight - 0.5) * 30;
            overlay.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
        });
    }

    typeWriter();
    createMetalDrops();
    createMetalRippleEffect();
    initButtonEffects();
    initBinarySubtitle();
    setupMetalSoundEffects();
    initLiquidMetalScene();
});