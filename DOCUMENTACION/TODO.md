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
- [x] Pilar 1: Juice & Game Feel (Fase 2: Partículas, Shake y Counter Anims).
- [x] Pilar 2: Profundidad y Rejugabilidad (Perfiles, Promesas, Eventos por cargo, Múltiples finales, Seed).
- [x] Pilar 3: Música Dinámica (Base implementada) y Sistema de Audio.
- [x] Pilar 4: Menú de Opciones (Completo con Audio, Video y Accesibilidad).
- [ ] Pilar 5: Sistema de Achievements (Configuración técnica preparada).
- [x] Pilar 6: Localización ES/EN (Sistema dinámico i18n).

## FASE 8: Polish de Lanzamiento y Balanceo de Sistemas [EN PROCESO]
- [x] **Refactor de UI**: Sistema de renderizado persistente (para no romper animaciones).
- [x] **Juice Avanzado**: Origen de partículas en la posición del click (`MouseEvent` tracking).
- [x] **Counter Anims**: Efecto de "surtidor de bencina" en los valores numéricos.
- [x] **Balanceo v0.8.2**: Corregir sesgo negativo del medidor permanente (ahora 15% chance positivo).
- [x] **Fix de Eventos**: Asegurar un evento especial único por cargo en el punto medio.
- [ ] **Sistema de Ministros**: Diseño conceptual completo (vínculo con medidores activos).
- [ ] **Metaprogresión**: Lógica de puntos de prestigio post-partida.
