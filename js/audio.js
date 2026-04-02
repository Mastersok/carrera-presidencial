/**
 * AUDIO.JS v4.0 — Motor de Sonido CARTOON
 *
 * Inspirado en: Cuphead, Dicey Dungeons, Balatro, sfxr/ZzFX.
 *
 * Principios CARTOON (vs cinematográfico):
 *   - Pitch jumps bruscos → "boing", "bonk", "pop" (sfxr technique)
 *   - Vibrato (LFO) → wobble juguetón, trompeta con sordina
 *   - Arpegios rápidos tipo xilófono (triangle wave)
 *   - Triangle + square waves = timbre clásico cartoon
 *   - Sonidos CORTOS y SECOS — poco reverb, inmediatos, "snappy"
 *   - Frecuencias medias-altas (400–1500 Hz rango principal)
 *   - Escalas mayores / pentatónicas → sensación alegre, juguetona
 *   - Variación aleatoria para que no suene robótico
 */

const AudioManager = (() => {

    let ctx = null;
    let master = null;
    let compressor = null;
    let reverb = null;

    // ── Inicialización ────────────────────────────────────────────────────────
    function boot() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -16;
        compressor.knee.value      = 8;
        compressor.ratio.value     = 4;
        compressor.attack.value    = 0.003;
        compressor.release.value   = 0.12;
        compressor.connect(ctx.destination);

        master = ctx.createGain();
        master.gain.value = 0.75;
        master.connect(compressor);

        // Reverb corto y brillante (sala pequeña — estilo cartoon, no catedral)
        reverb = buildReverb(0.8, 4.0);
        reverb.connect(master);
    }

    function getCtx() {
        if (!ctx) boot();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function buildReverb(duration, decay) {
        const len = ctx.sampleRate * duration;
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
        const node = ctx.createConvolver();
        node.buffer = buf;
        return node;
    }

    // ── Primitiva: nota con envelope ──────────────────────────────────────────
    // Variación aleatoria de pitch (jitter) para sonido orgánico
    function note(freq, type, dur, vol, delay = 0, wet = false) {
        const c = getCtx(), t = c.currentTime + delay;
        const jit = 1 + (Math.random() - 0.5) * 0.015; // ±0.75% variación

        const osc = c.createOscillator();
        const gn  = c.createGain();
        osc.type  = type;
        osc.frequency.setValueAtTime(freq * jit, t);

        gn.gain.setValueAtTime(0.001, t);
        gn.gain.linearRampToValueAtTime(vol, t + 0.004);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gn);
        gn.connect(master);
        if (wet) gn.connect(reverb);
        osc.start(t); osc.stop(t + dur + 0.05);
    }

    // ── Nota con vibrato (LFO → frequency) ───────────────────────────────────
    // Clave del sonido cartoon: wobble en la frecuencia → "wah wah", "boing"
    function noteVibrato(freq, type, dur, vol, vibratoHz, vibratoDepth, delay = 0, wet = false) {
        const c = getCtx(), t = c.currentTime + delay;

        const osc    = c.createOscillator();
        const lfo    = c.createOscillator();
        const lfoGn  = c.createGain();
        const outGn  = c.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        // LFO modula la frecuencia → vibrato
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(vibratoHz, t);
        lfoGn.gain.setValueAtTime(vibratoDepth, t);
        // El vibrato se desvanece con el tiempo
        lfoGn.gain.exponentialRampToValueAtTime(1, t + dur * 0.9);

        lfo.connect(lfoGn);
        lfoGn.connect(osc.frequency);

        outGn.gain.setValueAtTime(0.001, t);
        outGn.gain.linearRampToValueAtTime(vol, t + 0.005);
        outGn.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(outGn);
        outGn.connect(master);
        if (wet) outGn.connect(reverb);

        lfo.start(t);  lfo.stop(t + dur + 0.05);
        osc.start(t);  osc.stop(t + dur + 0.05);
    }

    // ── Nota con pitch jump (salto brusco → "bonk", "boing") ─────────────────
    // Técnica clave de sfxr/ZzFX: salto repentino de frecuencia
    function notePitchJump(freqStart, freqJump, freqSettle, type, dur, vol, jumpTime, delay = 0) {
        const c = getCtx(), t = c.currentTime + delay;

        const osc = c.createOscillator();
        const gn  = c.createGain();
        osc.type  = type;

        osc.frequency.setValueAtTime(freqStart, t);
        osc.frequency.setValueAtTime(freqJump,  t + jumpTime);
        osc.frequency.exponentialRampToValueAtTime(freqSettle, t + dur * 0.8);

        gn.gain.setValueAtTime(0.001, t);
        gn.gain.linearRampToValueAtTime(vol, t + 0.003);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gn); gn.connect(master);
        osc.start(t); osc.stop(t + dur + 0.05);
    }

    // ── Nota con spring (vibrato rápido que decae → "boing" / "resorte") ─────
    function noteSpring(freq, type, dur, vol, springHz, springDepth, delay = 0) {
        const c = getCtx(), t = c.currentTime + delay;

        const osc   = c.createOscillator();
        const lfo   = c.createOscillator();
        const lfoGn = c.createGain();
        const outGn = c.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        // La frecuencia principal baja mientras el spring decae
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(springHz, t);
        // Spring: el vibrato empieza intenso y decae rápido
        lfoGn.gain.setValueAtTime(springDepth, t);
        lfoGn.gain.exponentialRampToValueAtTime(2, t + dur * 0.5);

        lfo.connect(lfoGn);
        lfoGn.connect(osc.frequency);

        outGn.gain.setValueAtTime(vol, t);
        outGn.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(outGn); outGn.connect(master);
        lfo.start(t);  lfo.stop(t + dur + 0.05);
        osc.start(t);  osc.stop(t + dur + 0.05);
    }

    // ── Ruido corto (para transientes físicos) ────────────────────────────────
    function noiseHit(filterType, filterFreq, dur, vol, delay = 0) {
        const c     = getCtx(), t = c.currentTime + delay;
        const len   = Math.ceil(c.sampleRate * (dur + 0.02));
        const buf   = c.createBuffer(1, len, c.sampleRate);
        const d     = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

        const src    = c.createBufferSource();
        src.buffer   = buf;
        const filter = c.createBiquadFilter();
        const gn     = c.createGain();

        filter.type            = filterType;
        filter.frequency.value = filterFreq;
        filter.Q.value         = 1.5;

        gn.gain.setValueAtTime(vol, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);

        src.connect(filter); filter.connect(gn); gn.connect(master);
        src.start(t); src.stop(t + dur + 0.05);
    }

    // ════════════════════════════════════════════════════════════════════════
    //   SONIDOS DEL JUEGO — estilo CARTOON político
    // ════════════════════════════════════════════════════════════════════════

    return {

        init() { boot(); },

        // ── Hover sobre carta ──────────────────────────────────────────────
        // "Pip!" — burbuja/blip cortísimo, positivo, casi imperceptible
        cardHover() {
            note(1100, 'triangle', 0.06, 0.10);
            note(1650, 'sine', 0.04, 0.05, 0.01);
        },

        // ── Selección de carta ─────────────────────────────────────────────
        // "BONK!" de sello/estampa — un golpe con autoridad cartoon
        // Capa 1: pitch jump hacia abajo (el "bonk")
        // Capa 2: noise transiente (el "slap" del sello)
        // Capa 3: ping agudo (brillo de xilófono)
        cardClick() {
            // BONK: empieza agudo, salta a grave, rebota un poco
            notePitchJump(650, 180, 220, 'square', 0.18, 0.50, 0.012);
            // Slap físico
            noiseHit('bandpass', 1800, 0.04, 0.35);
            // Ping de xilófono
            note(1047, 'triangle', 0.12, 0.25, 0.01);
        },

        // ── Carta rechazada ────────────────────────────────────────────────
        // Desliz triste: "wup" descendente con wobble
        cardReject() {
            noteVibrato(450, 'triangle', 0.16, 0.18, 7, 25, 0.01);
            note(350, 'sine', 0.12, 0.10, 0.04);
        },

        // ── Medidor en zona crítica ────────────────────────────────────────
        // Alarma cartoon: "RING-RING!" con spring/wobble
        // NO heartbeat cinematográfico — alarma tipo teléfono de dibujo animado
        meterCritical() {
            [0, 0.28, 0.56, 0.84].forEach((d, i) => {
                const f = i % 2 === 0 ? 988 : 784; // B5 / G5
                noteVibrato(f, 'triangle', 0.18, 0.35, 12, 35, d);
                note(f * 1.5, 'sine', 0.08, 0.12, d + 0.02);
            });
        },

        // ── Nueva ronda ────────────────────────────────────────────────────
        // Arpegio de xilófono ascendente: "ding-ding-ding-DING!"
        // Escala pentatónica mayor = alegre y juguetón
        newRound() {
            const scale = [523, 659, 784, 1047]; // C5 E5 G5 C6
            scale.forEach((f, i) => {
                const vol = i === scale.length - 1 ? 0.38 : 0.26;
                const dur = i === scale.length - 1 ? 0.22 : 0.10;
                note(f, 'triangle', dur, vol, i * 0.065);
                // Armónico sutil una octava arriba
                note(f * 2, 'sine', dur * 0.7, vol * 0.15, i * 0.065 + 0.005);
            });
        },

        // ── Ascenso de cargo ───────────────────────────────────────────────
        // Fanfarria cartoon triunfal tipo "LEVEL UP!"
        // Arpegio rápido ascendente + nota larga con spring + chispa aguda
        ascend() {
            // Arpegio ascendente rápido (tipo Mario star)
            const arp = [523, 659, 784, 988, 1047, 1319, 1568];
            arp.forEach((f, i) => {
                note(f, 'triangle', 0.12, 0.32, i * 0.07, true);
                if (i % 2 === 0) note(f * 2, 'sine', 0.08, 0.10, i * 0.07 + 0.01);
            });

            // Nota de cierre con spring (BOING triunfal)
            noteSpring(1047, 'triangle', 0.8, 0.42, 10, 80, 0.52);

            // Chispa de estrellas: notas muy agudas y rápidas
            [2093, 2637, 3136, 2637, 3520].forEach((f, i) => {
                note(f, 'sine', 0.06, 0.10, 0.55 + i * 0.05, true);
            });
        },

        // ── Game Over ──────────────────────────────────────────────────────
        // Trompeta triste cartoon: "wah wah wah waaaaah..."
        // Notas descendentes con VIBRATO creciente (más wobble = más patético)
        gameOver() {
            const sad = [
                { f: 493, dur: 0.30, vHz: 5, vD: 15 },   // B4
                { f: 466, dur: 0.30, vHz: 5, vD: 25 },   // Bb4
                { f: 440, dur: 0.30, vHz: 6, vD: 35 },   // A4
                { f: 196, dur: 0.90, vHz: 7, vD: 55 },   // G3 (cae una octava — dramático)
            ];
            let t = 0;
            sad.forEach(n => {
                // Trompeta cartoon = square wave + vibrato
                noteVibrato(n.f, 'square', n.dur, 0.30, n.vHz, n.vD, t, true);
                // Cuerpo suave
                noteVibrato(n.f, 'triangle', n.dur, 0.18, n.vHz, n.vD * 0.5, t);
                t += n.dur + 0.04;
            });
        },

        // ── Victoria final ─────────────────────────────────────────────────
        // Fanfarria de game show: "DA-DA-DA-DA, DA-DA-DA-DAAAA!!"
        // Ritmo marcado → pausa → cadencia final → acorde con spring
        victory() {
            // Parte 1: ritmo marcado (DA-DA-DA-DA)
            const p1 = [523, 523, 659, 784]; // C5 C5 E5 G5
            p1.forEach((f, i) => {
                note(f, 'triangle', 0.10, 0.35, i * 0.13, true);
                note(f * 0.5, 'square', 0.08, 0.14, i * 0.13);
            });

            // Parte 2: subida (DA-DA-DA)
            const p2 = [880, 1047, 1319]; // A5 C6 E6
            p2.forEach((f, i) => {
                note(f, 'triangle', 0.12, 0.38, 0.62 + i * 0.12, true);
                note(f * 2, 'sine', 0.08, 0.10, 0.62 + i * 0.12 + 0.01);
            });

            // Nota final larga con spring (BOING triunfal)
            noteSpring(1568, 'triangle', 1.2, 0.48, 8, 100, 1.02);

            // Acorde sostenido
            [784, 988, 1175, 1568].forEach(f => {
                noteVibrato(f, 'triangle', 1.5, 0.22, 4, 12, 1.10, true);
            });

            // Lluvia de chispas agudas
            [2093, 2637, 3136, 2093, 3520, 2637, 3136].forEach((f, i) => {
                note(f, 'sine', 0.05, 0.08, 1.15 + i * 0.06, true);
            });
        },

        // ── Botones de UI ──────────────────────────────────────────────────
        // Blip clásico de menú — chirp ascendente corto
        uiClick() {
            note(700, 'triangle', 0.06, 0.20);
            note(950, 'triangle', 0.05, 0.14, 0.025);
        },

        // ── Inicio del juego ───────────────────────────────────────────────
        // Jingle de apertura: 3 notas ascendentes + bonk final con spring
        startGame() {
            // Tres notas ascendentes energéticas
            note(392, 'triangle', 0.14, 0.32, 0.00);  // G4
            note(523, 'triangle', 0.14, 0.35, 0.14);  // C5
            note(659, 'triangle', 0.14, 0.38, 0.28);  // E5

            // Nota final con pitch jump y spring (el "PUNCH")
            notePitchJump(500, 1047, 900, 'triangle', 0.20, 0.42, 0.01, 0.44);
            noteSpring(1047, 'sine', 0.55, 0.30, 12, 60, 0.46);

            // Acorde de bienvenida suave
            [523, 659, 784].forEach(f => {
                note(f, 'triangle', 0.60, 0.20, 0.58, true);
            });
        }
    };

})();
