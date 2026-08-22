import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const host = document.getElementById('page-background');
const canWebGL = Boolean(host && window.WebGLRenderingContext);

const mobile = window.matchMedia('(max-width: 768px)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const quality = {
    mobile,
    reduced,
    dpr: Math.min(window.devicePixelRatio || 1, mobile || coarse ? 1.15 : 1.6),
    antialias: !(mobile || coarse),
};

const palettes = {
    dark: { red: 0xff3b5c, cyan: 0x00e8ff, blue: 0x4f7cff },
    light: { red: 0xe11d48, cyan: 0x0891b2, blue: 0x2563eb },
};

function getPalette() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    return palettes[light ? 'light' : 'dark'];
}

export const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
export let scrollY = 0;
const clock = new THREE.Clock();

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

let raf = 0;

function tick() {
    if (!renderer || document.hidden) {
        raf = 0;
        return;
    }
    raf = requestAnimationFrame(tick);

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    const t = clock.elapsedTime;
    views.forEach((view) => {
        view.onFrame?.(t);
        renderer.render(view.scene, view.camera);
    });
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
