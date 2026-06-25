document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('presence-stage');
    const canvas = document.getElementById('presence-fx-canvas');
    const card = document.getElementById('lanyard-card');
    const hint = document.getElementById('presence-blast-hint');
    if (!stage || !canvas || !card) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const ctx = canvas.getContext('2d');

    let lines = [];
    let pointer = { x: 0, y: 0, active: false };
    let holdTimer = null;
    let pulseResetTimer = null;
    let isHolding = false;
    let holdEngaged = false;
    let pulsed = false;
    let animId = null;
    let kickTick = 0;

    function lineColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--presence-line').trim()
            || 'rgba(200, 205, 215, 0.38)';
    }

    document.documentElement.addEventListener('theme:change', () => {
        if (!pulsed) buildLines(canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
    });

    function accentRgb() {
        const accent = getComputedStyle(card).getPropertyValue('--lanyard-accent').trim() || '#54e29b';
        const h = accent.replace('#', '');
        const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
        const n = parseInt(full, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function buildLines(w, h) {
        lines = [];
        const hCount = Math.floor(h / (isMobile ? 32 : 26));
        const vCount = Math.floor(w / (isMobile ? 48 : 40));

        for (let i = 0; i < hCount; i += 1) {
            const y = (i + 1) * (h / (hCount + 1));
            lines.push({
                x1: w * 0.06, y1: y, x2: w * 0.94, y2: y,
                ox1: w * 0.06, oy1: y, ox2: w * 0.94, oy2: y,
                vx1: 0, vy1: 0, vx2: 0, vy2: 0,
                opacity: 0.18 + (i % 3) * 0.05,
            });
        }

        for (let i = 0; i < vCount; i += 1) {
            const x = (i + 1) * (w / (vCount + 1));
            lines.push({
                x1: x, y1: h * 0.1, x2: x, y2: h * 0.9,
                ox1: x, oy1: h * 0.1, ox2: x, oy2: h * 0.9,
                vx1: 0, vy1: 0, vx2: 0, vy2: 0,
                opacity: 0.1 + (i % 4) * 0.03,
            });
        }
    }

    function resetLines() {
        lines.forEach((line) => {
            line.x1 = line.ox1;
            line.y1 = line.oy1;
            line.x2 = line.ox2;
            line.y2 = line.oy2;
            line.vx1 = line.vy1 = line.vx2 = line.vy2 = 0;
            line.accent = false;
        });
    }

    function kickLines(intensity = 1) {
        const rgb = accentRgb();
        lines.forEach((line) => {
            const cx = (line.x1 + line.x2) * 0.5;
            const cy = (line.y1 + line.y2) * 0.5;
            const force = (2 + Math.random() * 6) * intensity;
            const a1 = Math.atan2(line.y1 - cy, line.x1 - cx);
            const a2 = Math.atan2(line.y2 - cy, line.x2 - cx);
            line.vx1 += Math.cos(a1) * force;
            line.vy1 += Math.sin(a1) * force;
            line.vx2 += Math.cos(a2) * force;
            line.vy2 += Math.sin(a2) * force;
            line.accent = true;
            line.rgb = rgb;
        });
    }

    function setPulseVisual(active) {
        pulsed = active;
        stage.classList.toggle('is-pulsed', active);
        hint?.classList.toggle('is-pulsed', active);

        if (active && typeof gsap !== 'undefined') {
            gsap.fromTo(card,
                { scale: 0.985 },
                { scale: 1, duration: 0.45, ease: 'power3.out' },
            );
        }
    }

    function clearPulseReset() {
        if (pulseResetTimer) {
            window.clearTimeout(pulseResetTimer);
            pulseResetTimer = null;
        }
    }

    function enterPulse({ oneShot = false } = {}) {
        if (prefersReduced) return;

        clearPulseReset();
        setPulseVisual(true);
        kickLines(oneShot ? 1.4 : 1);

        if (oneShot && !holdEngaged) {
            pulseResetTimer = window.setTimeout(exitPulse, 2000);
        }
    }

    function exitPulse() {
        if (holdEngaged) return;

        clearPulseReset();
        holdEngaged = false;
        setPulseVisual(false);
        stage.classList.remove('is-holding');
        hint?.classList.remove('is-holding');
        resetLines();
    }

    function pulseOneShot() {
        if (prefersReduced || holdEngaged) return;
        enterPulse({ oneShot: true });
    }

    function startHold() {
        if (prefersReduced || isMobile || isHolding) return;

        isHolding = true;
        stage.classList.add('is-holding');
        hint?.classList.add('is-holding');
        clearPulseReset();

        holdTimer = window.setTimeout(() => {
            holdEngaged = true;
            enterPulse({ oneShot: false });
        }, 400);
    }

    function endHold() {
        if (!isHolding && !holdEngaged) return;

        isHolding = false;
        stage.classList.remove('is-holding');
        hint?.classList.remove('is-holding');

        if (holdTimer) {
            window.clearTimeout(holdTimer);
            holdTimer = null;
        }

        if (holdEngaged) {
            holdEngaged = false;
            clearPulseReset();
            setPulseVisual(false);
            resetLines();
        }
    }

    function resize() {
        const rect = stage.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildLines(rect.width, rect.height);
    }

    function draw() {
        const rect = stage.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        ctx.clearRect(0, 0, w, h);

        kickTick += 1;
        if (holdEngaged && kickTick % 18 === 0) {
            kickLines(0.55);
        }

        lines.forEach((line) => {
            if (holdEngaged) {
                const mx = pointer.active ? pointer.x : w * 0.5;
                const my = pointer.active ? pointer.y : h * 0.5;
                const cx = (line.ox1 + line.ox2) * 0.5;
                const cy = (line.oy1 + line.oy2) * 0.5;
                const dist = Math.hypot(cx - mx, cy - my);
                const pull = Math.max(0, 1 - dist / 160) * 22;
                const angle = Math.atan2(cy - my, cx - mx);
                line.x1 = line.ox1 + Math.cos(angle) * pull;
                line.y1 = line.oy1 + Math.sin(angle) * pull;
                line.x2 = line.ox2 + Math.cos(angle) * pull * 0.65;
                line.y2 = line.oy2 + Math.sin(angle) * pull * 0.65;
                line.accent = true;
                line.rgb = accentRgb();
            } else if (pulsed) {
                line.x1 += line.vx1;
                line.y1 += line.vy1;
                line.x2 += line.vx2;
                line.y2 += line.vy2;
                line.vx1 *= 0.94;
                line.vy1 *= 0.94;
                line.vx2 *= 0.94;
                line.vy2 *= 0.94;
            } else if (pointer.active && !isMobile) {
                const mx = (line.x1 + line.x2) * 0.5;
                const my = (line.y1 + line.y2) * 0.5;
                const dist = Math.hypot(mx - pointer.x, my - pointer.y);
                const pull = Math.max(0, 1 - dist / 140) * 14;
                const angle = Math.atan2(my - pointer.y, mx - pointer.x);
                line.x1 = line.ox1 + Math.cos(angle) * pull;
                line.y1 = line.oy1 + Math.sin(angle) * pull;
                line.x2 = line.ox2 + Math.cos(angle) * pull * 0.5;
                line.y2 = line.oy2 + Math.sin(angle) * pull * 0.5;
            } else {
                line.x1 += (line.ox1 - line.x1) * 0.08;
                line.y1 += (line.oy1 - line.y1) * 0.08;
                line.x2 += (line.ox2 - line.x2) * 0.08;
                line.y2 += (line.oy2 - line.y2) * 0.08;
            }

            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            if (line.accent && line.rgb) {
                ctx.strokeStyle = `rgba(${line.rgb.r}, ${line.rgb.g}, ${line.rgb.b}, ${line.opacity * (holdEngaged ? 1.8 : 1.5)})`;
                ctx.lineWidth = holdEngaged ? 1.25 : 1.1;
            } else {
                ctx.strokeStyle = lineColor();
                ctx.globalAlpha = line.opacity;
                ctx.lineWidth = 1;
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        });

        animId = requestAnimationFrame(draw);
    }

    function onPointerMove(e) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
    }

    if (!prefersReduced && !isMobile) {
        stage.addEventListener('pointermove', onPointerMove, { passive: true });
        stage.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
        card.addEventListener('pointerdown', startHold);
        card.addEventListener('pointerup', endHold);
        card.addEventListener('pointerleave', endHold);
        card.addEventListener('pointercancel', endHold);
        hint?.addEventListener('pointerdown', startHold);
        hint?.addEventListener('pointerup', endHold);
        hint?.addEventListener('pointerleave', endHold);
    }

    let lastStatus = null;
    card.addEventListener('lanyard:status', (e) => {
        const status = e.detail?.status;
        if (status === lastStatus || prefersReduced || holdEngaged) return;
        lastStatus = status;
        pulseOneShot();
    });

    function markVisible() {
        stage.classList.add('is-visible');
        if (!prefersReduced && !holdEngaged) {
            window.setTimeout(pulseOneShot, 400);
        }
    }

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
            trigger: stage,
            start: 'top 85%',
            once: true,
            onEnter: markVisible,
        });
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    markVisible();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });
        observer.observe(stage);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();

    window.addEventListener('beforeunload', () => {
        if (animId) cancelAnimationFrame(animId);
        clearPulseReset();
        if (holdTimer) window.clearTimeout(holdTimer);
    });
});