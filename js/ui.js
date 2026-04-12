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
    let prevMeterValues = {};

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
    const btnDaily       = document.getElementById('btn-daily');
    const btnLeaderboard = document.getElementById('btn-leaderboard');
    const seedInput      = document.getElementById('seed-input');
    const btnSeedPlay    = document.getElementById('btn-seed-play');

    // ── Leaderboard overlay ──────────────────────────────
    const leaderboardOverlay   = document.getElementById('leaderboard-overlay');
    const leaderboardBody      = document.getElementById('leaderboard-body');
    const leaderboardEmpty     = document.getElementById('leaderboard-empty');
    const leaderboardTodayBox  = document.getElementById('leaderboard-today-box');
    const btnCloseLeaderboard  = document.getElementById('btn-close-leaderboard');

    // ── Referencias de Opciones (Pilar 4) ────────────────
    const optionsOverlay         = document.getElementById('options-overlay');
    const btnOptionsStart        = document.getElementById('btn-options-start');
    const btnPauseOptions        = document.getElementById('btn-pause-options');
    const btnOptionsClose        = document.getElementById('btn-options-close');
    const sliderMusic            = document.getElementById('slider-music');
    const sliderSFX              = document.getElementById('slider-sfx');
    const musicVolVal            = document.getElementById('music-vol-val');
    const sfxVolVal              = document.getElementById('sfx-vol-val');
    const btnToggleFullscreen    = document.getElementById('btn-toggle-fullscreen');
    const btnToggleAnimations    = document.getElementById('btn-toggle-animations');
    const btnToggleContrast      = document.getElementById('btn-toggle-contrast');
    const btnToggleMuteBlur      = document.getElementById('btn-toggle-muteblur');
    const btnToggleFastMode      = document.getElementById('btn-toggle-fastmode');
    const sliderShake            = document.getElementById('slider-shake');
    const shakeVal               = document.getElementById('shake-val');
    const selectLanguage         = document.getElementById('select-language');

    // ── CONFIGURACIÓN (SettingsManager) ─────────────────
    const DEFAULT_SETTINGS = {
        musicVol: 70,
        sfxVol: 80,
        muteOnBlur: false,
        fastMode: false,
        shakeIntensity: 100,
        fullscreen: false,
        reduceAnimations: false,
        highContrast: false,
        language: 'es'
    };

    let settings = { ...DEFAULT_SETTINGS };

    function loadSettings() {
        const saved = localStorage.getItem('cp_settings');
        if (saved) {
            try { settings = { ...settings, ...JSON.parse(saved) }; } catch(e) {}
        }
        applySettings();
        updateOptionsUI();
    }

    function saveSettings() {
        localStorage.setItem('cp_settings', JSON.stringify(settings));
    }

    function applySettings() {
        AudioManager.setMusicVolume(settings.musicVol);
        AudioManager.setSFXVolume(settings.sfxVol);

        document.body.classList.toggle('reduce-animations', !!settings.reduceAnimations);
        document.body.classList.toggle('high-contrast', !!settings.highContrast);
        document.body.classList.toggle('fast-mode', !!settings.fastMode);
    }

    function updateOptionsUI() {
        sliderMusic.value = settings.musicVol;
        musicVolVal.textContent = `${settings.musicVol}%`;
        sliderSFX.value = settings.sfxVol;
        sfxVolVal.textContent = `${settings.sfxVol}%`;

        sliderShake.value = settings.shakeIntensity;
        shakeVal.textContent = `${settings.shakeIntensity}%`;

        const _on  = I18n.tStr('ui.options.btn_on',  'ACTIVADO');
        const _off = I18n.tStr('ui.options.btn_off', 'DESACTIVADO');

        btnToggleFullscreen.textContent = settings.fullscreen ? _on : _off;
        btnToggleFullscreen.classList.toggle('active', settings.fullscreen);

        btnToggleAnimations.textContent = settings.reduceAnimations ? _on : _off;
        btnToggleAnimations.classList.toggle('active', settings.reduceAnimations);

        btnToggleContrast.textContent = settings.highContrast ? _on : _off;
        btnToggleContrast.classList.toggle('active', settings.highContrast);

        btnToggleMuteBlur.textContent = settings.muteOnBlur ? _on : _off;
        btnToggleMuteBlur.classList.toggle('active', settings.muteOnBlur);

        btnToggleFastMode.textContent = settings.fastMode ? _on : _off;
        btnToggleFastMode.classList.toggle('active', settings.fastMode);

        if (selectLanguage) selectLanguage.value = settings.language;
    }

    loadSettings();

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
            const pName   = I18n.tStr(`game.profiles.${p.id}.name`,   p.name);
            const pDesc   = I18n.tStr(`game.profiles.${p.id}.desc`,   p.desc);
            const pTagPos = I18n.tStr(`game.profiles.${p.id}.tagPos`, p.tagPos);
            const pTagNeg = I18n.tStr(`game.profiles.${p.id}.tagNeg`, p.tagNeg);
            card.innerHTML = `
                <div class="profile-icon">${p.icon}</div>
                <div class="profile-name">${pName}</div>
                <div class="profile-desc">${pDesc}</div>
                <div class="profile-tags">
                    <span class="profile-tag tag-pos">${pTagPos}</span>
                    <span class="profile-tag tag-neg">${pTagNeg}</span>
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
        openProfileScreen(generateSeed(), false);
    });

    btnDaily.addEventListener('click', async () => {
        if (!GameState.canPlayDaily()) {
            showLeaderboard(true); // mostrar historial con "ya jugaste hoy"
            return;
        }
        await AudioManager.init();
        AudioManager.startGame();
        launchGame();
        setTimeout(() => GameState.startNewRun(getDailySeed(), null, true), 400);
    });

    btnLeaderboard.addEventListener('click', () => showLeaderboard(false));
    btnCloseLeaderboard.addEventListener('click', () => {
        leaderboardOverlay.classList.add('hidden');
    });

    btnSeedPlay.addEventListener('click', async () => {
        const code = (seedInput.value || '').trim();
        if (!code) return;
        await AudioManager.init();
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

    // ── Manejo de Opciones (Pilar 4) ────────────────────
    function showOptions() {
        updateOptionsUI();
        optionsOverlay.classList.remove('hidden');
    }

    btnOptionsStart.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch(e) {}
        showOptions();
    });

    btnPauseOptions.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch(e) {}
        showOptions();
    });

    btnOptionsClose.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch(e) {}
        optionsOverlay.classList.add('hidden');
    });

    sliderMusic.addEventListener('input', (e) => {
        settings.musicVol = parseInt(e.target.value);
        musicVolVal.textContent = `${settings.musicVol}%`;
        AudioManager.setMusicVolume(settings.musicVol);
        saveSettings();
    });

    sliderSFX.addEventListener('input', (e) => {
        settings.sfxVol = parseInt(e.target.value);
        sfxVolVal.textContent = `${settings.sfxVol}%`;
        AudioManager.setSFXVolume(settings.sfxVol);
        saveSettings();
    });

    btnToggleFullscreen.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch(e) {}
        settings.fullscreen = !settings.fullscreen;
        if (settings.fullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
                settings.fullscreen = false;
                updateOptionsUI();
            });
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
        updateOptionsUI();
        saveSettings();
    });

    btnToggleAnimations.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch(e) {}
        settings.reduceAnimations = !settings.reduceAnimations;
        applySettings();
        updateOptionsUI();
        saveSettings();
    });

    btnToggleContrast.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch(e) {}
        settings.highContrast = !settings.highContrast;
        applySettings();
        updateOptionsUI();
        saveSettings();
    });

    btnToggleMuteBlur.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch(e) {}
        settings.muteOnBlur = !settings.muteOnBlur;
        updateOptionsUI();
        saveSettings();
    });

    btnToggleFastMode.addEventListener('click', () => {
        try { AudioManager.uiClick(); } catch(e) {}
        settings.fastMode = !settings.fastMode;
        applySettings();
        updateOptionsUI();
        saveSettings();
    });

    sliderShake.addEventListener('input', (e) => {
        settings.shakeIntensity = parseInt(e.target.value);
        shakeVal.textContent = `${settings.shakeIntensity}%`;
        saveSettings();
    });

    // Manejo de Mute on Blur
    document.addEventListener('visibilitychange', () => {
        if (settings.muteOnBlur) {
            AudioManager.setMasterMute(document.hidden);
        }
    });

    if (selectLanguage) {
        selectLanguage.addEventListener('change', (e) => {
            settings.language = e.target.value;
            saveSettings();
            // Aplicar idioma al DOM y redesplegar UI dinámica
            I18n.setLang(settings.language);
            // Actualizar strings de toggles que dependen del idioma
            updateOptionsUI();
        });
    }

    // Aplicar idioma guardado al iniciar
    I18n.setLang(settings.language || 'es');

    // Re-render elementos dinámicos cuando cambia el idioma en medio de una partida
    document.addEventListener('languageChanged', () => {
        if (GameState.runStatus === 'active') {
            renderHeader(GameState);
            renderMeters(GameState);
            renderCards(GameState);
            renderPromises(GameState);
        }
        updateOptionsUI();
    });

    document.addEventListener('fullscreenchange', () => {
        settings.fullscreen = !!document.fullscreenElement;
        updateOptionsUI();
        saveSettings();
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
                setTimeout(() => showNewspaper(state, false, message), settings.fastMode ? 400 : 800);
                break;
            case 'won_role':
                AudioManager.ascend();
                eventOverlay.classList.add('hidden');
                showAscendScreen(state);
                break;
            case 'victory':
                AudioManager.victory();
                eventOverlay.classList.add('hidden');
                showNewspaper(state, true, I18n.tStr('ui.newspaper.victory_message', '¡Pasaste de candidato anónimo a Presidente de la Nación! La historia te juzgará... con algo de sarcasmo.'));
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

        const roleName = I18n.tStr(`game.roles.${cfg.id}.name`, cfg.name);
        document.getElementById('intro-role').textContent = roleName.toUpperCase();

        const introChar = document.getElementById('intro-character');
        if (ROLE_CHARACTERS[cfg.id]) {
            introChar.src = ROLE_CHARACTERS[cfg.id];
        }

        const _rounLabel = I18n.tStr('ui.intro.rounds_label', 'rondas');
        document.getElementById('intro-rounds').textContent = `${cfg.totalRounds} ${_rounLabel}`;
        document.getElementById('intro-threshold').textContent = `${cfg.minThreshold}%`;

        const listEl = document.getElementById('intro-meters-list');
        listEl.innerHTML = '';
        state.activeMeters.forEach(m => {
            const mName = I18n.tStr(`game.meters.${m.id}.name`, m.name);
            const li = document.createElement('li');
            li.innerHTML = `${m.icon || '📊'} ${mName}`;
            listEl.appendChild(li);
        });
        if (state.permanentMeter) {
            const pm = state.permanentMeter;
            const pmName = I18n.tStr(`game.perm_meters.${pm.id}.name`, pm.name);
            const _permLabel = I18n.tStr('ui.game.perm_label', '(Permanente)');
            const li = document.createElement('li');
            li.innerHTML = `<strong>${pm.icon || '★'} ${pmName} ${_permLabel}</strong>`;
            listEl.appendChild(li);
        }

        introOverlay.classList.remove('hidden');
    }

    // ────────────────────────────────────────────────────
    //   EVENTO ALEATORIO (tipo Reigns)
    // ────────────────────────────────────────────────────
    function showEventOverlay(ev) {
        const evTitle = I18n.tStr(`game.events.${ev.id}.title`, ev.title);
        const evDesc  = I18n.tStr(`game.events.${ev.id}.desc`,  ev.desc);
        document.getElementById('event-icon').textContent  = ev.icon;
        document.getElementById('event-title').textContent = evTitle;
        document.getElementById('event-desc').textContent  = evDesc;

        // Render mini-meters preview (Orden idéntico al juego: Activos y luego Permanente)
        const previewEl = document.getElementById('event-meters-preview');
        if (previewEl) {
            previewEl.innerHTML = '';
            const allMeters = [...GameState.activeMeters];
            if (GameState.permanentMeter) allMeters.push(GameState.permanentMeter);
            
            allMeters.forEach(m => {
                const val = Math.round(m.value);
                const isPerm = GameState.permanentMeter && m.id === GameState.permanentMeter.id;
                const status = getMeterStatus(val, isPerm);
                const mKey  = isPerm ? `game.perm_meters.${m.id}.name` : `game.meters.${m.id}.name`;
                const mName = I18n.tStr(mKey, m.name);
                
                const mini = document.createElement('div');
                mini.className = `event-mini-meter status-${status} ${isPerm ? 'is-perm' : ''}`;
                mini.innerHTML = `
                    <div class="mini-meta">
                        <span class="mini-icon">${m.icon || '📊'}</span>
                        <span class="mini-name">${mName.split(' ')[0]}</span>
                    </div>
                    <div class="mini-bar-wrap"><div class="mini-bar bar-${status}" style="width:${val}%"></div></div>
                    <span class="mini-val">${val}%</span>
                `;
                previewEl.appendChild(mini);
            });
        }

        function fillOption(el, opt, optKey) {
            const label = I18n.tStr(`game.events.${ev.id}.${optKey}_label`, opt.label);
            const hint  = I18n.tStr(`game.events.${ev.id}.${optKey}_hint`,  opt.hint);
            el.querySelector('.event-opt-label').textContent = label;
            el.querySelector('.event-opt-hint').textContent  = hint;
            const effectsEl = el.querySelector('.event-opt-effects');
            effectsEl.innerHTML = opt.effects.map(e => {
                const pos = e.amount >= 0;
                const mLocKey = e.meterId ? `game.meters.${e.meterId}.name` : null;
                const mLocKeyP = e.meterId ? `game.perm_meters.${e.meterId}.name` : null;
                const mName = (mLocKey && I18n.tStr(mLocKey, '') !== '')
                    ? I18n.tStr(mLocKey, e.meterName)
                    : (mLocKeyP ? I18n.tStr(mLocKeyP, e.meterName) : e.meterName);
                return `<span class="event-eff ${pos ? 'pos' : 'neg'}">${pos ? '▲' : '▼'} ${Math.abs(e.amount)}% ${mName}</span>`;
            }).join('');
            el.onclick = null; // reset
            el.addEventListener('click', () => {
                try { AudioManager.cardClick(); } catch (e) {}
                eventOverlay.classList.add('hidden');
                GameState.applyEventChoice(opt.effects);
            }, { once: true });
        }

        fillOption(eventOptA, ev.optA, 'optA');
        fillOption(eventOptB, ev.optB, 'optB');
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
            const _rLabel = p.roundsLeft !== 1
                ? I18n.tStr('ui.newspaper.promise_rounds_pl', 'rondas')
                : I18n.tStr('ui.newspaper.promise_rounds',    'ronda');
            tag.innerHTML = `
                <span class="promise-label">${p.label}</span>
                <span class="promise-rounds">${p.roundsLeft} ${_rLabel}</span>`;
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

        const fromName = I18n.tStr(`game.roles.${currentCfg.id}.name`, currentCfg.name);
        const toName   = I18n.tStr(`game.roles.${nextRole.id}.name`,   nextRole.name);
        document.getElementById('ascend-from-role').textContent = fromName.toUpperCase();
        document.getElementById('ascend-new-role').textContent = toName.toUpperCase();

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
        const intensity = (settings.shakeIntensity || 0) / 100;
        if (intensity <= 0) return;
        gameScreen.style.setProperty('--shake-intensity', intensity);
        gameScreen.classList.add('shake');
        setTimeout(() => gameScreen.classList.remove('shake'), settings.fastMode ? 250 : 500);
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
        const roleName = I18n.tStr(`game.roles.${cfg.id}.name`, cfg.name);
        roleEl.textContent = roleName;
        roleIconEl.textContent = ROLE_ICONS[cfg.id] || '🏛️';

        // Actualizar personaje
        if (charImg && ROLE_CHARACTERS[cfg.id]) {
            charImg.src = ROLE_CHARACTERS[cfg.id];
        }

        // Mostrar umbral mínimo
        const thresholdEl = document.getElementById('threshold-label');
        if (thresholdEl) thresholdEl.textContent = `${I18n.tStr('ui.game.threshold_label', 'Mínimo: {0}%').replace('{0}', cfg.minThreshold)}`;

        // Tooltips dinámicos del header
        const roleTooltip = document.getElementById('role-tooltip');
        const roundTooltip = document.getElementById('round-tooltip');
        const ttPre  = I18n.tStr('ui.tooltip.role_prefix',  'Eres');
        const ttSuf  = I18n.tStr('ui.tooltip.role_suffix',  '— supera el');
        const ttSuf2 = I18n.tStr('ui.tooltip.role_suffix2', '% en todos los medidores para avanzar al siguiente cargo');
        if (roleTooltip) roleTooltip.textContent = `${ttPre} ${roleName} ${ttSuf} ${cfg.minThreshold}${ttSuf2}`;
        const ttRnd  = I18n.tStr('ui.tooltip.round_prefix', 'Ronda');
        const ttOf   = I18n.tStr('ui.tooltip.round_of',     'de');
        const ttRSuf = I18n.tStr('ui.tooltip.round_suffix', '— completa todas las rondas manteniendo tus medidores por encima del mínimo');
        if (roundTooltip) roundTooltip.textContent = `${ttRnd} ${state.currentRound} ${ttOf} ${cfg.totalRounds} ${ttRSuf}`;

        roundPipsEl.innerHTML = '';
        for (let i = 1; i <= cfg.totalRounds; i++) {
            const pip = document.createElement('div');
            pip.className = 'round-pip';
            if (i < state.currentRound) pip.classList.add('done');
            if (i === state.currentRound) pip.classList.add('current');
            roundPipsEl.appendChild(pip);
        }
    }

    function flashScreen(type) {
        if (settings.reduceAnimations) return;
        const main = document.body;
        const cls = type === 'pos' ? 'flash-pos' : 'flash-neg';
        main.classList.remove('flash-pos', 'flash-neg');
        void main.offsetWidth;
        main.classList.add(cls);
        setTimeout(() => main.classList.remove(cls), 500);
    }

    function animateNumber(element, start, end, duration = 600) {
        if (!element) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = current + '%';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = end + '%';
            }
        };
        window.requestAnimationFrame(step);
    }

    function renderMeters(state) {
        const nowCritical = new Set();

        // ── 1. LIMPIAR MEDIDORES ACTIVOS (Actualizar o Crear) ──
        // Para evitar recrear todo y perder animaciones, solo borramos lo que no está en el estado
        const currentActiveIds = new Set(state.activeMeters.map(m => m.id));
        Array.from(metersEl.children).forEach(child => {
            if (!currentActiveIds.has(child.dataset.meterId)) child.remove();
        });

        state.activeMeters.forEach(m => {
            const val = Math.round(m.value);
            const status = getMeterStatus(val, false);
            if (status === 'crit') nowCritical.add(m.id);
            
            let card = metersEl.querySelector(`.meter-card[data-meter-id="${m.id}"]`);
            if (!card) {
                card = buildMeterCard(m, false);
                metersEl.appendChild(card);
            }

            // Actualizar visual del card
            updateMeterCardVisuals(card, m, val, status, false);

            // Efectos de cambio (Partículas + Animación de Número)
            if (prevMeterValues[m.id] !== undefined && prevMeterValues[m.id] !== val) {
                const startVal = prevMeterValues[m.id];
                const diff = val - startVal;
                
                spawnParticle(card, diff);
                const valEl = card.querySelector('.meter-value');
                animateNumber(valEl, startVal, val);

                if (diff < 0) {
                    shakeScreen(Math.abs(diff) > 15 ? 10 : 5);
                    flashScreen('neg');
                } else if (diff > 0) {
                    flashScreen('pos');
                }
            }
            prevMeterValues[m.id] = val;
        });

        // ── 2. MEDIDOR PERMANENTE ──
        if (state.permanentMeter) {
            const pm = state.permanentMeter;
            const val = Math.round(pm.value);
            const ps = getMeterStatus(val, true);
            if (ps === 'crit') nowCritical.add(pm.id);

            let card = permMeterEl.querySelector(`.meter-card[data-meter-id="${pm.id}"]`);
            if (!card) {
                permMeterEl.innerHTML = ''; // El permanente es único, limpiar viejo
                card = buildMeterCard(pm, true);
                permMeterEl.appendChild(card);
            }

            updateMeterCardVisuals(card, pm, val, ps, true);

            if (prevMeterValues[pm.id] !== undefined && prevMeterValues[pm.id] !== val) {
                const startVal = prevMeterValues[pm.id];
                const diff = val - startVal;
                spawnParticle(card, diff);
                const valEl = card.querySelector('.meter-value');
                animateNumber(valEl, startVal, val);

                if (diff < 0) shakeScreen(5);
            }
            prevMeterValues[pm.id] = val;
        } else {
            permMeterEl.innerHTML = '';
        }

        // Tocar alarma solo cuando un medidor ENTRA por primera vez en crítico
        for (const id of nowCritical) {
            if (!prevCritical.has(id)) { AudioManager.meterCritical(); break; }
        }
        prevCritical.clear();
        nowCritical.forEach(id => prevCritical.add(id));
    }

    function updateMeterCardVisuals(card, meter, val, status, isPerm) {
        card.className = `meter-card status-${status} ${status === 'crit' ? 'is-crit' : ''} ${isPerm ? 'is-perm' : ''}`;
        
        const fill = card.querySelector('.meter-fill');
        if (fill) {
            fill.className = isPerm ? 'meter-fill perm' : `meter-fill ${status}`;
            fill.style.width = `${val}%`;
        }
        
        const valEl = card.querySelector('.meter-value');
        if (valEl) {
            valEl.className = isPerm ? 'meter-value perm' : `meter-value ${status}`;
            // El texto se anima en renderMeters si hay cambio
        }
    }

    function spawnParticle(element, amount) {
        if (!element || amount === 0 || settings.reduceAnimations) return;
        const rect = element.getBoundingClientRect();
        const p = document.createElement('div');
        p.className = amount > 0 ? 'particle-pos' : 'particle-neg';
        p.textContent = (amount > 0 ? '+' : '') + amount;
        
        // Posición aleatoria ligera
        const offsetX = (Math.random() - 0.5) * 40;
        p.style.left = `${rect.left + rect.width / 2 + offsetX}px`;
        p.style.top = `${rect.top}px`;
        
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }

    function shakeScreen(force = 5) {
        if (settings.reduceAnimations) return;
        const intense = (settings.shakeIntensity || 100) / 100;
        if (intense <= 0) return;

        const main = document.getElementById('game-screen');
        if (!main) return;

        main.classList.remove('shake');
        void main.offsetWidth; // Trigger reflow
        main.classList.add('shake');
        
        // Ajustar intensidad si fuera necesario vía CSS variable (todo: implementar si se requiere más detalle)
        setTimeout(() => main.classList.remove('shake'), 400);
    }

    function buildMeterCard(meter, isPerm) {
        const val = Math.round(meter.value);
        const status = getMeterStatus(val, isPerm);
        const cfg = GameState.getCurrentRoleConfig();

        const card = document.createElement('div');
        card.className = `meter-card status-${status} ${status === 'crit' ? 'is-crit' : ''}`;
        card.dataset.meterId = meter.id; 
        if (isPerm) card.className += ' is-perm';

        const icon = meter.icon || '📊';
        // Traducir nombre y descripción del medidor
        const meterLocale = isPerm ? 'game.perm_meters.' : 'game.meters.';
        meter = {
            ...meter,
            name: I18n.tStr(`${meterLocale}${meter.id}.name`, meter.name),
            desc: I18n.tStr(`${meterLocale}${meter.id}.desc`, meter.desc || ''),
        };

        let fillClass = isPerm ? 'meter-fill perm' : `meter-fill ${status}`;
        let valClass = isPerm ? 'meter-value perm' : `meter-value ${status}`;

        const tooltipText = meter.desc || '';

        // ── Indicador de bono/penalidad de perfil activo ──
        let profileBadge = '';
        if (!isPerm && GameState.selectedProfile) {
            const bonus   = (GameState.selectedProfile.meterBonuses   || {})[meter.id] || 0;
            const penalty = (GameState.selectedProfile.meterPenalties || {})[meter.id] || 0;
            if (bonus > 0) {
                const ttBonus = I18n.tStr('ui.profile_badge.bonus_title', 'Bono de origen activo: +{0}%').replace('{0}', bonus);
                profileBadge = `<span class="profile-meter-badge bonus" title="${ttBonus}">${GameState.selectedProfile.icon}+${bonus}%</span>`;
            } else if (penalty > 0) {
                const ttMalus = I18n.tStr('ui.profile_badge.malus_title', 'Penalidad de origen: −{0}%').replace('{0}', penalty);
                profileBadge = `<span class="profile-meter-badge malus" title="${ttMalus}">${GameState.selectedProfile.icon}−${penalty}%</span>`;
            }
        }

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
                    ${profileBadge}
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

    function spawnParticles(sourceEl, eff, clickEvt = null) {
        const rect = sourceEl.getBoundingClientRect();
        // PRIORIDAD: Coordenada de click si existe, sino centro de la carta
        const startX = clickEvt ? clickEvt.clientX : rect.left + rect.width / 2;
        const startY = clickEvt ? clickEvt.clientY : rect.top + rect.height / 2;

        const meterEl = document.querySelector(`.meter-card[data-meter-id="${eff.meterId}"]`);
        if (!meterEl) return;
        const mRect = meterEl.getBoundingClientRect();
        const destX = mRect.left + mRect.width / 2;
        const destY = mRect.top + mRect.height / 2;

        // Aumentar a 50 partículas para mayor impacto
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            const isPos = eff.amount >= 0;
            p.className = `particle ${isPos ? 'pos' : 'neg'}`;
            p.textContent = isPos ? '+' : '-';
            p.style.left = `${startX}px`;
            p.style.top = `${startY}px`;
            // Un poco más grandes
            p.style.fontSize = `${16 + Math.random() * 14}px`;
            
            // Random offset spread
            const spread = 120;
            const dx = (destX - startX) + (Math.random() * spread - spread / 2);
            const dy = (destY - startY) + (Math.random() * spread - spread / 2);
            p.style.setProperty('--dx', `${dx}px`);
            p.style.setProperty('--dy', `${dy}px`);

            // Variabilidad en duración
            p.style.animationDelay = `${Math.random() * 0.5}s`;
            p.style.animationDuration = `${0.8 + Math.random() * 0.7}s`;

            document.body.appendChild(p);
            setTimeout(() => p.remove(), 1500);
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
            // Traducir título y descripción de la carta
            card = {
                ...card,
                title: I18n.tStr(`game.cards.${card.id}.title`, card.title),
                desc:  I18n.tStr(`game.cards.${card.id}.desc`,  card.desc),
            };
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

            const _promiseBadgeTmpl = I18n.tStr('ui.newspaper.promise_badge', '⏳ PROMESA — vence en');
            const _rondaLabel = card.promise && card.promise.roundsLeft !== 1
                ? I18n.tStr('ui.newspaper.promise_rounds_pl', 'rondas')
                : I18n.tStr('ui.newspaper.promise_rounds',    'ronda');
            const promiseBadge = card.isPromise && card.promise
                ? `<div class="promise-badge">${_promiseBadgeTmpl} ${card.promise.roundsLeft} ${_rondaLabel}</div>`
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

            el.addEventListener('click', (clickEvt) => {
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

                // Spawn Particles (Pasar el evento de mouse para origen exacto)
                card.effects.forEach(eff => {
                    spawnParticles(el, eff, clickEvt);
                });

                setTimeout(() => {
                    el.classList.remove('squash-active');
                    el.classList.add('selected');
                    cardsEl.querySelectorAll('.decision-card').forEach(c => {
                        if (c !== el) {
                            c.classList.add('rejected');
                        }
                    });
                }, settings.fastMode ? 50 : 100);

                setTimeout(() => {
                    GameState.applyCardEffects(card.effects, card.promise || null);
                    cardsEl.dataset.locked = 'false';
                }, settings.fastMode ? 400 : 900);
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

    const ENDING_ICONS = { estadista: '🏛️', caudillo: '📣', oligarca: '🕸️', dictador: '🛡️' };
    const ENDING_NAMES = { estadista: 'ESTADISTA', caudillo: 'CAUDILLO', oligarca: 'OLIGARCA', dictador: 'DICTADOR' };

    function showLeaderboard(highlightToday) {
        const history = GameState.getDailyHistory();
        const todayPlayed = !GameState.canPlayDaily();

        // Caja "ya jugaste hoy"
        leaderboardTodayBox.classList.toggle('hidden', !todayPlayed);
        const _defeatLabel = I18n.tStr('ui.leaderboard.defeat', '💀 Derrota');
        if (todayPlayed && history.length > 0) {
            const t = history[0];
            const endingName = t.ending ? I18n.tStr(`newspaper.ending_names.${t.ending}`, ENDING_NAMES[t.ending]) : null;
            const endingLabel = endingName ? `${ENDING_ICONS[t.ending]} ${endingName}` : _defeatLabel;
            document.getElementById('leaderboard-today-score').textContent = `${t.score.toLocaleString('es-CL')} pts`;
            document.getElementById('leaderboard-today-meta').textContent = `${endingLabel} · ${t.cargoName}`;
        }

        // Bloquear botón diario si ya jugó hoy
        btnDaily.textContent = todayPlayed
            ? I18n.tStr('ui.start.btn_daily_played', '📅 YA JUGASTE HOY')
            : I18n.tStr('ui.start.btn_daily',        '📅 DESAFÍO DIARIO');
        btnDaily.style.opacity = todayPlayed ? '0.55' : '';

        // Tabla
        leaderboardBody.innerHTML = '';
        if (history.length === 0) {
            leaderboardEmpty.classList.remove('hidden');
        } else {
            leaderboardEmpty.classList.add('hidden');
            history.forEach((entry, i) => {
                const endingName = entry.ending ? I18n.tStr(`newspaper.ending_names.${entry.ending}`, ENDING_NAMES[entry.ending]) : null;
                const endingLabel = endingName ? `${ENDING_ICONS[entry.ending]} ${endingName}` : _defeatLabel;
                const tr = document.createElement('tr');
                if (i === 0 && todayPlayed) tr.classList.add('leaderboard-today-row');
                tr.innerHTML = `
                    <td>${entry.date}</td>
                    <td class="lb-score">${entry.score.toLocaleString('es-CL')}</td>
                    <td>${endingLabel}</td>
                    <td>${entry.cargoName}</td>`;
                leaderboardBody.appendChild(tr);
            });
        }

        if (highlightToday) leaderboardTodayBox.classList.remove('hidden');
        leaderboardOverlay.classList.remove('hidden');
    }

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
        const _caption = I18n.tStr(`newspaper.roles.${cfg.id}.caption`, roleMeta.caption);
        if (captionEl) captionEl.textContent = _caption;
        const sectionEl = document.getElementById('paper-section-label');
        const _section  = I18n.tStr(`newspaper.roles.${cfg.id}.section`, roleMeta.section);
        const _flagPfx  = I18n.tStr('ui.newspaper.section_flag_prefix', '⚠ ');
        if (sectionEl) sectionEl.textContent = isWin ? _section : _flagPfx + _section;

        // Fecha y edición
        document.getElementById('paper-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        document.getElementById('paper-edition').textContent = `Edición Nº ${Math.floor(Math.random() * 9000) + 1000}`;

        // Precio ficticio
        const priceEl = document.getElementById('paper-price');
        if (priceEl) priceEl.textContent = `$${(Math.random() * 3 + 1).toFixed(2)}`;

        // Titular
        const _roleKey    = `${cfg.id}_${isWin ? 'win' : 'loss'}`;
        const headlinesLoc = I18n.t(`newspaper.headlines.${_roleKey}`);
        const roleData    = NEWSPAPER[cfg.id] || NEWSPAPER['candidato'];
        const headlinesPool = Array.isArray(headlinesLoc)
            ? headlinesLoc
            : (isWin ? roleData.win.headlines : roleData.loss.headlines);

        if (state.runStatus === 'victory') {
            headlineEl.textContent = I18n.tStr('newspaper.headlines.victory', '¡PRESIDENTE ELECTO!');
        } else {
            headlineEl.textContent = headlinesPool[Math.floor(Math.random() * headlinesPool.length)];
        }

        // Subtítulo del cargo (Y motivo de derrota si aplica)
        const _roleName     = I18n.tStr(`game.roles.${cfg.id}.name`, cfg.name);
        const _roundOf      = I18n.tStr('ui.newspaper.round_of', 'de');
        const _threshLabel  = I18n.tStr('ui.newspaper.threshold_label', 'Umbral mínimo:');
        if (customMessage) {
            const prefix = isWin
                ? I18n.tStr('ui.newspaper.news_prefix_win',  'NOTICIA DE ÚLTIMA HORA')
                : I18n.tStr('ui.newspaper.news_prefix_loss', 'MOTIVO DE LA CAÍDA');
            subheadEl.innerHTML = `<strong>${prefix}: ${customMessage}</strong><br>${_roleName} — Ronda ${state.currentRound} ${_roundOf} ${cfg.totalRounds}`;
        } else {
            subheadEl.textContent = `${_roleName} — Ronda ${state.currentRound} ${_roundOf} ${cfg.totalRounds} — ${_threshLabel} ${cfg.minThreshold}%`;
        }

        // Cuerpo del artículo principal
        const articlesLoc  = I18n.t(`newspaper.articles.${_roleKey}`);
        const articlesPool = Array.isArray(articlesLoc)
            ? articlesLoc
            : (isWin ? roleData.win.articles : roleData.loss.articles);
        const quotePoolLoc = I18n.t(isWin ? 'game.win_quotes' : 'game.loss_quotes');
        const quotePool    = Array.isArray(quotePoolLoc)
            ? quotePoolLoc
            : (isWin ? WIN_QUOTES : LOSS_QUOTES);

        textEl.textContent = articlesPool[Math.floor(Math.random() * articlesPool.length)];

        // Cita
        const quoteEl = document.getElementById('news-quote');
        if (quoteEl) {
            quoteEl.textContent = quotePool[Math.floor(Math.random() * quotePool.length)];
        }

        // Columna lateral — titulares aleatorios más variados
        const sidebarEl = document.getElementById('news-sidebar');
        if (sidebarEl) {
            const othersLoc = I18n.t('newspaper.other_headlines');
            const othersPool = Array.isArray(othersLoc) ? othersLoc : OTROS_TITULARES;
            const shuffledSide = [...othersPool].sort(() => 0.5 - Math.random());
            sidebarEl.innerHTML = shuffledSide.slice(0, 4).map(h => `<div class="sidebar-item">${h}</div>`).join('');
        }

        // Avisos Clasificados
        const rightCol = document.querySelector('.paper-col-right');
        if (rightCol) {
            const existingAds = rightCol.querySelectorAll('.paper-ad');
            existingAds.forEach(ad => ad.remove());

            const adsLoc = I18n.t('newspaper.ads');
            const adsPool = Array.isArray(adsLoc) ? adsLoc : AVISOS_CLASIFICADOS;
            const shuffledAds = [...adsPool].sort(() => 0.5 - Math.random());
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
            const mKey  = isPerm ? `game.perm_meters.${m.id}.name` : `game.meters.${m.id}.name`;
            const mName = I18n.tStr(mKey, m.name);

            const li = document.createElement('li');
            li.className = 'stat-' + status;
            li.innerHTML = `
                <span class="stat-name">${m.icon || '📊'} ${mName}</span>
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
            const ending  = VICTORY_ENDINGS[profile];
            const eTitle   = I18n.tStr(`newspaper.endings.${profile}.title`,    ending.title);
            const eHeadline= I18n.tStr(`newspaper.endings.${profile}.headline`, ending.headline);
            const eArticle = I18n.tStr(`newspaper.endings.${profile}.article`,  ending.article);
            const eQuote   = I18n.tStr(`newspaper.endings.${profile}.quote`,    ending.quote);
            endingBar.classList.remove('hidden');
            endingBar.dataset.profile = profile;
            endingIcon.textContent  = ending.icon;
            endingLabel.textContent = `${eTitle} — ${eHeadline}`;
            // Sobreescribir artículo con el artículo del final narrativo
            textEl.textContent     = eArticle;
            headlineEl.textContent = eHeadline;
            const quoteEl = document.getElementById('news-quote');
            if (quoteEl) quoteEl.textContent = eQuote;
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
                        btnCopySeed.textContent = I18n.tStr('ui.newspaper.btn_copy_seed_ok', '✅ Copiado');
                        setTimeout(() => { btnCopySeed.textContent = I18n.tStr('ui.newspaper.btn_copy_seed', '📋 Copiar'); }, 2000);
                    });
                };
            }
        }

        // ── Diario label ──
        if (state.isDailyChallenge) {
            const edEl = document.getElementById('paper-edition');
            if (edEl) edEl.textContent = I18n.tStr('ui.newspaper.daily_edition', '📅 DESAFÍO DIARIO');
        }

        // ── Score diario (solo al terminar la carrera, no entre cargos) ──
        const dailyScoreSection = document.getElementById('daily-score-section');
        const isEndOfRun = state.runStatus === 'victory' || state.runStatus === 'game_over';
        if (state.isDailyChallenge && isEndOfRun && dailyScoreSection) {
            const result = GameState.saveDailyResult();
            const score = result.score;
            const endingName  = result.ending ? I18n.tStr(`newspaper.ending_names.${result.ending}`, ENDING_NAMES[result.ending]) : null;
            const endingLabel = endingName
                ? `${ENDING_ICONS[result.ending]} ${endingName}`
                : I18n.tStr('ui.leaderboard.defeat', '💀 Derrota');

            document.getElementById('daily-score-number').textContent = `${score.toLocaleString('es-CL')} pts`;
            document.getElementById('daily-score-label').textContent =
                `${endingLabel} · ${I18n.tStr('ui.newspaper.share_role', 'Cargo:')} ${result.cargoName}`;

            // Texto para compartir
            const today2 = new Date();
            const dateShare = `${today2.getDate().toString().padStart(2,'0')}/${(today2.getMonth()+1).toString().padStart(2,'0')}/${today2.getFullYear()}`;
            const _shareHeader    = I18n.tStr('ui.newspaper.share_header',    '🏛️ CARRERA PRESIDENCIAL — Desafío');
            const _shareEnding    = I18n.tStr('ui.newspaper.share_ending',    'Final:');
            const _shareRole      = I18n.tStr('ui.newspaper.share_role',      'Cargo:');
            const _shareScore     = I18n.tStr('ui.newspaper.share_score',     'Puntaje:');
            const _shareChallenge = I18n.tStr('ui.newspaper.share_challenge', '¿Me superas?');
            const shareText = `${_shareHeader} ${dateShare}\n${_shareEnding} ${endingLabel} · ${_shareRole} ${result.cargoName}\n${_shareScore} ${score.toLocaleString('es-CL')} pts\n${_shareChallenge}`;
            const shareEl = document.getElementById('daily-share-text');
            if (shareEl) shareEl.textContent = shareText;

            const btnCopyShare = document.getElementById('btn-copy-share');
            if (btnCopyShare) {
                btnCopyShare.onclick = () => {
                    navigator.clipboard.writeText(shareText).then(() => {
                        btnCopyShare.textContent = I18n.tStr('ui.newspaper.btn_copy_share_ok', '✅ ¡Copiado!');
                        setTimeout(() => { btnCopyShare.textContent = I18n.tStr('ui.newspaper.btn_copy_share', '📋 Copiar resultado'); }, 2000);
                    });
                };
            }

            dailyScoreSection.classList.remove('hidden');

            // Actualizar botón diario en start screen
            btnDaily.textContent = I18n.tStr('ui.start.btn_daily_played', '📅 YA JUGASTE HOY');
            btnDaily.style.opacity = '0.55';
        } else if (dailyScoreSection) {
            dailyScoreSection.classList.add('hidden');
        }

        // Botón
        if (isEndOfRun) {
            btnContinue.textContent = I18n.tStr('ui.newspaper.btn_new_run',    '🗳️ NUEVA CARRERA');
        } else {
            btnContinue.textContent = I18n.tStr('ui.newspaper.btn_accept_role','🏛️ ACEPTAR CARGO →');
        }
    }

});
