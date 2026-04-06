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

    // Pantalla de ascenso
    const ascendOverlay = document.getElementById('ascend-overlay');
    const btnAscend     = document.getElementById('btn-ascend-continue');
    let   pendingState  = null;

    // Tracking de medidores en zona crítica (para no repetir alarma)
    const prevCritical = new Set();

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
    btnPlay.addEventListener('click', async () => {
        await AudioManager.init();
        AudioManager.startGame();
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
                AudioManager.newRound();
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
                AudioManager.gameOver();
                renderHeader(state);
                renderMeters(state);
                shakeScreen();
                setTimeout(() => showNewspaper(state, false, message), 800);
                break;
            case 'won_role':
                AudioManager.ascend();
                showAscendScreen(state);
                break;
            case 'victory':
                AudioManager.victory();
                showNewspaper(state, true, '¡Has completado la Carrera Presidencial! Pasaste de candidato anónimo a Presidente de la nación. La historia te juzgará.');
                break;
        }
    });

    // ── Botón de la pantalla de ascenso ─────────────────
    btnAscend.addEventListener('click', () => {
        AudioManager.uiClick();
        ascendOverlay.classList.add('hidden');
        showNewspaper(pendingState, true, null);
    });

    // ── Botón Continuar del periódico ───────────────────
    btnContinue.addEventListener('click', () => {
        AudioManager.uiClick();
        overlay.classList.add('hidden');
        if (GameState.runStatus === 'game_over' || GameState.runStatus === 'victory') {
            GameState.startNewRun();
        } else if (GameState.runStatus === 'won_role') {
            GameState.advanceToNextRole();
        }
    });

    // ────────────────────────────────────────────────────
    //   PANTALLA DE ASCENSO
    // ────────────────────────────────────────────────────
    function showAscendScreen(state) {
        pendingState = state;
        const currentCfg = state.getCurrentRoleConfig();
        const nextRole   = ROLES[state.roleIndex + 1];

        document.getElementById('ascend-from-role').textContent = currentCfg.name.toUpperCase();
        document.getElementById('ascend-new-role').textContent  = nextRole.name.toUpperCase();

        const ascendChar = document.getElementById('ascend-character');
        ascendChar.src = ROLE_CHARACTERS[nextRole.id] || '';

        // Generar confetti
        const confettiEl = document.getElementById('ascend-confetti');
        confettiEl.innerHTML = '';
        const colors = ['#f5c518','#e63946','#2dc653','#ff9f1c','#fdf6e3'];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left     = Math.random() * 100 + 'vw';
            piece.style.width    = (8 + Math.random() * 8) + 'px';
            piece.style.height   = (10 + Math.random() * 10) + 'px';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration  = (1.5 + Math.random() * 2) + 's';
            piece.style.animationDelay     = (Math.random() * 1.5) + 's';
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

        // Tooltips dinámicos del header
        const roleTooltip  = document.getElementById('role-tooltip');
        const roundTooltip = document.getElementById('round-tooltip');
        if (roleTooltip)  roleTooltip.textContent  = `Eres ${cfg.name} — supera el ${cfg.minThreshold}% en todos los medidores para avanzar al siguiente cargo`;
        if (roundTooltip) roundTooltip.textContent = `Ronda ${state.currentRound} de ${cfg.totalRounds} — completa todas las rondas manteniendo tus medidores por encima del mínimo`;

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

            el.addEventListener('mouseenter', () => AudioManager.cardHover());

            el.addEventListener('click', () => {
                // Impedir doble click
                if (cardsEl.dataset.locked === 'true') return;
                cardsEl.dataset.locked = 'true';

                try { AudioManager.cardClick(); } catch(e) {}

                // Animación de selección LENTA
                el.classList.add('selected');
                cardsEl.querySelectorAll('.decision-card').forEach(c => {
                    if (c !== el) {
                        c.classList.add('rejected');
                        try { AudioManager.cardReject(); } catch(e) {}
                    }
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
        'Los analistas políticos coinciden en que la gestión fue sólida, coherente y orientada al bien común. Rara vez se observa en la arena política un desempeño tan consistente a lo largo de todas las etapas del mandato. El ciudadano de a pie, consultado en las afueras del palacio municipal, resumió el sentir general: "Por fin alguien que cumple lo que promete". Las encuestas de satisfacción cerraron en niveles históricos, y los indicadores sociales reflejan una mejora tangible en la calidad de vida de la población.',
        'Fuentes cercanas al gobierno afirman que el ascenso era "cuestión de tiempo". La combinación de decisiones estratégicas, alianzas bien construidas y una comunicación honesta con la ciudadanía creó las condiciones para un resultado que muy pocos se atrevieron a cuestionar. El partido oficialista celebró con mesura, consciente de que los desafíos del próximo cargo serán aún mayores. La oposición, por su parte, reconoció a regañadientes que la victoria fue limpia y merecida.',
        'La oposición reconoce, aunque con dificultad, una victoria que no deja lugar a dudas. Los números finales del mandato hablan por sí solos: medidores saneados, estabilidad institucional y una ciudadanía que recuperó la confianza en sus representantes. Varios líderes de partidos contrarios llamaron a la reflexión interna y plantearon la necesidad de renovar sus propias propuestas ante una figura que demostró que gobernar bien es posible.',
        '"Era el candidato que necesitábamos en este momento de la historia", declaró en primicia un portavoz del partido oficialista ante los medios reunidos en la sede central. La jornada concluyó con aplausos espontáneos en la Plaza Mayor, donde cientos de ciudadanos se congregaron para celebrar un resultado que marca un antes y un después en la carrera política nacional. Los corresponsales extranjeros destacaron la madurez del proceso democrático.',
        'Tras meses de decisiones difíciles y presiones constantes, los resultados finales confirman que la apuesta por la transparencia y el trabajo silencioso rindió sus frutos. Los organismos de fiscalización destacaron la ausencia de irregularidades durante todo el período, un dato que contrasta favorablemente con administraciones anteriores. "Este es el tipo de liderazgo que el país necesita para avanzar", publicó en su editorial el prestigioso semanario político.',
    ];
    const LOSS_SUBTEXTS = [
        'Observadores internacionales calificaron la gestión como "un ejemplo de lo que no se debe hacer en política pública". Los indicadores colapsaron semana a semana, y las advertencias tempranas fueron ignoradas sistemáticamente. El partido ya busca un sucesor tras lo que denominaron internamente "un fracaso sin precedentes en la historia reciente de la institución". Fuentes anónimas dentro del gobierno admitieron que los errores de cálculo comenzaron mucho antes de que fueran visibles para la opinión pública.',
        'El partido ya busca sucesor tras lo que denominaron "un fracaso sin precedentes". Las actas internas revelan que hubo múltiples instancias en que se pudo corregir el rumbo, pero la falta de voluntad política y la soberbia institucional impidieron cualquier rectificación a tiempo. Analistas de reconocido prestigio señalaron que la caída fue predecible desde el primer trimestre del mandato. El daño a la imagen institucional tardará años en repararse, según advierten los expertos.',
        '"Los números no mienten", sentenció el editorial del día siguiente, publicado en primera plana con letras de cuerpo 72. El balance final del mandato muestra medidores en rojo, ciudadanía desencantada y una institucionalidad debilitada que deberá ser reconstruida desde los cimientos. Varios funcionarios presentaron su renuncia antes del cierre oficial, distanciándose de una administración que no supo leer las señales del entorno ni responder a las necesidades reales de la población.',
        'Analistas políticos coinciden: las señales de alarma fueron ignoradas hasta el colapso final. Desde los primeros meses del mandato, los indicadores mostraban una tendencia preocupante que nadie en el círculo íntimo quiso reconocer públicamente. La negación sistemática de la realidad, combinada con decisiones que priorizaron intereses sectoriales por sobre el bien común, llevó a un desenlace que muchos ciudadanos vivieron con una mezcla de tristeza e indignación. La historia juzgará con dureza este período.',
        'Lo que comenzó con promesas de cambio terminó en una gestión que defraudó a propios y extraños. Los archivos del período muestran una sucesión de oportunidades perdidas, negociaciones fallidas y recursos mal administrados. La ciudadanía, cansada de justificaciones y excusas, expresó su veredicto con claridad. "No es que las circunstancias fueran difíciles", escribió un conocido columnista político, "es que nunca hubo un plan real para enfrentarlas".',
    ];
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
        candidato:  { img: 'img/char_candidato.png.jpg',  section: 'CAMPAÑA ELECTORAL',            caption: 'El candidato durante la campaña en terreno' },
        alcalde:    { img: 'img/char_alcalde.png.jpg',    section: 'GOBIERNO LOCAL',               caption: 'El alcalde en su despacho municipal' },
        diputado:   { img: 'img/char_diputado.png.jpg',   section: 'PODER LEGISLATIVO',            caption: 'El diputado en la Cámara de Representantes' },
        senador:    { img: 'img/char_senador.png.jpg',    section: 'CÁMARA ALTA',                  caption: 'El senador durante la sesión plenaria' },
        presidente: { img: 'img/char_presidente.png.jpg', section: 'PRESIDENCIA DE LA REPÚBLICA',  caption: 'El mandatario en el Palacio de Gobierno' },
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

        textEl.textContent = customMessage || subtextPool[Math.floor(Math.random() * subtextPool.length)];

        // Cita
        const quoteEl = document.getElementById('news-quote');
        if (quoteEl) {
            quoteEl.textContent = quotePool[Math.floor(Math.random() * quotePool.length)];
        }

        // Columna lateral — titulares aleatorios más variados
        const sidebarEl = document.getElementById('news-sidebar');
        if (sidebarEl) {
            const sideHeadlines = [
                'Mercados reaccionan con volatilidad ante el cambio',
                'Organizaciones civiles exigen mayor transparencia',
                'Encuestas muestran división en la opinión pública',
                'El congreso prepara sesión extraordinaria',
                'Analistas debaten el futuro del proyecto político',
                'Protestas programadas para el fin de semana',
                'Gremios empresariales solicitan reunión urgente',
                'ONG denuncia irregularidades en licitación pública',
                'Oposición anuncia moción de censura en el congreso',
                'Cumbre regional: acuerdos sobre seguridad fronteriza',
            ];
            const shuffled = [...sideHeadlines].sort(() => 0.5 - Math.random());
            sidebarEl.innerHTML = shuffled.slice(0, 4).map(h => `<div class="sidebar-item">${h}</div>`).join('');
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

        // Botón
        if (state.runStatus === 'victory' || state.runStatus === 'game_over') {
            btnContinue.textContent = '🗳️ NUEVA CARRERA';
        } else {
            btnContinue.textContent = '🏛️ ACEPTAR CARGO →';
        }
    }
});
