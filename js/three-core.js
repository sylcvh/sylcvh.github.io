import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const host = document.getElementById('page-background');
const canWebGL = Boolean(host && window.WebGLRenderingContext);

const mobile = window.matchMedia('(max-width: 768px)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const quality = {
    mobile,
    coarse,
    reduced,
    dpr: Math.min(window.devicePixelRatio || 1, mobile || coarse ? 1.15 : 1.6),
    antialias: !(mobile || coarse),
    particles: mobile ? 420 : coarse ? 640 : 980,
    presence: mobile ? 280 : coarse ? 420 : 720,
};

export const palettes = {
    dark: {
        red: 0xff3b5c,
        cyan: 0x00e8ff,
        blue: 0x4f7cff,
        bg: 0x07060f,
        surface: 0x12101c,
        line: 0x3a3658,
        faint: 0x1c1830,
        text: 0x9aa3c7,
    },
    light: {
        red: 0xe11d48,
        cyan: 0x0891b2,
        blue: 0x2563eb,
        bg: 0xf3f5fb,
        surface: 0xffffff,
        line: 0xb8bdd0,
        faint: 0xdedfea,
        text: 0x5b6178,
    },
};

export function themeKey() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function getPalette() {
    return palettes[themeKey()];
}

export const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
export const clock = new THREE.Clock();
export let scrollY = 0;

const themeListeners = [];
export function onTheme(fn) {
    themeListeners.push(fn);
}

const views = [];

export function registerView(view) {
    views.push(view);
    if (view.onResize) view.onResize();
    return view;
}

function applyTheme() {
    const pal = getPalette();
    themeListeners.forEach((fn) => fn(pal));
}

new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
});
document.documentElement.addEventListener('theme:change', applyTheme);

window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
}, { passive: true });

let renderer = null;

if (canWebGL) {
    const canvas = document.createElement('canvas');
    canvas.className = 'three-root';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: quality.antialias,
            powerPreference: quality.mobile ? 'low-power' : 'high-performance',
            stencil: false,
        });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.autoClear = false;
    } catch {
        renderer = null;
    }
}

export { THREE, renderer };

function resize() {
    if (!renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(quality.dpr);
    renderer.setSize(w, h, false);
    views.forEach((view) => view.onResize?.());
}

function viewBox(el) {
    if (!el || !renderer) return null;
    const rect = el.getBoundingClientRect();
    const canvasRect = renderer.domElement.getBoundingClientRect();
    const vw = canvasRect.width;
    const vh = canvasRect.height;
    if (rect.width < 2 || rect.height < 2) return null;
    if (rect.bottom < canvasRect.top || rect.top > canvasRect.bottom || rect.right < canvasRect.left || rect.left > canvasRect.right) return null;
    return {
        x: rect.left - canvasRect.left,
        y: canvasRect.bottom - rect.bottom,
        w: rect.width,
        h: rect.height,
        aspect: rect.width / Math.max(rect.height, 1),
        vw,
        vh,
    };
}

let raf = 0;

function tick() {
    raf = requestAnimationFrame(tick);
    if (!renderer || document.hidden) return;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    renderer.clear();

    views.forEach((view, i) => {
        const box = viewBox(view.host);
        if (!box) return;

        if (view.camera && view.camera.isPerspectiveCamera) {
            view.camera.aspect = box.aspect;
            view.camera.updateProjectionMatrix();
        }

        view.onFrame?.(t, dt, box);

        if (view.full) {
            renderer.setScissorTest(false);
            renderer.setViewport(0, 0, renderer.domElement.clientWidth, renderer.domElement.clientHeight);
        } else {
            renderer.setScissorTest(true);
            renderer.setViewport(box.x, box.y, box.w, box.h);
            renderer.setScissor(box.x, box.y, box.w, box.h);
        }

        if (i > 0) renderer.clearDepth();
        renderer.render(view.scene, view.camera);
    });

    renderer.setScissorTest(false);
}

if (renderer) {
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !raf) raf = requestAnimationFrame(tick);
    });
    resize();
    raf = requestAnimationFrame(tick);
}

export function makeField(material) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        -1, -1, 0, 3, -1, 0, -1, 3, 0,
    ]), 3));
    const pass = new THREE.Mesh(geo, material);
    pass.frustumCulled = false;
    pass.renderOrder = -1;
    return pass;
}

export function makeColorRamp() {
    const pal = getPalette();
    const colors = [pal.red, pal.cyan, pal.blue];
    const data = new Uint8Array(colors.length * 4);
    colors.forEach((hex, i) => {
        const c = new THREE.Color(hex);
        data[i * 4] = Math.round(c.r * 255);
        data[i * 4 + 1] = Math.round(c.g * 255);
        data[i * 4 + 2] = Math.round(c.b * 255);
        data[i * 4 + 3] = 255;
    });
    const tex = new THREE.DataTexture(data, colors.length, 1, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
}
