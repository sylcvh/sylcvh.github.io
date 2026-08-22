(function initLanyardPresence() {
    const card = document.getElementById('lanyard-card');
    if (!card) return;

    const userId = (card.dataset.lanyardUserId || '').trim();
    const $ = (sel) => card.querySelector(sel);
    const title = $('[data-lanyard-title]');
    const handle = $('[data-lanyard-handle]');
    const subtitle = $('[data-lanyard-subtitle]');
    const activityType = $('[data-lanyard-activity-type]');
    const statusChip = $('[data-lanyard-status]');
    const statusLabel = $('[data-lanyard-status-label]');
    const statusBadge = $('[data-lanyard-status-badge]');
    const syncEl = $('[data-lanyard-sync]');
    const signalEl = $('[data-lanyard-signal]');
    const deviceEl = $('[data-lanyard-device]');
    const activityCountEl = $('[data-lanyard-activity-count]');
    const updatedEl = $('[data-lanyard-updated]');
    const kvEl = $('[data-lanyard-kv]');
    const avatar = $('.lanyard-card__avatar');
    const spotifyEl = $('[data-lanyard-spotify]');
    const albumEl = $('[data-lanyard-album]');
    const trackEl = $('[data-lanyard-track]');
    const progressEl = $('[data-lanyard-progress]');
    const stage = card.closest('.presence-stage, .presence-wrap');
    const hint = document.getElementById('presence-blast-hint');

    const restUrl = userId ? `https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}` : '';
    const socketUrl = 'wss://api.lanyard.rest/socket';

    let socket = null;
    let heartbeatId = 0;
    let reconnectId = 0;
    let pollId = 0;
    let progressId = 0;
    let generation = 0;
    let stopped = false;
    let liveSocket = false;
    let lastAvatar = '';
    let lastStatus = '';
    let spotifyRange = null;

    function setSync(text) {
        if (syncEl) syncEl.textContent = text;
    }

    function setUpdated(text) {
        if (updatedEl) updatedEl.textContent = text;
    }

    function cssVar(name, fallback) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    }

    function accentFor(status) {
        if (status === 'online') return { color: cssVar('--accent', '#00e8ff'), soft: cssVar('--accent-soft', 'rgba(0, 232, 255, 0.16)') };
        if (status === 'idle') return { color: cssVar('--accent-blue', '#4f7cff'), soft: cssVar('--accent-blue-soft', 'rgba(79, 124, 255, 0.16)') };
        if (status === 'dnd') return { color: cssVar('--accent-red', '#ff3b5c'), soft: cssVar('--accent-red-soft', 'rgba(255, 59, 92, 0.16)') };
        return { color: '#6d7684', soft: 'rgba(109, 118, 132, 0.18)' };
    }

    function unwrap(payload) {
        if (!payload || typeof payload !== 'object') return null;
        if (payload.discord_user || payload.discord_status) return payload;
        if (userId && payload[userId]) return payload[userId];
        const values = Object.values(payload);
        if (values.length === 1 && values[0] && typeof values[0] === 'object') return values[0];
        return null;
    }

    function avatarUrl(user) {
        if (user.avatar) {
            const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
        }
        const index = Number(user.discriminator) % 5 || 0;
        return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    }

    function devicesOf(presence) {
        const list = [];
        if (presence.active_on_discord_desktop) list.push('desktop');
        if (presence.active_on_discord_mobile) list.push('mobile');
        if (presence.active_on_discord_web) list.push('web');
        if (presence.active_on_discord_embedded) list.push('embedded');
        return list;
    }

    function pickActivity(presence) {
        const list = presence.activities || [];
        return list.find((item) => item.type === 0 || item.type === 1 || item.type === 2)
            || list.find((item) => item.type === 4)
            || null;
    }

    function activityCopy(presence, status) {
        if (presence.listening_to_spotify && presence.spotify) {
            const song = presence.spotify.song || 'Spotify';
            const artist = presence.spotify.artist ? ` by ${presence.spotify.artist}` : '';
            return { type: 'Spotify', text: `Listening to ${song}${artist}` };
        }

        const active = pickActivity(presence);
        if (!active) return { type: 'Status', text: 'No active activity' };

        const types = { 0: 'Playing', 1: 'Streaming', 2: 'Listening', 4: 'Custom' };
        const type = types[active.type] || 'Status';
        const text = active.type === 4
            ? (active.state || active.name || 'Custom status')
            : [active.name, active.details, active.state].filter(Boolean).slice(0, 2).join(' · ');
        return { type, text: text || 'Active on Discord' };
    }

    function render(raw) {
        const presence = unwrap(raw);
        if (!presence) return;

        const user = presence.discord_user || {};
        const status = ['online', 'idle', 'dnd'].includes(presence.discord_status)
            ? presence.discord_status
            : 'offline';
        const accent = accentFor(status);

        card.classList.remove('is-online', 'is-idle', 'is-dnd', 'is-offline', 'is-error', 'is-connecting');
        card.classList.add(`is-${status}`);
        card.style.setProperty('--lanyard-accent', accent.color);
        card.style.setProperty('--lanyard-accent-soft', accent.soft);
        if (stage) {
            stage.style.setProperty('--lanyard-accent', accent.color);
            stage.style.setProperty('--lanyard-accent-soft', accent.soft);
        }

        if (title) title.textContent = user.global_name || user.display_name || user.username || 'Unknown';
        if (handle) handle.textContent = (user.username || '').replace(/^@/, '') || 'discord';

        const copy = activityCopy(presence, status);
        if (activityType) activityType.textContent = copy.type;
        if (subtitle) subtitle.textContent = copy.text;

        if (statusChip) statusChip.dataset.lanyardStatus = status;
        if (statusLabel) statusLabel.textContent = ({ online: 'Online', idle: 'Idle', dnd: 'Do not disturb' }[status] || 'Offline');
        if (statusBadge) statusBadge.dataset.status = status;

        setSync(liveSocket ? (status === 'offline' ? 'standby' : 'live') : 'polling');
        if (signalEl) {
            signalEl.textContent = ({ online: 'strong', idle: 'stable', dnd: 'focused' }[status] || 'weak');
        }

        const devices = devicesOf(presence);
        if (deviceEl) deviceEl.textContent = devices.length ? devices.join(' + ') : 'none';
        if (activityCountEl) activityCountEl.textContent = String((presence.activities || []).length);
        setUpdated(`Synced ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

        const listening = Boolean(presence.listening_to_spotify && presence.spotify);
        card.classList.toggle('is-listening', listening);
        if (spotifyEl) {
            if (listening) {
                const song = presence.spotify.song || 'Unknown track';
                const artist = presence.spotify.artist || '';
                if (trackEl) trackEl.textContent = artist ? `${song} · ${artist}` : song;
                if (albumEl && presence.spotify.album_art_url) {
                    albumEl.src = presence.spotify.album_art_url;
                    albumEl.alt = presence.spotify.album ? `${presence.spotify.album} cover` : '';
                }
                const start = presence.spotify.timestamps && presence.spotify.timestamps.start;
                const end = presence.spotify.timestamps && presence.spotify.timestamps.end;
                spotifyRange = start && end ? { start, end } : null;
                spotifyEl.hidden = false;
            } else {
                spotifyRange = null;
                spotifyEl.hidden = true;
            }
        }

        if (kvEl) {
            kvEl.replaceChildren();
            const entries = Object.entries(presence.kv || {});
            if (entries.length) {
                entries.forEach(([key, value]) => {
                    const chip = document.createElement('span');
                    chip.className = 'lanyard-kv-chip';
                    const k = document.createElement('span');
                    k.className = 'lanyard-kv-chip__key';
                    k.textContent = `${key}:`;
                    const v = document.createElement('span');
                    v.className = 'lanyard-kv-chip__value';
                    v.textContent = String(value);
                    chip.append(k, v);
                    kvEl.append(chip);
                });
                kvEl.hidden = false;
            } else {
                kvEl.hidden = true;
            }
        }

        const src = avatarUrl(user);
        if (avatar && src !== lastAvatar) {
            lastAvatar = src;
            avatar.classList.remove('is-ready');
            avatar.onload = () => avatar.classList.add('is-ready');
            avatar.onerror = () => avatar.classList.remove('is-ready');
            avatar.src = src;
            avatar.alt = user.username ? `${user.username}'s Discord avatar` : 'Discord avatar';
        }

        if (status !== lastStatus) {
            lastStatus = status;
            card.dispatchEvent(new CustomEvent('lanyard:status', { bubbles: true, detail: { status, accent } }));
        }
        card.dispatchEvent(new CustomEvent('lanyard:presence', {
            bubbles: true,
            detail: { status, accent, listening, activities: presence.activities || [] },
        }));
    }

    function fail(message) {
        card.classList.add('is-error');
        setSync('offline');
        if (title && title.textContent === 'Loading presence…') title.textContent = 'Presence unavailable';
        if (subtitle) subtitle.textContent = message;
        setUpdated('Could not reach Lanyard');
    }

    async function pullRest() {
        if (!restUrl) return false;
        try {
            const response = await fetch(restUrl, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            if (payload && payload.success && payload.data) {
                render(payload.data);
                return true;
            }
            throw new Error('Empty presence');
        } catch (error) {
            if (!lastStatus) fail('Could not load Discord presence');
            console.log('Lanyard REST failed:', error);
            return false;
        }
    }

    function clearHeartbeat() {
        if (heartbeatId) {
            clearInterval(heartbeatId);
            heartbeatId = 0;
        }
    }

    function dropSocket() {
        clearHeartbeat();
        liveSocket = false;
        if (socket) {
            const old = socket;
            socket = null;
            try { old.close(); } catch { /* already closed */ }
        }
    }

    function connectSocket() {
        if (stopped || !userId) return;
        generation += 1;
        const gen = generation;
        window.clearTimeout(reconnectId);
        dropSocket();
        setSync('connecting');

        const next = new WebSocket(socketUrl);
        socket = next;

        next.addEventListener('open', () => {
            if (gen !== generation) return;
        });

        next.addEventListener('message', (event) => {
            if (gen !== generation) return;
            let message;
            try {
                message = JSON.parse(event.data);
            } catch {
                return;
            }

            if (message.op === 1) {
                const interval = Number(message.d && message.d.heartbeat_interval) || 30000;
                next.send(JSON.stringify({ op: 2, d: { subscribe_to_id: userId } }));
                clearHeartbeat();
                heartbeatId = window.setInterval(() => {
                    if (socket === next && next.readyState === WebSocket.OPEN) {
                        next.send(JSON.stringify({ op: 3 }));
                    }
                }, interval);
                return;
            }

            if (message.op !== 0) return;

            if (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE') {
                liveSocket = true;
                render(message.d);
            }
        });

        next.addEventListener('close', () => {
            if (gen !== generation || stopped) return;
            liveSocket = false;
            clearHeartbeat();
            setSync('reconnecting');
            reconnectId = window.setTimeout(connectSocket, 4000);
        });

        next.addEventListener('error', () => {
            if (socket === next) {
                try { next.close(); } catch { /* ignore */ }
            }
        });
    }

    function tickProgress() {
        if (!progressEl) return;
        if (!spotifyRange) {
            progressEl.style.width = '0%';
            return;
        }
        const span = spotifyRange.end - spotifyRange.start;
        if (span <= 0) return;
        const ratio = Math.min(1, Math.max(0, (Date.now() - spotifyRange.start) / span));
        progressEl.style.width = `${(ratio * 100).toFixed(1)}%`;
    }

    function bindHint() {
        if (!hint || !stage) return;
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let holding = false;
        let holdTimer = 0;

        hint.querySelector('span:first-child')?.replaceChildren(document.createTextNode(coarse ? 'tap to' : 'hold to'));
        hint.setAttribute('aria-label', coarse ? 'Tap to pulse presence' : 'Hold to pulse presence');

        function pulse(on) {
            stage.classList.toggle('is-pulsed', on);
            hint.classList.toggle('is-pulsed', on);
        }

        function start(event) {
            event.preventDefault();
            if (reduced || holding) return;
            holding = true;
            stage.classList.add('is-holding');
            hint.classList.add('is-holding');
            holdTimer = window.setTimeout(() => pulse(true), coarse ? 0 : 260);
        }

        function end() {
            if (!holding) return;
            holding = false;
            stage.classList.remove('is-holding');
            hint.classList.remove('is-holding');
            window.clearTimeout(holdTimer);
            window.setTimeout(() => pulse(false), 800);
        }

        hint.addEventListener('pointerdown', start);
        hint.addEventListener('pointerup', end);
        hint.addEventListener('pointerleave', end);
        hint.addEventListener('pointercancel', end);
    }

    if (!userId) {
        card.classList.add('is-offline', 'is-error');
        if (title) title.textContent = 'Missing Discord ID';
        if (subtitle) subtitle.textContent = 'Set data-lanyard-user-id on this card.';
        setSync('offline');
        bindHint();
        return;
    }

    card.classList.add('is-connecting');
    setSync('connecting');
    pullRest();
    connectSocket();
    pollId = window.setInterval(() => {
        if (!liveSocket) pullRest();
    }, 25000);
    progressId = window.setInterval(tickProgress, 400);
    bindHint();

    window.addEventListener('beforeunload', () => {
        stopped = true;
        generation += 1;
        dropSocket();
        window.clearTimeout(reconnectId);
        window.clearInterval(pollId);
        window.clearInterval(progressId);
    });
})();
