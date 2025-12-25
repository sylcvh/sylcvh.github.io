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

    const themeCheckbox = document.getElementById('theme-checkbox');
    
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('metalTheme', theme);
    }

    themeCheckbox.addEventListener('change', function() {
        if (this.checked) {
            applyTheme('light');
        } else {
            applyTheme('dark');
        }
    });

    const savedTheme = localStorage.getItem('metalTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeCheckbox.checked = (savedTheme === 'light');

    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    
    let audioUnlocked = false;

    const savedVolume = localStorage.getItem('musicVolume');
    if (savedVolume) {
        const volume = parseFloat(savedVolume);
        bgMusic.volume = volume;
        volumeSlider.value = volume * 100;
    } else {
        bgMusic.volume = 0.3;
        volumeSlider.value = 30;
    }

    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        bgMusic.volume = volume;
        localStorage.setItem('musicVolume', volume);
    });

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

    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent re-triggering unlock
        
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

    if (localStorage.getItem('musicEnabled') === 'true') {
        musicToggle.classList.add('active');
        bgMusic.play().catch(() => {
            // Will play after next click
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

    window.addEventListener('mousemove', function(e) {
        const overlay = document.querySelector('.refraction-overlay');
        if (overlay) {
            const moveX = (e.clientX / window.innerWidth - 0.5) * 30;
            const moveY = (e.clientY / window.innerHeight - 0.5) * 30;
            overlay.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
        }
    });

    typeWriter();
    createMetalDrops();
    createMetalRippleEffect();
    setupMetalSoundEffects();
});