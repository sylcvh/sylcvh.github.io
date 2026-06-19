document.addEventListener('DOMContentLoaded', function() {
    const contactButton = document.getElementById('contact-button');

    if (contactButton) {
        contactButton.addEventListener('click', () => {
            window.location.href = 'mailto:xylcvh@gmail.com';
        });
    }

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
            osc.frequency.value = 600 + Math.random() * 200;
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        });
    });
});