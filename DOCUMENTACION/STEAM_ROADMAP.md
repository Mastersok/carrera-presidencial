# 🏛️ Carrera Presidencial — Roadmap hacia Steam

> Documento de planificación estratégica para la versión comercial.
> Estado del core loop: ✅ COMPLETO y funcional.
> Objetivo: Lanzamiento comercial en Steam (Windows + Mac).

---

## Estado Actual del Juego

| Elemento | Estado |
|---|:---:|
| Pantalla de inicio | ✅ |
| Tutorial (Cómo Jugar) | ✅ |
| Loop de juego (5 cargos) | ✅ |
| Sistema de cartas (115 únicas + 32 extra) | ✅ |
| Anti-repetición + Reshuffle | ✅ |
| Periódico narrativo al terminar cargo | ✅ |
| Cobertura garantizada de medidores | ✅ |
| Menú de pausa | ✅ |
| Audio básico | ✅ |
| Múltiples finales | ❌ |
| Metaprogresión / Desbloqueables | ❌ |
| Achievements | ❌ |
| Menú de opciones completo | ❌ |
| Soporte teclado/mando | ❌ |
| Localización ES/EN | ❌ |

---

## Los 8 Pilares Comerciales

### 🎮 PILAR 1 — Game Feel / Juice
**Prioridad: PRIMERO**
*Sin esto el juego se siente como prototipo, no como producto.*

- [x] Squash & stretch al hacer clic en una carta (compresión + rebote)
- [x] Preview de efectos al hacer hover sobre cada carta (resaltar medidores afectados)
- [ ] Hitstop de 2-3 frames en momentos dramáticos
- [ ] Partículas al subir medidores (+) y al bajar (-)
- [ ] Shake en la carta rechazada al seleccionar otra

**Stack técnico:**
- GSAP (GreenSock) o Anime.js para animaciones de cartas
- Canvas API nativa para partículas (sin dependencias extra)
- CSS transform: scale() para squash & stretch simple

---

### 🔄 PILAR 2 — Profundidad y Rejugabilidad
**Prioridad: SEGUNDO**

- [ ] Perfiles iniciales (elegir antes de empezar cada run):
  - Hijo de Millonario: +20% Dinero, -10% Credibilidad
  - Líder Sindical: +20% Bases, -10% Imagen
  - Tecnócrata: +20% Profesionalismo, -10% Popularidad
  - Populista Nato: +25% Popularidad, -15% Presupuesto
- [ ] Promises System: Cartas que generan una promesa que vence en 2 rondas
- [ ] Eventos aleatorios cada 3-4 rondas (interrupción tipo Reigns: 1 carta gigante, 2 opciones)
- [ ] Múltiples finales según perfil de victoria:
  - Alta Corrupción: Final del Oligarca corrupto
  - Alta Popularidad: Final del Caudillo populista
  - Equilibrio perfecto: Final del Estadista
  - Fuerza/Control: Final del Dictador "democrático"
- [ ] Seed system para compartir partidas (código de 6 dígitos reproducible)
- [ ] Daily Challenge: Seed fija diaria con tabla de posiciones

**Stack técnico:**
- Seedrandom.js para partidas reproducibles
- Pure JS para perfiles, eventos y finales
- localStorage para daily challenge y semilla del día

---

### 🎵 PILAR 3 — Música Dinámica
**Prioridad: TERCERO**

- [ ] Loops musicales por cargo (5 temas distintos: candidato → presidente)
- [ ] Capa de tensión que sube cuando algún medidor entra en rojo crítico
- [ ] Crossfade suave entre temas al cambiar de cargo
- [ ] Sonido de Babble cómico estilo Animal Crossing para el periódico

**Stack técnico:**
- Tone.js (ya integrado) para crossfade entre capas de audio
- Assets: Freesound.org / itch.io game-assets (CC0 o CC BY)

---

### ⚙️ PILAR 4 — Menú de Opciones
**Prioridad: TERCERO** (paralelo al anterior)
*Requisito mínimo para cualquier lanzamiento comercial.*

- [ ] Volumen de música (slider 0-100%)
- [ ] Volumen de efectos de sonido (slider 0-100%)
- [ ] Toggle Pantalla Completa / Ventana
- [ ] Reducir animaciones (modo accesibilidad)
- [ ] Idioma: Español / English

**Stack técnico:**
- localStorage para persistir preferencias entre sesiones
- Fullscreen API nativa del navegador (sin librerías)

---

### 🏆 PILAR 5 — Sistema de Achievements
**Prioridad: CUARTO**
*Steam los requiere; generan comunidad y viralidad orgánica.*

| Achievement | Condición | Rareza |
|---|---|:---:|
| Primer Escándalo | Pierde en el primer turno | Común |
| Sin Mancha | Completa Candidato con 0% Corrupción | Poco común |
| Oligarca | Gana con Dinero > 90% | Raro |
| El Plan Funcionó | Gana la presidencia con Credibilidad < 5% | Épico |
| Perfecto | Completa la Carrera con todos los medidores > 70% | Legendario |
| Night Owl | Juega a las 3am (timestamp real) | Secreto |
| 100 Veces | Jugar 100 partidas totales | Secreto |

**Stack técnico:**
- Archivo achievements.json con definiciones
- Módulo JS achievements.js que evalúa condiciones en tiempo real
- Notificación Toast al desbloquear (con animación)
- Al llegar a Steam: conectar con Steamworks JS bindings

---

### 🌍 PILAR 6 — Localización ES / EN
**Prioridad: QUINTO**
*El humor político cínico vende muchísimo en el mercado anglosajón.*

- [ ] Extraer TODOS los textos a locales/es.json
- [ ] Traducir a locales/en.json
- [ ] Adaptar el periódico a ambos idiomas
- [ ] Adaptar las 115 cartas a ambos idiomas
- [ ] Toggle de idioma en Menú de Opciones

**Stack técnico:**
- i18next (estándar industria para JS, liviano)

---

### 📦 PILAR 7 — Empaquetado para Steam
**Prioridad: PENÚLTIMO**
*Solo cuando el juego esté pulido. No hay que reescribir nada.*

- [ ] Instalar y configurar Electron.js (wrapper web → .exe / .app)
- [ ] Integrar Steamworks SDK via greenworks (node module)
- [ ] Steam Achievements conectados al sistema JS existente
- [ ] Steam Cloud Saves (sincroniza localStorage con la nube de Steam)
- [ ] Registrar en Steamworks ($100 USD, reembolsable al llegar a $1.000 en ventas)
- [ ] Build para Windows (x64) y Mac (arm64 + x64)
- [ ] Revisión manual de Valve (dejar 4 semanas de margen)

---

### 🎬 PILAR 8 — Store Page
**Prioridad: DESDE AHORA, en paralelo a todo**
*El juego más pulido fracasa con mala presentación en Steam.*

- [ ] Capsule Art (460x215px)
- [ ] Hero Capsule (616x353px)
- [ ] Screenshots (mínimo 5, mostrar variedad)
- [ ] GIFs animados para la descripción
- [ ] Trailer (60-90 seg, primeros 10 segundos son todo)
- [ ] Tags: Card Game, Political, Strategy, Roguelite, Singleplayer, Satirical
- [ ] Página "Coming Soon" para acumular wishlists ANTES del lanzamiento

**Herramientas:**
- ScreenToGif (capturas directo desde navegador)
- DaVinci Resolve (gratuito) o CapCut para el trailer

---

## 🗺️ Roadmap Visual

```
AHORA ──────────────────────────────────────────────────► STEAM

[1. GAME FEEL]
  └─ Hover preview + Squash carte + Partículas

[2. REJUGABILIDAD]
  └─ Perfiles + Eventos especiales + Múltiples finales

[3. AUDIO + OPCIONES]
  └─ Música dinámica + Menú opciones completo

[4. ACHIEVEMENTS]
  └─ Sistema local + notificaciones

[5. LOCALIZACIÓN]
  └─ ES/EN con i18next

[6. ELECTRON + STEAM]
  └─ .exe + Steamworks SDK

[PARALELO SIEMPRE]
  └─ Capturas · GIFs · Trailer · Coming Soon page
```

---

## Hook del juego en inglés (borrador)

> "Build your corrupt empire from city mayor to President.
> Every decision costs you something."

---

*Documento creado: 2026-04-09 | Versión: 1.0*
