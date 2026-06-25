document.addEventListener('DOMContentLoaded', () => {
    const mq = window.matchMedia('(max-width: 768px)');
    const headerMusic = document.querySelector('#header-chrome .music-controls');
    const dock = document.getElementById('mobile-sound-dock');

    if (!headerMusic || !dock) return;

    function placeMusic() {
        if (mq.matches) {
            if (!dock.contains(headerMusic)) {
                dock.appendChild(headerMusic);
                dock.setAttribute('aria-hidden', 'false');
            }
            headerMusic.style.display = '';
        } else {
            const chrome = document.getElementById('header-chrome');
            if (chrome && !chrome.contains(headerMusic)) {
                chrome.insertBefore(headerMusic, chrome.firstChild);
            }
            dock.setAttribute('aria-hidden', 'true');
        }
    }

    placeMusic();
    mq.addEventListener('change', placeMusic);
});