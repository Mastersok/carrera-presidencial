/**
 * AUDIO.JS v7.0 — Diseño de sonidos corregido con Tone.js
 *
 * Cambios clave vs v6:
 *  - cardHover:      Synth (no PluckSynth) — más audible, controlado
 *  - cardReject:     MonoSynth con portamento — glide G4→D4 = "nope" claro
 *  - meterCritical:  Synth square wave — alarma musical, no golpe metálico
 *  - gameOver:       MonoSynth con filterEnvelope — trombón triste real ("wah wah")
 *  - uiClick:        PluckSynth baja resonancia — tick físico, no nota larga
 *  - Bugs fix:       rejectHigh/rejectLow eran misma instancia (monofónico)
 */

const AudioManager = (() => {

    let ready = false;

    // ── Sintetizadores (creados en boot) ──────────────────────────────────────
    let hoverSynth;          // Synth triangle — cardHover
    let clickMembrane;       // MembraneSynth  — cardClick thud
    let clickSnap;           // PluckSynth     — cardClick snap
    let rejectSynth;         // MonoSynth portamento — cardReject
    let alarmSynth;          // Synth square   — meterCritical
    let pluckMelody = [];    // PluckSynth[6]  — pool melódico (newRound, ascend, etc)
    let pluckIdx = 0;
    let trombone;            // MonoSynth filterEnv — gameOver "wah wah"
    let boomMembrane;        // MembraneSynth  — gameOver impacto inicial
    let victorySynth;        // PolySynth      — victory acorde final
    let metal;               // MetalSynth     — victory/ascend sparkle
    let uiSynth;             // PluckSynth     — uiClick

    // ── Efectos ───────────────────────────────────────────────────────────────
    let masterComp, reverbBus;

    // ── Inicialización ────────────────────────────────────────────────────────
    async function boot() {
        if (ready) return;
        if (typeof Tone === 'undefined') {
            console.error('[Audio] Tone.js no se cargó — sin sonido.');
            return;
        }
        await Tone.start();

        // Compresor maestro
        masterComp = new Tone.Compressor({ threshold: -14, ratio: 4, attack: 0.003, release: 0.15 })
            .toDestination();

        // Reverb: sala pequeña
        reverbBus = new Tone.Reverb({ decay: 0.9, wet: 0.22 });
        reverbBus.connect(masterComp);
        await reverbBus.generate();

        // ── cardHover: Synth triangle, muy corto ─────────────────────────────
        // Tone.Synth da control total de duración — PluckSynth es impredecible
        hoverSynth = new Tone.Synth({
            oscillator : { type: 'triangle' },
            envelope   : { attack: 0.001, decay: 0.04, sustain: 0, release: 0.04 },
            volume     : -10
        }).connect(masterComp);

        // ── cardClick: MembraneSynth + PluckSynth percusivo ──────────────────
        clickMembrane = new Tone.MembraneSynth({
            pitchDecay : 0.04,
            octaves    : 5,
            envelope   : { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
            oscillator : { type: 'sine' },
            volume     : -4
        }).connect(masterComp);

        // attackNoise=20 = casi ruido puro = "snap" de sello/carta
        clickSnap = new Tone.PluckSynth({ attackNoise: 20, dampening: 1500, resonance: 0.88 })
            .connect(masterComp);

        // ── cardReject: MonoSynth con portamento ─────────────────────────────
        // Portamento hace que el pitch GLIDE entre notas = sonido de "nope"
        // G4 → D4 (quinta descendente) = claramente negativo
        rejectSynth = new Tone.MonoSynth({
            oscillator   : { type: 'triangle' },
            envelope     : { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.25 },
            filterEnvelope: {
                attack: 0.01, decay: 0.1, sustain: 0, release: 0.1,
                baseFrequency: 600, octaves: 2.5
            },
            portamento : 0.07,   // glide de 70ms entre notas
            volume     : -8
        }).connect(masterComp);

        // ── meterCritical: Synth square, alarma musical ──────────────────────
        // Synth con square wave da el carácter de alarma electrónica limpia
        // Mucho mejor que MetalSynth que sonaba a golpe industrial
        alarmSynth = new Tone.Synth({
            oscillator : { type: 'square' },
            envelope   : { attack: 0.001, decay: 0.05, sustain: 0.7, release: 0.08 },
            volume     : -12
        }).connect(masterComp);

        // ── Pool melódico de PluckSynth (newRound, ascend, victory, startGame) ──
        for (let i = 0; i < 6; i++) {
            const p = new Tone.PluckSynth({ attackNoise: 2, dampening: 5000, resonance: 0.989 });
            p.connect(masterComp);
            p.connect(reverbBus);
            pluckMelody.push(p);
        }

        // ── gameOver: MonoSynth con filterEnvelope = trombón con sordina ─────
        // La clave del trombón triste: filterEnvelope.attack lento = "waaah"
        // Oscillator sawtooth = armónicos de viento-metal
        trombone = new Tone.MonoSynth({
            oscillator   : { type: 'sawtooth' },
            envelope     : { attack: 0.04, decay: 0.2, sustain: 0.65, release: 0.5 },
            filterEnvelope: {
                attack: 0.1, decay: 0.4, sustain: 0.1, release: 0.4,
                baseFrequency: 180, octaves: 4.5   // filter abre y cierra = "waah"
            },
            volume: -6
        });
        trombone.connect(masterComp);
        trombone.connect(reverbBus);

        // Boom para inicio del game over
        boomMembrane = new Tone.MembraneSynth({
            pitchDecay : 0.1,
            octaves    : 10,
            envelope   : { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
            volume     : -2
        }).connect(masterComp);

        // ── victory: PolySynth para acordes simultáneos ──────────────────────
        victorySynth = new Tone.PolySynth(Tone.Synth, {
            oscillator : { type: 'triangle8' },
            envelope   : { attack: 0.02, decay: 0.1, sustain: 0.6, release: 1.0 },
            volume     : -10
        });
        victorySynth.connect(masterComp);
        victorySynth.connect(reverbBus);

        // ── MetalSynth: solo para sparkle decorativo (ascend/victory) ────────
        metal = new Tone.MetalSynth({
            frequency   : 450,
            envelope    : { attack: 0.001, decay: 0.12, release: 0.08 },
            harmonicity : 5.1, modulationIndex: 32, resonance: 3800, octaves: 1.5,
            volume      : -16
        }).connect(reverbBus);

        // ── uiClick: PluckSynth con resonancia baja = decay rápido = "tick" ──
        uiSynth = new Tone.PluckSynth({ attackNoise: 1, dampening: 4000, resonance: 0.93 })
            .connect(masterComp);

        ready = true;
    }

    // Pool melódico round-robin
    function melody(note, time) {
        const p = pluckMelody[pluckIdx % pluckMelody.length];
        pluckIdx++;
        p.triggerAttack(note, time ?? Tone.now());
    }

    // ════════════════════════════════════════════════════════════════════════
    //   SONIDOS
    // ════════════════════════════════════════════════════════════════════════

    return {

        async init() {
            try { await boot(); } catch(e) { console.warn('[Audio]', e); }
        },

        // ── Hover sobre carta ──────────────────────────────────────────────
        // Synth triangle corto en E5 (659Hz) — audible, sutil, positivo
        cardHover() {
            if (!ready) return;
            hoverSynth.triggerAttackRelease('E5', '32n');
        },

        // ── Selección de carta ─────────────────────────────────────────────
        // Thud de membrana (peso) + snap percusivo (contacto)
        cardClick() {
            if (!ready) return;
            const t = Tone.now();
            clickMembrane.triggerAttackRelease('C2', '16n', t);
            clickSnap.triggerAttack('G3', t + 0.008);
        },

        // ── Carta rechazada ────────────────────────────────────────────────
        // MonoSynth con portamento: glide G4→D4 = quinta descendente = "nope"
        // Sonido claramente negativo, distinguible del cardClick
        cardReject() {
            if (!ready) return;
            const t = Tone.now();
            rejectSynth.triggerAttackRelease('G4', '8n', t);
            // triggerAttackRelease en G4, luego D4 — el portamento hace el glide
            rejectSynth.triggerAttackRelease('D4', '8n', t + 0.18);
        },

        // ── Medidor en zona crítica ────────────────────────────────────────
        // Alarma musical: A5↔E5 alternando 4 veces — como alarma de película
        // Square wave da carácter nítido sin ser "industrial"
        meterCritical() {
            if (!ready) return;
            const t = Tone.now();
            ['A5', 'E5', 'A5', 'E5'].forEach((note, i) => {
                alarmSynth.triggerAttackRelease(note, '16n', t + i * 0.27);
            });
        },

        // ── Nueva ronda ────────────────────────────────────────────────────
        // Arpegio xilófono C5-E5-G5 (marimba física Karplus-Strong)
        newRound() {
            if (!ready) return;
            const t = Tone.now();
            ['C5', 'E5', 'G5'].forEach((note, i) => melody(note, t + i * 0.11));
        },

        // ── Ascenso de cargo ───────────────────────────────────────────────
        // Escala de marimba C5→C6 + acorde + destellos metálicos
        ascend() {
            if (!ready) return;
            const t = Tone.now();
            ['C5', 'E5', 'G5', 'B5', 'C6'].forEach((note, i) => melody(note, t + i * 0.1));
            victorySynth.triggerAttackRelease(['C5', 'E5', 'G5'], '2n', t + 0.58);
            for (let i = 0; i < 5; i++) metal.triggerAttackRelease('32n', t + 0.62 + i * 0.07);
        },

        // ── Game Over ──────────────────────────────────────────────────────
        // Boom inicial + trombón triste "wah-wah-wah-waaah"
        // MonoSynth con filterEnvelope = el "wah" viene del filtro abriéndose
        gameOver() {
            if (!ready) return;
            const t = Tone.now();
            // Boom dramático de apertura
            boomMembrane.triggerAttackRelease('C1', '4n', t);
            // Sad trombone: Bb4 → A4 → Ab4 → G3 (cae una octava = el "waaaaah")
            [
                ['Bb4', 0.15, '4n'],
                ['A4',  0.55, '4n'],
                ['Ab4', 0.95, '4n'],
                ['G3',  1.35, '2n']   // ← cae octava, nota larga = "waaah" final
            ].forEach(([note, delay, dur]) => {
                trombone.triggerAttackRelease(note, dur, t + delay);
            });
        },

        // ── Victoria ──────────────────────────────────────────────────────
        // Fanfarria de marimba + acorde PolySynth + lluvia de destellos
        victory() {
            if (!ready) return;
            const t = Tone.now();
            // Motivo rítmico en marimba (Karplus-Strong)
            ['C5','C5','C5','E5','C5','E5','G5','C6'].forEach((note, i) => {
                melody(note, t + [0,.12,.24,.38,.58,.70,.84,.98][i]);
            });
            // Acorde final PolySynth (simultáneo, diferente timbre)
            victorySynth.triggerAttackRelease(['C4','G4','C5','E5'], '1n', t + 1.10);
            // Boom de cierre
            clickMembrane.triggerAttackRelease('C2', '8n', t + 1.10);
            // Lluvia de destellos
            for (let i = 0; i < 7; i++) metal.triggerAttackRelease('32n', t + 1.14 + i * 0.065);
        },

        // ── Botones Continuar / Ascender ──────────────────────────────────
        // PluckSynth baja resonancia = decay corto = "tick" de botón real
        uiClick() {
            if (!ready) return;
            uiSynth.triggerAttack('E4', Tone.now());
        },

        // ── Inicio del juego ───────────────────────────────────────────────
        // Jingle G4→C5→E5 + nota alta + thud de membrana
        startGame() {
            if (!ready) return;
            const t = Tone.now();
            ['G4', 'C5', 'E5'].forEach((note, i) => melody(note, t + i * 0.14));
            melody('C6', t + 0.50);
            clickMembrane.triggerAttackRelease('C2', '16n', t + 0.50);
            metal.triggerAttackRelease('32n', t + 0.54);
        }
    };

})();
