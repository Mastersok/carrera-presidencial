/**
 * ENGINE.JS v2.1 - Núcleo lógico del juego "Política Dinámica".
 * Maneja el estado global, la definición de cargos y medidores, 
 * y las reglas de avance de turnos/victoria/derrota.
 */

// --- CONSTANTES DE DATOS ---
const ROLES = [
    {
        id: "candidato",
        name: "Candidato a Alcalde",
        totalRounds: 8,
        minThreshold: 40,
        tempMeters: [
            { id: "pop", name: "Popularidad", icon: "📊", desc: "Qué tan conocido y querido eres entre los votantes." },
            { id: "dinero", name: "Dinero de Campaña", icon: "💰", desc: "Fondos disponibles para publicidad, eventos y sobornos." },
            { id: "imagen", name: "Imagen Pública", icon: "📰", desc: "Tu reputación ante los medios y la opinión pública." },
            { id: "base", name: "Apoyo Base", icon: "✊", desc: "Fidelidad de tus votantes más leales y comprometidos." },
            { id: "cred", name: "Credibilidad", icon: "🎯", desc: "Cuánto confían en tus promesas y declaraciones." },
            { id: "momentum", name: "Momentum", icon: "🔥", desc: "Impulso y energía de tu campaña. Pierdes velocidad sin acción." },
            { id: "legit", name: "Legitimidad", icon: "⚖️", desc: "Percepción de que eres un candidato válido y serio." },
            { id: "prof", name: "Profesionalismo", icon: "🎩", desc: "Capacidad técnica percibida para ejercer el cargo." }
        ]
    },
    {
        id: "alcalde",
        name: "Alcalde",
        totalRounds: 9,
        minThreshold: 50,
        tempMeters: [
            { id: "satis", name: "Satisfacción Ciudadana", icon: "😊", desc: "Nivel de contento general de la población con tu gestión." },
            { id: "presup", name: "Presupuesto Municipal", icon: "💰", desc: "Fondos públicos disponibles para obras y servicios." },
            { id: "estab", name: "Estabilidad Local", icon: "⚖️", desc: "Orden social y político en tu distrito." },
            { id: "segur", name: "Seguridad Pública", icon: "🚔", desc: "Percepción de seguridad y control del crimen." },
            { id: "salud", name: "Salud Pública", icon: "🏥", desc: "Estado del sistema sanitario local y bienestar general." },
            { id: "educa", name: "Educación Local", icon: "🎓", desc: "Calidad y acceso a la educación en tu municipio." },
            { id: "medio", name: "Medio Ambiente", icon: "🌿", desc: "Políticas verdes, contaminación y áreas protegidas." },
            { id: "infra", name: "Infraestructura", icon: "🏗️", desc: "Estado de caminos, puentes, edificios públicos." }
        ]
    },
    {
        id: "diputado",
        name: "Diputado",
        totalRounds: 9,
        minThreshold: 60,
        tempMeters: [
            { id: "inf_dist", name: "Influencia Distrital", icon: "🗺️", desc: "Tu peso político en tu distrito de origen." },
            { id: "apoyo_part", name: "Apoyo Partidario", icon: "🤝", desc: "Respaldo de tu partido político y sus miembros." },
            { id: "pod_legis", name: "Poder Legislativo", icon: "📜", desc: "Capacidad de impulsar y aprobar leyes en el congreso." },
            { id: "transp", name: "Transparencia", icon: "🔍", desc: "Nivel de rendición de cuentas y honestidad percibida." },
            { id: "presup_asig", name: "Presupuesto Asignado", icon: "💼", desc: "Recursos fiscales bajo tu control directo." },
            { id: "img_nac", name: "Imagen Nacional", icon: "📺", desc: "Reconocimiento y percepción a nivel nacional." },
            { id: "coalic", name: "Coaliciones", icon: "🏛️", desc: "Alianzas políticas activas con otros bloques." },
            { id: "bal_reg", name: "Balance Regional", icon: "⚖️", desc: "Equilibrio de poder entre las distintas regiones." }
        ]
    },
    {
        id: "senador",
        name: "Senador",
        totalRounds: 10,
        minThreshold: 65,
        tempMeters: [
            { id: "pod_nac", name: "Poder Nacional", icon: "🏛️", desc: "Influencia real sobre decisiones de Estado." },
            { id: "resp_inst", name: "Respeto Institucional", icon: "📋", desc: "Credibilidad ante las instituciones del país." },
            { id: "rel_part", name: "Relaciones Partidarias", icon: "🤝", desc: "Solidez de tus alianzas dentro y fuera del partido." },
            { id: "vis_int", name: "Visión Internacional", icon: "🌍", desc: "Percepción de tu capacidad diplomática y visión global." },
            { id: "efec_legis", name: "Efectividad Legislativa", icon: "📊", desc: "Leyes aprobadas y proyectos completados con éxito." },
            { id: "inf_med", name: "Influencia Mediática", icon: "🎤", desc: "Control y presencia en los medios de comunicación." },
            { id: "peso_pol", name: "Peso Político", icon: "⚖️", desc: "Tu importancia en la balanza del poder nacional." },
            { id: "legado", name: "Legado en Construcción", icon: "🏆", desc: "Qué recordarán de tu gestión las generaciones futuras." }
        ]
    },
    {
        id: "presidente",
        name: "Presidente",
        totalRounds: 10,
        minThreshold: 70,
        tempMeters: [
            { id: "eco_nac", name: "Economía Nacional", icon: "📈", desc: "Salud del PIB, empleo, inflación y comercio exterior." },
            { id: "apoyo_pol", name: "Apoyo Político", icon: "🟢", desc: "Respaldo del congreso, partidos y aliados clave." },
            { id: "estab_soc", name: "Estabilidad Social", icon: "⚖️", desc: "Paz social, ausencia de protestas y conflictos internos." },
            { id: "img_int", name: "Imagen Internacional", icon: "🌐", desc: "Cómo te perciben otros países y organismos internacionales." },
            { id: "seg_nac", name: "Seguridad Nacional", icon: "🛡️", desc: "Defensa del territorio, inteligencia y orden público." },
            { id: "fin_pub", name: "Finanzas Públicas", icon: "💰", desc: "Deuda, presupuesto y recaudación fiscal." },
            { id: "des_sost", name: "Desarrollo Sostenible", icon: "🌱", desc: "Políticas ecológicas, energías renovables y planificación." },
            { id: "inst_sol", name: "Instituciones Sólidas", icon: "🏛️", desc: "Independencia judicial, democracia y estado de derecho." }
        ]
    }
];

const PERMANENT_METERS = [
    { id: "cap_pol", name: "Capital Político", icon: "👑", desc: "Tu reserva de poder e influencia acumulada. Reduce en 10% el impacto negativo de decisiones." },
    { id: "int_eti", name: "Integridad Ética", icon: "⚖️", desc: "Tu brújula moral. Reduce la probabilidad de enfrentar crisis y escándalos." },
    { id: "red_cli", name: "Red Clientelar", icon: "🕸️", desc: "Tu red de contactos e intercambio de favores. Aumenta recompensas económicas." },
    { id: "exp_tec", name: "Experiencia Técnica", icon: "📚", desc: "Tu conocimiento del aparato estatal. Previene desgaste por el paso del tiempo." },
    { id: "car_pop", name: "Carisma Popular", icon: "⭐", desc: "Tu conexión emocional con el pueblo. Aumenta el rendimiento de las decisiones populares." }
];

// --- ESTADO GLOBAL (GAME STATE) ---
const GameState = {
    roleIndex: 0,
    currentRound: 1,
    activeMeters: [],
    permanentMeter: null,
    activePromises: [],
    runStatus: "active",
    
    startNewRun: function() {
        this.roleIndex = 0;
        this.runStatus = "active";
        const perm = PERMANENT_METERS[Math.floor(Math.random() * PERMANENT_METERS.length)];
        this.permanentMeter = { ...perm, value: 50 };
        this.startRole();
    },
    
    startRole: function() {
        this.currentRound = 1;
        this.activePromises = [];
        this.runStatus = "active";
        const roleData = ROLES[this.roleIndex];
        const shuffledMeters = [...roleData.tempMeters].sort(() => 0.5 - Math.random());
        const selected = shuffledMeters.slice(0, 3);
        this.activeMeters = selected.map(m => ({
            id: m.id, name: m.name, icon: m.icon, desc: m.desc, value: 50
        }));
        console.log(`[Engine] Iniciando Rol: ${roleData.name}`, this.activeMeters);
        this.notifyStateChange("role_started");
    },
    
    getCurrentRoleConfig: function() {
        return ROLES[this.roleIndex];
    },
    
    applyCardEffects: function(effectsArray) {
        effectsArray.forEach(eff => {
            const meter = this.activeMeters.find(m => m.id === eff.meterId);
            if (meter) {
                meter.value += eff.amount;
                if (meter.value > 100) meter.value = 100;
                if (meter.value < 0) meter.value = 0;
            } else if (this.permanentMeter && eff.meterId === this.permanentMeter.id) {
                this.permanentMeter.value += eff.amount;
                if (this.permanentMeter.value > 100) this.permanentMeter.value = 100;
                if (this.permanentMeter.value < 0) this.permanentMeter.value = 0;
            }
        });
        this.notifyStateChange("effects_applied");
        this.evaluateTurn();
    },
    
    evaluateTurn: function() {
        const died = this.activeMeters.some(m => m.value <= 0);
        if (died) {
            this.runStatus = "game_over";
            this.notifyStateChange("game_over", "Un medidor crítico ha entrado en bancarrota absoluta (0%).");
            return;
        }
        const roleConfig = this.getCurrentRoleConfig();
        if (this.currentRound < roleConfig.totalRounds) {
            this.currentRound++;
            this.notifyStateChange("next_round");
        } else {
            this.evaluateEndOfRole(roleConfig);
        }
    },
    
    evaluateEndOfRole: function(roleConfig) {
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
    
    advanceToNextRole: function() {
        this.roleIndex++;
        this.startRole();
    },
    
    notifyStateChange: function(eventType, message = "") {
        const payload = { type: eventType, state: this, message: message };
        document.dispatchEvent(new CustomEvent('gameStateUpdate', { detail: payload }));
    }
};
