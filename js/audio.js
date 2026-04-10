/**
 * AUDIO.JS v7.1 — Diseño de sonidos corregido con Tone.js (Música deshabilitada)
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

        clickSnap = new Tone.PluckSynth({ attackNoise: 20, dampening: 1500, resonance: 0.88 })
            .connect(masterComp);

        // ── cardReject: MonoSynth con portamento ─────────────────────────────
        rejectSynth = new Tone.MonoSynth({
            oscillator   : { type: 'triangle' },
            envelope     : { attack: 0.01, decay: 0.15, sustain:0.2, release: 0.25 },
            filterEnvelope: {
                attack: 0.01, decay: 0.1, sustain: 0, release: 0.1,
                baseFrequency: 600, octaves: 2.5
            },
            portamento : 0.07,
            volume     : -8
        }).connect(masterComp);

        // ── meterCritical: Synth square, alarma musical ──────────────────────
        alarmSynth = new Tone.Synth({
            oscillator : { type: 'square' },
            envelope   : { attack: 0.001, decay: 0.05, sustain: 0.7, release: 0.08 },
            volume     : -12
        }).connect(masterComp);

        // ── Pool melódico de PluckSynth ──
        for (let i = 0; i < 6; i++) {
            const p = new Tone.PluckSynth({ attackNoise: 2, dampening: 5000, resonance: 0.989 });
            p.connect(masterComp);
            p.connect(reverbBus);
            pluckMelody.push(p);
        }

        // ── gameOver: MonoSynth con filterEnvelope ─────
        trombone = new Tone.MonoSynth({
            oscillator   : { type: 'sawtooth' },
            envelope     : { attack: 0.04, decay: 0.2, sustain: 0.65, release: 0.5 },
            filterEnvelope: {
                attack: 0.1, decay: 0.4, sustain: 0.1, release: 0.4,
                baseFrequency: 180, octaves: 4.5
            },
            volume: -6
        });
        trombone.connect(masterComp);
        trombone.connect(reverbBus);

        boomMembrane = new Tone.MembraneSynth({
            pitchDecay : 0.1,
            octaves    : 10,
            envelope   : { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
            volume     : -2
        }).connect(masterComp);

        // ── victory: PolySynth ──
        victorySynth = new Tone.PolySynth(Tone.Synth, {
            oscillator : { type: 'triangle8' },
            envelope   : { attack: 0.02, decay: 0.1, sustain: 0.6, release: 1.0 },
            volume     : -10
        });
        victorySynth.connect(masterComp);
        victorySynth.connect(reverbBus);

        // ── MetalSynth ──
        metal = new Tone.MetalSynth({
            frequency   : 450,
            envelope    : { attack: 0.001, decay: 0.12, release: 0.08 },
            harmonicity : 5.1, modulationIndex: 32, resonance: 3800, octaves: 1.5,
            volume      : -16
        }).connect(reverbBus);

        // ── uiClick ──
        uiSynth = new Tone.PluckSynth({ attackNoise: 1, dampening: 4000, resonance: 0.93 })
            .connect(masterComp);

        ready = true;
    }

    function melody(note, time) {
        const p = pluckMelody[pluckIdx % pluckMelody.length];
        pluckIdx++;
        p.triggerAttack(note, time ?? Tone.now());
    }

    return {
        async init() {
            try { await boot(); } catch(e) { console.warn('[Audio]', e); }
        },
        cardHover() { if (ready) hoverSynth.triggerAttackRelease('E5', '32n'); },
        cardClick() {
            if (!ready) return;
            const t = Tone.now();
            clickMembrane.triggerAttackRelease('C2', '16n', t);
            clickSnap.triggerAttack('G3', t + 0.008);
        },
        cardReject() {
            if (!ready) return;
            const t = Tone.now();
            rejectSynth.triggerAttackRelease('G4', '8n', t);
            rejectSynth.triggerAttackRelease('D4', '8n', t + 0.18);
        },
        meterCritical() {
            if (!ready) return;
            const t = Tone.now();
            ['A5', 'E5', 'A5', 'E5'].forEach((note, i) => {
                alarmSynth.triggerAttackRelease(note, '16n', t + i * 0.27);
            });
        },
        newRound() {
            if (!ready) return;
            const t = Tone.now();
            ['C5', 'E5', 'G5'].forEach((note, i) => melody(note, t + i * 0.11));
        },
        ascend() {
            if (!ready) return;
            const t = Tone.now();
            ['C5', 'E5', 'G5', 'B5', 'C6'].forEach((note, i) => melody(note, t + i * 0.1));
            victorySynth.triggerAttackRelease(['C5', 'E5', 'G5'], '2n', t + 0.58);
            for (let i = 0; i < 5; i++) metal.triggerAttackRelease('32n', t + 0.62 + i * 0.07);
        },
        gameOver() {
            if (!ready) return;
            const t = Tone.now();
            boomMembrane.triggerAttackRelease('C1', '4n', t);
            [['Bb4', 0.15, '4n'], ['A4', 0.55, '4n'], ['Ab4', 0.95, '4n'], ['G3', 1.35, '2n']].forEach(([note, delay, dur]) => {
                trombone.triggerAttackRelease(note, dur, t + delay);
            });
        },
        victory() {
            if (!ready) return;
            const t = Tone.now();
            ['C5','C5','C5','E5','C5','E5','G5','C6'].forEach((note, i) => {
                melody(note, t + [0,.12,.24,.38,.58,.70,.84,.98][i]);
            });
            victorySynth.triggerAttackRelease(['C4','G4','C5','E5'], '1n', t + 1.10);
            clickMembrane.triggerAttackRelease('C2', '8n', t + 1.10);
            for (let i = 0; i < 7; i++) metal.triggerAttackRelease('32n', t + 1.14 + i * 0.065);
        },
        uiClick() { if (ready) uiSynth.triggerAttack('E4', Tone.now()); },
        startGame() {
            if (!ready) return;
            const t = Tone.now();
            ['G4', 'C5', 'E5'].forEach((note, i) => melody(note, t + i * 0.14));
            melody('C6', t + 0.50);
            clickMembrane.triggerAttackRelease('C2', '16n', t + 0.50);
            metal.triggerAttackRelease('32n', t + 0.54);
        },
        // Placeholders para evitar errores en ui.js
        updateMusic() {},
        pauseMusic() {},
        babble() {}
    };

})();
