# Registro de Cambios (Changelog)

Todas las novedades, implementaciones tecnológicas y decisiones arquitecturales de Carrera Presidencial se documentarán aquí.

## [v0.1.0] - Inicio del Proyecto
- **Añadido:** Estructura de carpetas inicial y ecosistema de documentación base.
- **Añadido:** `DOCUMENTACION/GDD.md`, `TODO.md` y `CHANGELOG.md`.

## [v0.2.0] - Rediseño Visual "Presidential Midnight"
- **Mejora:** Implementación de paleta de colores premium basada en investigación de juegos de estrategia modernos.
- **Mejora:** Integración de Google Fonts (Inter para UI y Playfair Display para Periódicos).
- **Añadido:** Efectos de Glassmorphism (desenfoque de fondo y bordes translúcidos).
- **Añadido:** Micro-animaciones en cartas (entrada suave y hover interactivo).
- **Añadido:** Forzado de recarga de assets para navegadores (Cache Busting).

## [v0.3.0] - Rediseño Visual "Poder & Golpe"
- **Mejora:** Nueva paleta "Poder Corrupto" (Negro + Crimson + Dorado + Esmeralda).
- **Mejora:** Periódico estilo NYT con tipografía gótica (UnifrakturMaguntia), ornamentos, y estructura real.
- **Añadido:** Tooltips en medidores — hover muestra descripción completa de cada métrica.
- **Añadido:** Descripciones (icon + desc) para los 50+ medidores del juego.
- **Añadido:** Sistema de semáforo visual (Verde > 50%, Amarillo 26-50%, Rojo ≤ 25%).
- **Añadido:** Animaciones de feedback: Flash dorado al seleccionar carta, Screen Shake al perder.
- **Añadido:** Animación de selección/rechazo de cartas (la elegida brilla, las otras se desvanecen).
- **Fix:** Medidor permanente ahora puede ser modificado por cartas (35% de probabilidad).
- **Fix:** Periódico ilegible reemplazado por diseño puro CSS sin textura.

## [v0.4.0] - Expansión Narrativa del Periódico
- **Mejora:** Transformación de las noticias de una sola frase a verdaderos párrafos descriptivos y humorísticos de 2 a 3 oraciones.
- **Añadido:** Nuevo archivo independiente `js/newspaper-content.js` para separar los datos (textos) de la lógica de interfaz.
- **Añadido:** 10 titulares y 10 artículos únicos por cargo para escenario de victoria, y 10 para derrota (100 textos robustos en total).
- **Añadido:** 30 "Otros Titulares" aleatorios y 20 Avisos Clasificados satíricos para rellenar la columna lateral del diario.
- **Refactor:** `ui.js` lee e inyecta dinámicamente este contenido masivo basándose en el cargo correspondiente.

## [v0.3.1] - Semáforo Dinámico + Periódico Premium
- **Mejora:** Semáforo de medidores ahora es dinámico basado en el umbral mínimo de cada cargo.
  - Candidato: umbral 40%, Alcalde: 50%, Diputado: 60%, Senador: 65%, Presidente: 70%.
  - Verde: ≥ umbral, Amarillo: ≥ 65% del umbral, Rojo: < 65% del umbral.
- **Añadido:** Marca visual del umbral mínimo (▼) en cada barra de medidor.
- **Añadido:** Etiqueta "MÍNIMO: XX%" en el encabezado del juego.
- **Añadido:** Periódico con columna lateral ("Otros Titulares"), cita/blockquote y precio ficticio.
- **Añadido:** Headlines y textos variados aleatorios para victorias y derrotas.
- **Mejora:** Animaciones de cartas más lentas (900ms) para que se noten los efectos.
- **Fix:** Bloqueo de doble-click en cartas durante la animación.
- **Fix:** Efecto de "páginas apiladas" (box-shadow escalonado) en el periódico.

## [v0.5.0] - Steam Juice & Polish (Pilar 1)
- **Mejora:** Implementación de **Squash & Stretch** y **Hitstop** (Screen Shake de impacto) al seleccionar cartas.
- **Mejora:** Sistema de **Partículas** (íconos voladores) que viajan de la carta al medidor afectado.
- **Mejora:** Animación de **Shake de Rechazo** para las cartas no elegidas.
- **Mejora:** Implementación de **Camino 2: Iluminación de Previsión** (Glow dorado en medidores afectados).
- **Mejora:** Refuerzo de contraste en medidores críticos (glow rojo y animación de pulso).
- **Añadido:** **Pulsado 3D** en cartas con integración mejorada de Vanilla-Tilt.
- **Añadido:** Documento estratégico `STEAM_ROADMAP.md` para planificación comercial.
- **Añadido:** 32 nuevas cartas para Candidato y Alcalde, solucionando problemas de agotamiento y variedad.
## [v0.6.0] - Rejugabilidad & Profundidad (Pilar 2)
- **Añadido:** Sistema de **Perfiles Iniciales** (8 identidades únicas con bonos y penalizaciones).
- **Añadido:** **Promises System** (Cartas con efectos retardados).
- **Añadido:** **Eventos Aleatorios** expandidos (15 eventos tipo interrupción Reigns).
- **Añadido:** **Múltiples Finales** (Estadista, Caudillo, Oligarca, Dictador).
- **Añadido:** **Seed System** y **Daily Challenge** (Semillas compartibles y retos diarios).
- **Mejora:** Lógica de juego determinista basada en Mulberry32.
