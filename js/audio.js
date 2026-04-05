/**
 * AUDIO.JS v6.0 — Motor de Sonido Tone.js (Modelado Físico)
 *
 * Usa sintetizadores de Tone.js que son IMPOSIBLES de replicar
 * con OscillatorNode crudo:
 *
 *  PluckSynth   → Karplus-Strong: xilófono, marimba, cuerdas pulsadas
 *                 Modela físicamente la vibración en un material resonante.
 *                 NO suena a NES — suena a objeto REAL.
 *
 *  MembraneSynth → Modelo físico de membrana: kick drum, golpes, toms
 *                  Pitch sweep descendente + envolvente de percusión.
 *
 *  MetalSynth   → FM inarmónico: campanas, platillos, chispas metálicas
 *                 Múltiples osciladores desafinados = shimmer real.
 *
 *  FMSynth      → Síntesis FM completa: trompetas, órganos, "wah"
 *
 * Tone.js CDN: https://unpkg.com/tone@15/build/Tone.js
 */

const AudioManager = (() => {

    let ready = false;

    // Sintetizadores (creados en boot())
    let plucks   = [];   // pool de 6 PluckSynth para polifonía
    let pluckIdx = 0;
    let membrane, metal1, metal2, fmSynth;

    // Efectos
    let masterComp, reverbBus;

    // ── Inicialización (async — Tone.js lo requiere) ─────────────────────────
    async function boot() {
        if (ready) return;

        // Tone.js necesita que el AudioContext sea iniciado desde gesto del usuario
        await Tone.start();

        // ── Compresor maestro ─────────────────────────────────────────────
        masterComp = new Tone.Compressor({
            threshold : -14,
            ratio     :  4,
            attack    :  0.003,
            release   :  0.15
        }).toDestination();

        // ── Bus de reverb (sala pequeña, cartoon) ─────────────────────────
        reverbBus = new Tone.Reverb({ decay: 1.0, wet: 0.25 });
        reverbBus.connect(masterComp);
        reverbBus.generate(); // async en background, funciona al iniciar

        // ── PluckSynth pool — Karplus-Strong ──────────────────────────────
        // Cada instancia es monofónica; el pool de 6 da polifonía real.
        // Parámetros clave:
        //   attackNoise  : cantidad de ruido inicial (0.1=suave → 20=muy percusivo)
        //   dampening    : frecuencia del lowpass en el feedback (Hz)
        //                  bajo = oscuro/cálido, alto = brillante/claro
        //   resonance    : cuánto tiempo sustenta (0.9=corto → 0.999=largo)
        for (let i = 0; i < 6; i++) {
            const p = new Tone.PluckSynth({
                attackNoise : 1.5,
                dampening   : 4800,
                resonance   : 0.987
            });
            p.connect(masterComp);
            p.connect(reverbBus);
            plucks.push(p);
        }

        // ── MembraneSynth — modelo físico de membrana/percusión ──────────
        // pitchDecay: tiempo del sweep de pitch descendente
        // octaves   : cuántas octavas baja el pitch en el ataque
        membrane = new Tone.MembraneSynth({
            pitchDecay : 0.04,
            octaves    : 5,
            envelope   : { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
            oscillator : { type: 'sine' }
        }).connect(masterComp);

        // ── MetalSynth — FM inarmónico (campanas, shimmer) ───────────────
        // harmonicity   : ratio entre portadora y moduladora
        // modulationIndex: profundidad de la modulación FM
        // octaves       : barrido del highpass en el envelope
        metal1 = new Tone.MetalSynth({
            frequency      : 400,
            envelope       : { attack: 0.001, decay: 0.15, release: 0.12 },
            harmonicity    : 5.1,
            modulationIndex: 32,
            resonance      : 3800,
            octaves        : 1.5
        });
        metal1.connect(reverbBus);

        metal2 = new Tone.MetalSynth({
            frequency      : 600,
            envelope       : { attack: 0.001, decay: 0.08, release: 0.06 },
            harmonicity    : 8.5,
            modulationIndex: 48,
            resonance      : 5000,
            octaves        : 1.0
        });
        metal2.connect(reverbBus);

        // ── FMSynth — síntesis FM para tonos musicales expresivos ─────────
        // harmonicity    : relación de frecuencia moduladora/portadora
        // modulationIndex: cuánto "brillo" / riqueza armónica
        fmSynth = new Tone.FMSynth({
            harmonicity         : 1.5,
            modulationIndex     : 8,
            oscillator          : { type: 'sine' },
            envelope            : { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.4 },
            modulation          : { type: 'triangle' },
            modulationEnvelope  : { attack: 0.1, decay: 0.1, sustain: 1, release: 0.5 }
        });
        fmSynth.connect(masterComp);
        fmSynth.connect(reverbBus);

        ready = true;
    }

    // Toca la siguiente voz del pool de PluckSynth (round-robin)
    function pluck(note, time) {
        const p = plucks[pluckIdx % plucks.length];
        pluckIdx++;
        p.triggerAttack(note, time ?? Tone.now());
    }

    // ════════════════════════════════════════════════════════════════════════
    //   SONIDOS — diseñados para juego cartoon político, siglo 21
    // ════════════════════════════════════════════════════════════════════════

    return {

        async init() {
            try { await boot(); }
            catch (e) { console.warn('[AudioManager] init error:', e); }
        },

        // ── Hover sobre carta ──────────────────────────────────────────────
        // Toque suave de xilófono — como levantar una ficha de cartón
        cardHover() {
            if (!ready) return;
            plucks[0].attackNoise = 0.5;
            plucks[0].dampening   = 6000;
            plucks[0].resonance   = 0.96;
            plucks[0].triggerAttack('C6', Tone.now());
        },

        // ── Selección de carta — el sonido más importante ──────────────────
        // "STAMP!" político: golpe de sello de goma con resonancia de madera
        // Tres capas: thud de membrana + snap Karplus-Strong + shimmer metálico
        cardClick() {
            if (!ready) return;
            const t = Tone.now();
            // Capa 1: impacto grave (MembraneSynth — kick suave)
            membrane.triggerAttackRelease('C2', '16n', t);
            // Capa 2: snap Karplus-Strong (el "crack" del sello)
            plucks[1].attackNoise = 12;
            plucks[1].dampening   = 2200;
            plucks[1].resonance   = 0.93;
            plucks[1].triggerAttack('A3', t + 0.005);
            // Capa 3: shimmer metálico breve (calidad de decisión oficial)
            metal2.triggerAttackRelease('32n', t + 0.01);
        },

        // ── Carta rechazada ────────────────────────────────────────────────
        // Dos plucks descendentes — como deslizar cartas de vuelta
        cardReject() {
            if (!ready) return;
            const t = Tone.now();
            plucks[2].attackNoise = 0.8;
            plucks[2].dampening   = 3500;
            plucks[2].resonance   = 0.97;
            plucks[2].triggerAttack('E4', t);
            plucks[2].triggerAttack('B3', t + 0.09);
        },

        // ── Medidor en zona crítica ────────────────────────────────────────
        // Cuatro golpes metálicos urgentes — campana de alarma cartoon
        meterCritical() {
            if (!ready) return;
            const t = Tone.now();
            for (let i = 0; i < 4; i++) {
                metal1.triggerAttackRelease('16n', t + i * 0.28);
                // Acento alternando con metal2 (diálogo entre dos tonos)
                if (i % 2 === 1) metal2.triggerAttackRelease('32n', t + i * 0.28 + 0.02);
            }
        },

        // ── Nueva ronda ────────────────────────────────────────────────────
        // Arpegio de xilófono C5-E5-G5 — Karplus-Strong puro
        // Suena como un xilófono de verdad (no a NES)
        newRound() {
            if (!ready) return;
            const t = Tone.now();
            plucks[3].attackNoise = 1.5;
            plucks[3].dampening   = 5000;
            plucks[3].resonance   = 0.988;
            ['C5', 'E5', 'G5'].forEach((note, i) => {
                plucks[3].triggerAttack(note, t + i * 0.11);
            });
        },

        // ── Ascenso de cargo ───────────────────────────────────────────────
        // Escala de xilófono ascendente (5 notas) + lluvia metálica
        // Como recibir una medalla en una ceremonia cartoon
        ascend() {
            if (!ready) return;
            const t = Tone.now();

            // Escala Karplus-Strong (marimba presidencial)
            const scale = ['C5', 'E5', 'G5', 'B5', 'C6'];
            scale.forEach((note, i) => {
                plucks[i % plucks.length].attackNoise = 2;
                plucks[i % plucks.length].dampening   = 5200;
                plucks[i % plucks.length].resonance   = 0.990;
                plucks[i % plucks.length].triggerAttack(note, t + i * 0.1);
            });

            // Acorde final sostenido con FM (cuerpo musical)
            fmSynth.triggerAttackRelease('C5', '2n', t + 0.55);

            // Lluvia de destellos metálicos (5 hits, frecuencias variadas)
            [350, 500, 650, 450, 700].forEach((freq, i) => {
                metal1.frequency.value = freq;
                metal1.triggerAttackRelease('32n', t + 0.58 + i * 0.07);
            });
        },

        // ── Game Over ──────────────────────────────────────────────────────
        // Trombón triste FM: "wah-wah-wah-waaah"
        // Bb4→A4→Ab4→G3 (cromático descendente, último nota cae octava)
        gameOver() {
            if (!ready) return;
            const t = Tone.now();

            // Boom de apertura (MembraneSynth muy grave)
            membrane.pitchDecay = 0.08;
            membrane.octaves    = 8;
            membrane.triggerAttackRelease('C1', '8n', t);

            // Trombón FM descendente
            const sad = [
                ['Bb4', 0.00],
                ['A4',  0.38],
                ['Ab4', 0.76],
                ['G3',  1.14]   // salta una octava abajo — el "waaaaah" final
            ];
            sad.forEach(([note, delay]) => {
                fmSynth.triggerAttackRelease(note, '4n', t + delay);
            });
        },

        // ── Victoria final ─────────────────────────────────────────────────
        // Fanfarria presidencial: motivo + acorde final + lluvia metálica
        // Melodía en Karplus-Strong (marimba) + bass FM
        victory() {
            if (!ready) return;
            const t = Tone.now();

            // Motivo rítmico en xilófono (Karplus-Strong — NO suena a NES)
            const melody  = ['C5','C5','C5','E5','C5','E5','G5','C6'];
            const timings = [0, .12, .24, .38, .58, .70, .84, .98];
            melody.forEach((note, i) => {
                const voice = plucks[i % plucks.length];
                voice.attackNoise = 2.5;
                voice.dampening   = 4500;
                voice.resonance   = 0.985;
                voice.triggerAttack(note, t + timings[i]);
            });

            // Acorde final con FMSynth (cuerpo y calidez)
            ['C4', 'G4', 'E5'].forEach((note, i) => {
                fmSynth.triggerAttackRelease(note, '1n', t + 1.12 + i * 0.025);
            });

            // Golpe de membrana final
            membrane.pitchDecay = 0.04;
            membrane.octaves    = 5;
            membrane.triggerAttackRelease('C2', '8n', t + 1.12);

            // Lluvia de campanitas metálicas
            [400, 600, 800, 500, 700, 450, 650].forEach((freq, i) => {
                metal1.frequency.value = freq;
                metal1.triggerAttackRelease('32n', t + 1.15 + i * 0.065);
            });
        },

        // ── Botones de UI ──────────────────────────────────────────────────
        // Pluck suave tipo "tick" de reloj de pared cartoon
        uiClick() {
            if (!ready) return;
            plucks[4].attackNoise = 1;
            plucks[4].dampening   = 4000;
            plucks[4].resonance   = 0.960;
            plucks[4].triggerAttack('G4', Tone.now());
        },

        // ── Inicio del juego ───────────────────────────────────────────────
        // Jingle de campaña: G4→C5→E5 (marimba) + punch de membrana
        startGame() {
            if (!ready) return;
            const t = Tone.now();

            ['G4', 'C5', 'E5'].forEach((note, i) => {
                plucks[5].attackNoise = 2;
                plucks[5].dampening   = 5000;
                plucks[5].resonance   = 0.988;
                plucks[5].triggerAttack(note, t + i * 0.14);
            });

            // Nota final sostenida (marimba resonante)
            plucks[0].attackNoise = 3;
            plucks[0].dampening   = 4000;
            plucks[0].resonance   = 0.992;
            plucks[0].triggerAttack('C6', t + 0.50);

            // Punch de membrana en el acento
            membrane.pitchDecay = 0.05;
            membrane.octaves    = 5;
            membrane.triggerAttackRelease('C2', '16n', t + 0.50);

            // Dos shimmer metálicos
            metal2.triggerAttackRelease('32n', t + 0.52);
            metal1.triggerAttackRelease('32n', t + 0.58);
        }
    };

})();
