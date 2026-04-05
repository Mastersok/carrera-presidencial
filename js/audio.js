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
    // PluckSynths especializados (NO mutar propiedades mid-game)
    let pluckHover;          // suave — hover
    let pluckClick;          // percusivo — cardClick snap
    let pluckReject;         // medio — cardReject
    let pluckMelody = [];    // pool melodía — newRound, ascend, victory, startGame, uiClick
    let pluckIdx = 0;
    let membrane, membrane2, metal1, metal2, fmSynth;

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

        // ── PluckSynth especializados — Karplus-Strong ────────────────────
        // Instancias separadas con settings fijos (NO mutar mid-game).

        // Hover: muy suave, dampening alto = brillante y ligero
        pluckHover = new Tone.PluckSynth({ attackNoise: 0.4, dampening: 6500, resonance: 0.960 });
        pluckHover.connect(masterComp);

        // Click: muy percusivo, dampening bajo = oscuro y "snap"
        pluckClick = new Tone.PluckSynth({ attackNoise: 15, dampening: 1800, resonance: 0.920 });
        pluckClick.connect(masterComp);

        // Reject: medio, suave
        pluckReject = new Tone.PluckSynth({ attackNoise: 0.8, dampening: 3500, resonance: 0.970 });
        pluckReject.connect(masterComp);
        pluckReject.connect(reverbBus);

        // Pool de melodía: 6 voces para polifonía (newRound, ascend, victory…)
        for (let i = 0; i < 6; i++) {
            const p = new Tone.PluckSynth({ attackNoise: 2, dampening: 5000, resonance: 0.988 });
            p.connect(masterComp);
            p.connect(reverbBus);
            pluckMelody.push(p);
        }

        // ── MembraneSynth — modelo físico de membrana/percusión ──────────
        membrane = new Tone.MembraneSynth({
            pitchDecay : 0.04,
            octaves    : 5,
            envelope   : { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
            oscillator : { type: 'sine' }
        }).connect(masterComp);

        // Segundo membrane para gameOver (más grave y lento)
        membrane2 = new Tone.MembraneSynth({
            pitchDecay : 0.08,
            octaves    : 8,
            envelope   : { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 },
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

    // Toca la siguiente voz del pool de melodía (round-robin)
    function melody(note, time) {
        const p = pluckMelody[pluckIdx % pluckMelody.length];
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
        cardHover() {
            if (!ready) return;
            pluckHover.triggerAttack('C6', Tone.now());
        },

        // ── Selección de carta ─────────────────────────────────────────────
        cardClick() {
            if (!ready) return;
            const t = Tone.now();
            membrane.triggerAttackRelease('C2', '16n', t);
            pluckClick.triggerAttack('A3', t + 0.005);
            metal2.triggerAttackRelease('32n', t + 0.01);
        },

        // ── Carta rechazada ────────────────────────────────────────────────
        cardReject() {
            if (!ready) return;
            const t = Tone.now();
            pluckReject.triggerAttack('E4', t);
            pluckReject.triggerAttack('B3', t + 0.09);
        },

        // ── Medidor en zona crítica ────────────────────────────────────────
        meterCritical() {
            if (!ready) return;
            const t = Tone.now();
            for (let i = 0; i < 4; i++) {
                metal1.triggerAttackRelease('16n', t + i * 0.28);
                if (i % 2 === 1) metal2.triggerAttackRelease('32n', t + i * 0.28 + 0.02);
            }
        },

        // ── Nueva ronda ────────────────────────────────────────────────────
        newRound() {
            if (!ready) return;
            const t = Tone.now();
            ['C5', 'E5', 'G5'].forEach((note, i) => melody(note, t + i * 0.11));
        },

        // ── Ascenso de cargo ───────────────────────────────────────────────
        ascend() {
            if (!ready) return;
            const t = Tone.now();
            ['C5', 'E5', 'G5', 'B5', 'C6'].forEach((note, i) => melody(note, t + i * 0.1));
            fmSynth.triggerAttackRelease('C5', '2n', t + 0.55);
            [350, 500, 650, 450, 700].forEach((freq, i) => {
                metal1.triggerAttackRelease('32n', t + 0.58 + i * 0.07);
            });
        },

        // ── Game Over ──────────────────────────────────────────────────────
        gameOver() {
            if (!ready) return;
            const t = Tone.now();
            membrane2.triggerAttackRelease('C1', '8n', t);
            [['Bb4', 0.00], ['A4', 0.38], ['Ab4', 0.76], ['G3', 1.14]].forEach(([note, d]) => {
                fmSynth.triggerAttackRelease(note, '4n', t + d);
            });
        },

        // ── Victoria final ─────────────────────────────────────────────────
        victory() {
            if (!ready) return;
            const t = Tone.now();
            const notes   = ['C5','C5','C5','E5','C5','E5','G5','C6'];
            const timings = [0, .12, .24, .38, .58, .70, .84, .98];
            notes.forEach((note, i) => melody(note, t + timings[i]));
            ['C4', 'G4', 'E5'].forEach((note, i) =>
                fmSynth.triggerAttackRelease(note, '1n', t + 1.12 + i * 0.025)
            );
            membrane.triggerAttackRelease('C2', '8n', t + 1.12);
            [400, 600, 800, 500, 700, 450, 650].forEach((freq, i) => {
                metal1.triggerAttackRelease('32n', t + 1.15 + i * 0.065);
            });
        },

        // ── Botones de UI ──────────────────────────────────────────────────
        uiClick() {
            if (!ready) return;
            melody('G4', Tone.now());
        },

        // ── Inicio del juego ───────────────────────────────────────────────
        startGame() {
            if (!ready) return;
            const t = Tone.now();
            ['G4', 'C5', 'E5'].forEach((note, i) => melody(note, t + i * 0.14));
            melody('C6', t + 0.50);
            membrane.triggerAttackRelease('C2', '16n', t + 0.50);
            metal2.triggerAttackRelease('32n', t + 0.52);
            metal1.triggerAttackRelease('32n', t + 0.58);
        }
    };

})();
