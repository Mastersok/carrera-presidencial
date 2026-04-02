/**
 * AUDIO.JS v1.0 — Motor de Sonido
 * Síntesis procedural con Web Audio API. Sin archivos externos.
 * Todos los sonidos se generan matemáticamente en tiempo real.
 */

const AudioManager = (() => {

    let ctx = null;

    // Obtiene (o crea) el AudioContext — debe llamarse tras interacción del usuario
    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // ── Primitiva: oscilador simple con envelope ──────────
    function playOsc(freq, type, duration, volume, delay = 0) {
        const c = getCtx();
        const osc  = c.createOscillator();
        const gain = c.createGain();

        osc.connect(gain);
        gain.connect(c.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime + delay);

        gain.gain.setValueAtTime(0.001, c.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + duration + 0.05);
    }

    // ── Primitiva: barrido de frecuencia ─────────────────
    function playSweep(freqStart, freqEnd, type, duration, volume, delay = 0) {
        const c = getCtx();
        const osc  = c.createOscillator();
        const gain = c.createGain();

        osc.connect(gain);
        gain.connect(c.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, c.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + delay + duration);

        gain.gain.setValueAtTime(volume, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + duration + 0.05);
    }

    // ── Primitiva: acorde (varias notas simultáneas) ──────
    function playChord(freqs, type, duration, volume, delay = 0) {
        freqs.forEach(f => playOsc(f, type, duration, volume / freqs.length, delay));
    }

    // ── Primitiva: secuencia de notas ─────────────────────
    function playSequence(notes, type, noteDur, volume, startDelay = 0, gap = 0.02) {
        let t = startDelay;
        notes.forEach(freq => {
            playOsc(freq, type, noteDur, volume, t);
            t += noteDur + gap;
        });
    }

    // ════════════════════════════════════════════════════
    //   SONIDOS DEL JUEGO
    // ════════════════════════════════════════════════════

    return {

        // Inicializar contexto tras gesto del usuario
        init() { getCtx(); },

        // ── Hover sobre una carta ─────────────────────────
        // Tick suave y breve
        cardHover() {
            playOsc(700, 'sine', 0.06, 0.07);
        },

        // ── Selección de carta ────────────────────────────
        // Golpe seco + barrido descendente (sensación de "acción")
        cardClick() {
            playSweep(350, 80,  'sine',     0.20, 0.45);
            playSweep(900, 300, 'sawtooth', 0.08, 0.18, 0);
        },

        // ── Carta rechazada (las que NO se eligieron) ─────
        cardReject() {
            playSweep(400, 200, 'sine', 0.12, 0.10);
        },

        // ── Medidor entra en zona crítica ─────────────────
        // Alarma de dos tonos, urgente
        meterCritical() {
            playOsc(880, 'square', 0.14, 0.22, 0.00);
            playOsc(660, 'square', 0.14, 0.22, 0.18);
            playOsc(880, 'square', 0.14, 0.22, 0.36);
            playOsc(660, 'square', 0.14, 0.22, 0.54);
        },

        // ── Cambio de ronda ───────────────────────────────
        // Whoosh ascendente suave
        newRound() {
            playSweep(250, 500, 'sine', 0.15, 0.12);
            playOsc(500, 'sine', 0.10, 0.10, 0.12);
        },

        // ── Ascenso de cargo ──────────────────────────────
        // Fanfarria corta: cuatro notas triunfales
        ascend() {
            // Do Mi Sol Do (arpegio ascendente)
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                const dur = i === 3 ? 0.5 : 0.13;
                playOsc(freq, 'triangle', dur, 0.40, i * 0.14);
            });
            // Acorde final
            playChord([523, 659, 784], 'sine', 0.6, 0.35, 0.60);
        },

        // ── Game Over ────────────────────────────────────
        // Descenso dramático en menor
        gameOver() {
            // Melodía descendente cromática
            const notes = [523, 466, 440, 415, 392];
            notes.forEach((freq, i) => {
                playOsc(freq, 'sawtooth', 0.35, 0.28, i * 0.28);
            });
            // Golpe grave final
            playSweep(150, 40, 'sine', 0.6, 0.50, notes.length * 0.28);
        },

        // ── Victoria final (Presidente) ───────────────────
        // Fanfarria épica completa
        victory() {
            const melody = [523, 523, 523, 659, 523, 659, 784, 1047];
            const durs   = [0.1, 0.1, 0.1, 0.25, 0.1, 0.1, 0.2, 0.6];
            let t = 0;
            melody.forEach((freq, i) => {
                playOsc(freq, 'triangle', durs[i], 0.45, t);
                t += durs[i] + 0.02;
            });
            // Acorde triunfal al final
            playChord([523, 659, 784, 1047], 'sine', 0.8, 0.5, t);
        },

        // ── Click de botones de UI ────────────────────────
        uiClick() {
            playOsc(440, 'sine', 0.08, 0.15);
            playOsc(550, 'sine', 0.06, 0.10, 0.05);
        },

        // ── Inicio del juego (botón JUGAR) ────────────────
        startGame() {
            playSweep(200, 500, 'sine', 0.3, 0.20);
            playOsc(500, 'triangle', 0.25, 0.30, 0.25);
            playOsc(750, 'triangle', 0.20, 0.25, 0.45);
        }
    };

})();
