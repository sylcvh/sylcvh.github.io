document.addEventListener('DOMContentLoaded', () => {
    initTyping();
    initScrollTop();
    initScrollProgress();
    initHeader();
    initHeroEffects();
    initReveals();
    initFactCounters();
    initContact();
    initPresenceAnimations();
});

function initTyping() {
    const textEl = document.getElementById('typing-text');
    const cursor = document.getElementById('typing-cursor');
    if (!textEl || !cursor) return;

    const text = 'Sylco™';
    let i = 0;
    textEl.textContent = '';

    function type() {
        if (i < text.length) {
            textEl.textContent += text.charAt(i);
            i += 1;
            setTimeout(type, 110);
        }
    }

    setTimeout(type, 600);
}

function initScrollTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;

    const threshold = window.matchMedia('(max-width: 768px)').matches ? 100 : 140;

    function update() {
        const show = window.scrollY > threshold;
        btn.classList.toggle('is-visible', show);
        btn.hidden = !show;
    }

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    function update() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        bar.style.setProperty('--scroll-progress', progress.toFixed(4));
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
}

function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    function update() {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initHeroEffects() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof gsap === 'undefined') return;

    const wave = document.querySelector('.hero__wave-path');
    if (wave && !reduced) {
        gsap.to(wave, {
            strokeDashoffset: -400,
            duration: 14,
            ease: 'none',
            repeat: -1,
        });
    }
}

function initReveals() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = document.querySelectorAll('.reveal');

    if (reduced) {
        items.forEach((el) => el.classList.add('is-in'));
        return;
    }

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        items.forEach((el, i) => {
            const inHero = el.closest('.hero');
            gsap.fromTo(el,
                { opacity: 0, y: 28 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    ease: 'power3.out',
                    delay: inHero ? 0.15 + i * 0.08 : 0,
                    scrollTrigger: inHero ? undefined : {
                        trigger: el,
                        start: 'top 92%',
                        toggleActions: 'play none none none',
                    },
                    onStart: () => el.classList.add('is-in'),
                }
            );
        });
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    items.forEach((el) => io.observe(el));
}

function initFactCounters() {
    const nums = document.querySelectorAll('.fact__num[data-count]');
    if (!nums.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function run() {
        nums.forEach((el) => {
            const target = Number(el.dataset.count);
            if (reduced || typeof gsap === 'undefined') {
                el.textContent = `${target}+`;
                return;
            }
            const obj = { val: 0 };
            gsap.to(obj, {
                val: target,
                duration: 1.6,
                ease: 'power2.out',
                onUpdate: () => { el.textContent = `${Math.round(obj.val)}+`; },
            });
        });
    }

    if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.create({
            trigger: '#facts',
            start: 'top 80%',
            once: true,
            onEnter: run,
        });
    } else {
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                run();
                io.disconnect();
            }
        }, { threshold: 0.2 });
        const section = document.getElementById('facts');
        if (section) io.observe(section);
    }
}

function initContact() {
    const btn = document.getElementById('contact-button');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'mailto:xylcvh@gmail.com';
        });
    }
}

function initPresenceAnimations() {
    const stage = document.getElementById('presence-stage');
    const card = document.getElementById('lanyard-card');
    if (!stage || !card) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const parts = stage.querySelectorAll('.presence-part');

    if (reduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        parts.forEach((el) => el.classList.add('is-in'));
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(stage,
        { opacity: 0, y: 50, scale: 0.96 },
        {
            opacity: 1, y: 0, scale: 1,
            duration: 1.1, ease: 'power4.out',
            scrollTrigger: { trigger: stage, start: 'top 88%', toggleActions: 'play none none none' },
        }
    );

    gsap.fromTo('.lanyard-card__corner',
        { opacity: 0, scale: 0.4 },
        {
            opacity: 0.75, scale: 1,
            duration: 0.8, stagger: 0.1, ease: 'back.out(2)', delay: 0.2,
            scrollTrigger: { trigger: stage, start: 'top 86%', toggleActions: 'play none none none' },
        }
    );

    gsap.fromTo(parts,
        { opacity: 0, y: 22, filter: 'blur(4px)' },
        {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.85, stagger: 0.09, ease: 'power3.out', delay: 0.35,
            scrollTrigger: { trigger: stage, start: 'top 84%', toggleActions: 'play none none none' },
        }
    );

    gsap.to(card, {
        y: -6,
        ease: 'none',
        scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
    });
}