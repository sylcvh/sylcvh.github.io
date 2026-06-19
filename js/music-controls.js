document.addEventListener('DOMContentLoaded', function() {
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeLabel = document.getElementById('volume-label');

    if (!bgMusic || !musicToggle) {
        return;
    }

    let audioUnlocked = false;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    const updateVolumeUi = (percentage) => {
        if (!volumeSlider) return;
        const bounded = Math.min(Math.max(Number(percentage), 0), 100);
        volumeSlider.style.setProperty('--progress', `${bounded}%`);
        if (volumeLabel) {
            volumeLabel.textContent = `${Math.round(bounded)}%`;
        }
    };

    if (volumeSlider) {
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
});