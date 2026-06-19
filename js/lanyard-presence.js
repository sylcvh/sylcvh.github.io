function initLanyardPresence() {
    const lanyardCard = document.getElementById('lanyard-card');
    if (!lanyardCard) return;

    const lanyardTitle = document.querySelector('[data-lanyard-title]');
    const lanyardHandle = document.querySelector('[data-lanyard-handle]');
    const lanyardSubtitle = document.querySelector('[data-lanyard-subtitle]');
    const lanyardStatus = document.querySelector('[data-lanyard-status]');
    const lanyardStatusLabel = document.querySelector('[data-lanyard-status-label]');
    const lanyardKv = document.querySelector('[data-lanyard-kv]');
    const lanyardAvatar = document.querySelector('.lanyard-card__avatar');

    const userId = (lanyardCard.dataset.lanyardUserId || '').trim();
    if (!userId) {
        if (lanyardTitle) lanyardTitle.textContent = 'Connect your Discord ID';
        if (lanyardSubtitle) lanyardSubtitle.textContent = 'Set data-lanyard-user-id on this card to show live presence updates.';
        if (lanyardStatusLabel) lanyardStatusLabel.textContent = 'No user id';
        if (lanyardStatus) lanyardStatus.dataset.lanyardStatus = 'offline';
        lanyardCard.classList.add('is-offline');
        return;
    }

    const apiUrl = `https://api.lanyard.rest/v1/users/${encodeURIComponent(userId)}`;
    const socketUrl = 'wss://api.lanyard.rest/socket';
    let socket;
    let heartbeatId;
    let reconnectId;
    let closedByCode = false;

    const clearTimers = () => {
        if (heartbeatId) {
            clearInterval(heartbeatId);
            heartbeatId = null;
        }
        if (reconnectId) {
            clearTimeout(reconnectId);
            reconnectId = null;
        }
    };

    const getActivityLabel = (presence) => {
        const activeActivity = (presence.activities || []).find((activity) => activity.type === 0 || activity.type === 1 || activity.type === 2 || activity.type === 4);
        if (!activeActivity) return 'No active activity';

        if (activeActivity.type === 2 && activeActivity.details) {
            return activeActivity.details;
        }

        if (activeActivity.type === 4 && activeActivity.state) {
            return activeActivity.state;
        }

        return activeActivity.name || 'Active on Discord';
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'online': return 'Online';
            case 'idle': return 'Idle';
            case 'dnd': return 'Do not disturb';
            default: return 'Offline';
        }
    };

    const getPresenceAccent = (status) => {
        switch (status) {
            case 'online':
                return { color: '#54e29b', soft: 'rgba(84, 226, 155, 0.18)' };
            case 'idle':
                return { color: '#f0c35b', soft: 'rgba(240, 195, 91, 0.18)' };
            case 'dnd':
                return { color: '#ef6b6b', soft: 'rgba(239, 107, 107, 0.18)' };
            default:
                return { color: '#6d7684', soft: 'rgba(109, 118, 132, 0.18)' };
        }
    };

    const getDisplayName = (presence) => {
        const discordUser = presence.discord_user || {};
        return discordUser.global_name || discordUser.display_name || presence.display_name || discordUser.nick || discordUser.username || 'Discord presence active';
    };

    const getHandle = (presence) => {
        const discordUser = presence.discord_user || {};
        return discordUser.username || 'Discord';
    };

    const getAvatarUrl = (presence) => {
        const discordUser = presence.discord_user || {};
        if (discordUser.avatar) {
            const extension = discordUser.avatar.startsWith('a_') ? 'gif' : 'png';
            return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${extension}?size=256`;
        }
        return `https://api.lanyard.rest/${discordUser.id || userId}.png`;
    };

    const setPresence = (presence) => {
        if (!presence) return;

        const status = presence.discord_status || 'offline';
        const discordUser = presence.discord_user || {};
        const accent = getPresenceAccent(status);

        lanyardCard.classList.remove('is-online', 'is-idle', 'is-dnd', 'is-offline');
        lanyardCard.classList.add(`is-${status === 'online' || status === 'idle' || status === 'dnd' ? status : 'offline'}`);
        lanyardCard.style.setProperty('--lanyard-accent', accent.color);
        lanyardCard.style.setProperty('--lanyard-accent-soft', accent.soft);

        if (lanyardTitle) {
            lanyardTitle.textContent = getDisplayName(presence);
        }

        if (lanyardHandle) {
            lanyardHandle.textContent = getHandle(presence);
        }

        if (lanyardSubtitle) {
            if (presence.listening_to_spotify && presence.spotify) {
                const song = presence.spotify.song || 'Spotify';
                const artist = presence.spotify.artist ? ` by ${presence.spotify.artist}` : '';
                lanyardSubtitle.textContent = `Listening to ${song}${artist}`;
            } else {
                lanyardSubtitle.textContent = getActivityLabel(presence);
            }
        }

        if (lanyardStatus) {
            lanyardStatus.dataset.lanyardStatus = status === 'online' || status === 'idle' || status === 'dnd' ? status : 'offline';
        }

        if (lanyardStatusLabel) {
            lanyardStatusLabel.textContent = getStatusLabel(status);
        }

        if (lanyardKv) {
            lanyardKv.innerHTML = '';
            const kvEntries = Object.entries(presence.kv || {});

            if (kvEntries.length > 0) {
                kvEntries.forEach(([key, value]) => {
                    const chip = document.createElement('span');
                    chip.className = 'lanyard-kv-chip';

                    const keySpan = document.createElement('span');
                    keySpan.className = 'lanyard-kv-chip__key';
                    keySpan.textContent = `${key}:`;

                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'lanyard-kv-chip__value';
                    valueSpan.textContent = value;

                    chip.appendChild(keySpan);
                    chip.appendChild(valueSpan);
                    lanyardKv.appendChild(chip);
                });
                lanyardKv.hidden = false;
            } else {
                lanyardKv.hidden = true;
            }
        }

        if (lanyardAvatar) {
            lanyardAvatar.src = getAvatarUrl(presence);
            lanyardAvatar.alt = discordUser.username ? `${discordUser.username}'s Discord avatar` : 'Discord avatar';
        }
    };

    const connectSocket = () => {
        clearTimers();

        socket = new WebSocket(socketUrl);

        socket.addEventListener('open', async () => {
            try {
                const response = await fetch(apiUrl, { cache: 'no-store' });
                const payload = await response.json();
                if (payload && payload.success && payload.data) {
                    setPresence(payload.data);
                }
            } catch (error) {
                console.log('Lanyard REST fetch failed:', error);
            }
        });

        socket.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.op === 1 && message.d?.heartbeat_interval) {
                    socket.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: [userId] } }));
                    heartbeatId = window.setInterval(() => {
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({ op: 3 }));
                        }
                    }, message.d.heartbeat_interval);
                    return;
                }

                if (message.t === 'INIT_STATE' && message.d) {
                    setPresence(message.d[userId] || message.d);
                    return;
                }

                if (message.t === 'PRESENCE_UPDATE' && message.d) {
                    setPresence(message.d);
                }
            } catch (error) {
                console.log('Lanyard socket message error:', error);
            }
        });

        socket.addEventListener('close', () => {
            clearTimers();

            if (closedByCode) {
                return;
            }

            reconnectId = window.setTimeout(connectSocket, 5000);
        });

        socket.addEventListener('error', () => {
            try {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.close();
                }
            } catch (error) {
                console.log('Lanyard socket error:', error);
            }
        });
    };

    fetch(apiUrl, { cache: 'no-store' })
        .then((response) => response.json())
        .then((payload) => {
            if (payload && payload.success && payload.data) {
                setPresence(payload.data);
            }
        })
        .catch((error) => {
            console.log('Lanyard REST fetch failed:', error);
        });

    connectSocket();

    window.addEventListener('beforeunload', () => {
        closedByCode = true;
        clearTimers();
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanyardPresence, { once: true });
} else {
    initLanyardPresence();
}