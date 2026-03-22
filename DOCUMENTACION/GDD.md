# Política Dinámica - Documento de Diseño de Juego (GDD)

Versión: 2.0  
Fecha: Actualizado con todos los cambios discutidos  
Género: Roguelike / Deckbuilder / Simulación política  
Plataformas: PC / Web / Móvil (HTML + JS + CSS)  
Perspectiva: 2D, interfaz de cartas y medidores  

## 1. VISIÓN DEL JUEGO
### 1.1 Concepto General
El jugador comienza como candidato a alcalde y busca ascender hasta presidente, tomando decisiones estratégicas a través de cartas generadas dinámicamente. Cada run es única debido a la aleatorización de medidores activos y la generación contextual de cartas. El juego se reinicia completamente al perder (roguelike puro). 

El diseño busca el "Efecto Candy Crush": rejugabilidad altísima, turnos rápidos, victorias satisfactorias y derrotas por decisiones propias que motivan a intentar "sacar otra partida más".

### 1.2 Pilares de Diseño
1. **Decisión con Consecuencias:** Cada elección afecta múltiples medidores con trade-offs obligatorios.
2. **Rejugabilidad Extrema:** Ninguna run es igual debido a la aleatorización de medidores activos.
3. **Narrativa Emergente:** El periódico al final de cada cargo cuenta tu historia única basada en los balances finales.
4. **Estrategia Adaptativa:** Debes ajustar tu estrategia según qué medidores están activos.
5. **Ritmo Ágil (Pacing rápido):** Derrotas y reinicios sin fricción. Partida completa en ~15 minutos.
6. **Juicy UI & Audio:** Respuesta háptica y visual inmediata (sonidos fuertes al subir/bajar medidores, cartas físicas).

## 2. SISTEMA DE MEDIDORES
### 2.1 Estructura
- Cada cargo tiene 8 medidores temporales posibles.
- **Solo 3 medidores temporales** se activan aleatoriamente por cargo cada run.
- **1 medidor permanente** está activo durante toda la run.

#### Medidores por Cargo:
- **Candidato a Alcalde:** Popularidad, Dinero de campaña, Imagen pública, Apoyo base, Credibilidad, Momentum, Legitimidad, Profesionalismo.
- **Alcalde:** Satisfacción ciudadana, Presupuesto municipal, Estabilidad local, Seguridad pública, Salud pública, Educación local, Medio ambiente, Infraestructura.
- **Diputado:** Influencia distrital, Apoyo partidario, Poder legislativo, Transparencia, Presupuesto asignado, Imagen nacional, Coaliciones, Balance regional.
- **Senador:** Poder nacional, Respeto institucional, Relaciones partidarias, Visión internacional, Efectividad legislativa, Influencia mediática, Peso político, Legado.
- **Presidente:** Economía nacional, Apoyo político, Estabilidad social, Imagen internacional, Seguridad nacional, Finanzas públicas, Desarrollo sostenible, Instituciones sólidas.

#### Medidores Permanentes (1 por run):
1. Capital Político, Integridad Ética, Red Clientelar, Experiencia Técnica, Carisma Popular. *(Su impacto afecta multiplicadores pasivos o thresholds)*

### 2.2 Reglas
- Rango: 0-100 para todos. Inician en 50.
- Derrota inmediata: Cualquier medidor activo llega a 0.
- Ascenso: Todos los medidores activos deben ser ≥ al mínimo del cargo al terminar la ronda (40, 50, 60, 65, 70 respectivamente).

## 3. GENERACIÓN DE CARTAS DINÁMICAS
- Se presentan 3 cartas en cada una de las rondas del cargo (8 a 10 rondas según cargo).
- Solo afectan a los medidores **activos** (Máx 2 o 3 medidores modificados por carta).
- Cada carta tiene trade-off puro (un efecto + y un efecto -).
- Pueden lanzar promesas con contador de expiración (efectos latentes).

## 4. SISTEMA DE PERIÓDICO
El gran premio narrativo. Se genera al final (victoria o derrota) y contextualiza el resultado con titulares orgánicos que conectan los medidores resultantes. Emerge de un sistema de lógica basado en umbrales de resultados.

## 5. REGLAS TÉCNICAS Y UI
- **Desarrollo:** JavaScript Vanilla, HTML, CSS.
- **Pantalla:** Muestra 3 medidores temporales, 1 permanente, rol/etapa, y zona visual de Promesas Activas, más 3 ranuras de cartas interactivas.
