import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const host = document.getElementById('hero-three-host');
    const hero = document.getElementById('hero');
    if (!host || !hero || !window.WebGLRenderingContext) return;

    let renderer;
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-three-canvas';
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
    let intro = 0;

    const palettes = {
        dark: { line: 0x3a3a4a, accent: 0xb8ff3c, surface: 0x12121a, faint: 0x252530, text: 0x606070 },
        light: { line: 0xb8b2a4, accent: 0x8fc028, surface: 0xfffefb, faint: 0xd0ccc0, text: 0x9a9588 },
    };

    function themeKey() {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function pal() { return palettes[themeKey()]; }

    const themed = [];

    function track(mat, key) {
        themed.push({ mat, key });
        return mat;
    }

    function lineMat(opacity, key = 'line') {
        return track(new THREE.LineBasicMaterial({
            color: pal()[key],
            transparent: true,
            opacity,
            depthWrite: false,
        }), key);
    }

    function meshMat(opacity) {
        return track(new THREE.MeshBasicMaterial({
            color: pal().surface,
            transparent: true,
            opacity,
            depthWrite: false,
            side: THREE.DoubleSide,
        }), 'surface');
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(mobile ? 0.5 : 1.2, 2.4, mobile ? 9.5 : 10.5);

    const root = new THREE.Group();
    scene.add(root);

    let layoutX = 0;

    const LAYER_W = mobile ? 3.4 : 4.6;
    const LAYER_H = mobile ? 2.0 : 2.5;
    const TILT = -0.52;

    function rectLoop(w, h) {
        const hw = w * 0.5;
        const hh = h * 0.5;
        return new Float32Array([
            -hw, 0, -hh,  hw, 0, -hh,
             hw, 0, -hh,  hw, 0,  hh,
             hw, 0,  hh, -hw, 0,  hh,
            -hw, 0,  hh, -hw, 0, -hh,
        ]);
    }

    function gridSegments(w, h, cols, rows) {
        const verts = [];
        const hw = w * 0.5;
        const hh = h * 0.5;
        const cw = w / cols;
        const rh = h / rows;
        for (let i = 1; i < cols; i += 1) {
            const x = -hw + i * cw;
            verts.push(x, 0, -hh, x, 0, hh);
        }
        for (let j = 1; j < rows; j += 1) {
            const z = -hh + j * rh;
            verts.push(-hw, 0, z, hw, 0, z);
        }
        return new Float32Array(verts);
    }

    function blockWire(x, z, w, h) {
        const hw = w * 0.5;
        const hh = h * 0.5;
        return new Float32Array([
            x - hw, 0, z - hh,  x + hw, 0, z - hh,
            x + hw, 0, z - hh,  x + hw, 0, z + hh,
            x + hw, 0, z + hh,  x - hw, 0, z + hh,
            x - hw, 0, z + hh,  x - hw, 0, z - hh,
        ]);
    }

    function nodeCross(x, z, s = 0.06) {
        return new Float32Array([
            x, 0.01, z - s,  x, 0.01, z + s,
            x - s, 0.01, z,  x + s, 0.01, z,
        ]);
    }

    const layerDefs = [
        {
            id: 'design',
            y: mobile ? 1.15 : 1.45,
            introZ: -1.2,
            blocks: mobile
                ? [[-0.9, -0.45, 1.1, 0.55], [0.55, 0.35, 0.85, 0.4]]
                : [[-1.2, -0.55, 1.35, 0.65], [0.35, 0.15, 1.0, 0.45], [1.1, -0.5, 0.55, 0.35]],
            anchors: mobile
                ? [[-0.9, -0.45], [0.55, 0.35]]
                : [[-1.2, -0.55], [0.35, 0.15], [1.1, -0.5]],
            grid: [8, 5],
            frameOpacity: 0.58,
            gridOpacity: 0.22,
            blockOpacity: 0.45,
        },
        {
            id: 'frontend',
            y: 0,
            introZ: 0,
            blocks: mobile
                ? [[-0.7, 0.1, 1.4, 0.28], [-0.5, -0.5, 0.55, 0.35], [0.65, -0.35, 0.7, 0.5]]
                : [[-1.0, 0.2, 1.8, 0.3], [-0.85, -0.55, 0.65, 0.4], [0.2, -0.45, 0.9, 0.55], [1.05, 0.05, 0.55, 0.38]],
            anchors: mobile
                ? [[-0.7, 0.1], [-0.5, -0.5], [0.65, -0.35]]
                : [[-1.0, 0.2], [-0.85, -0.55], [0.2, -0.45], [1.05, 0.05]],
            grid: [12, 6],
            frameOpacity: 0.62,
            gridOpacity: 0.24,
            blockOpacity: 0.5,
        },
        {
            id: 'backend',
            y: mobile ? -1.15 : -1.45,
            introZ: 1.2,
            blocks: mobile
                ? [[-0.6, 0.0, 0.5, 0.5], [0.5, -0.2, 0.75, 0.45], [0.0, 0.55, 0.4, 0.3]]
                : [[-0.75, 0.05, 0.55, 0.55], [0.45, -0.15, 0.85, 0.5], [0.05, 0.6, 0.45, 0.32], [-1.05, -0.4, 0.5, 0.38]],
            anchors: mobile
                ? [[-0.6, 0.0], [0.5, -0.2], [0.0, 0.55]]
                : [[-0.75, 0.05], [0.45, -0.15], [0.05, 0.6], [-1.05, -0.4]],
            grid: [10, 5],
            frameOpacity: 0.52,
            gridOpacity: 0.2,
            blockOpacity: 0.42,
        },
    ];

    const layers = [];

    layerDefs.forEach((def, li) => {
        const group = new THREE.Group();
        group.userData = {
            baseY: def.y,
            introZ: def.introZ,
            phase: li * 1.1,
            id: def.id,
        };
        group.position.y = def.y;
        group.rotation.x = TILT;

        const glass = new THREE.Mesh(new THREE.PlaneGeometry(LAYER_W + 0.15, LAYER_H + 0.15), meshMat(0.08));
        glass.rotation.x = -Math.PI * 0.5;
        group.add(glass);

        const frameGeo = new THREE.BufferGeometry();
        frameGeo.setAttribute('position', new THREE.BufferAttribute(rectLoop(LAYER_W, LAYER_H), 3));
        group.add(new THREE.LineSegments(frameGeo, lineMat(def.frameOpacity)));

        const gridGeo = new THREE.BufferGeometry();
        gridGeo.setAttribute('position', new THREE.BufferAttribute(gridSegments(LAYER_W, LAYER_H, def.grid[0], def.grid[1]), 3));
        group.add(new THREE.LineSegments(gridGeo, lineMat(def.gridOpacity, 'faint')));

        def.blocks.forEach(([x, z, w, h], bi) => {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(blockWire(x, z, w, h), 3));
            const isAccent = li === 0 && bi === 0;
            group.add(new THREE.LineSegments(geo, lineMat(def.blockOpacity, isAccent ? 'accent' : 'line')));
        });

        def.anchors.forEach(([ax, az]) => {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(nodeCross(ax, az), 3));
            group.add(new THREE.LineSegments(geo, lineMat(0.72, 'accent')));
        });

        root.add(group);
        layers.push(group);
    });

    const connections = [];
    const pulses = [];

    for (let li = 0; li < layerDefs.length - 1; li += 1) {
        const count = Math.min(
            layerDefs[li].anchors.length,
            layerDefs[li + 1].anchors.length,
        );
        for (let ai = 0; ai < count; ai += 1) {
            const top = layerDefs[li].anchors[ai];
            const bot = layerDefs[li + 1].anchors[ai];
            const midY = (layerDefs[li].y + layerDefs[li + 1].y) * 0.5;
            const pts = [
                new THREE.Vector3(top[0], layerDefs[li].y + 0.05, top[1]),
                new THREE.Vector3(top[0] * 0.6, midY + 0.35, (top[1] + bot[1]) * 0.25),
                new THREE.Vector3(bot[0] * 0.6, midY - 0.35, (top[1] + bot[1]) * 0.25),
                new THREE.Vector3(bot[0], layerDefs[li + 1].y - 0.05, bot[1]),
            ];
            const curve = new THREE.CatmullRomCurve3(pts.map((p) => p.clone()));
            const segs = mobile ? 32 : 48;
            const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(segs));
            const line = new THREE.Line(geo, lineMat(0.14, ai === 0 ? 'accent' : 'line'));
            line.userData = {
                curve,
                basePts: pts.map((p) => p.clone()),
                baseOpacity: ai === 0 ? 0.34 : 0.22,
                segs,
            };
            root.add(line);
            connections.push(line);

            if (!mobile && !reduced) {
                pulses.push({
                    curve,
                    t: Math.random(),
                    speed: 0.06 + ai * 0.015,
                    offset: ai * 0.2 + li * 0.35,
                });
            }
        }
    }

    const pulseCount = pulses.length;
    const pulsePos = new Float32Array(Math.max(pulseCount, 1) * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    const pulseMat = track(new THREE.PointsMaterial({
        color: pal().accent,
        size: mobile ? 0.045 : 0.038,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        sizeAttenuation: true,
    }), 'accent');
    const pulsePts = new THREE.Points(pulseGeo, pulseMat);
    root.add(pulsePts);

    const orbitCount = mobile ? 3 : 5;
    const orbits = [];
    for (let i = 0; i < orbitCount; i += 1) {
        const verts = [];
        const segs = 48;
        const rx = 2.8 + i * 0.35;
        const rz = 1.4 + i * 0.15;
        for (let j = 0; j <= segs; j += 1) {
            const a = (j / segs) * Math.PI * 2;
            verts.push(Math.cos(a) * rx, -2.2 + i * 0.08, Math.sin(a) * rz - 0.5);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        const loop = new THREE.Line(geo, lineMat(0.07, 'faint'));
        loop.userData = { phase: i * 0.9, baseOpacity: 0.12 };
        orbits.push(loop);
        root.add(loop);
    }

    function applyTheme() {
        themed.forEach(({ mat, key }) => mat.color.setHex(pal()[key]));
    }
    applyTheme();
    new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.documentElement.addEventListener('theme:change', applyTheme);

    hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
        pointer.tx = 0;
        pointer.ty = 0;
    }, { passive: true });

    function resize() {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        if (mobile) {
            layoutX = 0;
        } else {
            const display = hero.querySelector('.hero__display');
            if (display) {
                const heroRect = hero.getBoundingClientRect();
                const displayRect = display.getBoundingClientRect();
                const center = (displayRect.left + displayRect.width * 0.72 - heroRect.left) / heroRect.width;
                layoutX = (center - 0.5) * -9.5;
            } else {
                layoutX = -2.2;
            }
        }
    }

    function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function tick(now) {
        const t = now * 0.001;
        const motion = reduced ? 0.12 : 1;
        intro = Math.min(1, intro + (reduced ? 0.035 : 0.008));
        const ease = easeOut(intro);

        pointer.x += (pointer.tx - pointer.x) * 0.035;
        pointer.y += (pointer.ty - pointer.y) * 0.035;

        layers.forEach((layer) => {
            const d = layer.userData;
            const float = Math.sin(t * 0.45 * motion + d.phase) * 0.06;
            layer.position.y = d.baseY + float;
            layer.position.z = d.introZ * (1 - ease);
            layer.rotation.z = Math.sin(t * 0.25 * motion + d.phase) * 0.012;
        });

        connections.forEach((conn, i) => {
            const d = conn.userData;
            const wobble = 0.5 + 0.5 * Math.sin(t * 0.5 * motion + i * 0.4);
            conn.material.opacity = d.baseOpacity * ease * (0.85 + wobble * 0.15);

            const base = d.basePts;
            const cp = d.curve.points;
            cp[0].copy(base[0]);
            cp[1].set(base[1].x, base[1].y + Math.sin(t * 0.6 * motion + i) * 0.04, base[1].z);
            cp[2].set(base[2].x, base[2].y + Math.cos(t * 0.55 * motion + i) * 0.04, base[2].z);
            cp[3].copy(base[3]);
            conn.geometry.setFromPoints(d.curve.getPoints(d.segs));
        });

        pulses.forEach((p, i) => {
            p.t = (p.t + p.speed * 0.001 * motion) % 1;
            const pos = p.curve.getPointAt(p.t);
            pulsePos[i * 3] = pos.x;
            pulsePos[i * 3 + 1] = pos.y + Math.sin(t * 2 + p.offset) * 0.02;
            pulsePos[i * 3 + 2] = pos.z;
        });
        if (pulseCount > 0) pulseGeo.attributes.position.needsUpdate = true;
        pulseMat.opacity = 0.5 * ease;

        orbits.forEach((orbit) => {
            orbit.rotation.y = t * 0.04 * motion + orbit.userData.phase * 0.1;
            orbit.material.opacity = orbit.userData.baseOpacity * ease;
        });

        root.rotation.y = pointer.x * 0.08 * motion;
        root.rotation.x = pointer.y * 0.04 * motion;
        root.position.x = layoutX + pointer.x * 0.18;
        root.position.y = pointer.y * -0.08;

        camera.position.x += ((mobile ? 0.5 : 1.2) + pointer.x * 0.35 - camera.position.x) * 0.025;
        camera.position.y += (2.4 + pointer.y * 0.15 - camera.position.y) * 0.025;
        camera.lookAt(pointer.x * 0.12, 0.1, 0);
        camera.position.z += ((mobile ? 9.5 : 10.5) - camera.position.z) * 0.02;

        root.scale.setScalar((mobile ? 0.95 : 1.05) + ease * 0.12);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(host);
    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(tick);
});