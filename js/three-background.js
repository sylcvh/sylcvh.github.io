import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const host = document.getElementById('page-background');
    if (!host || !window.WebGLRenderingContext) return;

    let renderer;
    const canvas = document.createElement('canvas');
    canvas.className = 'three-background';
    canvas.setAttribute('aria-hidden', 'true');

    try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setClearColor(0x000000, 0);
    } catch {
        return;
    }

    host.appendChild(canvas);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollY = 0;

    const palettes = {
        dark: { bg: 0x09090e, line: 0x2a2a38, faint: 0x1a1a24 },
        light: { bg: 0xf7f5f0, line: 0xd8d4ca, faint: 0xe8e4dc },
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    camera.position.set(0, 0.3, 11);

    const voidMat = new THREE.ShaderMaterial({
        depthWrite: false,
        uniforms: {
            line: { value: new THREE.Color(0x3a3a42) },
            faint: { value: new THREE.Color(0x2a2a30) },
            time: { value: 0 },
            scroll: { value: 0 },
            pointer: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform vec3 line;
            uniform vec3 faint;
            uniform float time;
            uniform float scroll;
            uniform vec2 pointer;

            float lineAt(float v, float w) {
                return smoothstep(w, 0.0, abs(v));
            }

            void main() {
                vec2 uv = vUv;
                float t = time * 0.05 + scroll * 0.00004;
                float center = smoothstep(0.2, 0.45, length((uv - 0.5) * vec2(1.1, 0.95)));

                float art = 0.0;
                for (int i = 0; i < 5; i++) {
                    float fi = float(i);
                    float y = fract(fi * 0.19 + t * (0.03 + fi * 0.005) + pointer.y * 0.02);
                    art += lineAt(uv.y - y, 0.002) * smoothstep(0.1, 0.25, uv.x) * smoothstep(0.9, 0.75, uv.x) * 0.04;
                }

                float arc = smoothstep(0.003, 0.0, abs(length(uv - vec2(0.86, 0.18)) - 0.2));
                float arc2 = smoothstep(0.002, 0.0, abs(length(uv - vec2(0.12, 0.82)) - 0.14));

                float band = art * center * 0.9;
                float arcs = (arc * 0.18 + arc2 * 0.12) * center;
                float alpha = clamp(max(band, arcs), 0.0, 1.0);
                vec3 col = vec3(0.0);
                col = mix(col, faint, band);
                col = mix(col, line, arcs);

                gl_FragColor = vec4(col, alpha);
            }
        `,
        transparent: true,
    });

    voidMat.depthTest = false;
    voidMat.blending = THREE.NormalBlending;

    const voidPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), voidMat);
    voidPlane.renderOrder = -1;
    scene.add(voidPlane);

    const art = new THREE.Group();
    scene.add(art);

    function makeMat(opacity) {
        return new THREE.LineBasicMaterial({
            color: palettes.dark.line,
            transparent: true,
            opacity,
            depthWrite: false,
        });
    }

    function addSegments(verts, opacity) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        const mesh = new THREE.LineSegments(geo, makeMat(opacity));
        art.add(mesh);
        return mesh;
    }

    function circleVerts(r, n, z) {
        const v = [];
        for (let i = 0; i < n; i += 1) {
            const a0 = (i / n) * Math.PI * 2;
            const a1 = ((i + 1) / n) * Math.PI * 2;
            v.push(Math.cos(a0) * r, Math.sin(a0) * r, z, Math.cos(a1) * r, Math.sin(a1) * r, z);
        }
        return v;
    }

    const phi = 1.61803398875;
    const motion = [];

    const column = addSegments([
        -8.5, -3.5, -7, -8.5, 3.8, -7,
        -7.8, -3, -6.5, -7.8, 3.3, -6.5,
        -8.5, -1.2, -7, -7.2, -1.2, -6.5,
        -8.5, 1.2, -7, -7.2, 1.2, -6.5,
    ], 0.11);
    motion.push({ obj: column, kind: 'float', phase: 0.2 });

    const rings = new THREE.Group();
    [2.2, 2.2 / phi, 2.2 / (phi * phi)].forEach((r, i) => {
        const ring = addSegments(circleVerts(r, mobile ? 28 : 44, 0), 0.09 + i * 0.03);
        rings.add(ring);
    });
    rings.position.set(-6.5, -0.5, -8);
    art.add(rings);
    motion.push({ obj: rings, kind: 'spin', speed: 0.12 });

    const arcVerts = [];
    const segs = mobile ? 18 : 30;
    for (let i = 0; i < segs; i += 1) {
        const a0 = -0.15 + (i / segs) * 1.35;
        const a1 = -0.15 + ((i + 1) / segs) * 1.35;
        const r = 4.5;
        arcVerts.push(Math.cos(a0) * r, Math.sin(a0) * r * 0.75, -9, Math.cos(a1) * r, Math.sin(a1) * r * 0.75, -9);
    }
    const arc = addSegments(arcVerts, 0.13);
    arc.position.set(7.5, 1.2, 0);
    motion.push({ obj: arc, kind: 'sway', phase: 0.8 });

    const tri = addSegments([
        0, 0.9, -8, -0.78, -0.62, -8,
        -0.78, -0.62, -8, 0.78, -0.62, -8,
        0.78, -0.62, -8, 0, 0.9, -8,
    ], 0.14);
    tri.position.set(-7.8, 2.8, -6);
    motion.push({ obj: tri, kind: 'sway', phase: 1.4 });

    const sq = addSegments([
        -0.55, -0.55, -7.5, 0.55, -0.55, -7.5,
        0.55, -0.55, -7.5, 0.55, 0.55, -7.5,
        0.55, 0.55, -7.5, -0.55, 0.55, -7.5,
        -0.55, 0.55, -7.5, -0.55, -0.55, -7.5,
    ], 0.12);
    sq.position.set(8.2, 2.6, -7);
    motion.push({ obj: sq, kind: 'spin', speed: -0.08 });

    if (!mobile) {
        const frame = addSegments([
            0, 0, -8, 2.6, 0, -8,
            2.6, 0, -8, 2.6, 3.2, -8,
            2.6, 3.2, -8, 0, 3.2, -8,
            0, 3.2, -8, 0, 0, -8,
            0.28, 0.28, -7.8, 2.32, 0.28, -7.8,
            2.32, 0.28, -7.8, 2.32, 2.92, -7.8,
            2.32, 2.92, -7.8, 0.28, 2.92, -7.8,
            0.28, 2.92, -7.8, 0.28, 0.28, -7.8,
        ], 0.12);
        frame.position.set(7, -2.8, 0);
        motion.push({ obj: frame, kind: 'float', phase: 2.1 });

        const curve = [];
        const p = (t) => {
            const u = 1 - t;
            const x = u * u * u * -2 + 3 * u * u * t * 1 + 3 * u * t * t * 4 + t * t * t * 7;
            const y = u * u * u * 1 + 3 * u * u * t * 3 + 3 * u * t * t * 0.5 + t * t * t * 2.5;
            return [x, y, -7];
        };
        for (let i = 0; i < 32; i += 1) {
            const a = p(i / 32);
            const b = p((i + 1) / 32);
            curve.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        }
        const path = addSegments(curve, 0.11);
        motion.push({ obj: path, kind: 'pulse', phase: 0.5 });
    }

    const mats = [];
    art.traverse((o) => { if (o.material) mats.push(o.material); });

    function applyTheme() {
        const key = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const p = palettes[key];
        const c = p.line;
        mats.forEach((m) => m.color.setHex(c));
        voidMat.uniforms.line.value.setHex(c);
        voidMat.uniforms.faint.value.setHex(p.faint);
    }
    applyTheme();
    new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.documentElement.addEventListener('theme:change', applyTheme);

    window.addEventListener('pointermove', (e) => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    function tick(now) {
        const t = now * 0.001;
        const m = reduced ? 0.12 : 1;

        pointer.x += (pointer.tx - pointer.x) * 0.04;
        pointer.y += (pointer.ty - pointer.y) * 0.04;

        voidMat.uniforms.time.value = t;
        voidMat.uniforms.scroll.value = scrollY;
        voidMat.uniforms.pointer.value.set(pointer.x, pointer.y);

        const scrollF = Math.min(scrollY * 0.00035, 0.4);
        camera.position.x += (pointer.x * 0.25 - camera.position.x) * 0.02;
        camera.position.y += (0.3 - pointer.y * 0.1 + scrollF * 0.08 - camera.position.y) * 0.02;
        camera.lookAt(pointer.x * 0.04, pointer.y * 0.03, -4);

        art.rotation.y = pointer.x * 0.03 * m;
        art.rotation.x = pointer.y * 0.015 * m;
        art.position.y = scrollF * 0.1;

        motion.forEach((item, i) => {
            const ph = item.phase ?? i;
            if (item.kind === 'spin') {
                item.obj.rotation.z += (item.speed ?? 0.1) * 0.004 * m;
            } else if (item.kind === 'sway') {
                item.obj.rotation.z = Math.sin(t * 0.22 + ph) * 0.06 * m;
            } else if (item.kind === 'float') {
                item.obj.position.y = Math.sin(t * 0.3 + ph) * 0.12 * m;
            } else if (item.kind === 'pulse' && item.obj.material) {
                item.obj.material.opacity = 0.09 + Math.sin(t * 0.45 + ph) * 0.03;
            }
        });

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(tick);
});