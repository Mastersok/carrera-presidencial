/**
 * CARDS.JS v3.0 — Sistema de Cartas Contextual con Anti-Repetición y Promesas
 * ─────────────────────────────────────────────────────────────────
 * Cada carta tiene:
 *   primary:  { meterId, direction }  → medidor fijo temáticamente coherente
 *   baseGain: número base de ganancia
 *   baseRisk: número base de costo
 *   role:     id del cargo al que pertenece (o 'universal')
 *
 * El generador:
 * 1. Filtra cartas cuyo metro primario esté activo en esta run
 * 2. Asigna el efecto secundario dinámicamente desde los medidores activos
 * 3. Nunca repite una carta dentro del mismo cargo (anti-repeat pool)
 * 4. Cartas de promesa: ganancia inmediata + efecto retardado (vence en 2 rondas)
 */

/** Usa el RNG semillado del GameState si está disponible, si no Math.random */
function _rng() {
    return (typeof GameState !== 'undefined' && typeof GameState.rng === 'function')
        ? GameState.rng()
        : Math.random();
}

const CARD_POOL = {

    /* ════════════════════════════════════════════════════
       CANDIDATO A ALCALDE
       Medidores: pop, dinero, imagen, base, cred, momentum, legit, prof
       ════════════════════════════════════════════════════ */
    candidato: [
        { id:"ca01", title:"Mitin Masivo",           desc:"Llevas a las masas a una plaza. Todos aplaudan — o al menos eso parece.",              primary:"pop",      baseGain:22, baseRisk:14 },
        { id:"ca02", title:"Spot Televisivo",         desc:"Sales en televisión. Sonríes. Repites 'futuro' doce veces.",                          primary:"pop",      baseGain:16, baseRisk:10 },
        { id:"ca03", title:"Foto con Ancianita",      desc:"La abuela se vuelve viral. Tus encuestas también.",                                   primary:"pop",      baseGain:18, baseRisk:8  },
        { id:"ca04", title:"Donación de Campaña",     desc:"Un empresario aparece con un maletín. No preguntas de dónde viene.",                  primary:"dinero",   baseGain:25, baseRisk:18 },
        { id:"ca05", title:"Crowdfunding Ciudadano",  desc:"El pueblo pone la plata. Tú pones la cara. Todo el mundo queda contento.",            primary:"dinero",   baseGain:18, baseRisk:8  },
        { id:"ca06", title:"Rifa Benéfica",           desc:"Organizas una rifa. El premio es una cena contigo. Se venden pocos boletos.",          primary:"dinero",   baseGain:12, baseRisk:6  },
        { id:"ca07", title:"Entrevista Exclusiva",    desc:"Te sientas frente al periodista más temido del país. Sudas. Sobrevives.",              primary:"imagen",   baseGain:20, baseRisk:12 },
        { id:"ca08", title:"Campaña en Redes",        desc:"Tu equipo de comunicación trabaja horas; tú tuiteas desde el baño.",                  primary:"imagen",   baseGain:15, baseRisk:9  },
        { id:"ca09", title:"Endorsement Famoso",      desc:"El cantante más popular del país te apoya. Sus fans también votan.",                  primary:"imagen",   baseGain:18, baseRisk:7  },
        { id:"ca10", title:"Puerta a Puerta",         desc:"Golpeas cada puerta del barrio. Te ladran varios perros. Vale la pena.",              primary:"base",     baseGain:20, baseRisk:10 },
        { id:"ca11", title:"Reunión Comunitaria",     desc:"Escuchas los problemas vecinales. Prometes resolverlos todos. Clásico.",              primary:"base",     baseGain:16, baseRisk:9  },
        { id:"ca12", title:"Promesa Electoral",       desc:"Prometes bajar el precio del pan. La economía no lo permite, pero tú sí.",            primary:"cred",     baseGain:20, baseRisk:16 },
        { id:"ca13", title:"Debate Público",          desc:"El moderador hace una pregunta difícil. Respondes con tres preguntas.",               primary:"cred",     baseGain:22, baseRisk:18 },
        { id:"ca14", title:"Plan de Gobierno",        desc:"Presentas un documento de 300 páginas. Nadie lo lee, pero impresiona.",               primary:"cred",     baseGain:15, baseRisk:7  },
        { id:"ca15", title:"Marcha Política",         desc:"Encabezas una marcha. El entusiasmo es contagioso y el cansancio también.",           primary:"momentum", baseGain:25, baseRisk:15 },
        { id:"ca16", title:"Acto Sorpresa",           desc:"Apareces sin previo aviso en el mercado local. La gente saca el celular.",            primary:"momentum", baseGain:18, baseRisk:10 },
        { id:"ca17", title:"Firma de Compromisos",    desc:"Firmas una declaración ante notario. Ahora hay testigos de tus promesas.",            primary:"legit",    baseGain:20, baseRisk:12 },
        { id:"ca18", title:"Respaldo Gremial",        desc:"Los sindicatos te anuncian como candidato favorito. No sin condiciones.",              primary:"legit",    baseGain:22, baseRisk:14 },
        { id:"ca19", title:"Charla Universitaria",    desc:"Expones frente a estudiantes. Las preguntas son brutales. Las respondes igual.",       primary:"prof",     baseGain:18, baseRisk:10 },
        { id:"ca20", title:"Asesoría Técnica",        desc:"Contratas a un experto para mejorar tu propuesta. Él sabe, tú firmas.",               primary:"prof",     baseGain:20, baseRisk:12 },
        { id:"ca21", title:"Caravana de Vehículos",   desc:"Una fila de autos tocando bocina. Molesta a unos, pero te hace notar.",               primary:"pop",      baseGain:18, baseRisk:12 },
        { id:"ca22", title:"Baile Viral",             desc:"Haces el ridículo en internet. Pero es un ridículo que suma simpatía.",               primary:"pop",      baseGain:24, baseRisk:16 },
        { id:"ca23", title:"Cena de Recaudación",     desc:"El plato cuesta fortunas. La comida es mala, pero el cheque es bueno.",               primary:"dinero",   baseGain:22, baseRisk:14 },
        { id:"ca24", title:"Venta de Merchandising",  desc:"Camisetas, gorras y tazas con tu cara. Alguien las compra.",                          primary:"dinero",   baseGain:16, baseRisk:10 },
        { id:"ca25", title:"Sesión Fotográfica",      desc:"Contratas al mejor fotógrafo. Logra que parezcas presidenciable... y humano.",        primary:"imagen",   baseGain:18, baseRisk:8 },
        { id:"ca26", title:"Campaña de Limpieza",     desc:"Tú y tu equipo recogen basura. La prensa llega casualmente al mismo tiempo.",         primary:"imagen",   baseGain:20, baseRisk:12 },
        { id:"ca27", title:"Olla Común",              desc:"Organizas comida gratis en el barrio más leal. Se come y se jura lealtad.",           primary:"base",     baseGain:18, baseRisk:10 },
        { id:"ca28", title:"Asamblea de Vecinos",     desc:"Te sientas a escuchar quejas por horas. Tu paciencia refuerza a tus seguidores.",     primary:"base",     baseGain:16, baseRisk:12 },
        { id:"ca29", title:"Promesa de Transparencia",desc:"Juras mostrar cada boleta de gastos. Un riesgo, pero la gente te cree.",              primary:"cred",     baseGain:22, baseRisk:16 },
        { id:"ca30", title:"Rechazar Soborno",        desc:"Filtramos que rechazaste dinero sucio. Todos aplauden tu honestidad.",                primary:"cred",     baseGain:24, baseRisk:18 },
        { id:"ca31", title:"Anuncio de Alto Impacto", desc:"Lanzas un spot de madrugada. Al despertar, todos hablan de ti.",                      primary:"momentum", baseGain:20, baseRisk:14 },
        { id:"ca32", title:"Volanteo Relámpago",      desc:"Inundas la estación central con afiches. Estás en todas partes.",                     primary:"momentum", baseGain:16, baseRisk:8 },
        { id:"ca33", title:"Firma ante Notario",      desc:"Recreas una firma pública frente a testigos ilustres.",                               primary:"legit",    baseGain:18, baseRisk:10 },
        { id:"ca34", title:"Aprobación de Históricos",desc:"Los viejos próceres de tu partido te levantan la mano.",                              primary:"legit",    baseGain:22, baseRisk:16 },
        { id:"ca35", title:"Cita Académica",          desc:"Usas datos y estudios para apoyar tu plan. Suenas muy inteligente hoy.",              primary:"prof",     baseGain:18, baseRisk:10 },
        { id:"ca36", title:"Debate Técnico",          desc:"Humillas a tu rival hablando de tasas impositivas. Aburrido pero letal.",             primary:"prof",     baseGain:20, baseRisk:14 },
        // ── CARTAS DE PROMESA ──
        { id:"ca_p1", title:"¡Subsidios para Todos!", desc:"Anuncias subsidios a voz en cuello en el mitin. La gente te ama ahora. La factura llega sola después.", primary:"pop",   baseGain:20, baseRisk:0, noRisk:true,
          promise:{ label:"💰 Subsidios prometidos", roundsLeft:2, effects:[{meterId:"dinero", amount:-25}] } },
        { id:"ca_p2", title:"Juro por Estas (Transparencia)",  desc:"Juras publicar cada gasto. El periódico te aplaude. Los auditores empiezan a leer. Oops.", primary:"cred",   baseGain:18, baseRisk:0, noRisk:true,
          promise:{ label:"🔍 Auditoría prometida",  roundsLeft:2, effects:[{meterId:"cred", amount:12}, {meterId:"imagen", amount:-20}] } }
    ],

    /* ════════════════════════════════════════════════════
       ALCALDE
       Medidores: satis, presup, estab, segur, salud, educa, medio, infra
       ════════════════════════════════════════════════════ */
    alcalde: [
        { id:"al01", title:"Festival Comunitario",     desc:"Organizas un festival gratuito. La gente baila, come y momentáneamente te quiere.",   primary:"satis",  baseGain:22, baseRisk:14 },
        { id:"al02", title:"Línea Directa del Alcalde",desc:"Abres un número de teléfono donde los vecinos pueden llamarte. Llaman mucho.",        primary:"satis",  baseGain:16, baseRisk:8  },
        { id:"al03", title:"Plaza Pública Renovada",   desc:"Pintas la plaza, pones un quiosco de empanadas y la gente celebra.",                  primary:"satis",  baseGain:18, baseRisk:12 },
        { id:"al04", title:"Licitación Urgente",       desc:"Abres una licitación exprés. Llega el mejor postor. No siempre el más honesto.",      primary:"presup", baseGain:28, baseRisk:18 },
        { id:"al05", title:"Austeridad Municipal",     desc:"Recortas gastos superfluos. El área de café ejecutivo queda sin café.",               primary:"presup", baseGain:22, baseRisk:14 },
        { id:"al06", title:"Convenio con Privados",    desc:"Firma acuerdos con empresas locales. El dinero entra, las condiciones también.",      primary:"presup", baseGain:20, baseRisk:12 },
        { id:"al07", title:"Mesa de Diálogo",          desc:"Convocas a todos los actores locales a conversar. Nadie está de acuerdo, pero bajan la voz.", primary:"estab", baseGain:20, baseRisk:10 },
        { id:"al08", title:"Toque de Queda Vecinal",   desc:"Propones restricciones nocturnas. La tranquilidad llega, la libertad se va.",         primary:"estab",  baseGain:18, baseRisk:16 },
        { id:"al09", title:"Plan Cuadrante Policial",  desc:"Refuerzas las patrullas. El crimen baja. El presupuesto también.",                    primary:"segur",  baseGain:24, baseRisk:16 },
        { id:"al10", title:"Cámaras en las Calles",    desc:"Instalas cámaras de vigilancia. Los vecinos se sienten seguros y observados.",        primary:"segur",  baseGain:18, baseRisk:12 },
        { id:"al11", title:"Campaña Anti-Delito",      desc:"Lanzas avisos públicos contra el robo. El robo no lee avisos.",                       primary:"segur",  baseGain:14, baseRisk:8  },
        { id:"al12", title:"Posta Médica Gratuita",    desc:"Abres un centro de salud en el barrio más olvidado. La fila es larga, el impacto mayor.", primary:"salud", baseGain:24, baseRisk:16 },
        { id:"al13", title:"Vacunación Masiva",        desc:"Organizas una jornada de vacunación. Colas kilométricas. Resultados buenos.",         primary:"salud",  baseGain:20, baseRisk:12 },
        { id:"al14", title:"Talleres para Escolares",  desc:"Implementas talleres extracurriculares. Los niños aprenden, tú ganas puntos.",        primary:"educa",  baseGain:18, baseRisk:10 },
        { id:"al15", title:"Nueva Escuela Municipal",  desc:"Inauguras una escuela. La cinta es del color de tu partido.",                         primary:"educa",  baseGain:25, baseRisk:18 },
        { id:"al16", title:"Programa Verde",           desc:"Plantas árboles en la ciudad. El CO₂ no se va, pero la foto queda bonita.",           primary:"medio",  baseGain:16, baseRisk:10 },
        { id:"al17", title:"Cierre de Vertedero",      desc:"Clausuras el vertedero ilegal del sector poniente. Los vecinos respiran mejor.",      primary:"medio",  baseGain:20, baseRisk:14 },
        { id:"al18", title:"Bacheo Masivo",            desc:"Tapas baches en toda la ciudad. Los conductores lloran de alegría.",                  primary:"infra",  baseGain:20, baseRisk:12 },
        { id:"al19", title:"Puente Comunitario",       desc:"Construyes el puente que prometiste hace tres años. Solo demoró el triple.",          primary:"infra",  baseGain:28, baseRisk:20 },
        { id:"al20", title:"Renovación de Alcantarillado", desc:"Modernizas el sistema de aguas. Obra invisible, impacto real.",                   primary:"infra",  baseGain:22, baseRisk:16 },
        { id:"al21", title:"Día del Vecino",          desc:"Un evento en el parque con choripanes. Felices y con el estómago lleno.",             primary:"satis",  baseGain:20, baseRisk:12 },
        { id:"al22", title:"Bono Municipal",          desc:"Repartes cajas justo en el momento adecuado. Sonrisas garantizadas.",                 primary:"satis",  baseGain:24, baseRisk:18 },
        { id:"al23", title:"Aumento de Patentes",     desc:"Subes el costo de permisos comerciales. Entra dinero, salen quejas.",                 primary:"presup", baseGain:18, baseRisk:10 },
        { id:"al24", title:"Subasta de Bienes",       desc:"Vendes vehículos en desuso del municipio a buen precio.",                             primary:"presup", baseGain:22, baseRisk:14 },
        { id:"al25", title:"Trabajo Barrial",         desc:"Das poder a las juntas de vecinos para obras menores. La paz reina.",                 primary:"estab",  baseGain:16, baseRisk:8 },
        { id:"al26", title:"Reunión de Conciliación", desc:"Sientas a los dos sindicatos peleados en la misma mesa y no los dejas salir.",        primary:"estab",  baseGain:20, baseRisk:16 },
        { id:"al27", title:"Rondas Nocturnas",        desc:"Pones serenos a caminar en la noche. Los vecinos duermen más tranquilos.",            primary:"segur",  baseGain:18, baseRisk:14 },
        { id:"al28", title:"Botón de Pánico",         desc:"Apps para que los vecinos denuncien. Ahora todos vigilan a todos.",                   primary:"segur",  baseGain:20, baseRisk:12 },
        { id:"al29", title:"Medicamentos Gratuitos",  desc:"Abres una farmacia comunitaria. Larga fila, pero ahorro significativo.",              primary:"salud",  baseGain:24, baseRisk:18 },
        { id:"al30", title:"Campaña Prevención",      desc:"Fomentas el chequeo médico. Te sacas la foto tomando la presión arterial.",           primary:"salud",  baseGain:16, baseRisk:8 },
        { id:"al31", title:"Beca Estudiantil Local",  desc:"Premias a los mejores promedios con ayuda directa. Aplausos de las madres.",          primary:"educa",  baseGain:20, baseRisk:14 },
        { id:"al32", title:"Mejora Bibliotecas",      desc:"Compran libros nuevos y pintan. Sencillo, barato y aplaudido.",                       primary:"educa",  baseGain:16, baseRisk:10 },
        { id:"al33", title:"Día Sin Autos",           desc:"Prohíbes autos en el centro por un día. El aire y los peatones agradecen.",           primary:"medio",  baseGain:18, baseRisk:14 },
        { id:"al34", title:"Reciclaje Obligatorio",   desc:"Pones tachos de colores por todas partes. Multiplicas los puntos limpios.",           primary:"medio",  baseGain:22, baseRisk:16 },
        { id:"al35", title:"Luminarias LED",          desc:"Cambias luces antiguas. La ciudad brilla más (y gasta un poco menos).",               primary:"infra",  baseGain:20, baseRisk:12 },
        { id:"al36", title:"Pasos Peatonales",        desc:"Pintas cruces seguros y pones lomos de toro donde la gente pedía.",                   primary:"infra",  baseGain:16, baseRisk:10 },
        // ── CARTAS DE PROMESA ──
        { id:"al_p1", title:"¡Obras ya! (próximamente)", desc:"Prometiste las obras en campaña. Ahora hay que pagarlas. La sonrisa fue gratis. La cinta de inauguración, no.", primary:"satis", baseGain:22, baseRisk:0, noRisk:true,
          promise:{ label:"🏗️ Obras prometidas", roundsLeft:2, effects:[{meterId:"presup", amount:-28}] } },
        { id:"al_p2", title:"Bono Municipal (cheques en camino)", desc:"Repartes bonos con foto incluida. Los vecinos sonríen. El contador municipal no.", primary:"satis", baseGain:20, baseRisk:0, noRisk:true,
          promise:{ label:"💸 Bono por cobrar", roundsLeft:2, effects:[{meterId:"presup", amount:-22}] } }
    ],

    /* ════════════════════════════════════════════════════
       DIPUTADO
       Medidores: inf_dist, apoyo_part, pod_legis, transp, presup_asig, img_nac, coalic, bal_reg
       ════════════════════════════════════════════════════ */
    diputado: [
        { id:"di01", title:"Tour por el Distrito",     desc:"Recorres tu distrito en camioneta nueva. Los votantes saludan, tú sonríes.",          primary:"inf_dist",    baseGain:20, baseRisk:10 },
        { id:"di02", title:"Oficina de Gestión Local", desc:"Abres una oficina en tu barrio. La gente viene con problemas. Tú los escuchas.",      primary:"inf_dist",    baseGain:16, baseRisk:8  },
        { id:"di03", title:"Reunión con el Partido",   desc:"Te sientas en la mesa grande con los jefes. Cedes algo. Ganas algo.",                 primary:"apoyo_part",  baseGain:22, baseRisk:14 },
        { id:"di04", title:"Convención Partidaria",    desc:"Discurso ante los militantes. Todos aplauden aunque pocos entienden tu plan.",        primary:"apoyo_part",  baseGain:18, baseRisk:10 },
        { id:"di05", title:"Proyecto de Ley Estrella", desc:"Presentas el proyecto del que te enorgulleces. El congreso lo analiza con... lentitud.", primary:"pod_legis", baseGain:25, baseRisk:16 },
        { id:"di06", title:"Acuerdo de Votación",      desc:"Negocias votos con otro bloque. Todos ganan algo, todos pierden algo.",               primary:"pod_legis",   baseGain:22, baseRisk:14 },
        { id:"di07", title:"Comisión Investigadora",   desc:"Prestas tu nombre a una comisión que investiga irregularidades. El nombre queda.",     primary:"transp",      baseGain:20, baseRisk:14 },
        { id:"di08", title:"Declaración de Bienes",    desc:"Publicas tu patrimonio. El periodismo encuentra algo interesante. Claro que sí.",     primary:"transp",      baseGain:15, baseRisk:18 },
        { id:"di09", title:"Asignación de Fondos",     desc:"Consigues fondos para proyectos de tu distrito. El ministro te debe un favor.",       primary:"presup_asig", baseGain:26, baseRisk:16 },
        { id:"di10", title:"Fondo Concursable",        desc:"Gestionas un concurso de fondos para organizaciones locales. Todos quieren ganar.",   primary:"presup_asig", baseGain:20, baseRisk:12 },
        { id:"di11", title:"Entrevista en Canal Nacional", desc:"Apareces en la pantalla grande. Hablas claro. O al menos intentas.",               primary:"img_nac",     baseGain:22, baseRisk:14 },
        { id:"di12", title:"Opinión en Foro Internacional", desc:"Te invitan a hablar afuera. Hablas. Algunos te escuchan.",                        primary:"img_nac",     baseGain:18, baseRisk:10 },
        { id:"di13", title:"Alianza con Otro Bloque",  desc:"Tiendes la mano al bloque rival. Ellos también la tienden. Todos desconfían.",        primary:"coalic",      baseGain:24, baseRisk:18 },
        { id:"di14", title:"Pacto de No Agresión",     desc:"Acordáis no atacaros en cámara. Dura hasta el próximo martes.",                       primary:"coalic",      baseGain:18, baseRisk:14 },
        { id:"di15", title:"Proyecto Regional",        desc:"Propones una iniciativa que beneficia varias regiones. Pocas se quejan.",             primary:"bal_reg",     baseGain:20, baseRisk:12 },
        { id:"di16", title:"Redistribución de Fondos", desc:"Redistribuyes fondos entre regiones. Las favorecidas aplauden, las otras no.",        primary:"bal_reg",     baseGain:22, baseRisk:18 },
        { id:"di17", title:"Gira Legislativa",         desc:"Visitas varios distritos con tu comitiva. Gastas mucho, aprendes poco.",              primary:"inf_dist",    baseGain:16, baseRisk:14 },
        { id:"di18", title:"Seminario de Leyes",       desc:"Organizas un seminario jurídico. Asisten tres abogados y tu secretaria.",             primary:"pod_legis",   baseGain:14, baseRisk:8  },
        { id:"di19", title:"Auditoria al Gasto",       desc:"Auditas el gasto de tu propio gabinete. Encuentras cosas. Guardas silencio.",         primary:"transp",      baseGain:18, baseRisk:22 },
        { id:"di20", title:"Campaña de Identidad",     desc:"Lanzas una campaña de imagen con tu rostro en vallas. Cara conocida.",                primary:"img_nac",     baseGain:16, baseRisk:10 },
        // ── CARTAS DE PROMESA ──
        { id:"di_p1", title:"El Proyecto del Siglo™", desc:"Presentas tu gran proyecto. El país lo ovaciona. Los auditores preguntan de dónde sale el dinero.", primary:"pod_legis", baseGain:24, baseRisk:0, noRisk:true,
          promise:{ label:"📜 Proyecto vence", roundsLeft:2, effects:[{meterId:"transp", amount:-20}] } },
        { id:"di_p2", title:"Pacto de Caballeros (o lo que sea)", desc:"Firmas un acuerdo de coalición. Todos sonríen. Nadie aclara qué significa exactamente.", primary:"coalic", baseGain:22, baseRisk:0, noRisk:true,
          promise:{ label:"🤝 Pacto vence", roundsLeft:2, effects:[{meterId:"apoyo_part", amount:-18}] } }
    ],

    /* ════════════════════════════════════════════════════
       SENADOR
       Medidores: pod_nac, resp_inst, rel_part, vis_int, efec_legis, inf_med, peso_pol, legado
       ════════════════════════════════════════════════════ */
    senador: [
        { id:"se01", title:"Discurso en Cámara Alta",  desc:"Te paras ante el micrófono. La sala te escucha. Hoy estás en forma.",                 primary:"pod_nac",    baseGain:22, baseRisk:14 },
        { id:"se02", title:"Reunión con el Ejecutivo", desc:"El Presidente te recibe en privado. Sales contento. Él también, probablemente.",       primary:"pod_nac",    baseGain:26, baseRisk:18 },
        { id:"se03", title:"Voto Clave en Senado",     desc:"Tu voto décide la suerte de una ley importante. El país te observa.",                 primary:"peso_pol",   baseGain:28, baseRisk:20 },
        { id:"se04", title:"Declaración Institucional",desc:"Emites un comunicado oficial de máxima sobriedad. Usan palabras que nadie habla.",     primary:"resp_inst",  baseGain:18, baseRisk:10 },
        { id:"se05", title:"Audiencia Constitucional", desc:"Participas en el proceso de nombramiento de un juez. Con toda la solemnidad necesaria.", primary:"resp_inst", baseGain:22, baseRisk:14 },
        { id:"se06", title:"Congreso del Partido",     desc:"Asistes al congreso anual. Aplaudes en los momentos correctos.",                      primary:"rel_part",   baseGain:20, baseRisk:12 },
        { id:"se07", title:"Mediación Interna",        desc:"Apaciguas un conflicto interno que amenazaba fracturar el partido.",                   primary:"rel_part",   baseGain:24, baseRisk:16 },
        { id:"se08", title:"Visita Diplomática",       desc:"Recibes una delegación extranjera con protocolo completo y café de exportación.",      primary:"vis_int",    baseGain:22, baseRisk:12 },
        { id:"se09", title:"Cumbre Internacional",     desc:"Viajas a un foro global. Estrecha manos. Intercambia tarjetas. Suma kilómetros.",       primary:"vis_int",    baseGain:26, baseRisk:16 },
        { id:"se10", title:"Ley de Reforma Mayor",     desc:"Presentas una reforma estructural. El país la debatirá años. Tú ya firmaste.",         primary:"efec_legis", baseGain:28, baseRisk:22 },
        { id:"se11", title:"Acuerdo Bipartidista",     desc:"Logras que dos partidos opuestos firmen una ley común. Milagro moderno.",              primary:"efec_legis", baseGain:24, baseRisk:16 },
        { id:"se12", title:"Rueda de Prensa",          desc:"Convocas a la prensa y anuncias medidas. Algunos periodistas te creen.",               primary:"inf_med",    baseGain:20, baseRisk:14 },
        { id:"se13", title:"Documental sobre tu Cargo", desc:"Un canal filma tu gestión. Salgas bien. O casi bien.",                                primary:"inf_med",    baseGain:16, baseRisk:12 },
        { id:"se14", title:"Discurso del Legado",      desc:"Hablas sobre qué quieres dejar para la historia. La historia decide más tarde.",       primary:"legado",     baseGain:20, baseRisk:10 },
        { id:"se15", title:"Inauguración de Obra Nacional", desc:"Cortas la cinta de una obra de impacto nacional. La cinta es dorada, cómo no.",    primary:"legado",     baseGain:24, baseRisk:16 },
        { id:"se16", title:"Alianza Territorial",      desc:"Unes a senadores de distintas regiones bajo una agenda común.",                        primary:"pod_nac",    baseGain:22, baseRisk:18 },
        { id:"se17", title:"Decreto de Estado",        desc:"Impulsas una declaración de estado especial ante una crisis. Emergencia legislativa.",  primary:"peso_pol",   baseGain:26, baseRisk:22 },
        { id:"se18", title:"Sesión Especial",          desc:"Convocas una sesión fuera del calendario normal. Urgencia real o calculada.",           primary:"efec_legis", baseGain:20, baseRisk:14 },
        { id:"se19", title:"Foro de Liderazgo",        desc:"Te invitan como panelista principal. Hablas con gravedad. Te fotografían.",             primary:"inf_med",    baseGain:18, baseRisk:10 },
        { id:"se20", title:"Homenaje Institucional",   desc:"Recibes un reconocimiento formal del Senado. Guardas la plaqueta para la posteridad.", primary:"legado",     baseGain:18, baseRisk:8  },
        // ── CARTAS DE PROMESA ──
        { id:"se_p1", title:"La Gran Reforma Histórica™", desc:"Propones una reforma que cambiará el país. Todos aplauden. Nadie sabe los detalles. Perfecto por ahora.", primary:"efec_legis", baseGain:26, baseRisk:0, noRisk:true,
          promise:{ label:"📜 Reforma vence", roundsLeft:2, effects:[{meterId:"legado", amount:12}, {meterId:"resp_inst", amount:-22}] } },
        { id:"se_p2", title:"Alianza Estratégica (con asterisco)", desc:"Tejes una alianza poderosa. El comunicado es espléndido. El acuerdo privado, menos.", primary:"rel_part", baseGain:20, baseRisk:0, noRisk:true,
          promise:{ label:"🤝 Alianza vence", roundsLeft:2, effects:[{meterId:"rel_part", amount:8}, {meterId:"peso_pol", amount:-18}] } }
    ],

    /* ════════════════════════════════════════════════════
       PRESIDENTE
       Medidores: eco_nac, apoyo_pol, estab_soc, img_int, seg_nac, fin_pub, des_sost, inst_sol
       ════════════════════════════════════════════════════ */
    presidente: [
        { id:"pr01", title:"Paquete de Reactivación",  desc:"Anuncias medidas económicas urgentes. Los mercados reaccionan. No siempre bien.",     primary:"eco_nac",   baseGain:28, baseRisk:20 },
        { id:"pr02", title:"Acuerdo Comercial",        desc:"Firmas tratado con otro país. El PIB proyectado sube. El tiempo dirá.",               primary:"eco_nac",   baseGain:24, baseRisk:16 },
        { id:"pr03", title:"Plan de Empleo Nacional",  desc:"Lanzas un plan de empleo masivo. Miles de puestos de trabajo. Muchos temporales.",    primary:"eco_nac",   baseGain:22, baseRisk:18 },
        { id:"pr04", title:"Coalición de Gobierno",    desc:"Integras un tercer partido al gabinete. Más sillas, más cuotas, más tensión.",        primary:"apoyo_pol", baseGain:24, baseRisk:18 },
        { id:"pr05", title:"Consulta Ciudadana",       desc:"Preguntas al pueblo. El pueblo responde. No siempre lo que esperabas.",               primary:"apoyo_pol", baseGain:20, baseRisk:14 },
        { id:"pr06", title:"Discurso a la Nación",     desc:"Hablas desde el palacio. Todo el país te observa. No tartamudeas. Hoy no.",           primary:"estab_soc", baseGain:22, baseRisk:14 },
        { id:"pr07", title:"Estado de Excepción",      desc:"Declaras emergencia ante una crisis social. La calma llega con restricciones.",       primary:"estab_soc", baseGain:26, baseRisk:24 },
        { id:"pr08", title:"Visita de Estado",         desc:"Recibes a un jefe de Estado extranjero. Protocolo, banderas y apretón de manos.",    primary:"img_int",   baseGain:22, baseRisk:12 },
        { id:"pr09", title:"Cumbre del G20",           desc:"Participas en el foro económico global. Tu asiento está en la mesa grande.",          primary:"img_int",   baseGain:28, baseRisk:18 },
        { id:"pr10", title:"Acuerdo de Paz Regional",  desc:"Medias un conflicto vecinal. La región respira. Tú firmas en el centro.",            primary:"img_int",   baseGain:26, baseRisk:16 },
        { id:"pr11", title:"Operación Antiterrorista", desc:"Autorizas una operación de seguridad. Resulta. El elogio y la controversia llegan juntos.", primary:"seg_nac", baseGain:26, baseRisk:20 },
        { id:"pr12", title:"Reforma a las FFAA",       desc:"Modernizas las fuerzas armadas. Más capacidad, más costo, más debate.",               primary:"seg_nac",   baseGain:22, baseRisk:18 },
        { id:"pr13", title:"Plan Presupuestario",      desc:"Presentas el presupuesto al congreso. Negociación larga, resultado aceptable.",       primary:"fin_pub",   baseGain:24, baseRisk:16 },
        { id:"pr14", title:"Reducción de Deuda",       desc:"Implementas plan de pago de deuda. Los acreedores sonríen. El pueblo aprieta cinturón.", primary:"fin_pub", baseGain:28, baseRisk:22 },
        { id:"pr15", title:"Ley de Energías Renovables", desc:"Impulsa la transición energética. El planeta agradece. Los combustibles, no.",      primary:"des_sost",  baseGain:24, baseRisk:16 },
        { id:"pr16", title:"Reforestación Nacional",   desc:"Lanzas el plan más verde de la historia. Árboles, fotógrafos, aplausos.",            primary:"des_sost",  baseGain:20, baseRisk:12 },
        { id:"pr17", title:"Reforma de la Constitución", desc:"Propones cambios constitucionales. Todo el país tiene una opinión. Nadie la misma.", primary:"inst_sol",  baseGain:30, baseRisk:28 },
        { id:"pr18", title:"Nombramiento Judicial",    desc:"Designas a un juez de la corte suprema. Tu legado judicial queda sellado.",           primary:"inst_sol",  baseGain:22, baseRisk:16 },
        { id:"pr19", title:"Ley Anticorrupción",       desc:"Firmas la ley contra la corrupción. El mismo día, alguien de tu gabinete es investigado.", primary:"inst_sol", baseGain:26, baseRisk:22 },
        { id:"pr20", title:"Referéndum Nacional",      desc:"Sometes una decisión histórica al voto popular. El resultado te sorprende.",          primary:"apoyo_pol", baseGain:24, baseRisk:22 },
        // ── CARTAS DE PROMESA ──
        { id:"pr_p1", title:"Decreto Populista (letra chica pendiente)", desc:"Firmas un decreto que encanta a las masas. El Ministerio de Hacienda emite un comunicado sombrío.", primary:"apoyo_pol", baseGain:24, baseRisk:0, noRisk:true,
          promise:{ label:"📣 Decreto vence", roundsLeft:2, effects:[{meterId:"fin_pub", amount:-28}] } },
        { id:"pr_p2", title:"Plan Nacional de Todo (en cuotas)", desc:"Anuncias un plan ambicioso de infraestructura. La bolsa sube. El déficit también.", primary:"eco_nac", baseGain:22, baseRisk:0, noRisk:true,
          promise:{ label:"🏗️ Plan vence", roundsLeft:2, effects:[{meterId:"fin_pub", amount:-24}, {meterId:"eco_nac", amount:10}] } }
    ],

    /* ════════════════════════════════════════════════════
       CARTAS UNIVERSALES — Aplican en cualquier cargo
       Medidor primario: siempre uno de los medidores permanentes o político común
       El secondary se resuelve dinámicamente igual
       Nota: estas cartas tienen primary: 'any' → el generador toma el primer metro activo
       ════════════════════════════════════════════════════ */
    universal: [
        { id:"un01", title:"Escándalo en la Prensa",    desc:"Un periodista publica algo incómodo. La verdad, a medias. El daño, completo.",       primary:"any", baseGain:0,  baseRisk:22 },
        { id:"un02", title:"Filtración Interna",        desc:"Alguien de tu equipo habla de más. El partido organiza una cacería de topos.",       primary:"any", baseGain:0,  baseRisk:18 },
        { id:"un03", title:"Golpe de Suerte",           desc:"Un evento inesperado te favorece políticamente. No lo planeaste. Tampoco te quejas.", primary:"any", baseGain:24, baseRisk:0  },
        { id:"un04", title:"Crisis Climática Local",    desc:"Una tormenta o sequía afecta tu territorio. La naturaleza no respeta agendas.",       primary:"any", baseGain:0,  baseRisk:20 },
        { id:"un05", title:"Encuesta Favorable",        desc:"Una encuesta te pone primero. La enmarcas. La publicas. La repites en cada discurso.", primary:"any", baseGain:18, baseRisk:8  },
        { id:"un06", title:"Encuesta Desfavorable",     desc:"Otra encuesta te hunde. Llamas al metodólogo. El metodólogo no contesta.",           primary:"any", baseGain:0,  baseRisk:18 },
        { id:"un07", title:"Visita Inesperada de Prensa", desc:"Periodistas llegan sin cita previa. Improvisas. Te grabas hablando mal de ellos.",  primary:"any", baseGain:0,  baseRisk:16 },
        { id:"un08", title:"Conferencia de Celebración", desc:"Anuncias un logro. Solo tú lo ves claramente como logro, pero se festeja igual.",   primary:"any", baseGain:16, baseRisk:8  },
        { id:"un09", title:"Acuerdo Secreto",           desc:"Firmas algo discretamente. El discreto en política dura poco.",                      primary:"any", baseGain:20, baseRisk:22 },
        { id:"un10", title:"Renuncia de Colaborador",   desc:"Un asesor clave renuncia. Se lleva información, credibilidad y el acceso al café.",   primary:"any", baseGain:0,  baseRisk:16 },
        { id:"un11", title:"Donación Anónima",          desc:"Recibes apoyo financiero sin firma. El dinero no pregunta. Los auditores sí.",        primary:"any", baseGain:22, baseRisk:20 },
        { id:"un12", title:"Momento Viral",             desc:"Un video tuyo se vuelve viral. Por fortuna, por error o por ambas razones.",          primary:"any", baseGain:20, baseRisk:14 },
        { id:"un13", title:"Huelga General",            desc:"El sector laboral para todo. Negocias. Te cuesta. Cedes lo que no querías.",          primary:"any", baseGain:0,  baseRisk:20 },
        { id:"un14", title:"Éxito Inesperado",          desc:"Una política tuya funciona mejor de lo esperado. Nadie sabe exactamente por qué.",   primary:"any", baseGain:22, baseRisk:0  },
        { id:"un15", title:"Crisis Sanitaria",          desc:"Un brote de algo afecta la región. Actúas. Demasiado tarde para algunos, justo para otros.", primary:"any", baseGain:0, baseRisk:18 }
    ]
};

/* ══════════════════════════════════════════════════════════════════
   GENERADOR DE CARTAS — Sistema Híbrido con Anti-Repetición
   ══════════════════════════════════════════════════════════════════
   REGLAS DURAS:
   1. Cada turno, cada medidor activo aparece como efecto POSITIVO en AL MENOS 1 carta
   2. Cada carta tiene SIEMPRE 2 efectos (positivo y negativo en medidores distintos)
   3. Nunca se repite la misma carta dentro del mismo cargo (anti-repeat)
   ══════════════════════════════════════════════════════════════════ */
const CardGenerator = {
    usedCardIds: new Set(),
    lastTurnCards: [],

    resetPool: function() {
        this.usedCardIds.clear();
        this.lastTurnCards = [];
    },

    /**
     * Si quedan menos cartas elegibles que las necesarias o si algún medidor activo
     * se queda sin cartas específicas (y no hay universales), baraja el mazo.
     */
    _reshuffleIfNeeded: function(activeMeters, roleId, needed) {
        let needsReshuffle = false;
        const rolePool      = CARD_POOL[roleId]       || [];
        const universalPool = CARD_POOL['universal']   || [];

        const eligible = [...rolePool, ...universalPool].filter(c => {
            if (this.usedCardIds.has(c.id)) return false;
            if (c.primary === 'any') return true;
            return activeMeters.some(m => m.id === c.primary);
        });

        if (eligible.length < needed) {
            needsReshuffle = true;
        } else {
            const availUniversals = universalPool.filter(c => !this.usedCardIds.has(c.id));
            if (availUniversals.length === 0) {
                // Si no hay universales de reemplazo, exigimos que haya al menos 1 carta
                // para CADA uno de los medidores activos.
                for (const meter of activeMeters) {
                    const specificAvail = rolePool.filter(c => c.primary === meter.id && !this.usedCardIds.has(c.id));
                    if (specificAvail.length === 0) {
                        needsReshuffle = true;
                        break;
                    }
                }
            }
        }

        if (needsReshuffle) {
            this.usedCardIds.clear();
            // Evitar que salgan en el mismo turno inmediato tras barajar
            this.lastTurnCards.forEach(id => this.usedCardIds.add(id));
            console.log('[Cards] ♻️ Pool agotado — mazo barajado de nuevo');
        }
    },

    /**
     * Genera exactamente `count` cartas garantizando cobertura total de medidores activos.
     */
    generateCardsForTurn: function(activeMeters, permMeter, count = 3, roleId = 'candidato') {
        this._reshuffleIfNeeded(activeMeters, roleId, count);

        const rolePool      = (CARD_POOL[roleId]      || []).filter(c => !this.usedCardIds.has(c.id));
        const universalPool = (CARD_POOL['universal']  || []).filter(c => !this.usedCardIds.has(c.id));

        const result       = [];
        const usedThisTurn = new Set();  // evitar duplicados dentro del mismo turno

        // ── FASE 1: Una carta por medidor activo (garantía de cobertura) ──
        // Barajamos los medidores para que el orden sea aleatorio
        const shuffledMeters = [...activeMeters].sort(() => 0.5 - _rng());

        for (const meter of shuffledMeters) {
            if (result.length >= count) break;

            // Buscar carta del cargo específico para este medidor
            const roleCards = rolePool.filter(c =>
                c.primary === meter.id && !usedThisTurn.has(c.id)
            );

            let picked = null;
            if (roleCards.length > 0) {
                picked = roleCards[Math.floor(_rng() * roleCards.length)];
            } else {
                // Fallback: universal disponible
                const univAvail = universalPool.filter(c => !usedThisTurn.has(c.id));
                if (univAvail.length > 0) {
                    picked = univAvail[Math.floor(_rng() * univAvail.length)];
                }
            }

            if (picked) {
                usedThisTurn.add(picked.id);
                result.push(this._buildCard(picked, activeMeters, permMeter, meter.id));
            }
        }

        // ── FASE 2: Rellenar slots restantes con cartas variadas ──
        while (result.length < count) {
            const remaining = [
                ...rolePool.filter(c =>
                    !usedThisTurn.has(c.id) &&
                    activeMeters.some(m => m.id === c.primary)
                ),
                ...universalPool.filter(c => !usedThisTurn.has(c.id))
            ];

            if (remaining.length === 0) break;

            const picked = remaining[Math.floor(_rng() * remaining.length)];
            usedThisTurn.add(picked.id);
            result.push(this._buildCard(picked, activeMeters, permMeter, null));
        }

        // Marcar todas como usadas (anti-repeat para turnos futuros)
        usedThisTurn.forEach(id => this.usedCardIds.add(id));
        this.lastTurnCards = Array.from(usedThisTurn);

        return result.slice(0, count);
    },

    /**
     * Construye una instancia de carta con 2 efectos SIEMPRE en medidores DISTINTOS.
     * @param {Object}  template         Plantilla de la carta
     * @param {Array}   activeMeters     Medidores activos del turno
     * @param {Object}  permMeter        Medidor permanente
     * @param {string}  forcedPrimaryId  Si no es null, este metro es el efecto positivo
     */
    _buildCard: function(template, activeMeters, permMeter, forcedPrimaryId) {
        const varPos = 1 + ((_rng() * 0.5) - 0.25);   // ±25%
        const varNeg = 1 + ((_rng() * 0.5) - 0.25);

        // Cartas de promesa (noRisk): solo efecto positivo inmediato, el coste es diferido
        const isPromiseCard = !!template.noRisk;

        const gainBase = (template.baseGain > 0) ? template.baseGain : 8;
        const riskBase = (template.baseRisk > 0) ? template.baseRisk : (isPromiseCard ? 0 : 8);

        const finalGain = Math.max(5, Math.round(gainBase * varPos));
        const finalRisk = isPromiseCard ? 0 : Math.max(5, Math.round(riskBase * varNeg));

        // ── Determinar el medidor POSITIVO (primary) ──
        let chosenPrimaryId;
        if (forcedPrimaryId) {
            // Fase 1: metro forzado para garantizar cobertura
            chosenPrimaryId = forcedPrimaryId;
        } else if (template.primary === 'any') {
            // Universal sin forzar: escoger al azar entre activos y permanente
            const candidates = [...activeMeters];
            if (permMeter) candidates.push(permMeter);
            chosenPrimaryId = candidates[Math.floor(_rng() * candidates.length)]?.id;
        } else if (permMeter && _rng() < 0.15) {
            // 15% de chance de que una carta normal de cargo "bonus" el medidor permanente
            chosenPrimaryId = permMeter.id;
        } else {
            chosenPrimaryId = template.primary;
        }

        const posMeter = activeMeters.find(m => m.id === chosenPrimaryId)
                      || (permMeter?.id === chosenPrimaryId ? permMeter : null)
                      || activeMeters[0];

        // ── Determinar el medidor NEGATIVO (diferente al positivo) ──
        // REGLA: negMeter NUNCA puede ser el mismo que posMeter
        const negCandidates = activeMeters.filter(m => m.id !== posMeter?.id);

        let negMeter;
        if (permMeter && permMeter.id !== posMeter?.id && _rng() < 0.20) {
            // 20% de chance de que el costo afecte al medidor permanente
            negMeter = permMeter;
        } else if (negCandidates.length > 0) {
            negMeter = negCandidates[Math.floor(_rng() * negCandidates.length)];
        } else {
            // Último recurso: permanente (si ya no hay otros)
            negMeter = (permMeter && permMeter.id !== posMeter?.id) ? permMeter : activeMeters[0];
        }

        const effects = [];
        if (posMeter) effects.push({ meterId: posMeter.id, meterName: posMeter.name, amount: finalGain });
        if (!isPromiseCard && negMeter && finalRisk > 0) {
            effects.push({ meterId: negMeter.id, meterName: negMeter.name, amount: -finalRisk });
        }

        return {
            id:       template.id + '_' + Date.now(),
            title:    template.title,
            desc:     template.desc,
            primary:  posMeter?.id,
            isPromise: isPromiseCard,
            promise:  template.promise || null,
            effects
        };
    }
};

