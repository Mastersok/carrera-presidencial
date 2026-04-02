/**
 * AUDIO.JS v3.0 — Motor de Sonido Moderno
 * Técnicas usadas en juegos del siglo XXI:
 *   - Síntesis FM (modulación de frecuencia) → timbres tipo trompeta, campana, órgano
 *   - Ruido rosa (Pink noise) → texturas naturales
 *   - WaveShaperNode → distorsión / punch / crunch
 *   - LFO (oscilador de baja frecuencia) → tremolo, vibrato, vida
 *   - PeriodicWave → timbres armónicos personalizados
 *   - Variación aleatoria → cada sonido ligeramente diferente (no robótico)
 *   - Reverb sintético (ConvolverNode)
 *   - Compresor dinámico maestro
 */

const AudioManager = (() => {

    let ctx = null;
    let masterGain = null;
    let reverbDry = null;   // mezcla seca (sin reverb)
    let reverbWet = null;   // mezcla húmeda (con reverb)
    let compressor = null;

    // ── Inicialización del grafo de audio ─────────────────────────────────────
    function boot() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Compresor maestro: punch profesional, evita clipping
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value      =  8;
        compressor.ratio.value     =  5;
        compressor.attack.value    =  0.002;
        compressor.release.value   =  0.12;
        compressor.connect(ctx.destination);

        // Ganancia maestra
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.80;
        masterGain.connect(compressor);

        // Reverb sintético — sala mediana
        reverbWet = buildReverb(2.0, 2.5);
        reverbWet.connect(masterGain);

        // Bus seco (sin reverb) directo al master
        reverbDry = masterGain; // alias semántico
    }

    function getCtx() {
        if (!ctx) boot();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // Genera un ConvolverNode con impulso aleatorio ponderado
    function buildReverb(duration, decay) {
        const c   = ctx;
        const len = c.sampleRate * duration;
        const buf = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
        const node = c.createConvolver();
        node.buffer = buf;
        return node;
    }

    // Curva de distorsión waveshaper (para punch/crunch en impactos)
    function makeDistortionCurve(amount = 80) {
        const n = 512;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    // ── Ruido rosa (pink noise) — más cálido y natural que blanco ─────────────
    function pinkNoise(duration) {
        const c       = getCtx();
        const bufSize = Math.ceil(c.sampleRate * duration);
        const buf     = c.createBuffer(1, bufSize, c.sampleRate);
        const d       = buf.getChannelData(0);
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
        for (let i = 0; i < bufSize; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
            b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
            b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
            d[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11;
            b6 = w * 0.115926;
        }
        const src = c.createBufferSource();
        src.buffer = buf;
        return src;
    }

    // ── Ruido blanco simple ────────────────────────────────────────────────────
    function whiteNoise(duration) {
        const c       = getCtx();
        const bufSize = Math.ceil(c.sampleRate * duration);
        const buf     = c.createBuffer(1, bufSize, c.sampleRate);
        const d       = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        return src;
    }

    // ── Primitiva de tono con envelope ADSR ───────────────────────────────────
    // jitter = variación aleatoria de frecuencia (0.0–0.05)
    function tone(freq, type, dur, vol, delay=0, attack=0.004, release=null, jitter=0, toReverb=false) {
        const c   = getCtx();
        const t   = c.currentTime + delay;
        const rel = release !== null ? release : dur * 0.85;

        const osc  = c.createOscillator();
        const gain = c.createGain();

        osc.type = type;
        const jf  = freq * (1 + (Math.random() - 0.5) * jitter);
        osc.frequency.setValueAtTime(jf, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol, t + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, t + rel);

        osc.connect(gain);
        gain.connect(toReverb ? reverbWet : reverbDry);

        osc.start(t);
        osc.stop(t + rel + 0.1);
    }

    // Tono con barrido de frecuencia (sweep)
    function sweep(fStart, fEnd, type, dur, vol, delay=0, toReverb=false) {
        const c   = getCtx();
        const t   = c.currentTime + delay;
        const osc = c.createOscillator();
        const gn  = c.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(fStart, t);
        osc.frequency.exponentialRampToValueAtTime(fEnd, t + dur * 0.9);

        gn.gain.setValueAtTime(vol, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gn);
        gn.connect(toReverb ? reverbWet : reverbDry);
        osc.start(t); osc.stop(t + dur + 0.1);
    }

    // ── SÍNTESIS FM ───────────────────────────────────────────────────────────
    // Carrier oscilado por Modulator → timbres tipo trompeta / campana / órgano
    // modRatio: relación de frecuencia modulator/carrier (1=unísono, 2=octava, 3=5ª…)
    // modDepth: cuánto mueve la modulación la frecuencia (Hz)
    function fm(carrierFreq, modRatio, modDepth, type, dur, vol, delay=0, toReverb=false) {
        const c   = getCtx();
        const t   = c.currentTime + delay;

        const carrier  = c.createOscillator();
        const modulator= c.createOscillator();
        const modGain  = c.createGain();
        const outGain  = c.createGain();

        carrier.type   = type;
        carrier.frequency.setValueAtTime(carrierFreq, t);
        modulator.frequency.setValueAtTime(carrierFreq * modRatio, t);

        // La profundidad de modulación decrece con el tiempo (más brillante al inicio)
        modGain.gain.setValueAtTime(modDepth, t);
        modGain.gain.exponentialRampToValueAtTime(modDepth * 0.05, t + dur * 0.6);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency); // ← aquí ocurre la FM

        outGain.gain.setValueAtTime(0.001, t);
        outGain.gain.linearRampToValueAtTime(vol, t + 0.005);
        outGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        carrier.connect(outGain);
        outGain.connect(toReverb ? reverbWet : reverbDry);

        carrier.start(t);  carrier.stop(t + dur + 0.1);
        modulator.start(t); modulator.stop(t + dur + 0.1);
    }

    // ── Ruido con filtro + envelope ────────────────────────────────────────────
    function filteredNoise(type_noise, filterType, filterFreq, filterQ, dur, vol, delay=0, toReverb=false) {
        const c      = getCtx();
        const t      = c.currentTime + delay;
        const src    = type_noise === 'pink' ? pinkNoise(dur + 0.05) : whiteNoise(dur + 0.05);
        const filter = c.createBiquadFilter();
        const gn     = c.createGain();

        filter.type            = filterType;
        filter.frequency.value = filterFreq;
        if (filterQ) filter.Q.value = filterQ;

        gn.gain.setValueAtTime(vol, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);

        src.connect(filter);
        filter.connect(gn);
        gn.connect(toReverb ? reverbWet : reverbDry);

        src.start(t); src.stop(t + dur + 0.1);
    }

    // Impacto con distorsión (WaveShaperNode) para punch real
    function distortedBass(freq, dur, vol, delay=0) {
        const c       = getCtx();
        const t       = c.currentTime + delay;
        const osc     = c.createOscillator();
        const shaper  = c.createWaveShaper();
        const gn      = c.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.35, t + dur * 0.7);

        shaper.curve = makeDistortionCurve(120);
        shaper.oversample = '4x';

        gn.gain.setValueAtTime(vol, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(shaper);
        shaper.connect(gn);
        gn.connect(reverbDry);

        osc.start(t); osc.stop(t + dur + 0.1);
    }

    // ════════════════════════════════════════════════════════════════════════
    //   SONIDOS DEL JUEGO — v3
    // ════════════════════════════════════════════════════════════════════════

    return {

        init() { boot(); },

        // ── Hover sobre carta ──────────────────────────────────────────────
        // Swish de papel: mínimo, apenas perceptible, natural
        cardHover() {
            filteredNoise('pink', 'highpass', 5500, 1.0, 0.05, 0.12);
            tone(1600, 'sine', 0.06, 0.04, 0.01, 0.002, 0.06, 0.02);
        },

        // ── Selección de carta ─────────────────────────────────────────────
        // Capas: ataque nítido + cuerpo grave distorsionado + resonancia FM
        cardClick() {
            // Capa 1: Slap de superficie (ruido blanco muy corto, agudo)
            filteredNoise('white', 'bandpass', 3500, 6.0, 0.04, 0.50);
            // Capa 2: Thud grave con distorsión (da el peso físico)
            distortedBass(110, 0.18, 0.65);
            // Capa 3: Sub-bass punch (sensación de impacto en el pecho)
            filteredNoise('pink', 'lowpass', 250, 0.8, 0.12, 0.55);
            // Capa 4: Resonancia FM breve (da cuerpo / tono)
            fm(380, 2.5, 180, 'sine', 0.15, 0.30, 0.005);
        },

        // ── Carta rechazada ────────────────────────────────────────────────
        // Desliz con tono descendente (feedback negativo sutil)
        cardReject() {
            filteredNoise('pink', 'bandpass', 1000, 2.0, 0.12, 0.18);
            sweep(420, 200, 'sine', 0.16, 0.18, 0.02);
        },

        // ── Medidor en zona crítica ────────────────────────────────────────
        // Latido de corazón: dos golpes graves, tipo heartbeat cinématico
        meterCritical() {
            [0, 0.70, 1.40, 2.10].forEach(d => {
                // Primer latido (fuerte)
                filteredNoise('pink', 'lowpass', 170, 0.6, 0.08, 0.55, d);
                distortedBass(72, 0.22, 0.60, d);
                // Segundo latido (eco, más suave)
                filteredNoise('pink', 'lowpass', 150, 0.6, 0.07, 0.35, d + 0.13);
                distortedBass(62, 0.18, 0.40, d + 0.13);
            });
        },

        // ── Nueva ronda ────────────────────────────────────────────────────
        // Whoosh cinematográfico barrido + campanas FM
        newRound() {
            // Whoosh ascendente (sweep de filtro sobre ruido rosa)
            const c   = getCtx();
            const t   = c.currentTime;
            const src = pinkNoise(0.45);
            const filter = c.createBiquadFilter();
            const gn     = c.createGain();
            filter.type  = 'bandpass';
            filter.frequency.setValueAtTime(300, t);
            filter.frequency.exponentialRampToValueAtTime(3500, t + 0.45);
            filter.Q.value = 2.5;
            gn.gain.setValueAtTime(0, t);
            gn.gain.linearRampToValueAtTime(0.30, t + 0.08);
            gn.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            src.connect(filter); filter.connect(gn); gn.connect(reverbWet);
            src.start(t); src.stop(t + 0.5);

            // Campanas FM al final del whoosh
            fm(880,  2.0, 320, 'sine', 0.55, 0.30, 0.38, true);
            fm(1320, 2.0, 480, 'sine', 0.45, 0.22, 0.46, true);
        },

        // ── Ascenso de cargo ───────────────────────────────────────────────
        // Fanfarria orquestal con FM (tipo trompeta/corno) + reverb
        ascend() {
            // Ruido de ambiente (crowd cheering simulado)
            filteredNoise('pink', 'bandpass', 800, 0.3, 1.8, 0.08, 0.0, true);

            // Arpegio triunfal FM (carrierFreq, modRatio=1.5→ sonido de viento-metal)
            const arp = [523, 659, 784, 1047, 1319];
            arp.forEach((f, i) => {
                fm(f, 1.5, f * 0.5, 'sawtooth', 0.45, 0.35, i * 0.12, true);
                // Octava inferior para cuerpo
                fm(f * 0.5, 2.0, f * 0.2, 'sine', 0.35, 0.18, i * 0.12, true);
            });

            // Acorde final grandioso
            [523, 659, 784, 1047].forEach(f => {
                fm(f, 1.5, f * 0.6, 'triangle', 1.2, 0.30, 0.65, true);
            });
            filteredNoise('white', 'highpass', 5000, 0.5, 0.4, 0.12, 0.68, true);
        },

        // ── Game Over ──────────────────────────────────────────────────────
        // Caída cinematográfica: boom distorsionado + requiem FM con reverb total
        gameOver() {
            // Boom de apertura
            distortedBass(90, 1.0, 0.70);
            filteredNoise('pink', 'lowpass', 200, 0.4, 0.9, 0.45, 0.0, true);

            // Melodía descendente cromática en FM (oscura, tipo réquiem)
            const fall = [494, 466, 440, 415, 392, 370, 349, 294];
            fall.forEach((f, i) => {
                fm(f, 1.0, f * 0.8, 'sawtooth', 0.55, 0.28, 0.10 + i * 0.24, true);
                fm(f * 0.5, 0.5, f * 0.3, 'sine', 0.50, 0.18, 0.10 + i * 0.24, true);
            });

            // Golpe final profundo
            distortedBass(42, 2.0, 0.65, 2.1);
            filteredNoise('pink', 'lowpass', 130, 0.3, 1.5, 0.35, 2.1, true);
        },

        // ── Victoria final ─────────────────────────────────────────────────
        // Fanfarria épica de 2 partes: melodía rítmica + acorde de cierre grandioso
        victory() {
            // Parte 1 — Melodía rítmica tipo fanfarria de trompeta (FM)
            const theme  = [523, 523, 523, 659, 523, 659, 784, 784, 1047];
            const timing = [0, 0.13, 0.26, 0.40, 0.60, 0.73, 0.87, 1.05, 1.20];
            const durs   = [0.10, 0.10, 0.10, 0.18, 0.10, 0.10, 0.16, 0.14, 0.60];

            theme.forEach((f, i) => {
                fm(f,     1.5, f*0.6, 'sawtooth', durs[i]+0.05, 0.32, timing[i], true);
                fm(f*0.5, 2.0, f*0.2, 'sine',     durs[i]+0.05, 0.16, timing[i], true);
            });

            // Parte 2 — Acorde grandioso final (1.9s desde el inicio)
            const T = 1.90;
            [523, 659, 784, 1047, 1568].forEach(f => {
                fm(f, 1.5, f*0.7, 'triangle', 2.2, 0.28, T, true);
            });
            distortedBass(65, 2.2, 0.55, T);
            filteredNoise('white', 'highpass', 4500, 0.5, 0.7, 0.15, T, true);
        },

        // ── Botones de UI ──────────────────────────────────────────────────
        // Click moderno: transiente de ruido + tono FM corto
        uiClick() {
            filteredNoise('white', 'bandpass', 2000, 8.0, 0.03, 0.22);
            fm(700, 3.0, 200, 'sine', 0.07, 0.14, 0.008);
        },

        // ── Inicio del juego ───────────────────────────────────────────────
        // Intro cinematográfica: whoosh + fanfarria FM corta de bienvenida
        startGame() {
            // Whoosh de arranque
            filteredNoise('pink', 'bandpass', 500, 1.5, 0.55, 0.22, 0.0, true);
            filteredNoise('white', 'highpass', 4000, 0.5, 0.25, 0.10, 0.12);

            // 3 notas FM ascendentes
            fm(392, 2.0, 200, 'sawtooth', 0.18, 0.32, 0.22, true);
            fm(523, 2.0, 280, 'sawtooth', 0.18, 0.35, 0.42, true);
            fm(659, 2.0, 360, 'sawtooth', 0.45, 0.42, 0.62, true);

            // Acorde de bienvenida
            [523, 659, 784].forEach(f => {
                fm(f, 1.5, f*0.5, 'triangle', 1.0, 0.28, 0.90, true);
            });
            distortedBass(130, 1.1, 0.45, 0.90);
        }
    };

})();
