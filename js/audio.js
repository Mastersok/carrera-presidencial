/**
 * AUDIO.JS v5.0 — Motor de Sonido ZzFX
 *
 * Implementa el algoritmo ZzFX Micro de Frank Force (MIT License)
 * https://github.com/KilledByAPixel/ZzFX
 *
 * La diferencia clave vs v1-v4:
 *   - v1-v4 usaban OscillatorNode en vivo → siempre sonarán "electrónicos"
 *   - v5 pre-renderiza todo el audio en un Float32Array sample-por-sample
 *   - Esto permite: envelopes ADSR exactos, noise mezclado en el oscilador,
 *     pitchJump (salto brusco de tono), slide acelerado, tremolo real, filtro biquad
 *
 * Sonidos del juego diseñados específicamente para juego cartoon político.
 */

const AudioManager = (() => {

    let ctx = null;
    let compressor = null;
    let reverbNode = null;

    // ── Inicialización ────────────────────────────────────────────────────────
    function boot() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value      =  8;
        compressor.ratio.value     =  4;
        compressor.attack.value    =  0.003;
        compressor.release.value   =  0.15;
        compressor.connect(ctx.destination);

        // Reverb corto tipo "sala pequeña"
        reverbNode = buildReverb(0.9, 3.5);
        reverbNode.connect(compressor);
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

    // ════════════════════════════════════════════════════════════════════════
    //   ZzFX MICRO — algoritmo portado de ZzFXMicro.js por Frank Force (MIT)
    //   github.com/KilledByAPixel/ZzFX
    // ════════════════════════════════════════════════════════════════════════
    //
    // Parámetros (en orden):
    //  [0]  volume        – volumen total
    //  [1]  randomness    – variación aleatoria de freq (0 = exacto)
    //  [2]  frequency     – frecuencia base en Hz
    //  [3]  attack        – tiempo de ataque (s)
    //  [4]  sustain       – tiempo de sustain (s)
    //  [5]  release       – tiempo de release (s)
    //  [6]  shape         – forma de onda: 0=sine 1=triangle 2=saw 3=tan 4=sin³ 5=pulse
    //  [7]  shapeCurve    – curvatura (1=normal, <1=suave, >1=afilado)
    //  [8]  slide         – slide de frecuencia
    //  [9]  deltaSlide    – aceleración del slide
    //  [10] pitchJump     – salto de pitch (Hz*PI2/sr) en pitchJumpTime
    //  [11] pitchJumpTime – tiempo del salto (s)
    //  [12] repeatTime    – período de reinicio de frecuencia (s), 0=sin repetir
    //  [13] noise         – cantidad de ruido mezclado en la fase
    //  [14] modulation    – modulación de frecuencia (FM)
    //  [15] bitCrush      – sample-hold (lo-fi), 0=desactivado
    //  [16] delay         – eco (s)
    //  [17] sustainVolume – nivel durante sustain (0–1)
    //  [18] decay         – tiempo de decay (s)
    //  [19] tremolo       – profundidad de tremolo (0–1)
    //  [20] filter        – filtro biquad: + = LP, – = HP (Hz)

    function zzfxBuild(
        volume=1, randomness=.05, frequency=220, attack=0, sustain=0,
        release=.1, shape=0, shapeCurve=1, slide=0, deltaSlide=0,
        pitchJump=0, pitchJumpTime=0, repeatTime=0, noise=0, modulation=0,
        bitCrush=0, delay=0, sustainVolume=1, decay=0, tremolo=0, filter=0
    ) {
        const SR = 44100;
        const PI2 = Math.PI * 2;
        const abs  = Math.abs;
        const sign = v => v < 0 ? -1 : 1;

        // Escalar parámetros a samples/radianes
        let startSlide = slide *= 500 * PI2 / SR / SR;
        let startFreq  = frequency *= (1 + randomness * 2 * Math.random() - randomness)
                                      * PI2 / SR;
        let modOffset = 0, repeat = 0, crush = 0, jump = 1;
        let b = [], t = 0, i = 0, s = 0, f;

        attack        = attack   * SR || 9;   // mínimo 9 samples (evita clic)
        decay         *= SR;
        sustain       *= SR;
        release       *= SR;
        delay         *= SR;
        deltaSlide    *= 500 * PI2 / SR ** 3;
        modulation    *= PI2 / SR;
        pitchJump     *= PI2 / SR;
        pitchJumpTime *= SR;
        repeatTime     = repeatTime * SR | 0;

        // Filtro biquad LP/HP (igual que en ZzFXMicro.js)
        const quality = 2;
        const w  = PI2 * abs(filter) * 2 / SR;
        const co = Math.cos(w), alpha = Math.sin(w) / 2 / quality;
        const a0 = 1 + alpha, a1 = -2 * co / a0, a2 = (1 - alpha) / a0;
        const b0 = (1 + sign(filter) * co) / 2 / a0;
        const b1 = -(sign(filter) + co) / a0, b2 = b0;
        let x2 = 0, x1 = 0, y2 = 0, y1 = 0;

        const length = attack + decay + sustain + release + delay | 0;

        for (; i < length; b[i++] = s * volume * 0.3) {

            // Sample-hold para bit crush
            if (!(++crush % (bitCrush * 100 | 0))) {

                // ── Generación de forma de onda ──
                s = shape > 0
                    ? shape > 1
                        ? shape > 2
                            ? shape > 3
                                ? shape > 4
                                    // 5: pulse/square
                                    ? (t / PI2 % 1 < shapeCurve / 2) * 2 - 1
                                    // 4: sin³ (más "gordito" que sine)
                                    : Math.sin(t ** 3)
                                // 3: tan clamped
                                : Math.max(Math.min(Math.tan(t), 1), -1)
                            // 2: sawtooth
                            : 1 - (2 * t / PI2 % 2 + 2) % 2
                        // 1: triangle
                        : 1 - 4 * abs(Math.round(t / PI2) - t / PI2)
                    // 0: sine
                    : Math.sin(t);

                // ── Aplicar tremolo y shapeCurve ──
                s = (repeatTime
                        ? 1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime)
                        : 1)
                    * (shape > 4 ? s : sign(s) * abs(s) ** shapeCurve);

                // ── Aplicar envelope ADSR ──
                s *= i < attack
                    ? i / attack
                    : i < attack + decay
                        ? 1 - ((i - attack) / decay) * (1 - sustainVolume)
                        : i < attack + decay + sustain
                            ? sustainVolume
                            : i < length - delay
                                ? (length - i - delay) / release * sustainVolume
                                : 0;

                // ── Eco (delay) ──
                s = delay
                    ? s / 2 + (delay > i ? 0
                        : (i < length - delay ? 1 : (length - i) / delay)
                        * b[i - delay | 0] / 2 / volume)
                    : s;

                // ── Filtro biquad ──
                if (filter)
                    s = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = s) - a2 * y2 - a1 * (y2 = y1);
            }

            // ── Avanzar fase (con FM y noise) ──
            f  = (frequency += slide += deltaSlide) * Math.cos(modulation * modOffset++);
            t += f + f * noise * Math.sin(i ** 5);

            // ── Pitch jump ──
            if (jump && ++jump > pitchJumpTime) {
                frequency     += pitchJump;
                startFreq     += pitchJump;
                jump           = 0;
            }

            // ── Repeat (reinicia frecuencia) ──
            if (repeatTime && !(++repeat % repeatTime)) {
                frequency = startFreq;
                slide     = startSlide;
                jump    ||= 1;
            }
        }

        return b;
    }

    // Reproduce un sonido ZzFX. `delayS` = tiempo de inicio en segundos.
    // `wet` = true para pasar por reverb.
    function play(params, delayS = 0, wet = false) {
        const c       = getCtx();
        const samples = zzfxBuild(...params);
        if (!samples.length) return;

        const buf = c.createBuffer(1, samples.length, 44100);
        buf.getChannelData(0).set(samples);

        const src = c.createBufferSource();
        src.buffer = buf;

        const gain = c.createGain();
        gain.gain.value = 1;

        src.connect(gain);
        gain.connect(compressor);
        if (wet) gain.connect(reverbNode);

        src.start(c.currentTime + delayS);
        return src;
    }

    // ════════════════════════════════════════════════════════════════════════
    //   SONIDOS DEL JUEGO — diseñados para juego cartoon político
    // ════════════════════════════════════════════════════════════════════════

    return {

        init() { boot(); },

        // ── Hover sobre carta ──────────────────────────────────────────────
        // "Pip!" — blip suave ascendente, como carta que se levanta
        // triangle 830Hz, pitchJump sube +200Hz a los 5ms
        cardHover() {
            play([0.28, 0, 830, 0, .01, .05, 1, 1.2, 0, 0, 200, .005]);
        },

        // ── Selección de carta (el sonido más importante) ──────────────────
        // "STAMP!" — como sello de goma / decisión política
        // Dos capas: impacto + resonancia
        cardClick() {
            // Capa 1: Impacto (triangle noisy, slide hacia abajo rápido)
            play([0.95, 0, 290, 0, .015, .12, 1, 2.5, -4, 0, 0, 0, 0, 2.5]);
            // Capa 2: Ping brillante (sine, muy corto, pitchJump para dar "snap")
            play([0.45, 0, 1050, 0, 0, .07, 0, 1, -8, 0, 0, 0, 0, .1]);
        },

        // ── Carta rechazada ────────────────────────────────────────────────
        // "bwop" — descenso suave, negativo pero no dramático
        // triangle 400Hz, slide descendente, pitchJump a frecuencia menor
        cardReject() {
            play([0.32, 0, 400, 0, .02, .15, 1, 1, -2.5, 0, -100, .04]);
        },

        // ── Medidor en zona crítica ────────────────────────────────────────
        // Alarma con repeatTime + tremolo — como teléfono de cartoon
        // triangle 950Hz, repeats cada 200ms, tremolo 85%
        meterCritical() {
            play([0.55, 0, 950, 0, .85, .1, 1, 1, 0, 0, 0, 0, .2, 0, 0, 0, 0, 1, 0, .85]);
        },

        // ── Nueva ronda ────────────────────────────────────────────────────
        // Arpegio de xilófono: C5-E5-G5 con slide ligero
        // Triangle, cada nota corta, volumen ascendente
        newRound() {
            play([0.38, 0, 523, 0, .04, .10, 1, 1.3, 1.5],  0.00);
            play([0.43, 0, 659, 0, .04, .11, 1, 1.3, 1.5],  0.12);
            play([0.50, 0, 784, 0, .05, .16, 1, 1.3, 1.5],  0.25);
        },

        // ── Ascenso de cargo ───────────────────────────────────────────────
        // Level-up: arpegio rápido C5→E5→G5→B5→C6, nota larga con tremolo
        ascend() {
            const scale = [523, 659, 784, 988, 1047];
            scale.forEach((f, i) =>
                play([0.42, 0, f, 0, .04, .09, 1, 1.2, 2], i * .09, i > 2)
            );
            // Nota final sostenida con vibrato (tremolo + repeatTime)
            play([0.65, 0, 1047, .01, .5, .25, 1, 1, 0, 0, 0, 0, .14, 0, 0, 0, 0, .8, 0, .35], .47, true);
            // Chispas (sine, muy agudas, muy cortas)
            [2093, 2637, 3136, 2093, 3520].forEach((f, i) =>
                play([0.18, 0, f, 0, 0, .06, 0, 1], .52 + i * .055, true)
            );
        },

        // ── Game Over ──────────────────────────────────────────────────────
        // Trompeta triste cartoon: "wah-wah-wah-waaah"
        // Basado en el preset "game over" oficial de ZzFX (Frank Force)
        // Parámetros: triangle 925Hz, deltaSlide=6.27, pitchJump=-184, repeat=170ms
        gameOver() {
            // Trombon cartoon (preset ZzFX oficial adaptado)
            play([1.0, 0, 925, .04, .3, .6, 1, .3, 0, 6.27, -184, .09, .17], 0, true);
            // Bajo sordo de impacto
            play([0.65, 0, 110, 0, 0, .35, 1, 3, -2.5, 0, 0, 0, 0, 3], 0);
        },

        // ── Victoria final ─────────────────────────────────────────────────
        // Fanfarria presidencial: motivo C5-C5-C5-E5 / G5 / C6 + acorde final
        victory() {
            // Motivo rítmico (triangle, staccato)
            const melody  = [523, 523, 523, 659, 523, 659, 784, 1047];
            const timings = [0, .12, .24, .38, .58, .70, .83, .97];
            melody.forEach((f, i) => {
                const isLast = i === melody.length - 1;
                const dur    = isLast ? .55 : .10;
                const rel    = isLast ? .30 : .07;
                play([0.48, 0, f, 0, dur, rel, 1, 1.3, 1], timings[i], true);
            });

            // Acorde de cierre (4 notas simultáneas, con tremolo y reverb)
            [523, 659, 784, 1047].forEach(f =>
                play([0.32, 0, f, .01, .6, .35, 1, 1, 0, 0, 0, 0, .18, 0, 0, 0, 0, .8, 0, .25], 1.02, true)
            );

            // Sub-bajo para dar peso
            play([0.6, 0, 130, 0, .5, .4, 1, 2, 0], 1.02);

            // Estrellitas finales
            [2093, 2637, 3136, 2637, 3520, 3136].forEach((f, i) =>
                play([0.15, 0, f, 0, 0, .055, 0, 1], 1.06 + i * .06, true)
            );
        },

        // ── Botones de UI ──────────────────────────────────────────────────
        // Blip positivo clásico: sine/triangle, corto, pitchJump leve arriba
        uiClick() {
            play([0.30, 0, 540, 0, 0, .07, 1, 1, 2, 0, 90, .015]);
        },

        // ── Inicio del juego ───────────────────────────────────────────────
        // Jingle de campaña: G4→C5→E5 + punch final con pitchJump
        startGame() {
            play([0.38, 0, 392, 0, .04, .12, 1, 1.2, 1.5],  0.00);
            play([0.43, 0, 523, 0, .04, .12, 1, 1.2, 1.5],  0.14);
            play([0.50, 0, 659, 0, .05, .15, 1, 1.2, 2.0],  0.28);
            // Golpe final con pitchJump
            play([0.72, 0, 523, 0, .05, .28, 1, 1.8, 0, 0, 400, .04], 0.46, true);
            // Campana de bienvenida
            play([0.35, 0, 1047, .01, .2, .25, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, .7], 0.50, true);
        }
    };

})();
