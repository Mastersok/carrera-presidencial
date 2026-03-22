/**
 * CARDS.JS - Sistema de Generación Dinámica de Cartas
 * Responsable de instanciar cartas basadas en los medidores 
 * activos del Game Context para asegurar que siempre ofrezcan un trade-off real.
 */

const CardGenerator = {
    // Plantillas de títulos genéricas que encajan en cualquier contexto político
    templates: [
        { title: "Declaración Contundente", desc: "Das un discurso publico agresivo pero aclamado por unos pocos.", baseR: 15, risk: 10 },
        { title: "Negociación Oscura", desc: "Llegas a un acuerdo a puertas cerradas. Nadie debe enterarse.", baseR: 20, risk: 15 },
        { title: "Medida de Austeridad", desc: "Tomas una decisión dolorosa hoy para un beneficio mañana.", baseR: 25, risk: 20 },
        { title: "Campaña de Territorio", desc: "Trabajo de base tradicional. Poco glamour pero efectivo.", baseR: 10, risk: 5 },
        { title: "Auditoría Interna", desc: "Decides investigar que ocurre a costa de algunos aliados.", baseR: 15, risk: 15 },
        { title: "Promesa Atrevida", desc: "Te comprometes públicamente a solucionar el gran problema.", baseR: 20, risk: 10 },
        { title: "Alianza Estratégica", desc: "Te unes temporalmente con un histórico rival político.", baseR: 25, risk: 25 },
        { title: "Control de Daños", desc: "Una inversión en RRPP para apagar un incendio inminente.", baseR: 30, risk: 20 }
    ],

    /**
     * Genera N cartas asegurando que solo afecten a los medidores ACTIVOS de esta run
     * y esporádicamente al medidor Permanente.
     * @param {Array} activeMeters - Array de medidores temporales
     * @param {Object} permMeter - Objeto del medidor permanente (Capital Político)
     * @param {number} count - Número de opciones a generar
     */
    generateCardsForTurn: function(activeMeters, permMeter, count = 3) {
        const genCards = [];
        
        // Evitar plantillas repetidas
        const availableTemplates = [...this.templates].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < count; i++) {
            const template = availableTemplates[i];
            
            // Elegimos dos medidores base
            const shuffledMeters = [...activeMeters].sort(() => 0.5 - Math.random());
            let posMeter = shuffledMeters[0];
            let negMeter = shuffledMeters[1];
            
            // Lógica: 35% de probabilidad de que esta carta afecte al Medidor Permanente (como castigo o recompensa)
            if (permMeter && Math.random() < 0.35) {
                if (Math.random() < 0.5) {
                    posMeter = permMeter; // Ganas permanente
                } else {
                    negMeter = permMeter; // Pierdes permanente
                }
            }
            
            // Lógica Central: Variación
            const varPos = 1 + ((Math.random() * 0.6) - 0.3);
            const varNeg = 1 + ((Math.random() * 0.6) - 0.3);
            
            const finalPosVal = Math.floor(template.baseR * varPos);
            const finalNegVal = -Math.floor(template.risk * varNeg);
            
            const card = {
                id: "card_" + Date.now() + i,
                title: template.title,
                desc: template.desc,
                effects: [
                    { meterId: posMeter.id, meterName: posMeter.name, amount: finalPosVal },
                    { meterId: negMeter.id, meterName: negMeter.name, amount: finalNegVal }
                ]
            };
            
            genCards.push(card);
        }
        
        return genCards;
    }
};
