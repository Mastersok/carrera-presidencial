# Lista de Tareas (Carrera Presidencial)

Esta es la 'biblia' del estado del proyecto para la carpeta de documentación.

## FASE 1: Setup y Documentación
- [x] Crear estructura base de carpetas.
- [x] Crear `GDD.md`, `CHANGELOG.md` y `TODO.md`.

## FASE 2: Arquitectura HTML/CSS (La Interfaz del Cargo) [COMPLETO]
- [x] Crear esqueleto `index.html` con las 4 zonas clave (Header Cargo, Medidores, Promesas/Eventos, Cartas).
- [x] Programar CSS con paleta 'Presidential Midnight' (Glassmorphism, Inter & Playfair Fonts).
- [x] Maquetar estructura visual de una Carta interactiva ('Juicy UI', hover, animaciones de entrada).
- [x] Maquetar visualización de Medidor (barras reactivas con glow).
- [x] Maquetar esqueleto visual del Modal "Periódico" (Estilo oficial Journal).

## FASE 3: Lógica Core - Engine y Estado (`js/engine.js`)
- [ ] Definir estructura de datos del `GameState` (rondas, cargo actual, medidores activos, medidor permanente).
- [ ] Crear generador aleatorio de setup de run (asignar 3 de 8 medidores según el cargo actual + 1 permanente).
- [ ] Desarrollar bucle maestro de turnos (evaluación de vida en 0 tras carta, control de fin de rondas, umbral de ascenso).
- [ ] Implementar sistema básico de Promesas latentes (trackear cooldown y efectos post-ronda).

## FASE 4: Sistema de Cartas (`js/cards.js`)
- [ ] Definir JSON/objetos constantes con Plantillas Bases por Cargo y Tipo.
- [ ] Programar Función Generadora (filtrar plantillas por medidores activos del State).
- [ ] Programar inyección de valores ± y cálculo matemático balanceado (+/- 30% del valor base).
- [ ] Garantizar que devuelva 3 opciones legales por turno de validación.

## FASE 5: UI Controller (`js/ui.js`) y Periódico Dinámico
- [ ] Conectar motor interno con DOM (Renderer de valores de medidores hacia barras HTML).
- [ ] Renderizar las 3 cartas opciones inyectando los datos de texto de las plantillas generadas.
- [ ] Controlar eventos OnClick reales de la carta (aplicar efectos -> pasar turno -> re-render).
- [ ] Programar Lógica del Periódico (evaluar si es Win/Loss y seleccionar Titular en base a medidores).

## FASE 6: Polish (Pulido y Sonido)
- [ ] Añadir SFX base para Interacción de Cartas y Alarmas de medidor crítico.
- [ ] Balance Test Nivel 1 (Candidato).
