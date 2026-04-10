/**
 * UI.JS v3.0 — Controlador de la Interfaz
 * Semáforo dinámico por umbral de cargo, animaciones lentas, periódico premium
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── Referencias al DOM ──────────────────────────────
    const roleEl = document.getElementById('current-role');
    const roleIconEl = document.getElementById('role-icon');
    const roundPipsEl = document.getElementById('round-pips');
    const metersEl = document.getElementById('active-meters');
    const permMeterEl = document.getElementById('permanent-meter');
    const cardsEl = document.getElementById('cards-container');
    const gameScreen = document.getElementById('game-screen');
    const startScreen = document.getElementById('start-screen');
    const btnPlay = document.getElementById('btn-play');
    const charImg = document.getElementById('role-character');

    // Periódico
    const overlay = document.getElementById('newspaper-overlay');
    const headlineEl = document.getElementById('news-headline');
    const subheadEl = document.getElementById('news-subhead');
    const textEl = document.getElementById('news-text');
    const statsEl = document.getElementById('news-stats');
    const btnContinue = document.getElementById('btn-continue');

    // Pantalla de ascenso
    const ascendOverlay = document.getElementById('ascend-overlay');
    const btnAscend = document.getElementById('btn-ascend-continue');
    let pendingState = null;

    // Pantalla de intro / misión
    const introOverlay = document.getElementById('intro-overlay');
    const btnIntroReady = document.getElementById('btn-intro-ready');

    // Menú de pausa
    const pauseOverlay = document.getElementById('pause-overlay');
    const btnPause = document.getElementById('btn-pause');
    const btnResume = document.getElementById('btn-resume');
    const btnRestart = document.getElementById('btn-restart');
    const btnMainMenu = document.getElementById('btn-main-menu');

    // Tracking de medidores en zona crítica (para no repetir alarma)
    const prevCritical = new Set();

    const ROLE_ICONS = {
        candidato: '🗳️',
        alcalde: '🏙️',
        diputado: '📜',
        senador: '🏛️',
        presidente: '👑'
    };

    const ROLE_CHARACTERS = {
        candidato: 'img/char_candidato.png.jpg',
        alcalde: 'img/char_alcalde.png.jpg',
        diputado: 'img/char_diputado.png.jpg',
        senador: 'img/char_senador.png.jpg',
        presidente: 'img/char_presidente.png.jpg'
    };

    // ── Pantalla de inicio ──────────────────────────────
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const btnTutorial = document.getElementById('btn-tutorial');
    const btnTutorialClose = document.getElementById('btn-tutorial-close');
    const btnTutorialPlay = document.getElementById('btn-tutorial-play');

    // ── Overlay de perfiles ─────────────────────────────
    const profileOverlay  = document.getElementById('profile-overlay');
    const profileCardsEl  = document.getElementById('profile-cards');
    const btnProfileStart = document.getElementById('btn-profile-start');
    const profileSeedCode = document.getElementById('profile-seed-code');
    let pendingProfileSeed    = 0;
    let pendingProfileIsDaily = false;
    let selectedProfile       = null;

    // ── Overlay de evento aleatorio ─────────────────────
    const eventOverlay = document.getElementById('event-overlay');
    const eventOptA    = document.getElementById('event-opt-a');
    const eventOptB    = document.getElementById('event-opt-b');

    // ── Botones nuevos del start-screen ─────────────────
    const btnDaily    = document.getElementById('btn-daily');
    const seedInput   = document.getElementById('seed-input');
    const btnSeedPlay = document.getElementById('btn-seed-play');

    function openProfileScreen(seed, isDaily) {
        pendingProfileSeed    = seed;
        pendingProfileIsDaily = isDaily;
        selectedProfile       = null;
        btnProfileStart.disabled = true;
        profileSeedCode.textContent = seedToCode(seed);

        // Generar los 4 perfiles de esta run usando la misma semilla (determinista)
        // Debe ser idéntico al orden en startNewRun para consistencia
        const tempRng = createSeededRNG(seed);
        const runProfiles = [...ALL_PROFILES].sort(() => tempRng() - 0.5).slice(0, 4);

        profileCardsEl.innerHTML = '';
        runProfiles.forEach(p => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.dataset.profileId = p.id;
            card.innerHTML = `
                <div class="profile-icon">${p.icon}</div>
                <div class="profile-name">${p.name}</div>
                <div class="profile-desc">${p.desc}</div>
                <div class="profile-tags">
                    <span class="profile-tag tag-pos">${p.tagPos}</span>
                    <span class="profile-tag tag-neg">${p.tagNeg}</span>
                </div>`;
            card.addEventListener('click', () => {
                profileCardsEl.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedProfile = p;
                btnProfileStart.disabled = false;
                try { AudioManager.uiClick(); } catch (e) {}
            });
            profileCardsEl.appendChild(card);
        });

        profileOverlay.classList.remove('hidden');
    }

    function launchGame() {
        startScreen.style.animation = 'fade-out 0.4s ease forwards';
        setTimeout(() => {
            startScreen.style.display = 'none';
            gameScreen.classList.remove('hidden');
        }, 400);
    }

    btnPlay.addEventListener('click', async () => {
        await AudioManager.init();
        AudioManager.startGame();
        openProfileScreen(generateSeed(), false);
    });

    btnDaily.addEventListener('click', async () => {
        await AudioManager.init();
        AudioManager.startGame();
        launchGame();
        setTimeout(() => GameState.startNewRun(getDailySeed(), null, true), 400);
    });

    btnSeedPlay.addEventListener('click', async () => {
        const code = (seedInput.value || '').trim();
        if (!code) return;
        await AudioManager.init();
        AudioManager.startGame();
        openProfileScreen(codeToSeed(code), false);
    });

    seedInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnSeedPlay.click(); });

    btnProfileStart.addEventListener('click', () => {
        if (!selectedProfile) return;
        try { AudioManager.uiClick(); } catch (e) {}
        profileOverlay.classList.add('hidden');
        launchGame();
        setTimeout(() => GameState.startNewRun(pendingProfileSeed, selectedProfile, pendingProfileIsDaily), 400);
    });

    // ── Botón de Tutorial ──────────────────────────────
    btnTutorial.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { AudioManager.uiClick(); } catch (e) { }
        console.log('Opening tutorial...');
        tutorialOverlay.classList.remove('hidden');
    });

    btnTutorialClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { AudioManager.uiClick(); } catch (e) { }
        tutorialOverlay.classList.add('hidden');
    });

    btnTutorialPlay.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { AudioManager.uiClick(); } catch (e) { }
        tutorialOverlay.classList.add('hidden');
        await AudioManager.init();
        AudioManager.startGame();
        openProfileScreen(generateSeed(), false);
    });

    // ── Menú de Pausa ──────────────────────────────────
    btnPause.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { AudioManager.uiClick(); } catch (e) { }
        pauseOverlay.classList.remove('hidden');
        // Actualizar texto del botón a "▶️"
        btnPause.textContent = '▶️';
    });

    btnResume.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { AudioManager.uiClick(); } catch (e) { }
        pauseOverlay.classList.add('hidden');
        btnPause.textContent = '⏸️';
    });

    btnRestart.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { AudioManager.uiClick(); } catch (e) { }
        pauseOverlay.classList.add('hidden');
        btnPause.textContent = '⏸️';
        eventOverlay.classList.add('hidden');
        // Reiniciar con el mismo perfil y semilla (para reproducibilidad)
        GameState.startNewRun(GameState.seed, GameState.selectedProfile, GameState.isDailyChallenge);
    });

    btnMainMenu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { AudioManager.uiClick(); } catch (e) { }
        pauseOverlay.classList.add('hidden');
        gameScreen.classList.add('hidden');
        startScreen.style.display = 'flex';
        startScreen.style.animation = 'fade-in 0.4s ease forwards';
        btnPause.textContent = '⏸️';
    });

    // ── Tecla ESC para pausar/reanudar ─────────────────
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            // Si estamos en tutorial, no hacer nada
            if (!tutorialOverlay.classList.contains('hidden')) return;
            if (!profileOverlay.classList.contains('hidden')) return;
            if (!eventOverlay.classList.contains('hidden')) return;
            // Si estamos en newspaper/ascend/intro, no hacer nada
            if (!overlay.classList.contains('hidden')) return;
            if (!ascendOverlay.classList.contains('hidden')) return;
            if (!introOverlay.classList.contains('hidden')) return;
            // Si el start screen está visible, no hacer nada
            if (startScreen.style.display !== 'none') return;

            if (pauseOverlay.classList.contains('hidden')) {
                // Abrir pausa
                try { AudioManager.uiClick(); } catch (e) { }
                pauseOverlay.classList.remove('hidden');
                btnPause.textContent = '▶️';
            } else {
                // Cerrar pausa
                try { AudioManager.uiClick(); } catch (e) { }
                pauseOverlay.classList.add('hidden');
                btnPause.textContent = '⏸️';
            }
        }
    });

    // ── Escuchar eventos del Engine ──────────────────────
    document.addEventListener('gameStateUpdate', ({ detail }) => {
        const { type, state, message } = detail;

        switch (type) {
            case 'role_started':
                CardGenerator.resetPool();
                renderHeader(state);
                renderMeters(state);
                renderCards(state);
                renderPromises(state);
                showIntroScreen(state);
                break;
            case 'next_round':
                AudioManager.newRound();
                renderHeader(state);
                renderMeters(state);
                renderPromises(state);
                if (state.runStatus === 'active') renderCards(state);
                break;
            case 'effects_applied':
                renderHeader(state);
                renderMeters(state);
                renderPromises(state);
                flashScreen();
                if (state.runStatus === 'active') renderCards(state);
                break;
            case 'promise_added':
                renderPromises(state);
                break;
            case 'promises_expired':
                renderHeader(state);
                renderMeters(state);
                renderPromises(state);
                flashScreen();
                break;
            case 'random_event':
                showEventOverlay(message); // message = resolved event object
                break;
            case 'game_over':
                AudioManager.gameOver();
                eventOverlay.classList.add('hidden');
                renderHeader(state);
                renderMeters(state);
                shakeScreen();
                setTimeout(() => showNewspaper(state, false, message), 800);
                break;
            case 'won_role':
                AudioManager.ascend();
                eventOverlay.classList.add('hidden');
                showAscendScreen(state);
                break;
            case 'victory':
                AudioManager.victory();
                eventOverlay.classList.add('hidden');
                showNewspaper(state, true, '¡Pasaste de candidato anónimo a Presidente de la Nación! La historia te juzgará... con algo de sarcasmo.');
                break;
        }
    });

    // ── Botón de la pantalla de ascenso ─────────────────
    btnAscend.addEventListener('click', () => {
        AudioManager.uiClick();
        ascendOverlay.classList.add('hidden');
        showNewspaper(pendingState, true, null);
    });

    // ── Botón de Introducción a Cargo ───────────────────
    btnIntroReady.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch (e) { }
        introOverlay.classList.add('hidden');
    });

    // ── Botón Continuar del periódico ───────────────────
    btnContinue.addEventListener('click', () => {
        AudioManager.uiClick();
        overlay.classList.add('hidden');
        if (GameState.runStatus === 'game_over' || GameState.runStatus === 'victory') {
            // Volver al menú y mostrar pantalla de perfil
            gameScreen.classList.add('hidden');
            startScreen.style.display = 'flex';
            startScreen.style.animation = 'fade-in 0.4s ease forwards';
        } else if (GameState.runStatus === 'won_role') {
            GameState.advanceToNextRole();
        }
    });

    // ────────────────────────────────────────────────────
    //   PANTALLA DE INTRO / MISIÓN
    // ────────────────────────────────────────────────────
    function showIntroScreen(state) {
        const cfg = state.getCurrentRoleConfig();

        document.getElementById('intro-role').textContent = cfg.name.toUpperCase();

        const introChar = document.getElementById('intro-character');
        if (ROLE_CHARACTERS[cfg.id]) {
            introChar.src = ROLE_CHARACTERS[cfg.id];
        }

        document.getElementById('intro-rounds').textContent = `${cfg.totalRounds} rondas`;
        document.getElementById('intro-threshold').textContent = `${cfg.minThreshold}%`;

        const listEl = document.getElementById('intro-meters-list');
        listEl.innerHTML = '';
        state.activeMeters.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `${m.icon || '📊'} ${m.name}`;
            listEl.appendChild(li);
        });
        if (state.permanentMeter) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${state.permanentMeter.icon || '★'} ${state.permanentMeter.name} (Permanente)</strong>`;
            listEl.appendChild(li);
        }

        introOverlay.classList.remove('hidden');
    }

    // ────────────────────────────────────────────────────
    //   EVENTO ALEATORIO (tipo Reigns)
    // ────────────────────────────────────────────────────
    function showEventOverlay(ev) {
        document.getElementById('event-icon').textContent  = ev.icon;
        document.getElementById('event-title').textContent = ev.title;
        document.getElementById('event-desc').textContent  = ev.desc;

        function fillOption(el, opt) {
            el.querySelector('.event-opt-label').textContent = opt.label;
            el.querySelector('.event-opt-hint').textContent  = opt.hint;
            const effectsEl = el.querySelector('.event-opt-effects');
            effectsEl.innerHTML = opt.effects.map(e => {
                const pos = e.amount >= 0;
                return `<span class="event-eff ${pos ? 'pos' : 'neg'}">${pos ? '▲' : '▼'} ${Math.abs(e.amount)}% ${e.meterName}</span>`;
            }).join('');
            el.onclick = null; // reset
            el.addEventListener('click', () => {
                try { AudioManager.cardClick(); } catch (e) {}
                eventOverlay.classList.add('hidden');
                GameState.applyEventChoice(opt.effects);
            }, { once: true });
        }

        fillOption(eventOptA, ev.optA);
        fillOption(eventOptB, ev.optB);
        eventOverlay.classList.remove('hidden');
    }

    // ────────────────────────────────────────────────────
    //   BARRA DE PROMESAS
    // ────────────────────────────────────────────────────
    function renderPromises(state) {
        const barEl = document.getElementById('active-promises');
        if (!barEl) return;
        barEl.innerHTML = '';
        if (!state.activePromises || state.activePromises.length === 0) return;

        state.activePromises.forEach(p => {
            const tag = document.createElement('div');
            tag.className = 'promise-tag';
            tag.innerHTML = `
                <span class="promise-label">${p.label}</span>
                <span class="promise-rounds">${p.roundsLeft} ronda${p.roundsLeft !== 1 ? 's' : ''}</span>`;
            barEl.appendChild(tag);
        });
    }

    // ────────────────────────────────────────────────────
    //   PANTALLA DE ASCENSO
    // ────────────────────────────────────────────────────
    function showAscendScreen(state) {
        pendingState = state;
        const currentCfg = state.getCurrentRoleConfig();
        const nextRole = ROLES[state.roleIndex + 1];

        document.getElementById('ascend-from-role').textContent = currentCfg.name.toUpperCase();
        document.getElementById('ascend-new-role').textContent = nextRole.name.toUpperCase();

        const ascendChar = document.getElementById('ascend-character');
        ascendChar.src = ROLE_CHARACTERS[nextRole.id] || '';

        // Generar confetti
        const confettiEl = document.getElementById('ascend-confetti');
        confettiEl.innerHTML = '';
        const colors = ['#f5c518', '#e63946', '#2dc653', '#ff9f1c', '#fdf6e3'];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + 'vw';
            piece.style.width = (8 + Math.random() * 8) + 'px';
            piece.style.height = (10 + Math.random() * 10) + 'px';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
            piece.style.animationDelay = (Math.random() * 1.5) + 's';
            confettiEl.appendChild(piece);
        }

        ascendOverlay.classList.remove('hidden');
    }

    // ────────────────────────────────────────────────────
    //   FEEDBACK VISUAL
    // ────────────────────────────────────────────────────
    function flashScreen() {
        gameScreen.classList.add('flash');
        setTimeout(() => gameScreen.classList.remove('flash'), 300);
    }

    function shakeScreen() {
        gameScreen.classList.add('shake');
        setTimeout(() => gameScreen.classList.remove('shake'), 500);
    }

    // ────────────────────────────────────────────────────
    //   SEMÁFORO DINÁMICO
    //   Basado en el minThreshold del cargo actual
    //   Verde: valor >= umbral
    //   Amarillo: valor >= umbral * 0.65 && valor < umbral
    //   Rojo: valor < umbral * 0.65
    // ────────────────────────────────────────────────────
    function getMeterStatus(val, isPerm) {
        const cfg = GameState.getCurrentRoleConfig();
        const threshold = cfg.minThreshold; // 40, 50, 60, 65, 70 según cargo
        const dangerZone = Math.floor(threshold * 0.65);

        if (isPerm) {
            // Permanente: umbral fijo 30%
            if (val <= 20) return 'crit';
            if (val <= 35) return 'warn';
            return 'safe';
        }

        if (val < dangerZone) return 'crit';
        if (val < threshold) return 'warn';
        return 'safe';
    }

    // ────────────────────────────────────────────────────
    //   RENDERERS
    // ────────────────────────────────────────────────────

    function renderHeader(state) {
        const cfg = state.getCurrentRoleConfig();
        roleEl.textContent = cfg.name;
        roleIconEl.textContent = ROLE_ICONS[cfg.id] || '🏛️';

        // Actualizar personaje
        if (charImg && ROLE_CHARACTERS[cfg.id]) {
            charImg.src = ROLE_CHARACTERS[cfg.id];
        }

        // Mostrar umbral mínimo
        const thresholdEl = document.getElementById('threshold-label');
        if (thresholdEl) thresholdEl.textContent = `Mínimo: ${cfg.minThreshold}%`;

        // Tooltips dinámicos del header
        const roleTooltip = document.getElementById('role-tooltip');
        const roundTooltip = document.getElementById('round-tooltip');
        if (roleTooltip) roleTooltip.textContent = `Eres ${cfg.name} — supera el ${cfg.minThreshold}% en todos los medidores para avanzar al siguiente cargo`;
        if (roundTooltip) roundTooltip.textContent = `Ronda ${state.currentRound} de ${cfg.totalRounds} — completa todas las rondas manteniendo tus medidores por encima del mínimo`;

        roundPipsEl.innerHTML = '';
        for (let i = 1; i <= cfg.totalRounds; i++) {
            const pip = document.createElement('div');
            pip.className = 'round-pip';
            if (i < state.currentRound) pip.classList.add('done');
            if (i === state.currentRound) pip.classList.add('current');
            roundPipsEl.appendChild(pip);
        }
    }

    function renderMeters(state) {
        const nowCritical = new Set();

        metersEl.innerHTML = '';
        state.activeMeters.forEach(m => {
            const status = getMeterStatus(Math.round(m.value), false);
            if (status === 'crit') nowCritical.add(m.id);
            metersEl.appendChild(buildMeterCard(m, false));
        });

        permMeterEl.innerHTML = '';
        if (state.permanentMeter) {
            const ps = getMeterStatus(Math.round(state.permanentMeter.value), true);
            if (ps === 'crit') nowCritical.add(state.permanentMeter.id);
            permMeterEl.appendChild(buildMeterCard(state.permanentMeter, true));
        }

        // Tocar alarma solo cuando un medidor ENTRA por primera vez en crítico
        for (const id of nowCritical) {
            if (!prevCritical.has(id)) { AudioManager.meterCritical(); break; }
        }
        prevCritical.clear();
        nowCritical.forEach(id => prevCritical.add(id));
    }

    function buildMeterCard(meter, isPerm) {
        const val = Math.round(meter.value);
        const status = getMeterStatus(val, isPerm);
        const cfg = GameState.getCurrentRoleConfig();

        const card = document.createElement('div');
        card.className = `meter-card is-${status}`;
        card.dataset.meterId = meter.id; // Added for hover preview matching
        if (isPerm) card.className = 'meter-card is-perm';

        const icon = meter.icon || '📊';

        let fillClass = isPerm ? 'meter-fill perm' : `meter-fill ${status}`;
        let valClass = isPerm ? 'meter-value perm' : `meter-value ${status}`;

        const tooltipText = meter.desc || '';

        // Línea del umbral mínimo (solo para medidores temporales)
        let thresholdMarker = '';
        if (!isPerm) {
            thresholdMarker = `<div class="meter-threshold" style="left:${cfg.minThreshold}%" title="Mínimo requerido: ${cfg.minThreshold}%"></div>`;
        }

        card.innerHTML = `
            <div class="meter-row">
                <span class="meter-name">
                    <span class="meter-icon">${icon}</span>
                    ${meter.name}
                </span>
                <span class="${valClass}">${val}%</span>
            </div>
            <div class="meter-track">
                <div class="${fillClass}" style="width:${val}%"></div>
                <div class="meter-preview-fill"></div>
                ${thresholdMarker}
            </div>
            <div class="meter-tooltip">${tooltipText}</div>
        `;
        return card;
    }

    function spawnParticles(sourceEl, eff) {
        const rect = sourceEl.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        const meterEl = document.querySelector(`.meter-card[data-meter-id="${eff.meterId}"]`);
        if (!meterEl) return;
        const mRect = meterEl.getBoundingClientRect();
        const destX = mRect.left + mRect.width / 2;
        const destY = mRect.top + mRect.height / 2;

        for (let i = 0; i < 25; i++) {
            const p = document.createElement('div');
            const isPos = eff.amount >= 0;
            p.className = `particle ${isPos ? 'pos' : 'neg'}`;
            p.textContent = isPos ? '+' : '-';
            p.style.left = `${startX}px`;
            p.style.top = `${startY}px`;
            p.style.fontSize = `${12 + Math.random() * 12}px`;
            
            // Random offset spread
            const spread = 80;
            const dx = (destX - startX) + (Math.random() * spread - spread / 2);
            const dy = (destY - startY) + (Math.random() * spread - spread / 2);
            p.style.setProperty('--dx', `${dx}px`);
            p.style.setProperty('--dy', `${dy}px`);

            // Higher randomness for speed and path
            p.style.animationDelay = `${Math.random() * 0.4}s`;
            p.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;

            document.body.appendChild(p);
            setTimeout(() => p.remove(), 1200);
        }
    }

    function renderCards(state) {
        cardsEl.innerHTML = '';
        cardsEl.dataset.locked = 'false';
        const roleId = state.getCurrentRoleConfig().id;
        const options = CardGenerator.generateCardsForTurn(
            state.activeMeters,
            state.permanentMeter,
            3,
            roleId
        );

        options.forEach((card, idx) => {
            const el = document.createElement('div');

            // Determinar el tipo visual de la carta según los efectos
            const totalPos = card.effects.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);
            const totalNeg = card.effects.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
            let cardType = 'neutral';
            if (totalPos > totalNeg * 1.3) cardType = 'profit';
            else if (totalNeg > totalPos * 1.3) cardType = 'risk';

            // Icono del banner según tipo
            const bannerIcons = {
                neutral: '⚖️',
                profit: '📈',
                risk: '🎲'
            };

            el.className = `decision-card card-type-${cardType}`;
            el.style.animationDelay = `${idx * 0.18}s`;

            // Efectos como pastillas (pills) - Camino 2 (Números visibles)
            let effectsHTML = '';
            card.effects.forEach(eff => {
                const pos = eff.amount >= 0;
                const cls = pos ? 'effect-pos' : 'effect-neg';
                const sign = pos ? '+' : '';
                const arrow = pos ? '▲' : '▼';
                effectsHTML += `
                    <div class="effect-row ${cls}">
                        <span class="effect-pill">
                            <span class="effect-arrow-icon">${arrow}</span>
                            ${sign}${eff.amount}% ${eff.meterName}
                        </span>
                    </div>`;
            });

            const promiseBadge = card.isPromise && card.promise
                ? `<div class="promise-badge">⏳ PROMESA — vence en ${card.promise.roundsLeft} ronda${card.promise.roundsLeft !== 1 ? 's' : ''}</div>`
                : '';

            el.innerHTML = `
                <div class="card-banner">
                    <span class="card-banner-icon">${card.isPromise ? '📋' : bannerIcons[cardType]}</span>
                    <span class="card-banner-number">${idx + 1}</span>
                </div>
                <div class="card-title-zone">
                    <div class="card-title">${card.title}</div>
                </div>
                <div class="card-desc-zone">
                    <div class="card-desc">${card.desc}</div>
                </div>
                <div class="card-effects-zone">${effectsHTML}</div>
                ${promiseBadge}
            `;

            // Hover Preview Events - Camino 2 (Glow neutral en medidor)
            el.addEventListener('mouseenter', () => {
                if (cardsEl.dataset.locked === 'true') return;
                card.effects.forEach(eff => {
                    const meterEl = document.querySelector(`.meter-card[data-meter-id="${eff.meterId}"]`);
                    if (meterEl) {
                        meterEl.classList.add('preview-neutral');
                    }
                });
            });

            el.addEventListener('mouseleave', () => {
                card.effects.forEach(eff => {
                    const meterEl = document.querySelector(`.meter-card[data-meter-id="${eff.meterId}"]`);
                    if (meterEl) {
                        meterEl.classList.remove('preview-neutral');
                    }
                });
            });

            el.addEventListener('click', () => {
                if (cardsEl.dataset.locked === 'true') return;
                cardsEl.dataset.locked = 'true';

                try { AudioManager.cardClick(); } catch (e) { }

                // Quitar previews al confirmar click
                card.effects.forEach(eff => {
                    const meterEl = document.querySelector(`.meter-card[data-meter-id="${eff.meterId}"]`);
                    if (meterEl) {
                        meterEl.classList.remove('preview-neutral');
                    }
                });

                // Squash anim (impact visual)
                el.classList.add('squash-active');
                
                // Hitstop (Screen Shake breve)
                document.body.classList.add('hitstop-active');
                setTimeout(() => document.body.classList.remove('hitstop-active'), 150);

                // Spawn Particles
                card.effects.forEach(eff => {
                    spawnParticles(el, eff);
                });

                setTimeout(() => {
                    el.classList.remove('squash-active');
                    el.classList.add('selected');
                    cardsEl.querySelectorAll('.decision-card').forEach(c => {
                        if (c !== el) {
                            c.classList.add('rejected');
                        }
                    });
                }, 100);

                setTimeout(() => {
                    GameState.applyCardEffects(card.effects, card.promise || null);
                    cardsEl.dataset.locked = 'false';
                }, 900);
            });

            cardsEl.appendChild(el);
        });

        // Activar vanilla-tilt en todas las cartas nuevas
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(cardsEl.querySelectorAll('.decision-card'), {
                max: 12,
                speed: 400,
                glare: true,
                'max-glare': 0.2,
                scale: 1.04,
                perspective: 800,
            });
        }
    }

    // ────────────────────────────────────────────────────
    //   PERIÓDICO
    // ────────────────────────────────────────────────────


    const WIN_QUOTES = [
        '«Demostramos que se puede gobernar con responsabilidad y obtener resultados concretos para la gente.»',
        '«Este ascenso es del pueblo, yo solo fui el instrumento de una voluntad colectiva que siempre supo hacia dónde ir.»',
        '«La democracia funciona cuando los ciudadanos premian la buena gestión y exigen cuentas claras.»',
        '«Trabajamos sin descanso, tomamos las decisiones difíciles y hoy los resultados nos dan la razón.»',
    ];
    const LOSS_QUOTES = [
        '«Asumo toda la responsabilidad por los errores cometidos. No buscaré excusas donde solo hubo malas decisiones.»',
        '«Las circunstancias fueron adversas, pero reconozco que tampoco estuve a la altura de lo que el momento requería.»',
        '«El pueblo ha decidido, y respeto su veredicto. La democracia es más grande que cualquier ambición personal.»',
        '«Me voy con la conciencia de haber intentado lo que creí correcto, aunque los resultados demuestren que me equivoqué.»',
    ];

    // Datos por cargo: foto, etiqueta de sección, caption de la foto
    const ROLE_NEWSPAPER = {
        candidato: { img: 'img/char_candidato.png.jpg', section: 'CAMPAÑA ELECTORAL', caption: 'El candidato durante la campaña en terreno' },
        alcalde: { img: 'img/char_alcalde.png.jpg', section: 'GOBIERNO LOCAL', caption: 'El alcalde en su despacho municipal' },
        diputado: { img: 'img/char_diputado.png.jpg', section: 'PODER LEGISLATIVO', caption: 'El diputado en la Cámara de Representantes' },
        senador: { img: 'img/char_senador.png.jpg', section: 'CÁMARA ALTA', caption: 'El senador durante la sesión plenaria' },
        presidente: { img: 'img/char_presidente.png.jpg', section: 'PRESIDENCIA DE LA REPÚBLICA', caption: 'El mandatario en el Palacio de Gobierno' },
    };

    function showNewspaper(state, isWin, customMessage) {
        overlay.classList.remove('hidden');
        const cfg = state.getCurrentRoleConfig();
        const today = new Date();
        const dateStr = today.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Resultado visual
        const paperEl = document.getElementById('newspaper-paper');
        paperEl.className = isWin ? 'paper-win' : 'paper-loss';

        // Foto, sección y caption según cargo
        const roleMeta = ROLE_NEWSPAPER[cfg.id] || ROLE_NEWSPAPER.candidato;
        const photoEl = document.getElementById('paper-photo');
        if (photoEl) photoEl.src = roleMeta.img;
        const captionEl = document.getElementById('paper-caption');
        if (captionEl) captionEl.textContent = roleMeta.caption;
        const sectionEl = document.getElementById('paper-section-label');
        if (sectionEl) sectionEl.textContent = isWin ? roleMeta.section : '⚠ ' + roleMeta.section;

        // Fecha y edición
        document.getElementById('paper-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        document.getElementById('paper-edition').textContent = `Edición Nº ${Math.floor(Math.random() * 9000) + 1000}`;

        // Precio ficticio
        const priceEl = document.getElementById('paper-price');
        if (priceEl) priceEl.textContent = `$${(Math.random() * 3 + 1).toFixed(2)}`;

        // Titular
        const roleData = NEWSPAPER[cfg.id] || NEWSPAPER['candidato'];
        const headlinesPool = isWin ? roleData.win.headlines : roleData.loss.headlines;

        if (state.runStatus === 'victory') {
            headlineEl.textContent = '¡PRESIDENTE ELECTO!';
        } else {
            headlineEl.textContent = headlinesPool[Math.floor(Math.random() * headlinesPool.length)];
        }

        // Subtítulo del cargo (Y motivo de derrota si aplica)
        if (customMessage) {
            const prefix = isWin ? 'NOTICIA DE ÚLTIMA HORA' : 'MOTIVO DE LA CAÍDA';
            subheadEl.innerHTML = `<strong>${prefix}: ${customMessage}</strong><br>${cfg.name} — Ronda ${state.currentRound} de ${cfg.totalRounds}`;
        } else {
            subheadEl.textContent = `${cfg.name} — Ronda ${state.currentRound} de ${cfg.totalRounds} — Umbral mínimo: ${cfg.minThreshold}%`;
        }

        // Cuerpo del artículo principal
        const articlesPool = isWin ? roleData.win.articles : roleData.loss.articles;
        const quotePool = isWin ? WIN_QUOTES : LOSS_QUOTES;

        textEl.textContent = articlesPool[Math.floor(Math.random() * articlesPool.length)];

        // Cita
        const quoteEl = document.getElementById('news-quote');
        if (quoteEl) {
            quoteEl.textContent = quotePool[Math.floor(Math.random() * quotePool.length)];
        }

        // Columna lateral — titulares aleatorios más variados
        const sidebarEl = document.getElementById('news-sidebar');
        if (sidebarEl) {
            const shuffledSide = [...OTROS_TITULARES].sort(() => 0.5 - Math.random());
            sidebarEl.innerHTML = shuffledSide.slice(0, 4).map(h => `<div class="sidebar-item">${h}</div>`).join('');
        }

        // Avisos Clasificados
        const rightCol = document.querySelector('.paper-col-right');
        if (rightCol) {
            const existingAds = rightCol.querySelectorAll('.paper-ad');
            existingAds.forEach(ad => ad.remove());

            const shuffledAds = [...AVISOS_CLASIFICADOS].sort(() => 0.5 - Math.random());
            const selectedAds = shuffledAds.slice(0, 2);

            selectedAds.forEach((ad, i) => {
                const adEl = document.createElement('div');
                adEl.className = 'paper-ad';
                if (i > 0) adEl.style.marginTop = '10px';
                adEl.innerHTML = `<div class="ad-header">${ad.header}</div><div class="ad-body">${ad.body}</div>`;
                rightCol.appendChild(adEl);
            });
        }

        // Stats — nuevo layout: nombre arriba, barra+valor abajo
        statsEl.innerHTML = '';
        const allMeters = [...state.activeMeters];
        if (state.permanentMeter) allMeters.push(state.permanentMeter);

        allMeters.forEach(m => {
            const val = Math.round(m.value);
            const isPerm = state.permanentMeter && m.id === state.permanentMeter.id;
            const status = getMeterStatus(val, isPerm);

            const li = document.createElement('li');
            li.className = 'stat-' + status;
            li.innerHTML = `
                <span class="stat-name">${m.icon || '📊'} ${m.name}</span>
                <span class="stat-row">
                    <span class="stat-bar-wrap"><span class="stat-bar" style="width:${val}%"></span></span>
                    <span class="stat-val">${val}%</span>
                </span>
            `;
            statsEl.appendChild(li);
        });

        // ── Final narrativo (solo en victoria total) ──
        const endingBar = document.getElementById('victory-ending-bar');
        const endingIcon = document.getElementById('victory-ending-icon');
        const endingLabel = document.getElementById('victory-ending-label');
        if (state.runStatus === 'victory' && endingBar) {
            const profile = state.getVictoryProfile();
            const ending = VICTORY_ENDINGS[profile];
            endingBar.classList.remove('hidden');
            endingBar.dataset.profile = profile;
            endingIcon.textContent  = ending.icon;
            endingLabel.textContent = `${ending.title} — ${ending.headline}`;
            // Sobreescribir artículo con el artículo del final narrativo
            textEl.textContent  = ending.article;
            headlineEl.textContent = ending.headline;
            const quoteEl = document.getElementById('news-quote');
            if (quoteEl) quoteEl.textContent = ending.quote;
        } else if (endingBar) {
            endingBar.classList.add('hidden');
        }

        // ── Semilla ──
        const paperSeedCode = document.getElementById('paper-seed-code');
        const btnCopySeed   = document.getElementById('btn-copy-seed');
        if (paperSeedCode) {
            const code = seedToCode(state.seed || 0);
            paperSeedCode.textContent = code;
            if (btnCopySeed) {
                btnCopySeed.onclick = () => {
                    navigator.clipboard.writeText(code).then(() => {
                        btnCopySeed.textContent = '✅ Copiado';
                        setTimeout(() => { btnCopySeed.textContent = '📋 Copiar'; }, 2000);
                    });
                };
            }
        }

        // ── Diario label ──
        if (state.isDailyChallenge) {
            const edEl = document.getElementById('paper-edition');
            if (edEl) edEl.textContent = '📅 DESAFÍO DIARIO';
        }

        // Botón
        if (state.runStatus === 'victory' || state.runStatus === 'game_over') {
            btnContinue.textContent = '🗳️ NUEVA CARRERA';
        } else {
            btnContinue.textContent = '🏛️ ACEPTAR CARGO →';
        }
    }

});
