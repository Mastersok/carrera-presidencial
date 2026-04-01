# Plan de Rediseño Visual — Estilo Cartoon
**Versión:** 1.0  
**Fecha:** 2026-04-01  
**Estado:** Pendiente de implementación

---

## Contexto

Durante la sesión del 01/04/2026 se decidió abandonar el estilo "dark premium/realista" actual y migrar a una estética **cartoon/dibujo animado**. El juego actualmente parece un dashboard web — el objetivo es que parezca un videojuego.

---

## Referentes Visuales (Para Estudiar Antes de Implementar)

| Juego / Show | Qué tomar |
|---|---|
| **Cuphead** | Outline negro grueso, colores planos saturados, sombras de 2 tonos |
| **Dicey Dungeons** | UI con bordes redondeados exagerados, sombras offset sólidas, texto gordo |
| **South Park: Phone Destroyer** | Cartas con ilustraciones caricaturescas, bordes gruesos |
| **Slay the Spire** | Jerarquía visual clara, personajes expresivos en cartas, colores vibrantes |
| **Hades** | Fondos con profundidad pintada, sin fotorrealismo |

---

## Las 3 Reglas de Oro del Estilo Cartoon

Aplicar estas 3 reglas **consistentemente** en TODO el juego:

1. **Outline negro** — Borde `2-3px solid #000` en todos los elementos importantes
2. **Sombra offset sólida** — `4px 4px 0 #000` en lugar de `box-shadow` con blur gaussiano
3. **Colores planos saturados** — Sin gradientes complejos. Máximo 2 tonos por elemento (base + tono claro de brillo)

---

## Cambios por Elemento

### 1. Paleta de Colores (CAMBIO TOTAL)

**Eliminar** la paleta actual "Poder & Golpe" oscura. **Reemplazar por:**

```css
:root {
    /* Fondos */
    --bg-deep:    #1a1f5e;   /* Azul medianoche saturado — como un escenario teatral */
    --bg-panel:   #252a6e;
    --bg-card:    #fdf6e3;   /* Crema/blanco cálido para cartas */

    /* Colores de acento */
    --gold:        #f5c518;   /* Amarillo mostaza brillante */
    --crimson:     #e63946;   /* Rojo tomate saturado */
    --emerald:     #2dc653;   /* Verde hierba saturado */
    --amber:       #ff9f1c;   /* Naranja vibrante */
    --purple:      #7b2d8b;   /* Violeta para promesas */

    /* Texto */
    --text-main:   #1a1209;   /* Casi negro, no negro puro */
    --text-light:  #fdf6e3;   /* Crema para texto sobre fondos oscuros */

    /* Outline universal */
    --outline: 2px solid #1a1209;
    --shadow-cartoon: 4px 4px 0 #1a1209;
}
```

---

### 2. Tipografía (CAMBIO TOTAL)

**Eliminar** Cinzel (demasiado romano/serio) e Inter (demasiado tech).

**Nueva tipografía en Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka:wght@400;600;700&display=swap" rel="stylesheet">
```

| Uso | Fuente | Peso |
|---|---|---|
| Títulos principales (cargo, periódico) | **Bangers** | Normal (ya es bold por diseño) |
| UI general, descripciones | **Fredoka** | 400 / 600 |
| Números de medidores | **Fredoka** | 700 |

Mantener **Playfair Display** solo para el periódico (esa sección ya funciona bien).

---

### 3. Cartas de Decisión (CAMBIO TOTAL — Mayor Impacto)

**De:** Rectángulos oscuros con brillo dorado sutil  
**A:** Cartas estilo cómic con fondo crema, outline y sombra offset

```css
.decision-card {
    background: #fdf6e3;              /* fondo crema */
    border: 3px solid #1a1209;        /* outline negro grueso */
    border-radius: 16px;
    box-shadow: 5px 5px 0 #1a1209;    /* sombra offset sólida — firma cartoon */
    color: #1a1209;
}

.decision-card:hover {
    transform: translateY(-8px) rotate(-1deg);
    box-shadow: 8px 8px 0 #1a1209;    /* sombra crece al hacer hover */
}
```

**Color de fondo por tipo de carta:**
- Carta económica → fondo verde claro `#d4f5d4`
- Carta social → fondo azul claro `#d4e8f5`
- Carta de seguridad → fondo rojo claro `#f5d4d4`
- Carta de campaña → fondo amarillo `#f5f0d4`

**El título de la carta** debe ir en un **banner/etiqueta** con fondo de color sólido y outline, como una pegatina.

---

### 4. Medidores (CAMBIO MODERADO)

**De:** Barras delgadas con glow difuso  
**A:** Barras gordas estilo "chicle" con outline y brillo blanco

```css
.meter-track {
    height: 18px;                      /* más grueso */
    border: 2px solid #1a1209;         /* outline negro */
    border-radius: 99px;
    background: rgba(255,255,255,0.2);
}

.meter-fill {
    position: relative;
    /* brillo blanco en la mitad superior — efecto plástico brillante */
}
.meter-fill::after {
    content: '';
    position: absolute;
    top: 2px; left: 4px; right: 4px;
    height: 40%;
    background: rgba(255,255,255,0.4);
    border-radius: 99px;
}
```

---

### 5. Fondo del Juego

**De:** Negro con gradientes de color sutiles  
**A:** Azul medianoche saturado (`#1a1f5e`) con un patrón de puntos o líneas sutiles

Opción A (CSS puro): Patrón de puntos halftone con `radial-gradient`  
Opción B (Asset): Imagen PNG de una sala de gobierno caricaturesca como `background-image` fija

---

### 6. Header / Badge de Cargo

**De:** Header plano con emoji e texto  
**A:** Un "sello" o "badge" con forma de escudo/cinta, con outline y colores sólidos

Cada cargo tiene su propio color de acento:
- Candidato → Amarillo
- Alcalde → Verde
- Diputado → Azul
- Senador → Morado
- Presidente → Rojo/Dorado

---

### 7. Periódico (CAMBIO MÍNIMO — ya funciona bien)

Solo añadir:
- Una textura PNG de **manchas de café o pliegues** superpuesta con `mix-blend-mode: multiply`
- El titular de victoria en verde brillante, el de derrota en rojo tomate (ya existe, solo ajustar colores)
- El botón "Nueva Carrera" con estilo cartoon (outline + sombra offset)

---

## Assets Necesarios

### Gratis — Descargar/Generar Antes de Implementar

| Asset | Fuente | Uso |
|---|---|---|
| Iconos SVG estilo cartoon para medidores | **game-icons.net** (CC BY 3.0) | Reemplazar emojis de medidores |
| Escudos heráldicos SVG por cargo | **game-icons.net** → "heraldry" | Badge del cargo en header |
| Textura de papel/pergamino PNG | **Subtle Patterns** o **Transparent Textures** | Overlay en cartas y periódico |
| Textura de manchas de café PNG | **FreePik** (filtro gratis) | Overlay periódico |
| Ilustraciones de personaje por cargo | **Leonardo.ai** o **Midjourney** (generar) | Imagen en cartas, una por cargo |

### Instrucción para Generar Ilustraciones con IA
Prompt sugerido para cada cargo:
> *"Cartoon character, flat 2D illustration, thick black outline, vibrant colors, [cargo: fat mayor with gold chain / serious senator with oversized tie / pompous president with top hat], white background, game card art style, Cuphead inspired"*

---

## Orden de Implementación Recomendado

Atacar en este orden para ver resultados rápidos en cada paso:

1. **Tipografía** — Cambiar fuentes en CSS (10 min, impacto inmediato)
2. **Paleta de colores** — Actualizar variables CSS `:root` (15 min)
3. **Cartas** — Rediseñar `.decision-card` con outline y sombra offset (30 min)
4. **Medidores** — Barras más gruesas con outline y brillo (20 min)
5. **Header/Badge** — Nuevo estilo para el cargo actual (20 min)
6. **Fondo** — Color sólido + patrón o asset (15 min)
7. **Assets** — Integrar iconos SVG y texturas descargadas (variable)
8. **Periódico** — Ajustes finales de color y overlay de textura (15 min)

**Tiempo estimado sin assets:** ~2 horas de CSS  
**Tiempo con assets preparados:** ~3-4 horas en total

---

## Archivos a Modificar

- `css/style.css` — Todo el rediseño visual
- `index.html` — Cambiar link de Google Fonts, añadir clases de color por tipo de carta
- `js/ui.js` — Asignar clase de color según tipo de carta al renderizar
- `js/cards.js` — Verificar que las plantillas tengan campo `type` (económica, social, etc.)

---

## Notas Finales

- El JS/lógica de `engine.js` y `cards.js` **no necesita cambios** para el rediseño visual
- Priorizar siempre el "outline negro + sombra offset" — es lo que da el look cartoon de forma más rápida
- Testear en móvil desde el inicio — el layout actual ya es responsive, el cartoon también debe serlo
