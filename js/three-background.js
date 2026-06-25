import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const backgroundHost = document.querySelector('.page-background');
    if (!backgroundHost || !window.WebGLRenderingContext) {
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'three-background';
    canvas.setAttribute('aria-hidden', 'true');
    backgroundHost.prepend(canvas);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        velocityX: 0,
        velocityY: 0,
    };

    const palettes = {
        dark: {
            bg: 0x03060d,
            fog: 0x08101c,
            gridA: 0x1c3152,
            gridB: 0x111b31,
            neonA: 0x57ffe7,
            neonB: 0x61a8ff,
            neonC: 0x7d6dff,
            metal: 0xa9bdd4,
            core: 0xdbf8ff,
        },
        light: {
            bg: 0xf3f7fb,
            fog: 0xe3eaf4,
            gridA: 0xc7d4e4,
            gridB: 0xaebed4,
            neonA: 0x137d8d,
            neonB: 0x3e68c9,
            neonC: 0x7868e4,
            metal: 0x4b5d74,
            core: 0xf8feff,
        },
    };

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
    } catch {
        return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 140);
    camera.position.set(0, 0.6, 25);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    const keyLight = new THREE.DirectionalLight(0x89f7ff, 2.2);
    keyLight.position.set(-6, 8, 12);
    const fillLight = new THREE.DirectionalLight(0x7e72ff, 1.4);
    fillLight.position.set(9, -3, 8);
    const coreLight = new THREE.PointLight(0x72fff0, 6, 50, 2);
    coreLight.position.set(0, 0, 7);
    scene.add(ambient, keyLight, fillLight, coreLight);

    const backdrop = new THREE.Mesh(
        new THREE.SphereGeometry(90, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x03060d })
    );
    backdrop.scale.x = 1.55;
    scene.add(backdrop);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const techPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(120, 120, 120, 120),
        new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                time: { value: 0 },
                pointer: { value: new THREE.Vector2(0, 0) },
                paletteA: { value: new THREE.Color(0x1c3152) },
                paletteB: { value: new THREE.Color(0x050814) },
                accentA: { value: new THREE.Color(0x57ffe7) },
                accentB: { value: new THREE.Color(0x61a8ff) },
                accentC: { value: new THREE.Color(0x7d6dff) },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;

                float hash(vec2 p) {
                    p = fract(p * vec2(123.34, 456.21));
                    p += dot(p, p + 45.32);
                    return fract(p.x * p.y);
                }

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float wave = sin((pos.x + time * 2.2) * 0.18) * cos((pos.y - time * 1.6) * 0.14);
                    pos.z += wave * 1.6;
                    pos.z += (hash(pos.xy + time) - 0.5) * 0.18;
                    vPosition = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                uniform vec2 pointer;
                uniform vec3 paletteA;
                uniform vec3 paletteB;
                uniform vec3 accentA;
                uniform vec3 accentB;
                uniform vec3 accentC;

                float hash(vec2 p) {
                    p = fract(p * vec2(123.34, 456.21));
                    p += dot(p, p + 45.32);
                    return fract(p.x * p.y);
                }

                float gridLine(float coord, float scale, float width) {
                    float g = abs(fract(coord * scale - 0.5) - 0.5) / fwidth(coord * scale);
                    return 1.0 - smoothstep(width, width + 0.6, g);
                }

                void main() {
                    vec2 uv = vUv;
                    vec2 centered = uv * 2.0 - 1.0;
                    float vignette = 1.0 - smoothstep(0.2, 1.1, length(centered));
                    float fine = gridLine(uv.x + pointer.x * 0.03, 42.0, 0.35) * gridLine(uv.y + pointer.y * 0.03, 42.0, 0.35);
                    float coarse = gridLine(uv.x + time * 0.03, 8.0, 0.18) * gridLine(uv.y - time * 0.02, 8.0, 0.18);
                    float sweep = smoothstep(0.18, 0.0, abs(centered.y + 0.25 * sin(time * 0.6)));
                    float scan = smoothstep(0.46, 0.0, abs(fract(uv.y * 42.0 - time * 6.0) - 0.5));
                    float noise = hash(floor(uv * 400.0 + time * 30.0));
                    float xGlow = smoothstep(0.42, 0.0, abs(centered.x + pointer.x * 0.18));
                    float yGlow = smoothstep(0.42, 0.0, abs(centered.y - pointer.y * 0.18));
                    vec3 base = mix(paletteB, paletteA, uv.y * 0.8 + 0.2);
                    vec3 tech = base;
                    tech += accentA * fine * 0.35;
                    tech += accentB * coarse * 0.55;
                    tech += accentC * sweep * 0.6;
                    tech += accentA * scan * 0.12;
                    tech += accentB * xGlow * 0.18;
                    tech += accentC * yGlow * 0.18;
                    tech += vec3(1.0) * noise * 0.04;
                    tech *= vignette;
                    float alpha = 0.34 + fine * 0.2 + coarse * 0.25 + sweep * 0.18;
                    gl_FragColor = vec4(tech, alpha);
                }
            `,
        })
    );
    techPlane.position.z = -32;
    scene.add(techPlane);

    const floorPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80, 1, 1),
        new THREE.MeshBasicMaterial({
            color: 0x09111f,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
        })
    );
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.position.y = -7.2;
    floorPlane.position.z = -8;
    scene.add(floorPlane);

    const lattice = new THREE.Group();
    lattice.position.z = -1.2;
    scene.add(lattice);

    const tileGeometry = new THREE.BoxGeometry(0.42, 0.42, 1.2);
    const tileMaterial = new THREE.MeshStandardMaterial({
        color: 0xa8bdd4,
        emissive: 0x0d1b2b,
        emissiveIntensity: 0.45,
        metalness: 0.92,
        roughness: 0.14,
        transparent: true,
        opacity: 0.74,
        flatShading: false,
        depthWrite: false,
    });

    const tileCount = prefersReducedMotion.matches ? 160 : 420;
    const tileMesh = new THREE.InstancedMesh(tileGeometry, tileMaterial, tileCount);
    tileMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(tileMesh);

    const tileData = [];
    const radial = new THREE.Vector3();
    const tileMatrix = new THREE.Matrix4();
    const tilePosition = new THREE.Vector3();
    const tileQuaternion = new THREE.Quaternion();
    const tileScale = new THREE.Vector3();
    for (let index = 0; index < tileCount; index += 1) {
        const ring = Math.floor(Math.random() * 4.5);
        const angle = (index / tileCount) * Math.PI * 18 + Math.random() * 0.6;
        const radius = 3.8 + ring * 2.2 + Math.random() * 1.4;
        const height = (Math.random() - 0.5) * 10.0;
        const twist = Math.random() * Math.PI * 2;
        const baseScale = 0.42 + Math.random() * 0.95;
        tileData.push({ ring, angle, radius, height, twist, baseScale, pulse: Math.random() * Math.PI * 2 });
    }

    const tileGlowGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 6, 1, false);
    const tileGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x57ffe7,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const tileGlowMesh = new THREE.InstancedMesh(tileGlowGeometry, tileGlowMaterial, tileCount);
    tileGlowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(tileGlowMesh);

    const coreGroup = new THREE.Group();
    coreGroup.position.z = 3.2;
    scene.add(coreGroup);

    const coreShell = new THREE.Mesh(
        new THREE.TorusGeometry(4.4, 0.22, 18, 120),
        new THREE.MeshStandardMaterial({
            color: 0x9fc1da,
            emissive: 0x1a4a55,
            emissiveIntensity: 0.9,
            metalness: 0.98,
            roughness: 0.08,
            transparent: true,
            opacity: 0.78,
        })
    );
    coreShell.rotation.x = Math.PI / 2.2;
    coreGroup.add(coreShell);

    const coreShell2 = new THREE.Mesh(
        new THREE.TorusKnotGeometry(2.0, 0.18, 180, 16, 2, 5),
        new THREE.MeshBasicMaterial({
            color: 0x57ffe7,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    coreShell2.rotation.y = Math.PI / 5;
    coreGroup.add(coreShell2);

    const coreCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 1.3, 6.8, 8, 1, false),
        new THREE.MeshStandardMaterial({
            color: 0xd8f6ff,
            emissive: 0x50ffe0,
            emissiveIntensity: 1.8,
            metalness: 0.96,
            roughness: 0.05,
            transparent: true,
            opacity: 0.9,
            flatShading: true,
            depthWrite: false,
        })
    );
    coreGroup.add(coreCylinder);

    const coreCaps = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.2, 1),
        new THREE.MeshBasicMaterial({
            color: 0xf4fffe,
            transparent: true,
            opacity: 0.62,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    coreCaps.scale.set(1.4, 1.8, 1.2);
    coreGroup.add(coreCaps);

    const axisRig = new THREE.Group();
    coreGroup.add(axisRig);

    for (let index = 0; index < 3; index += 1) {
        const axisBar = new THREE.Mesh(
            new THREE.BoxGeometry(5.8, 0.1, 0.1),
            new THREE.MeshStandardMaterial({
                color: index === 0 ? 0x57ffe7 : index === 1 ? 0x61a8ff : 0x7d6dff,
                emissive: index === 0 ? 0x14a18e : index === 1 ? 0x2a61cf : 0x5c52da,
                emissiveIntensity: 1.1,
                metalness: 0.84,
                roughness: 0.08,
                transparent: true,
                opacity: 0.75,
                depthWrite: false,
            })
        );
        axisBar.rotation.z = (Math.PI / 2) * index;
        axisRig.add(axisBar);
    }

    const cursorRig = new THREE.Group();
    cursorRig.position.z = 7.5;
    scene.add(cursorRig);

    const cursorCore = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 1),
        new THREE.MeshStandardMaterial({
            color: 0xecffff,
            emissive: 0x6effea,
            emissiveIntensity: 1.6,
            metalness: 0.92,
            roughness: 0.05,
            transparent: true,
            opacity: 0.96,
            flatShading: true,
            depthWrite: false,
        })
    );
    cursorRig.add(cursorCore);

    const cursorRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.25, 0.07, 16, 48),
        new THREE.MeshBasicMaterial({
            color: 0x57ffe7,
            transparent: true,
            opacity: 0.72,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
    );
    cursorRing.rotation.x = Math.PI / 2;
    cursorRig.add(cursorRing);

    const cursorBrackets = new THREE.Group();
    cursorRig.add(cursorBrackets);
    for (let index = 0; index < 4; index += 1) {
        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.75, 0.16),
            new THREE.MeshStandardMaterial({
                color: 0x9fc1da,
                emissive: 0x3c87ff,
                emissiveIntensity: 0.8,
                metalness: 0.95,
                roughness: 0.08,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
            })
        );
        bracket.position.y = 1.35;
        bracket.rotation.z = (Math.PI / 2) * index;
        cursorBrackets.add(bracket);
    }

    const cursorTrail = [];
    for (let index = 0; index < 8; index += 1) {
        const trailNode = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.12, 0.12),
            new THREE.MeshBasicMaterial({
                color: index % 2 === 0 ? 0x57ffe7 : 0x61a8ff,
                transparent: true,
                opacity: 0.58 - index * 0.05,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        scene.add(trailNode);
        cursorTrail.push(trailNode);
    }

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.14, 10.5, 10, 1, true),
        new THREE.MeshBasicMaterial({
            color: 0x57ffe7,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
    );
    beam.rotation.x = Math.PI / 2;
    beam.position.z = 1.6;
    cursorRig.add(beam);

    const paletteState = { active: null };

    function applyPalette() {
        const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        if (paletteState.active === theme) {
            return;
        }

        paletteState.active = theme;
        const palette = palettes[theme];

        scene.background = new THREE.Color(palette.bg);
        scene.fog = new THREE.Fog(palette.fog, 20, 62);
        ambient.intensity = theme === 'light' ? 1.5 : 1.15;
        keyLight.color.setHex(palette.neonB);
        fillLight.color.setHex(palette.neonC);
        coreLight.color.setHex(palette.neonA);
        backdrop.material.color.setHex(palette.bg);

        techPlane.material.uniforms.paletteA.value.setHex(palette.gridA);
        techPlane.material.uniforms.paletteB.value.setHex(palette.bg);
        techPlane.material.uniforms.accentA.value.setHex(palette.neonA);
        techPlane.material.uniforms.accentB.value.setHex(palette.neonB);
        techPlane.material.uniforms.accentC.value.setHex(palette.neonC);

        tileMaterial.color.setHex(palette.metal);
        tileMaterial.emissive.setHex(theme === 'light' ? 0xd2e0ee : 0x0c1828);
        tileGlowMaterial.color.setHex(palette.neonA);
        coreShell.material.color.setHex(palette.metal);
        coreShell.material.emissive.setHex(palette.neonA);
        coreShell2.material.color.setHex(palette.neonA);
        coreCylinder.material.color.setHex(palette.core);
        coreCylinder.material.emissive.setHex(palette.neonA);
        coreCaps.material.color.setHex(palette.core);
        cursorCore.material.color.setHex(palette.core);
        cursorCore.material.emissive.setHex(palette.neonA);
        cursorRing.material.color.setHex(palette.neonA);
        cursorBrackets.children.forEach((node, index) => {
            node.material.color.setHex(index % 2 === 0 ? palette.neonB : palette.neonC);
        });
        cursorTrail.forEach((node, index) => {
            node.material.color.setHex(index % 2 === 0 ? palette.neonA : palette.neonB);
        });
        beam.material.color.setHex(palette.neonA);
    }

    applyPalette();

    const themeObserver = new MutationObserver(applyPalette);
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });

    window.addEventListener('pointermove', (event) => {
        const nextX = (event.clientX / window.innerWidth) * 2 - 1;
        const nextY = (event.clientY / window.innerHeight) * 2 - 1;
        pointer.velocityX = nextX - pointer.targetX;
        pointer.velocityY = nextY - pointer.targetY;
        pointer.targetX = nextX;
        pointer.targetY = nextY;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
        pointer.targetX = 0;
        pointer.targetY = 0;
    });

    let lastTime = performance.now();

    function animate(now) {
        const time = now * 0.001;
        const delta = Math.min((now - lastTime) * 0.001, 0.04);
        lastTime = now;
        const motionScale = prefersReducedMotion.matches ? 0.16 : 1;

        pointer.x += (pointer.targetX - pointer.x) * 0.06;
        pointer.y += (pointer.targetY - pointer.y) * 0.06;
        const velocityMagnitude = Math.min(Math.hypot(pointer.velocityX, pointer.velocityY) * 7.2, 2.1);
        pointer.velocityX *= 0.8;
        pointer.velocityY *= 0.8;

        camera.position.x = pointer.x * 1.6 * motionScale;
        camera.position.y = -pointer.y * 1.25 * motionScale + 0.4;
        camera.position.z = 25 - velocityMagnitude * 0.3;
        camera.lookAt(0, 0, 0);

        techPlane.material.uniforms.time.value = time;
        techPlane.material.uniforms.pointer.value.set(pointer.x, pointer.y);
        techPlane.rotation.z = Math.sin(time * 0.08) * 0.08 + pointer.x * 0.02;
        techPlane.rotation.x = Math.sin(time * 0.03) * 0.03;
        techPlane.position.y = Math.sin(time * 0.2) * 0.25;

        mainGroup.rotation.y += delta * 0.06 * motionScale;
        mainGroup.rotation.x = Math.sin(time * 0.11) * 0.04;

        floorPlane.position.x = pointer.x * 0.8;
        floorPlane.position.y = -7.2 + pointer.y * 0.45;
        floorPlane.rotation.z = pointer.x * 0.02;

        coreGroup.rotation.y += delta * (0.45 + velocityMagnitude * 0.08) * motionScale;
        coreGroup.rotation.x = Math.sin(time * 0.2) * 0.18 + pointer.y * 0.16;
        coreShell.rotation.z += delta * 0.12;
        coreShell2.rotation.y += delta * 0.6;
        coreCylinder.rotation.y += delta * 0.4;
        coreCaps.rotation.x += delta * 0.35;
        axisRig.rotation.z = Math.sin(time * 0.4) * 0.07 + pointer.x * 0.08;

        tileMesh.rotation.y = time * 0.06 + pointer.x * 0.14;
        tileMesh.rotation.x = Math.sin(time * 0.18) * 0.06 + pointer.y * 0.08;
        tileGlowMesh.rotation.copy(tileMesh.rotation);

        for (let index = 0; index < tileData.length; index += 1) {
            const data = tileData[index];
            const pulse = Math.sin(time * (1.8 + data.ring * 0.12) + data.pulse) * 0.35 + 0.85;
            const twist = time * (0.42 + data.ring * 0.06) + data.twist;
            const height = data.height + Math.sin(time * 0.8 + data.angle * 2.1) * 0.65;
            const radialShift = data.radius + Math.sin(time * 0.45 + data.pulse) * 0.45;
            radial.set(
                Math.cos(data.angle + twist) * radialShift,
                height,
                Math.sin(data.angle * 0.8 + twist) * radialShift * 0.38
            );

            tilePosition.copy(radial);
            tilePosition.z += Math.sin(time * 0.4 + index) * 0.5;
            tileQuaternion.setFromEuler(new THREE.Euler(
                time * 0.7 + data.twist * 0.2,
                data.angle + velocityMagnitude * 0.06,
                data.twist + pointer.x * 0.1
            ));
            tileScale.setScalar(data.baseScale * pulse * (1 + velocityMagnitude * 0.025));
            tileMatrix.compose(tilePosition, tileQuaternion, tileScale);
            tileMesh.setMatrixAt(index, tileMatrix);

            const glowScale = data.baseScale * (0.95 + pulse * 0.35);
            tileMatrix.compose(tilePosition, tileQuaternion, new THREE.Vector3(glowScale, glowScale, glowScale * 2.1));
            tileGlowMesh.setMatrixAt(index, tileMatrix);
        }
        tileMesh.instanceMatrix.needsUpdate = true;
        tileGlowMesh.instanceMatrix.needsUpdate = true;

        cursorRig.position.x += ((pointer.x * 6.0) - cursorRig.position.x) * 0.26;
        cursorRig.position.y += ((-pointer.y * 4.0) - cursorRig.position.y) * 0.26;
        cursorRig.rotation.x = pointer.y * 0.18 + Math.sin(time * 0.9) * 0.08;
        cursorRig.rotation.y = pointer.x * 0.2 + Math.cos(time * 0.8) * 0.08;
        cursorRig.rotation.z += delta * (0.9 + velocityMagnitude * 0.22);
        cursorRig.scale.setScalar(0.9 + velocityMagnitude * 0.05);

        cursorCore.rotation.x += 0.06 + velocityMagnitude * 0.01;
        cursorCore.rotation.y += 0.08 + velocityMagnitude * 0.01;
        cursorRing.rotation.z += delta * (1.4 + velocityMagnitude * 0.3);
        cursorRing.scale.setScalar(1 + velocityMagnitude * 0.08);
        cursorBrackets.rotation.z = Math.sin(time * 1.2) * 0.14;

        for (let index = 0; index < cursorTrail.length; index += 1) {
            const node = cursorTrail[index];
            const lag = 0.12 + index * 0.06;
            node.position.x += ((cursorRig.position.x - pointer.velocityX * 10 * lag) - node.position.x) * 0.18;
            node.position.y += ((cursorRig.position.y - pointer.velocityY * 10 * lag) - node.position.y) * 0.18;
            node.position.z = cursorRig.position.z - index * 0.25;
            node.rotation.x = time * 0.9 + index;
            node.rotation.y = time * 0.7 - index * 0.4;
            node.scale.setScalar(1 + velocityMagnitude * 0.02 - index * 0.03);
        }

        beam.scale.setScalar(1 + velocityMagnitude * 0.06);
        beam.rotation.z = pointer.x * 0.14 + Math.sin(time * 0.7) * 0.08;
        beam.material.opacity = 0.1 + velocityMagnitude * 0.03;

        renderer.render(scene, camera);
        window.requestAnimationFrame(animate);
    }

    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setSize(width, height, false);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    window.requestAnimationFrame(animate);
});
