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
| Perfiles iniciales (pool 8, muestra 4 por run) | ✅ |
| Eventos especiales por cargo (17, filtrados por rol) | ✅ |
| Sistema de Promesas (efectos retardados) | ✅ |
| Seed system + Daily Challenge | ✅ |
| Múltiples finales (Estadista/Caudillo/Oligarca/Dictador) | ✅ |
| Metaprogresión / Desbloqueables | ❌ |
| Achievements | ✅ |
| Menú de opciones completo | ✅ |
| Soporte teclado/mando | ❌ |
| Localización ES/EN | ✅ |

---

## Los 8 Pilares Comerciales

### 🎮 PILAR 1 — Game Feel / Juice
**Prioridad: PRIMERO**
*Sin esto el juego se siente como prototipo, no como producto.*

- [x] Squash & stretch al hacer clic en una carta (compresión + rebote)
- [x] Preview de efectos al hacer hover sobre cada carta (resaltar medidores afectados)
- [x] Hitstop de 2-3 frames en momentos dramáticos
- [x] Partículas al subir medidores (+) y al bajar (-)
- [x] Counter Anims: Efecto de "surtidor de bencina" en los valores numéricos (conteo de números).
- [x] Shake en la carta rechazada al seleccionar otra

**Stack técnico:**
- GSAP (GreenSock) o Anime.js para animaciones de cartas
- Canvas API nativa para partículas (sin dependencias extra)
- CSS transform: scale() para squash & stretch simple

---

### 🔄 PILAR 2 — Profundidad y Rejugabilidad
**Prioridad: SEGUNDO**

- [x] Perfiles iniciales (elegir antes de empezar cada run):
  - Hijo de Millonario: +20% Dinero, -10% Credibilidad
  - Líder Sindical: +20% Bases, -10% Imagen
  - Tecnócrata: +20% Profesionalismo, -10% Popularidad
  - Populista Nato: +25% Popularidad, -15% Presupuesto
- [x] Promises System: Cartas que generan una promesa que vence en 2 rondas
- [x] Eventos aleatorios cada 3-4 rondas (interrupción tipo Reigns: 1 carta gigante, 2 opciones)
- [x] Múltiples finales según perfil de victoria:
  - Alta Corrupción: Final del Oligarca corrupto
  - Alta Popularidad: Final del Caudillo populista
  - Equilibrio perfecto: Final del Estadista
  - Fuerza/Control: Final del Dictador "democrático"
- [x] Seed system para compartir partidas (código de 6 dígitos reproducible)
- [x] Daily Challenge: Seed fija diaria con tabla de posiciones

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

- [x] Volumen de música (slider 0-100%)
- [x] Volumen de efectos de sonido (slider 0-100%)
- [x] Toggle Pantalla Completa / Ventana
- [x] Reducir animaciones (modo accesibilidad)
- [x] Idioma: Español / English (UI y persistencia listas)

**Stack técnico:**
- localStorage para persistir preferencias entre sesiones
- Fullscreen API nativa del navegador (sin librerías)

---

### 🏆 PILAR 5 — Sistema de Achievements
**Prioridad: CUARTO**
*Steam los requiere; generan comunidad y viralidad orgánica.*

> **Nota de diseño:** Todas las condiciones usan variables internas del engine
> (`corruptionScore`, `popularityScore`, `controlScore`, `roleIndex`, `usedEventIds`, etc.)
> — nunca nombres de medidores específicos de un cargo, que no existen en otros.

#### 🟢 Primeros Pasos
| Achievement | Condición técnica | Rareza |
|---|---|:---:|
| **"Primeros Votos"** | Completa el cargo de Candidato por primera vez | Común |
| **"El Primer Tropiezo"** | Pierde una partida (cualquier cargo) | Común |
| **"Promesa Rota"** | Una promesa vence y activa sus efectos negativos (`promises_expired`) | Común |
| **"Compartir el Poder"** | Copia tu código de semilla con el botón de copiar | Común |

#### 🟡 Los 4 Finales
*Cada final tiene su achievement — el jugador que los quiere todos debe cambiar de estilo entre runs.*

| Achievement | Condición técnica | Rareza |
|---|---|:---:|
| **"El Estadista"** | `getVictoryProfile() === "estadista"` al terminar la carrera | Poco común |
| **"El Caudillo"** | `getVictoryProfile() === "caudillo"` al terminar la carrera | Poco común |
| **"El Oligarca"** | `getVictoryProfile() === "oligarca"` al terminar la carrera | Poco común |
| **"El Dictador"** | `getVictoryProfile() === "dictador"` al terminar la carrera | Poco común |
| **"Los 4 Rostros del Poder"** | Obtener los 4 finales distintos a lo largo de cualquier número de runs | Raro |

#### 🔴 Desafíos de Carrera
| Achievement | Condición técnica | Rareza |
|---|---|:---:|
| **"Desafío Diario"** | `isDailyChallenge === true && runStatus === "victory"` | Poco común |
| **"Crisis Manager"** | `usedEventIds.length >= 5` en una sola run | Raro |
| **"Al Filo del Abismo"** | Gana un cargo con al menos un medidor por debajo del umbral mínimo al inicio de la última ronda | Raro |
| **"Sin Mancha"** | Termina la carrera completa con `corruptionScore < 30` | Raro |

#### 🟣 Playstyle & Estrategia
| Achievement | Condición técnica | Rareza |
|---|---|:---:|
| **"Voz del Pueblo"** | `popularityScore > 500` al ganar la presidencia | Raro |
| **"Puño de Acero"** | `controlScore > 500` al ganar la presidencia | Raro |
| **"El Plan Funcionó"** | `corruptionScore > 300 && runStatus === "victory"` — ganar siendo corrupto | Épico |
| **"Hijo del Destino"** | Ganar la carrera completa usando el perfil "Hijo de Millonario" | Raro |

#### ⚫ Maestría Absoluta
| Achievement | Condición técnica | Rareza |
|---|---|:---:|
| **"Perfecto"** | Terminar la presidencia con los 3 medidores activos > 75% | Épico |
| **"Sin Tocar Fondo"** | Completar la carrera entera sin que ningún medidor llegue a 0% en ningún momento | Épico |
| **"Veterano"** | Completar 10 partidas completas hasta la presidencia (`localStorage` counter) | Legendario |

#### 🔒 Secretos *(ocultos hasta desbloquear)*
| Achievement | Condición técnica | Rareza |
|---|---|:---:|
| **"Night Owl"** | Jugar entre las 2:00am y las 4:00am según el reloj del sistema | Secreto |
| **"Semilla Maldita"** | Perder en la ronda 1 del cargo Candidato en un Daily Challenge | Secreto |
| **"Todo Pasa"** | Completar una partida completa sin resolver ningún evento especial (todos expirados o no disparados) | Secreto |

---

**Total: 22 achievements** — distribución: 4 Comunes · 6 Poco comunes · 7 Raros · 3 Épicos · 1 Legendario · 3 Secretos

---

**Stack técnico:**
- `js/achievements.js` — módulo independiente con array de definiciones + función evaluadora
- Cada achievement tiene: `{ id, name, desc, rarity, condition: fn(GameState, stats) }`
- Se evalúa en cada `notifyStateChange` (game_over, victory, won_role, promises_expired, random_event)
- `localStorage["cp_achievements"]` — JSON con IDs desbloqueados + contador de runs
- Toast de notificación: CSS puro + JS, sin librerías (slide-in desde arriba, 3s, estilo periódico)
- Al llegar a Steam: reemplazar `localStorage` por `Steamworks JS bindings` sin cambiar la lógica de condiciones

---

### 🌍 PILAR 6 — Localización ES / EN
**Prioridad: QUINTO**
*El humor político cínico vende muchísimo en el mercado anglosajón.*

- [x] Extraer TODOS los textos a locales/es.js
- [x] Traducir a locales/en.js
- [x] Adaptar el periódico a ambos idiomas
- [x] Adaptar las 115 cartas a ambos idiomas
- [x] Toggle de idioma en Menú de Opciones

**Stack técnico:**
- I18n custom IIFE (js/i18n.js) — sin dependencias externas, carga via `<script>` tags

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
