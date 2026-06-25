document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('menu-trigger');
    const panel = document.getElementById('nav-panel');
    const backdrop = document.getElementById('nav-backdrop');
    const drawer = panel?.querySelector('.nav-panel__drawer');
    const closeLinks = panel?.querySelectorAll('[data-nav-close]');
    const navLinks = panel?.querySelectorAll('.nav-panel__link');
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const useGsap = typeof gsap !== 'undefined' && !mobile;

    if (!trigger || !panel || !backdrop) return;

    function setOpen(isOpen) {
        panel.classList.toggle('is-open', isOpen);
        panel.setAttribute('aria-hidden', String(!isOpen));
        trigger.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';

        if (!drawer) return;

        if (useGsap) {
            if (isOpen) {
                gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
                gsap.fromTo(drawer, { xPercent: 105 }, { xPercent: 0, duration: 0.55, ease: 'power4.out' });
                gsap.fromTo(navLinks,
                    { opacity: 0, x: 40 },
                    { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
                );
            } else {
                gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: 'power2.in' });
                gsap.to(drawer, { xPercent: 105, duration: 0.45, ease: 'power3.in' });
                gsap.to(navLinks, { opacity: 0, x: 24, duration: 0.25, stagger: 0.04, ease: 'power2.in' });
            }
        } else {
            gsap?.set(drawer, { clearProps: 'all' });
            gsap?.set(navLinks, { clearProps: 'all' });
            gsap?.set(backdrop, { clearProps: 'all' });
        }
    }

    trigger.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    closeLinks?.forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
});