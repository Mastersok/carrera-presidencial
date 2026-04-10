# Lista de Tareas (Carrera Presidencial)

Esta es la 'biblia' del estado del proyecto para la carpeta de documentación.

## FASE 1: Setup y Documentación [COMPLETO]
- [x] Crear estructura base de carpetas.
- [x] Crear `GDD.md`, `CHANGELOG.md` y `TODO.md`.

## FASE 2: Arquitectura HTML/CSS (La Interfaz del Cargo) [COMPLETO]
- [x] Crear esqueleto `index.html` con las 4 zonas clave (Header Cargo, Medidores, Promesas/Eventos, Cartas).
- [x] Programar CSS con paleta 'Poder & Golpe' (Dorado, Crimson, Esmeralda).
- [x] Maquetar estructura visual de una Carta interactiva ('Juicy UI', hover, animaciones de entrada).
- [x] Maquetar visualización de Medidor (barras reactivas con semáforo dinámico).
- [x] Maquetar esqueleto visual del Modal "Periódico" (Estilo Realismo Premium).

## FASE 3: Lógica Core - Engine y Estado (`js/engine.js`) [COMPLETO]
- [x] Definir estructura de datos del `GameState` (rondas, cargo actual, medidores activos, medidor permanente).
- [x] Crear generador aleatorio de setup de run (asignar 3 de 8 medidores según el cargo actual + 1 permanente).
- [x] Desarrollar bucle maestro de turnos (evaluación de vida en 0 tras carta, control de fin de rondas, umbral de ascenso).
- [x] Implementar sistema básico de Promesas latentes.

## FASE 4: Sistema de Cartas (`js/cards.js`) [COMPLETO]
- [x] Definir JSON/objetos constantes con Plantillas Bases por Cargo y Tipo.
- [x] Programar Función Generadora (filtrar plantillas por medidores activos del State).
- [x] Programar inyección de valores ± y cálculo matemático balanceado.

## FASE 5: UI Controller (`js/ui.js`) y Periódico Dinámico [COMPLETO]
- [x] Conectar motor interno con DOM (Renderer de valores de medidores hacia barras HTML).
- [x] Renderizar las 3 cartas opciones inyectando los datos de texto de las plantillas generadas.
- [x] Controlar eventos OnClick reales de la carta (aplicar efectos -> pasar turno -> re-render).
- [x] Programar Lógica del Periódico (evaluar si es Win/Loss y seleccionar Titular en base a medidores).
- [x] Mover textos a archivo independiente y expandir narrativa (párrafos de estilo noticia por cargo y avisos satíricos).

## FASE 6: Polish (Pulido y Sonido) [COMPLETO]
- [x] Añadir SFX base para Interacción de Cartas y Alarmas de medidor crítico.
- [x] Balance Test Nivel 1-5 (Desde Candidato a Presidente).
- [x] Git & GitHub Deployment.

## FASE 7: Roadmap hacia Steam [EN PROCESO]
- [x] Pilar 1: Juice & Game Feel (Fase 1: Física y Hovers).
- [x] Pilar 1: Juice & Game Feel (Fase 2: Partículas y Shake).
- [x] Pilar 2: Profundidad y Rejugabilidad (Perfiles, Promesas, Eventos por cargo, Múltiples finales, Seed).
- [ ] Pilar 3: Música Dinámica y Audio Babble.
