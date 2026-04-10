/**
 * ENGINE.JS v3.0 - Núcleo lógico del juego "Carrera Presidencial".
 * Incluye: Perfiles, Semillas, Sistema de Promesas, Eventos Aleatorios, Finales Múltiples.
 */

// ── UTILIDADES DE SEMILLA ────────────────────────────────────────────────────

/** Mulberry32 — PRNG determinista de alta calidad */
function createSeededRNG(seed) {
    let s = seed >>> 0;
    return function () {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function generateSeed() {
    return Math.floor(Math.random() * 2176782335) + 1;
}

function seedToCode(seed) {
    return seed.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

function codeToSeed(code) {
    const n = parseInt((code || '').toUpperCase(), 36);
    return (isNaN(n) || n <= 0) ? generateSeed() : n;
}

function getDailySeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ── CONSTANTES DE DATOS ──────────────────────────────────────────────────────
const ROLES = [
    {
        id: "candidato",
        name: "Candidato a Alcalde",
        totalRounds: 8,
        minThreshold: 40,
        tempMeters: [
            { id: "pop",      name: "Popularidad",         icon: "📊", desc: "Qué tan conocido y querido eres entre los votantes." },
            { id: "dinero",   name: "Dinero de Campaña",   icon: "💰", desc: "Fondos disponibles para publicidad, eventos y sobornos." },
            { id: "imagen",   name: "Imagen Pública",       icon: "📰", desc: "Tu reputación ante los medios y la opinión pública." },
            { id: "base",     name: "Apoyo Base",           icon: "✊", desc: "Fidelidad de tus votantes más leales y comprometidos." },
            { id: "cred",     name: "Credibilidad",         icon: "🎯", desc: "Cuánto confían en tus promesas y declaraciones." },
            { id: "momentum", name: "Momentum",             icon: "🔥", desc: "Impulso y energía de tu campaña. Pierdes velocidad sin acción." },
            { id: "legit",    name: "Legitimidad",          icon: "⚖️", desc: "Percepción de que eres un candidato válido y serio." },
            { id: "prof",     name: "Profesionalismo",      icon: "🎩", desc: "Capacidad técnica percibida para ejercer el cargo." }
        ]
    },
    {
        id: "alcalde",
        name: "Alcalde",
        totalRounds: 9,
        minThreshold: 50,
        tempMeters: [
            { id: "satis",  name: "Satisfacción Ciudadana",  icon: "😊", desc: "Nivel de contento general de la población con tu gestión." },
            { id: "presup", name: "Presupuesto Municipal",    icon: "💰", desc: "Fondos públicos disponibles para obras y servicios." },
            { id: "estab",  name: "Estabilidad Local",        icon: "⚖️", desc: "Orden social y político en tu distrito." },
            { id: "segur",  name: "Seguridad Pública",        icon: "🚔", desc: "Percepción de seguridad y control del crimen." },
            { id: "salud",  name: "Salud Pública",            icon: "🏥", desc: "Estado del sistema sanitario local y bienestar general." },
            { id: "educa",  name: "Educación Local",          icon: "🎓", desc: "Calidad y acceso a la educación en tu municipio." },
            { id: "medio",  name: "Medio Ambiente",           icon: "🌿", desc: "Políticas verdes, contaminación y áreas protegidas." },
            { id: "infra",  name: "Infraestructura",          icon: "🏗️", desc: "Estado de caminos, puentes, edificios públicos." }
        ]
    },
    {
        id: "diputado",
        name: "Diputado",
        totalRounds: 9,
        minThreshold: 60,
        tempMeters: [
            { id: "inf_dist",    name: "Influencia Distrital",  icon: "🗺️", desc: "Tu peso político en tu distrito de origen." },
            { id: "apoyo_part",  name: "Apoyo Partidario",      icon: "🤝", desc: "Respaldo de tu partido político y sus miembros." },
            { id: "pod_legis",   name: "Poder Legislativo",     icon: "📜", desc: "Capacidad de impulsar y aprobar leyes en el congreso." },
            { id: "transp",      name: "Transparencia",         icon: "🔍", desc: "Nivel de rendición de cuentas y honestidad percibida." },
            { id: "presup_asig", name: "Presupuesto Asignado",  icon: "💼", desc: "Recursos fiscales bajo tu control directo." },
            { id: "img_nac",     name: "Imagen Nacional",       icon: "📺", desc: "Reconocimiento y percepción a nivel nacional." },
            { id: "coalic",      name: "Coaliciones",           icon: "🏛️", desc: "Alianzas políticas activas con otros bloques." },
            { id: "bal_reg",     name: "Balance Regional",      icon: "⚖️", desc: "Equilibrio de poder entre las distintas regiones." }
        ]
    },
    {
        id: "senador",
        name: "Senador",
        totalRounds: 10,
        minThreshold: 65,
        tempMeters: [
            { id: "pod_nac",     name: "Poder Nacional",            icon: "🏛️", desc: "Influencia real sobre decisiones de State." },
            { id: "resp_inst",   name: "Respeto Institucional",     icon: "📋", desc: "Credibilidad ante las instituciones del país." },
            { id: "rel_part",    name: "Relaciones Partidarias",    icon: "🤝", desc: "Solidez de tus alianzas dentro y fuera del partido." },
            { id: "vis_int",     name: "Visión Internacional",      icon: "🌍", desc: "Percepción de tu capacidad diplomática y visión global." },
            { id: "efec_legis",  name: "Efectividad Legislativa",   icon: "📊", desc: "Leyes aprobadas y proyectos completados con éxito." },
            { id: "inf_med",     name: "Influencia Mediática",      icon: "🎤", desc: "Control y presencia en los medios de comunicación." },
            { id: "peso_pol",    name: "Peso Político",             icon: "⚖️", desc: "Tu importancia en la balanza del poder nacional." },
            { id: "legado",      name: "Legado en Construcción",    icon: "🏆", desc: "Qué recordarán de tu gestión las generaciones futuras." }
        ]
    },
    {
        id: "presidente",
        name: "Presidente",
        totalRounds: 10,
        minThreshold: 70,
        tempMeters: [
            { id: "eco_nac",   name: "Economía Nacional",      icon: "📈", desc: "Salud del PIB, empleo, inflación y comercio exterior." },
            { id: "apoyo_pol", name: "Apoyo Político",         icon: "🟢", desc: "Respaldo del congreso, partidos y aliados clave." },
            { id: "estab_soc", name: "Estabilidad Social",     icon: "⚖️", desc: "Paz social, ausencia de protestas y conflictos internos." },
            { id: "img_int",   name: "Imagen Internacional",   icon: "🌐", desc: "Cómo te perciben otros países y organismos internacionales." },
            { id: "seg_nac",   name: "Seguridad Nacional",     icon: "🛡️", desc: "Defensa del territorio, inteligencia y orden público." },
            { id: "fin_pub",   name: "Finanzas Públicas",      icon: "💰", desc: "Deuda, presupuesto y recaudación fiscal." },
            { id: "des_sost",  name: "Desarrollo Sostenible",  icon: "🌱", desc: "Políticas ecológicas, energías renovables y planificación." },
            { id: "inst_sol",  name: "Instituciones Sólidas",  icon: "🏛️", desc: "Independencia judicial, democracia y estado de derecho." }
        ]
    }
];

const PERMANENT_METERS = [
    { id: "cap_pol",  name: "Capital Político",   icon: "👑", desc: "Tu reserva de poder e influencia acumulada. Reduce en 10% el impacto negativo de decisiones." },
    { id: "int_eti",  name: "Integridad Ética",   icon: "⚖️", desc: "Tu brújula moral. Reduce la probabilidad de enfrentar crisis y escándalos." },
    { id: "red_cli",  name: "Red Clientelar",     icon: "🕸️", desc: "Tu red de contactos e intercambio de favores. Aumenta recompensas económicas." },
    { id: "exp_tec",  name: "Experiencia Técnica",icon: "📚", desc: "Tu conocimiento del aparato estatal. Previene desgaste por el paso del tiempo." },
    { id: "car_pop",  name: "Carisma Popular",    icon: "⭐", desc: "Tu conexión emocional con el pueblo. Aumenta el rendimiento de las decisiones populares." }
];

// ── PERFILES INICIALES ───────────────────────────────────────────────────────
const PROFILES = [
    {
        id: "millonario",
        name: "Hijo de Millonario",
        icon: "💎",
        desc: "Partiste con ventaja económica, pero el pueblo desconfía.",
        tagPos: "+20% Dinero",
        tagNeg: "−10% Credibilidad",
        meterBonuses:   { dinero: 20, presup: 20, presup_asig: 20, fin_pub: 20 },
        meterPenalties: { cred: 10, transp: 10, resp_inst: 10, legit: 10 },
        permBonuses:    { red_cli: 15 }
    },
    {
        id: "sindical",
        name: "Líder Sindical",
        icon: "✊",
        desc: "Las bases te adoran, pero los medios te temen.",
        tagPos: "+20% Apoyo Base",
        tagNeg: "−10% Imagen",
        meterBonuses:   { base: 20, apoyo_part: 20, satis: 20, estab_soc: 20, rel_part: 20 },
        meterPenalties: { imagen: 10, img_nac: 10, inf_med: 10, vis_int: 10 },
        permBonuses:    { car_pop: 15 }
    },
    {
        id: "tecnocrata",
        name: "Tecnócrata",
        icon: "🎓",
        desc: "Sabes gobernar, pero el pueblo no sabe quién eres.",
        tagPos: "+20% Profesionalismo",
        tagNeg: "−10% Popularidad",
        meterBonuses:   { prof: 20, efec_legis: 20, resp_inst: 20, inst_sol: 20 },
        meterPenalties: { pop: 10, satis: 10, inf_med: 10, img_nac: 10 },
        permBonuses:    { exp_tec: 15 }
    },
    {
        id: "populista",
        name: "Populista Nato",
        icon: "📣",
        desc: "El pueblo te ama. Tu presupuesto, no tanto.",
        tagPos: "+25% Popularidad",
        tagNeg: "−15% Presupuesto",
        meterBonuses:   { pop: 25, satis: 25, momentum: 20, apoyo_pol: 20 },
        meterPenalties: { dinero: 15, presup: 15, presup_asig: 15, fin_pub: 15 },
        permBonuses:    { car_pop: 15 }
    }
];

// ── EVENTOS ALEATORIOS ───────────────────────────────────────────────────────
const RANDOM_EVENTS = [
    {
        id: "ev01", icon: "📰",
        title: "¡ESCÁNDALO DE PROPORCIONES BÍBLICAS!",
        desc: "Un periodista de investigación publicó ALGO. No está claro qué exactamente, pero suena muy mal. El país pide tu cabeza. O al menos un comunicado.",
        optA: { label: "🎤 Confrontar en vivo (con cámara y todo)", hint: "Alto riesgo, alto espectáculo",     posAmount: 18, negAmount: 22 },
        optB: { label: "🤫 Manejar en silencio y rezar",           hint: "Menor daño, menor escena",          posAmount: 8,  negAmount: 12 }
    },
    {
        id: "ev02", icon: "💰",
        title: "¡LA ECONOMÍA DIJO 'NO MÁS'!",
        desc: "Los mercados colapsaron. El FMI llamó. Tu contador lloró. El pueblo no entiende qué pasó, pero sabe que fue tu culpa.",
        optA: { label: "✂️ Austeridad de emergencia (sin café ejecutivo)", hint: "Recuperas fondos, sacrificas comodidades", posAmount: 22, negAmount: 18 },
        optB: { label: "💸 Gastar más para salir del hoyo",               hint: "Clásica estrategia. Clásicos resultados.", posAmount: 14, negAmount: 25 }
    },
    {
        id: "ev03", icon: "✊",
        title: "¡HUELGA GENERAL! ¡TODOS PARAN! ¡CAOS!",
        desc: "Los trabajadores pararon todo. El camionero paró. El barista paró. Hasta el tipo que recarga los extinguidores paró. El país está paralizado.",
        optA: { label: "🤝 Negociar con los líderes sindicales", hint: "Cedes algo, obtienes paz (temporalmente)", posAmount: 20, negAmount: 15 },
        optB: { label: "🚨 Declarar estado de emergencia",       hint: "Orden inmediata. Popularidad inmolada.",  posAmount: 10, negAmount: 8  }
    },
    {
        id: "ev04", icon: "🌪️",
        title: "¡TERREMOTO! ¡LA NATURALEZA NO RESPETA AGENDAS!",
        desc: "Un sismo sacudió todo. Tu agenda está cancelada. Las cámaras apuntan a los escombros y a ti, alternadamente.",
        optA: { label: "🚁 Respuesta humanitaria total (y visible)", hint: "Héroe de portada, presupuesto en llamas", posAmount: 26, negAmount: 20 },
        optB: { label: "📋 Respuesta coordinada y discreta",        hint: "Ahorras recursos, pero las críticas llegan igual", posAmount: 12, negAmount: 10 }
    },
    {
        id: "ev05", icon: "🤝",
        title: "¡TU MAYOR RIVAL QUIERE SER TU AMIGO!",
        desc: "El político que más te ha atacado aparece con la mano extendida. Propone una alianza. Sonríe. Desconfías.",
        optA: { label: "😬 Aceptar la alianza (con recelo)",    hint: "Más poder, más compromisos incómodos", posAmount: 22, negAmount: 12 },
        optB: { label: "🙅 Rechazarlo y actuar solo",           hint: "Principios intactos, aliados perdidos",posAmount: 8,  negAmount: 18 }
    },
    {
        id: "ev06", icon: "🎙️",
        title: "¡TU COLABORADOR LA CAGÓ EN VIVO!",
        desc: "En cadena nacional, tu asesor dijo AQUELLO. No repetiremos qué. Pero todo el país ya lo sabe. Y pide explicaciones.",
        optA: { label: "🪓 Desvincularlo en tiempo récord",  hint: "Imagen recuperada, aliado perdido",    posAmount: 20, negAmount: 14 },
        optB: { label: "🛡️ Defenderlo (y enterrarte con él)",hint: "Lealtad admirable, consecuencias predecibles", posAmount: 6, negAmount: 24 }
    },
    {
        id: "ev07", icon: "🔍",
        title: "¡EL JUEZ TE INVESTIGA!",
        desc: "Un juez abrió una investigación sobre 'presuntas irregularidades'. La oposición festeja. Tu abogado no contesta.",
        optA: { label: "📂 Cooperar plenamente (y dramáticamente)", hint: "Honestidad cara pero luminosa",              posAmount: 24, negAmount: 16 },
        optB: { label: "⚔️ Atacar la independencia judicial",       hint: "Ganas tiempo, pierdes la moral del país",   posAmount: 8,  negAmount: 26 }
    },
    {
        id: "ev08", icon: "🌍",
        title: "¡EL MUNDO TE SEÑALA CON EL DEDO!",
        desc: "Un organismo internacional con siglas que nadie recuerda criticó una de tus políticas. La prensa lo amplificó mil veces.",
        optA: { label: "🏳️ Ceder y reformar (con cara seria)", hint: "Legitimidad exterior, base interior furiosa", posAmount: 18, negAmount: 14 },
        optB: { label: "🦅 Defender soberanía a capa y espada", hint: "Tu base te ovaciona, el FMI te anota",         posAmount: 10, negAmount: 20 }
    },
    {
        id: "ev09", icon: "🏛️",
        title: "¡MOCIÓN DE CENSURA! ¡AHORA SÍ TE FUERON!",
        desc: "La oposición presentó una moción de censura. Tienes exactamente 24 horas para no quedar en el olvido histórico.",
        optA: { label: "🍪 Comprar voluntades (políticamente hablando)", hint: "Sobrevives, pero debes muchos favores", posAmount: 20, negAmount: 18 },
        optB: { label: "📣 Apelar al pueblo directamente",               hint: "Épico si funciona. Catastrófico si no.",posAmount: 28, negAmount: 24 }
    },
    {
        id: "ev10", icon: "💣",
        title: "¡FILTRACIÓN MASIVA! ¡TODO SALIÓ A LA LUZ!",
        desc: "Documentos internos de tu gobierno circulan en Twitter, TikTok y hasta en el grupo de WhatsApp de los abuelitos. El escándalo es total.",
        optA: { label: "😔 Reconocerlo y pedir disculpas (en llorar)", hint: "Pierdes ahora, quizás sobrevives después", posAmount: 16, negAmount: 20 },
        optB: { label: "🤥 Negar todo y contraatacar al mensajero",     hint: "Táctico, clásico, predeciblemente malo",  posAmount: 10, negAmount: 28 }
    }
];

// ── TEXTOS DE FINALES ────────────────────────────────────────────────────────
const VICTORY_ENDINGS = {
    estadista: {
        title: "EL ESTADISTA",
        icon: "🏛️",
        headline: "GOBERNÓ CON EQUILIBRIO: UNO EN UN MILLÓN",
        article: "Parece mentira, pero lo logró. En un país donde 'político honesto' suena a contradicción, este mandatario demostró que gobernar sin incendiar todo es posible. Su gabinete fue sospechosamente funcional. Sus decisiones, irritantemente razonables. La oposición nunca supo bien cómo atacarlo. Los historiadores aún debaten si fue talento o pura suerte descarada.",
        quote: "«Gobernar es servir — y quien lo olvida, no merece gobernar.»"
    },
    caudillo: {
        title: "EL CAUDILLO POPULISTA",
        icon: "📣",
        headline: "AMADO POR LAS MASAS, TEMIDO POR LAS ÉLITES",
        article: "El pueblo lo adoraba. Las élites lo detestaban. Los periodistas necesitaban medicamentos para dormir. Su discurso llegaba al corazón de las masas con la precisión de un misil emocional y el presupuesto de diez misiles reales. ¿Que el déficit fiscal creció? Detalles. ¿Que las instituciones crujían? Ruidos normales. Lo importante es que en cada mitin, la gente lloraba de emoción. Eso no se improvisa.",
        quote: "«El pueblo no se equivoca — y el pueblo me eligió.»"
    },
    oligarca: {
        title: "EL OLIGARCA CORRUPTO",
        icon: "🕸️",
        headline: "LLEGÓ SIN NADA. SE FUE CON TODO. MISTERIO.",
        article: "Las auditorías encontraron 'irregularidades'. Los contratos tenían curiosos beneficiarios con apellidos familiares. La transparencia, aunque prometida en cada discurso, fue más bien una metáfora. Llegó al poder con tres trajes. Se fue con diecisiete propiedades en cuatro países. Nadie sabe exactamente cómo. Él tampoco recuerda. Su abogado tampoco. Raro.",
        quote: "«En política, el ingenuo pierde. Yo no perdí.»"
    },
    dictador: {
        title: "EL DICTADOR DEMOCRÁTICO",
        icon: "🛡️",
        headline: "ORDEN TOTAL: LAS CALLES TRANQUILAS (NADIE PROTESTABA YA)",
        article: "Las calles estaban impecables. Nadie protestaba. Nadie gritaba. Nadie... hablaba muy fuerte en realidad. La seguridad era absoluta. Los medios eran disciplinados. La oposición era, digamos, 'reducida'. Todo esto, claro, dentro del marco legal vigente, que él mismo había actualizado oportunamente. ¿Democracia? Técnicamente sí. ¿Qué tipo de democracia? Esa es otra pregunta.",
        quote: "«El orden no se pide — se impone.»"
    }
};

// ── ESTADO GLOBAL (GAME STATE) ───────────────────────────────────────────────
const GameState = {
    roleIndex: 0,
    currentRound: 1,
    activeMeters: [],
    permanentMeter: null,
    activePromises: [],
    runStatus: "active",
    // Semilla y perfil
    seed: 0,
    rng: Math.random,
    selectedProfile: null,
    isDailyChallenge: false,
    // Métricas para final narrativo
    corruptionScore: 0,
    popularityScore: 0,
    controlScore: 0,
    // Eventos aleatorios
    nextEventRound: 999,
    pendingEvent: null,

    startNewRun: function (seed, profile, isDaily) {
        this.roleIndex = 0;
        this.runStatus = "active";
        this.seed = seed || generateSeed();
        this.rng = createSeededRNG(this.seed);
        this.selectedProfile = profile || null;
        this.isDailyChallenge = isDaily || false;
        this.corruptionScore = 0;
        this.popularityScore = 0;
        this.controlScore = 0;

        const permIdx = Math.floor(this.rng() * PERMANENT_METERS.length);
        const perm = PERMANENT_METERS[permIdx];
        this.permanentMeter = { ...perm, value: 50 };

        // Bonus de perfil al medidor permanente
        if (this.selectedProfile && this.selectedProfile.permBonuses) {
            const bonus = this.selectedProfile.permBonuses[perm.id] || 0;
            if (bonus) this.permanentMeter.value = Math.min(100, 50 + bonus);
        }

        this.startRole();
    },

    startRole: function () {
        this.currentRound = 1;
        this.activePromises = [];
        this.runStatus = "active";
        this.pendingEvent = null;

        const roleData = ROLES[this.roleIndex];
        const shuffledMeters = [...roleData.tempMeters].sort(() => this.rng() - 0.5);
        const selected = shuffledMeters.slice(0, 3);

        this.activeMeters = selected.map(m => {
            let startVal = 50;
            if (this.selectedProfile) {
                const bonus   = (this.selectedProfile.meterBonuses   || {})[m.id] || 0;
                const penalty = (this.selectedProfile.meterPenalties || {})[m.id] || 0;
                startVal = Math.min(100, Math.max(10, 50 + bonus - penalty));
            }
            return { id: m.id, name: m.name, icon: m.icon, desc: m.desc, value: startVal };
        });

        // Programar primer evento aleatorio: ronda 3 o 4
        this.nextEventRound = 3 + Math.floor(this.rng() * 2);

        console.log(`[Engine] Rol: ${roleData.name} | Seed: ${seedToCode(this.seed)}`, this.activeMeters);
        this.notifyStateChange("role_started");
    },

    getCurrentRoleConfig: function () {
        return ROLES[this.roleIndex];
    },

    applyCardEffects: function (effectsArray, promise) {
        // Registrar métricas de perfil de victoria
        effectsArray.forEach(eff => {
            if (eff.amount < 0 && ['cred', 'transp', 'int_eti', 'resp_inst', 'legit', 'inst_sol'].includes(eff.meterId)) {
                this.corruptionScore += Math.abs(eff.amount);
            }
            if (eff.amount > 0 && ['pop', 'satis', 'base', 'car_pop', 'apoyo_pol', 'estab_soc'].includes(eff.meterId)) {
                this.popularityScore += eff.amount;
            }
            if (eff.amount > 0 && ['segur', 'seg_nac', 'estab', 'estab_soc', 'pod_nac', 'peso_pol'].includes(eff.meterId)) {
                this.controlScore += eff.amount;
            }

            const meter = this.activeMeters.find(m => m.id === eff.meterId);
            if (meter) {
                meter.value = Math.min(100, Math.max(0, meter.value + eff.amount));
            } else if (this.permanentMeter && eff.meterId === this.permanentMeter.id) {
                this.permanentMeter.value = Math.min(100, Math.max(0, this.permanentMeter.value + eff.amount));
            }
        });

        // Agregar promesa si la carta la incluye
        if (promise) {
            this.activePromises.push({ ...promise, roundsLeft: promise.roundsLeft || 2 });
            this.notifyStateChange("promise_added");
        }

        this.notifyStateChange("effects_applied");
        this._checkDeathThenContinue();
    },

    applyEventChoice: function (effects) {
        effects.forEach(eff => {
            const meter = this.activeMeters.find(m => m.id === eff.meterId);
            if (meter) {
                meter.value = Math.min(100, Math.max(0, meter.value + eff.amount));
            }
        });
        this.pendingEvent = null;
        // Reprogramar siguiente evento
        this.nextEventRound = this.currentRound + 3 + Math.floor(this.rng() * 2);
        this.notifyStateChange("effects_applied");
        this._checkDeathThenContinue("event");
    },

    _checkDeathThenContinue: function (source) {
        const died = this.activeMeters.some(m => m.value <= 0);
        if (died) {
            this.runStatus = "game_over";
            this.notifyStateChange("game_over", source === "event"
                ? "La crisis fue demasiado grave para sobrevivir."
                : "Un medidor crítico ha entrado en bancarrota absoluta (0%).");
            return;
        }
        if (source !== "event") {
            this._processTurnEnd();
        } else {
            this._advanceRound();
        }
    },

    _processTurnEnd: function () {
        // Procesar promesas que vencen
        const expired = this.activePromises.filter(p => {
            p.roundsLeft--;
            return p.roundsLeft <= 0;
        });
        expired.forEach(p => {
            p.effects.forEach(eff => {
                const meter = this.activeMeters.find(m => m.id === eff.meterId);
                if (meter) meter.value = Math.min(100, Math.max(0, meter.value + eff.amount));
            });
        });
        this.activePromises = this.activePromises.filter(p => p.roundsLeft > 0);

        if (expired.length > 0) {
            this.notifyStateChange("promises_expired", expired);
        }

        // Verificar muerte post-promesas
        const died = this.activeMeters.some(m => m.value <= 0);
        if (died) {
            this.runStatus = "game_over";
            this.notifyStateChange("game_over", "Una promesa incumplida arrastró tu carrera al abismo.");
            return;
        }

        this._advanceRound();
    },

    _advanceRound: function () {
        const roleConfig = this.getCurrentRoleConfig();
        if (this.currentRound < roleConfig.totalRounds) {
            this.currentRound++;
            // ¿Evento aleatorio?
            if (this.currentRound === this.nextEventRound) {
                this._triggerRandomEvent();
            } else {
                this.notifyStateChange("next_round");
            }
        } else {
            this.evaluateEndOfRole(roleConfig);
        }
    },

    _triggerRandomEvent: function () {
        const evIdx = Math.floor(this.rng() * RANDOM_EVENTS.length);
        const template = RANDOM_EVENTS[evIdx];

        // Resolver medidores dinámicamente
        const shuffled = [...this.activeMeters].sort(() => this.rng() - 0.5);
        const mA = shuffled[0];
        const mB = shuffled[Math.min(1, shuffled.length - 1)];
        const mNeg = shuffled[shuffled.length - 1];
        const mNegB = shuffled[Math.max(0, shuffled.length - 2)];

        this.pendingEvent = {
            ...template,
            optA: {
                ...template.optA,
                effects: [
                    { meterId: mA.id,   meterName: mA.name,   amount:  template.optA.posAmount },
                    { meterId: mNeg.id, meterName: mNeg.name, amount: -template.optA.negAmount }
                ]
            },
            optB: {
                ...template.optB,
                effects: [
                    { meterId: mB.id,    meterName: mB.name,    amount:  template.optB.posAmount },
                    { meterId: mNegB.id, meterName: mNegB.name, amount: -template.optB.negAmount }
                ]
            }
        };
        this.notifyStateChange("random_event", this.pendingEvent);
    },

    evaluateEndOfRole: function (roleConfig) {
        const failed = this.activeMeters.some(m => m.value < roleConfig.minThreshold);
        if (failed) {
            this.runStatus = "game_over";
            this.notifyStateChange("game_over", `No alcanzaste el mínimo requerido de ${roleConfig.minThreshold}% al terminar el mandato.`);
        } else {
            if (this.roleIndex < ROLES.length - 1) {
                this.runStatus = "won_role";
                this.notifyStateChange("won_role");
            } else {
                this.runStatus = "victory";
                this.notifyStateChange("victory");
            }
        }
    },

    getVictoryProfile: function () {
        const c = this.corruptionScore;
        const p = this.popularityScore;
        const k = this.controlScore;
        if (c > 300)                     return "oligarca";
        if (k > 350 && k > p)           return "dictador";
        if (p > 300)                     return "caudillo";
        return "estadista";
    },

    advanceToNextRole: function () {
        this.roleIndex++;
        this.startRole();
    },

    notifyStateChange: function (eventType, payload) {
        const detail = { type: eventType, state: this, message: payload };
        document.dispatchEvent(new CustomEvent('gameStateUpdate', { detail }));
    }
};
