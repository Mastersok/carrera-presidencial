/**
 * UI.JS v3.0 — Controlador de la Interfaz
 * Semáforo dinámico por umbral de cargo, animaciones lentas, periódico premium
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── Referencias al DOM ──────────────────────────────
    const roleEl        = document.getElementById('current-role');
    const roleIconEl    = document.getElementById('role-icon');
    const roundPipsEl   = document.getElementById('round-pips');
    const metersEl      = document.getElementById('active-meters');
    const permMeterEl   = document.getElementById('permanent-meter');
    const cardsEl       = document.getElementById('cards-container');
    const gameScreen    = document.getElementById('game-screen');
    const startScreen   = document.getElementById('start-screen');
    const btnPlay       = document.getElementById('btn-play');
    const charImg       = document.getElementById('role-character');

    // Periódico
    const overlay       = document.getElementById('newspaper-overlay');
    const headlineEl    = document.getElementById('news-headline');
    const subheadEl     = document.getElementById('news-subhead');
    const textEl        = document.getElementById('news-text');
    const statsEl       = document.getElementById('news-stats');
    const btnContinue   = document.getElementById('btn-continue');

    const ROLE_ICONS = {
        candidato:  '🗳️',
        alcalde:    '🏙️',
        diputado:   '📜',
        senador:    '🏛️',
        presidente: '👑'
    };

    const ROLE_CHARACTERS = {
        candidato:  'img/char_candidato.png.jpg',
        alcalde:    'img/char_alcalde.png.jpg',
        diputado:   'img/char_diputado.png.jpg',
        senador:    'img/char_senador.png.jpg',
        presidente: 'img/char_presidente.png.jpg'
    };

    // ── Pantalla de inicio ──────────────────────────────
    btnPlay.addEventListener('click', () => {
        startScreen.style.animation = 'fade-out 0.4s ease forwards';
        setTimeout(() => {
            startScreen.style.display = 'none';
            gameScreen.classList.remove('hidden');
            GameState.startNewRun();
        }, 400);
    });

    // ── Escuchar eventos del Engine ──────────────────────
    document.addEventListener('gameStateUpdate', ({ detail }) => {
        const { type, state, message } = detail;

        switch (type) {
            case 'role_started':
                renderHeader(state);
                renderMeters(state);
                renderCards(state);
                break;
            case 'next_round':
                renderHeader(state);
                renderMeters(state);
                if (state.runStatus === 'active') renderCards(state);
                break;
            case 'effects_applied':
                renderHeader(state);
                renderMeters(state);
                flashScreen();
                if (state.runStatus === 'active') renderCards(state);
                break;
            case 'game_over':
                renderHeader(state);
                renderMeters(state);
                shakeScreen();
                setTimeout(() => showNewspaper(state, false, message), 800);
                break;
            case 'won_role':
                showNewspaper(state, true, null);
                break;
            case 'victory':
                showNewspaper(state, true, '¡Has completado la Carrera Presidencial! Pasaste de candidato anónimo a Presidente de la nación. La historia te juzgará.');
                break;
        }
    });

    // ── Botón Continuar del periódico ───────────────────
    btnContinue.addEventListener('click', () => {
        overlay.classList.add('hidden');
        if (GameState.runStatus === 'game_over' || GameState.runStatus === 'victory') {
            GameState.startNewRun();
        } else if (GameState.runStatus === 'won_role') {
            GameState.advanceToNextRole();
        }
    });

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

        if (val < dangerZone)  return 'crit';
        if (val < threshold)   return 'warn';
        return 'safe';
    }

    // ────────────────────────────────────────────────────
    //   RENDERERS
    // ────────────────────────────────────────────────────

    function renderHeader(state) {
        const cfg = state.getCurrentRoleConfig();
        roleEl.textContent      = cfg.name;
        roleIconEl.textContent  = ROLE_ICONS[cfg.id] || '🏛️';

        // Actualizar personaje
        if (charImg && ROLE_CHARACTERS[cfg.id]) {
            charImg.src = ROLE_CHARACTERS[cfg.id];
        }

        // Mostrar umbral mínimo
        const thresholdEl = document.getElementById('threshold-label');
        if (thresholdEl) thresholdEl.textContent = `Mínimo: ${cfg.minThreshold}%`;

        roundPipsEl.innerHTML = '';
        for (let i = 1; i <= cfg.totalRounds; i++) {
            const pip = document.createElement('div');
            pip.className = 'round-pip';
            if (i < state.currentRound)  pip.classList.add('done');
            if (i === state.currentRound) pip.classList.add('current');
            roundPipsEl.appendChild(pip);
        }
    }

    function renderMeters(state) {
        metersEl.innerHTML = '';
        state.activeMeters.forEach(m => {
            metersEl.appendChild(buildMeterCard(m, false));
        });

        permMeterEl.innerHTML = '';
        if (state.permanentMeter) {
            permMeterEl.appendChild(buildMeterCard(state.permanentMeter, true));
        }
    }

    function buildMeterCard(meter, isPerm) {
        const val = Math.round(meter.value);
        const status = getMeterStatus(val, isPerm);
        const cfg = GameState.getCurrentRoleConfig();

        const card = document.createElement('div');
        card.className = `meter-card is-${status}`;
        if (isPerm) card.className = 'meter-card is-perm';

        const icon = meter.icon || '📊';

        let fillClass = isPerm ? 'meter-fill perm' : `meter-fill ${status}`;
        let valClass  = isPerm ? 'meter-value perm' : `meter-value ${status}`;

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
                ${thresholdMarker}
            </div>
            <div class="meter-tooltip">${tooltipText}</div>
        `;
        return card;
    }

    function renderCards(state) {
        cardsEl.innerHTML = '';
        const options = CardGenerator.generateCardsForTurn(state.activeMeters, state.permanentMeter, 3);

        options.forEach((card, idx) => {
            const el = document.createElement('div');
            el.className = 'decision-card';
            el.style.animationDelay = `${idx * 0.15}s`;

            // Efectos HTML
            let effectsHTML = '';
            card.effects.forEach(eff => {
                const pos   = eff.amount >= 0;
                const cls   = pos ? 'effect-pos' : 'effect-neg';
                const sign  = pos ? '+' : '';
                const arrow = pos ? '▲' : '▼';
                effectsHTML += `<div class="effect-row ${cls}">
                    <span class="effect-arrow">${arrow}</span>
                    <span>${sign}${eff.amount}% ${eff.meterName}</span>
                </div>`;
            });

            el.innerHTML = `
                <div class="card-header">
                    <span class="card-number">${idx + 1}</span>
                </div>
                <div class="card-body">
                    <div class="card-title">${card.title}</div>
                    <div class="card-desc">${card.desc}</div>
                </div>
                <div class="card-effects">${effectsHTML}</div>
            `;

            el.addEventListener('click', () => {
                // Impedir doble click
                if (cardsEl.dataset.locked === 'true') return;
                cardsEl.dataset.locked = 'true';

                // Animación de selección LENTA
                el.classList.add('selected');
                cardsEl.querySelectorAll('.decision-card').forEach(c => {
                    if (c !== el) c.classList.add('rejected');
                });

                // Esperar 900ms para que se vea la animación
                setTimeout(() => {
                    cardsEl.dataset.locked = 'false';
                    GameState.applyCardEffects(card.effects);
                }, 900);
            });

            cardsEl.appendChild(el);
        });
    }

    // ────────────────────────────────────────────────────
    //   PERIÓDICO
    // ────────────────────────────────────────────────────

    const WIN_HEADLINES = [
        '¡VICTORIA CONTUNDENTE!',
        'ASCENSO CONFIRMADO',
        'EL PUEBLO HA HABLADO',
        'TRIUNFO POLÍTICO ROTUNDO',
        'OVACIÓN POPULAR',
    ];
    const LOSS_HEADLINES = [
        'ESCÁNDALO Y CAÍDA',
        'DERROTA APLASTANTE',
        'FIN DE UNA ERA',
        'CRISIS TERMINAL',
        'DESASTRE POLÍTICO',
        'RENUNCIA FORZADA',
    ];
    const WIN_SUBTEXTS = [
        'Los analistas coinciden: la gestión fue sólida y el pueblo premió la constancia.',
        'Fuentes cercanas al gobierno afirman que el ascenso era "cuestión de tiempo".',
        'La oposición reconoce a regañadientes una victoria limpia.',
        '"Era el candidato que necesitábamos", declaró un portavoz del partido oficialista.',
    ];
    const LOSS_SUBTEXTS = [
        'Observadores internacionales calificaron la gestión como "un ejemplo de lo que no se debe hacer".',
        'El partido ya busca sucesor tras lo que denominaron "un fracaso sin precedentes".',
        '"Los números no mienten", sentenció el editorial del día siguiente.',
        'Analistas políticos coinciden: las señales de alarma fueron ignoradas hasta el colapso.',
    ];
    const WIN_QUOTES = [
        '«Demostramos que se puede gobernar con responsabilidad y obtener resultados.»',
        '«Este ascenso es del pueblo, yo solo fui el instrumento.»',
        '«La democracia funciona cuando los ciudadanos premian la buena gestión.»',
    ];
    const LOSS_QUOTES = [
        '«Asumo toda la responsabilidad por los errores cometidos.»',
        '«Las circunstancias fueron adversas, pero reconozco mi derrota.»',
        '«El pueblo ha decidido, y respeto su veredicto.»',
    ];

    function showNewspaper(state, isWin, customMessage) {
        overlay.classList.remove('hidden');
        const cfg = state.getCurrentRoleConfig();
        const today = new Date();
        const dateStr = today.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Resultado visual
        const paperEl = document.getElementById('newspaper-paper');
        paperEl.className = isWin ? 'paper-win' : 'paper-loss';

        // Fecha y edición
        document.getElementById('paper-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        document.getElementById('paper-edition').textContent = `Edición Nº ${Math.floor(Math.random() * 9000) + 1000}`;

        // Precio ficticio
        const priceEl = document.getElementById('paper-price');
        if (priceEl) priceEl.textContent = `$${(Math.random() * 3 + 1).toFixed(2)}`;

        // Titular
        if (state.runStatus === 'victory') {
            headlineEl.textContent = '¡PRESIDENTE ELECTO!';
        } else {
            const pool = isWin ? WIN_HEADLINES : LOSS_HEADLINES;
            headlineEl.textContent = pool[Math.floor(Math.random() * pool.length)];
        }

        // Subtítulo del cargo
        subheadEl.textContent = `${cfg.name} — Ronda ${state.currentRound} de ${cfg.totalRounds} — Umbral mínimo: ${cfg.minThreshold}%`;

        // Cuerpo del artículo principal
        const subtextPool = isWin ? WIN_SUBTEXTS : LOSS_SUBTEXTS;
        const quotePool   = isWin ? WIN_QUOTES : LOSS_QUOTES;

        let articleBody = '';
        if (customMessage) {
            articleBody = customMessage;
        } else {
            articleBody = subtextPool[Math.floor(Math.random() * subtextPool.length)];
        }
        textEl.textContent = articleBody;

        // Cita
        const quoteEl = document.getElementById('news-quote');
        if (quoteEl) {
            quoteEl.textContent = quotePool[Math.floor(Math.random() * quotePool.length)];
        }

        // Columna lateral
        const sidebarEl = document.getElementById('news-sidebar');
        if (sidebarEl) {
            const sideHeadlines = [
                'Mercados reaccionan con volatilidad ante cambio de liderazgo',
                'Organizaciones civiles exigen mayor transparencia',
                'Encuestas muestran división en la opinión pública',
                'El congreso prepara sesión extraordinaria',
                'Analistas debaten el futuro del proyecto político',
                'Protestas programadas para el fin de semana',
            ];
            // Elegir 3 titulares aleatorios
            const shuffled = [...sideHeadlines].sort(() => 0.5 - Math.random());
            sidebarEl.innerHTML = shuffled.slice(0, 3).map(h => `<div class="sidebar-item">${h}</div>`).join('');
        }

        // Stats con semáforo basado en umbral
        statsEl.innerHTML = '';
        const allMeters = [...state.activeMeters];
        if (state.permanentMeter) allMeters.push(state.permanentMeter);

        allMeters.forEach((m, idx) => {
            const val = Math.round(m.value);
            const isPerm = state.permanentMeter && m.id === state.permanentMeter.id;
            const status = getMeterStatus(val, isPerm);

            let statusClass = 'stat-' + status;

            const li = document.createElement('li');
            li.className = statusClass;
            li.innerHTML = `
                <span class="stat-name">${m.icon || '📊'} ${m.name}</span>
                <span class="stat-bar-wrap">
                    <span class="stat-bar" style="width:${val}%"></span>
                </span>
                <span class="stat-val">${val}%</span>
            `;
            statsEl.appendChild(li);
        });

        // Botón
        if (state.runStatus === 'victory' || state.runStatus === 'game_over') {
            btnContinue.textContent = '🗳️ NUEVA CARRERA';
        } else {
            btnContinue.textContent = '🏛️ ACEPTAR CARGO →';
        }
    }
});
