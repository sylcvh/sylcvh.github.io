import {
    THREE, renderer, registerView, quality, pointer, onTheme, makeColorRamp, makeField, scrollY,
} from './three-core.js';

if (renderer) {
    const host = document.getElementById('page-background');
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let ramp = makeColorRamp();

    const TRAIL = 256;
    const trailCanvas = document.createElement('canvas');
    trailCanvas.width = TRAIL;
    trailCanvas.height = TRAIL;
    const tctx = trailCanvas.getContext('2d');
    tctx.fillStyle = '#000';
    tctx.fillRect(0, 0, TRAIL, TRAIL);
    const trailMap = new THREE.CanvasTexture(trailCanvas);
    trailMap.minFilter = THREE.LinearFilter;
    trailMap.magFilter = THREE.LinearFilter;
    trailMap.wrapS = THREE.ClampToEdgeWrapping;
    trailMap.wrapT = THREE.ClampToEdgeWrapping;

    const uniforms = {
        time: { value: 0 },
        scroll: { value: 0 },
        pointer: { value: new THREE.Vector2(0.5, 0.5) },
        trailMap: { value: trailMap },
        ramp: { value: ramp },
        intensity: { value: 1 },
        light: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = position.xy * 0.5 + 0.5;
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `,
        fragmentShader: `
            precision highp float;
            varying vec2 vUv;
            uniform float time;
            uniform float scroll;
            uniform vec2 pointer;
            uniform sampler2D trailMap;
            uniform sampler2D ramp;
            uniform float intensity;
            uniform float light;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }

            float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                for (int i = 0; i < 5; i++) {
                    v += a * noise(p);
                    p = p * 2.02 + vec2(1.7, 9.2);
                    a *= 0.5;
                }
                return v;
            }

            vec2 curl(vec2 p) {
                float e = 0.018;
                float n1 = fbm(p + vec2(0.0, e));
                float n2 = fbm(p - vec2(0.0, e));
                float n3 = fbm(p + vec2(e, 0.0));
                float n4 = fbm(p - vec2(e, 0.0));
                return vec2(n1 - n2, n4 - n3);
            }

            void main() {
                vec2 uv = vUv;
                float trail = texture2D(trailMap, uv).r;
                vec2 toCursor = uv - pointer;
                vec2 swirl = vec2(-toCursor.y, toCursor.x);

                float t = time * 0.035 + scroll * 0.00008;
                vec2 p = (uv - 0.5) * vec2(1.5, 1.0);
                vec2 flow = curl(p + t);
                p += flow * 0.28;
                p += swirl * trail * 0.85;
                p += toCursor * trail * -0.25;

                vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t * 0.65));
                vec2 r = vec2(
                    fbm(p + q * 1.55 + vec2(1.7, 9.2) + t * 0.12),
                    fbm(p + q * 1.25 + vec2(8.3, 2.8) - t * 0.1)
                );
                float n = fbm(p + r * 2.15);

                vec3 c0 = texture2D(ramp, vec2(0.02, 0.5)).rgb;
                vec3 c1 = texture2D(ramp, vec2(0.5, 0.5)).rgb;
                vec3 c2 = texture2D(ramp, vec2(0.98, 0.5)).rgb;

                vec3 col = mix(c0, c1, clamp(q.x, 0.0, 1.0));
                col = mix(col, c2, clamp(r.y, 0.0, 1.0));
                col = mix(col, c1, n * 0.28);
                col = mix(col, mix(c1, c0, 0.4), trail * 0.55);

                float smoke = smoothstep(0.2, 0.72, n);
                float wisps = smoothstep(0.58, 0.9, n) * 0.42;
                float vig = smoothstep(1.22, 0.16, length((uv - 0.5) * vec2(1.12, 1.0)));
                float wake = trail * (0.42 + smoke * 0.28);

                float alpha = (smoke * 0.44 + wisps * 0.18 + wake) * vig * intensity;
                alpha = mix(alpha, alpha * 0.4, light);
                col = mix(col, vec3(0.9, 0.93, 1.0), light * 0.35);

                gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.56));
            }
        `,
    });

    scene.add(makeField(material));

    let prev = null;

    function cursorUv() {
        return {
            x: pointer.x * 0.5 + 0.5,
            y: 0.5 - pointer.y * 0.5,
        };
    }

    function stamp(ax, ay, bx, by, strength) {
        const x0 = ax * TRAIL;
        const y0 = (1 - ay) * TRAIL;
        const x1 = bx * TRAIL;
        const y1 = (1 - by) * TRAIL;
        const dist = Math.hypot(x1 - x0, y1 - y0);
        const radius = 16 + Math.min(dist * 0.45, 22);
        tctx.globalCompositeOperation = 'lighter';
        const g = tctx.createRadialGradient(x1, y1, 0, x1, y1, radius);
        g.addColorStop(0, `rgba(255,255,255,${0.42 * strength})`);
        g.addColorStop(0.4, `rgba(255,255,255,${0.16 * strength})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        tctx.fillStyle = g;
        tctx.beginPath();
        tctx.arc(x1, y1, radius, 0, Math.PI * 2);
        tctx.fill();

        if (dist > 1.2) {
            tctx.strokeStyle = `rgba(255,255,255,${0.18 * strength})`;
            tctx.lineWidth = radius * 0.9;
            tctx.lineCap = 'round';
            tctx.beginPath();
            tctx.moveTo(x0, y0);
            tctx.lineTo(x1, y1);
            tctx.stroke();
        }
    }

    function tint() {
        const light = document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0;
        uniforms.light.value = light;
        uniforms.intensity.value = light ? 0.48 : 1;
        ramp.dispose();
        ramp = makeColorRamp();
        uniforms.ramp.value = ramp;
    }

    onTheme(tint);
    tint();

    registerView({
        host,
        scene,
        camera,
        full: true,
        onFrame(t) {
            const motion = quality.reduced ? 0.12 : 1;
            uniforms.time.value = t * motion;
            uniforms.scroll.value = scrollY;

            const cur = cursorUv();
            uniforms.pointer.value.set(cur.x, cur.y);

            tctx.globalCompositeOperation = 'source-over';
            tctx.fillStyle = quality.reduced ? 'rgba(0,0,0,0.16)' : 'rgba(0,0,0,0.03)';
            tctx.fillRect(0, 0, TRAIL, TRAIL);

            if (prev) {
                const moved = Math.hypot(cur.x - prev.x, cur.y - prev.y);
                if (moved > 0.0008 && !quality.reduced) {
                    stamp(prev.x, prev.y, cur.x, cur.y, Math.min(1, moved * 22 + 0.45));
                }
            }
            prev = cur;
            trailMap.needsUpdate = true;
        },
    });
}
