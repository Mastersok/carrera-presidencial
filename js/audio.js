/**
 * AUDIO.JS v2.0 — Motor de Sonido Moderno
 * Síntesis procedural con Web Audio API.
 * Usa ruido blanco + filtros + reverb sintético para sonidos "siglo XXI".
 */

const AudioManager = (() => {

    let ctx = null;
    let masterGain = null;
    let reverb = null;
    let compressor = null;

    // ── Setup del grafo de audio ──────────────────────────────────────────────
    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Compresor maestro: suaviza los picos, da "punch" profesional
            compressor = ctx.createDynamicsCompressor();
            compressor.threshold.value = -18;
            compressor.knee.value      = 10;
            compressor.ratio.value     = 4;
            compressor.attack.value    = 0.003;
            compressor.release.value   = 0.15;
            compressor.connect(ctx.destination);

            // Ganancia maestra
            masterGain = ctx.createGain();
            masterGain.gain.value = 0.85;
            masterGain.connect(compressor);

            // Reverb sintético (impulso generado matemáticamente)
            reverb = buildReverb(1.8, 3.0);
            reverb.connect(masterGain);
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // Genera un ConvolverNode con impulso aleatorio ponderado (reverb de sala)
    function buildReverb(duration, decay) {
        const c   = ctx;
        const len = c.sampleRate * duration;
        const buf = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
            }
        }
        const node = c.createConvolver();
        node.buffer = buf;
        return node;
    }

    // ── Primitivas de bajo nivel ─────────────────────────────────────────────

    // Ruido blanco con filtro y envolvente — para impactos físicos
    function noise(duration, filterType, filterFreq, filterQ, volume, delay = 0, dry = true, wet = false) {
        const c   = getCtx();
        const t   = c.currentTime + delay;
        const len = Math.ceil(c.sampleRate * (duration + 0.05));
        const buf = c.createBuffer(1, len, c.sampleRate);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

        const src    = c.createBufferSource();
        src.buffer   = buf;

        const filter        = c.createBiquadFilter();
        filter.type         = filterType;
        filter.frequency.value = filterFreq;
        if (filterQ) filter.Q.value = filterQ;

        const gain = c.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        src.connect(filter);
        filter.connect(gain);
        if (dry) gain.connect(masterGain);
        if (wet) gain.connect(reverb);

        src.start(t);
        src.stop(t + duration + 0.1);
    }

    // Oscilador con barrido de frecuencia y envolvente ADSR básico
    function tone(freqStart, freqEnd, type, duration, volume, delay = 0,
                  attack = 0.005, decay = 0.0, sustain = 1.0, dry = true, wet = false) {
        const c    = getCtx();
        const t    = c.currentTime + delay;
        const osc  = c.createOscillator();
        const gain = c.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, t);
        if (freqEnd !== freqStart) {
            osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration * 0.8);
        }

        const peak = volume;
        const sus  = peak * sustain;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(peak, t + attack);
        if (decay > 0) gain.gain.linearRampToValueAtTime(sus, t + attack + decay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        if (dry) gain.connect(masterGain);
        if (wet) gain.connect(reverb);

        osc.start(t);
        osc.stop(t + duration + 0.1);
    }

    // ════════════════════════════════════════════════════════════════════════
    //   SONIDOS DEL JUEGO
    // ════════════════════════════════════════════════════════════════════════

    return {

        init() { getCtx(); },

        // ── Hover sobre carta ─────────────────────────────────────────────
        // Swish suave de papel / fricción de naipe
        cardHover() {
            noise(0.06, 'highpass', 5000, 0.8, 0.18, 0, true, false);
            tone(1800, 1400, 'sine', 0.07, 0.06, 0.01);
        },

        // ── Selección de carta ────────────────────────────────────────────
        // Golpe físico: thud grave + slap de cartón + resonancia
        cardClick() {
            // Impacto grave (cuerpo)
            noise(0.12, 'lowpass',  350, 1.0, 0.55, 0,    true, false);
            // Slap de superficie (ataque)
            noise(0.05, 'bandpass', 2200, 4.0, 0.30, 0,   true, false);
            // Resonancia tonal
            tone(280, 90, 'sine', 0.18, 0.35, 0.01, 0.003, 0.04, 0.3);
            // Sub-bass punch
            tone(65, 40, 'sine', 0.15, 0.50, 0.00, 0.002);
        },

        // ── Carta rechazada ────────────────────────────────────────────────
        // Desliz suave descendente (cartas deslizadas de vuelta)
        cardReject() {
            noise(0.10, 'bandpass', 1200, 2.0, 0.18, 0, true, false);
            tone(380, 220, 'sine', 0.14, 0.15, 0.02, 0.005, 0, 0.8);
        },

        // ── Medidor en zona crítica ────────────────────────────────────────
        // Latido de corazón + palpitación grave (NO beep de Atari)
        meterCritical() {
            [0, 0.65, 1.3, 1.95].forEach(d => {
                // Primer golpe fuerte
                noise(0.06, 'lowpass', 180, 0.8, 0.6,  d,       true, false);
                tone(75, 55, 'sine', 0.18, 0.55, d,    0.002);
                // Segundo golpe suave (eco del latido)
                noise(0.05, 'lowpass', 160, 0.8, 0.35, d + 0.12, true, false);
                tone(65, 45, 'sine', 0.14, 0.35, d + 0.12, 0.002);
            });
        },

        // ── Nueva ronda ───────────────────────────────────────────────────
        // Whoosh cinematográfico + campana suave
        newRound() {
            // Whoosh (ruido barrido de grave a agudo)
            noise(0.35, 'bandpass', 800,  3.0, 0.22, 0.00, true, true);
            noise(0.20, 'highpass', 3000, 0.5, 0.10, 0.15, true, false);
            // Campana de ronda
            tone(880, 880, 'sine', 0.6, 0.28, 0.28, 0.004, 0.05, 0.2, true, true);
            tone(1320, 1320, 'sine', 0.45, 0.18, 0.30, 0.004, 0.05, 0.2, true, true);
        },

        // ── Ascenso de cargo ──────────────────────────────────────────────
        // Fanfarria orquestal con reverb: arpegio + acorde triunfal
        ascend() {
            // Ruido de ambiente (crowd cheering simulation)
            noise(1.5, 'bandpass', 900, 0.4, 0.12, 0.0, true, true);

            // Arpegio con dos capas (triángulo brillante + sine cálido)
            const arp = [523, 659, 784, 1047, 1319];
            arp.forEach((f, i) => {
                tone(f, f, 'triangle', 0.30, 0.38, i * 0.11, 0.004, 0.05, 0.5, true, true);
                tone(f * 0.5, f * 0.5, 'sine', 0.22, 0.18, i * 0.11, 0.004, 0.03, 0.4, false, true);
            });

            // Acorde final largo con reverb
            [523, 659, 784, 1047].forEach(f => {
                tone(f, f, 'triangle', 1.0, 0.28, 0.62, 0.008, 0.1, 0.6, true, true);
            });
            // Brillo extra en agudos
            tone(2093, 2093, 'sine', 0.6, 0.12, 0.68, 0.01, 0.1, 0.3, false, true);
        },

        // ── Game Over ─────────────────────────────────────────────────────
        // Caída cinematográfica: boom + descenso dramático con reverb
        gameOver() {
            // Boom inicial
            noise(0.8, 'lowpass', 200, 0.5, 0.55, 0.0, true, true);
            tone(90, 35, 'sine', 0.9, 0.60, 0.0, 0.005, 0.1, 0.7);

            // Melodía descendente (escala cromática en menor)
            const fall = [494, 466, 440, 415, 392, 370, 349, 294];
            fall.forEach((f, i) => {
                tone(f, f, 'triangle', 0.40, 0.30, 0.12 + i * 0.22, 0.008, 0.1, 0.5, true, true);
                // Armónico inferior (más oscuro)
                tone(f * 0.5, f * 0.5, 'sine', 0.35, 0.20, 0.12 + i * 0.22, 0.008, 0.05, 0.4, false, true);
            });

            // Golpe final muy grave
            noise(1.2, 'lowpass', 120, 0.3, 0.40, 1.9, true, true);
            tone(55, 28, 'sine', 1.4, 0.55, 1.9, 0.01);
        },

        // ── Victoria final ────────────────────────────────────────────────
        // Fanfarria épica de 2 partes con gran reverb
        victory() {
            // Parte 1: fanfarria rítmica (ritmo de trompeta)
            const theme = [
                [523, 0.08], [523, 0.08], [523, 0.08],
                [659, 0.22], [523, 0.08],
                [659, 0.08], [784, 0.35]
            ];
            let t = 0;
            theme.forEach(([f, dur]) => {
                tone(f, f, 'sawtooth', dur, 0.28, t, 0.005, 0.04, 0.7, true, true);
                tone(f * 1.5, f * 1.5, 'triangle', dur, 0.12, t, 0.005, 0.04, 0.5, false, true);
                t += dur + 0.025;
            });

            // Parte 2: cadencia descendente rápida hacia el acorde final
            const cadence = [1047, 880, 784, 1047];
            cadence.forEach((f, i) => {
                tone(f, f, 'triangle', 0.14, 0.35, t + i * 0.13, 0.005, 0.04, 0.6, true, true);
            });
            t += cadence.length * 0.13 + 0.05;

            // Acorde triunfal final (largo, con reverb total)
            [523, 659, 784, 1047, 1568].forEach(f => {
                tone(f, f, 'triangle', 2.0, 0.30, t, 0.015, 0.15, 0.7, true, true);
            });
            // Ruido brillante de celebración
            noise(0.6, 'highpass', 4000, 0.5, 0.14, t, true, true);
            // Sub bajo
            tone(130, 130, 'sine', 2.0, 0.45, t, 0.015, 0.15, 0.7);
        },

        // ── Botones de UI ─────────────────────────────────────────────────
        // Click limpio y moderno (no beep)
        uiClick() {
            noise(0.04, 'bandpass', 1800, 5.0, 0.20, 0, true, false);
            tone(900, 700, 'sine', 0.06, 0.12, 0.005, 0.002, 0.01, 0.5);
        },

        // ── Inicio del juego ──────────────────────────────────────────────
        // Intro cinematográfica: whoosh + fanfarria corta
        startGame() {
            // Whoosh de arranque
            noise(0.5, 'bandpass', 600, 1.5, 0.25, 0.0, true, true);
            noise(0.3, 'highpass', 4000, 0.5, 0.10, 0.1, true, false);

            // Intro de 3 notas
            tone(392, 392, 'triangle', 0.15, 0.35, 0.25, 0.005, 0.04, 0.6, true, true);
            tone(523, 523, 'triangle', 0.15, 0.35, 0.42, 0.005, 0.04, 0.6, true, true);
            tone(659, 659, 'triangle', 0.40, 0.45, 0.59, 0.008, 0.06, 0.7, true, true);

            // Acorde de bienvenida
            [523, 659, 784].forEach(f => {
                tone(f, f, 'triangle', 0.8, 0.28, 0.85, 0.01, 0.1, 0.6, true, true);
            });
            tone(262, 262, 'sine', 0.9, 0.40, 0.85, 0.01, 0.1, 0.7);
        }
    };

})();
