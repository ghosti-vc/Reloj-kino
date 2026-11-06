// Reloj del reproductor (versión de una sola pieza): la hora arriba y la fecha debajo, en dos líneas de un mismo elemento.
// Sin desplazamientos, para que Kino lo dibuje completo desde el primer instante. Fondo transparente.
// Solo se ajustan el tamaño y el color de la letra. Siempre usa la hora del aparato. Sin red y sin botones.
// La persona elige por separado, en TV en vivo y en series y películas, si el reloj va siempre visible ("clock-fixed") o solo con los controles ("clock").

const DAYS = { es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const MONTHS = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const pad = (n) => String(n).padStart(2, "0");

/** "es" o "en" según el `lang` del contexto ("es-CO", "en-US"); cualquier otro se lee como español. */
function langOf(lang) {
  return typeof lang === "string" && lang.toLowerCase().startsWith("en") ? "en" : "es";
}

/** La hora "HH:mm" y la fecha ("jue 5 nov" en español, "Thu Nov 5" en inglés) del instante [now] en el reloj del aparato. */
function clockParts(now, lang, hour12) {
  const l = langOf(lang);
  const h = now.getHours();
  const time = hour12
    ? `${h % 12 || 12}:${pad(now.getMinutes())} ${h < 12 ? "AM" : "PM"}`
    : `${pad(h)}:${pad(now.getMinutes())}`;
  const day = DAYS[l][now.getDay()];
  const month = MONTHS[l][now.getMonth()];
  const d = now.getDate();
  const date = l === "en" ? `${day} ${month} ${d}` : `${day} ${d} ${month}`;
  return { time, date };
}

// Ancho aproximado de cada carácter (en em) para centrar la hora sobre la fecha con espacios fijos.
const EM = { ":": 0.26, " ": 0.25, i: 0.24, j: 0.24, l: 0.24, t: 0.33, f: 0.33, r: 0.34, m: 0.85, w: 0.75 };
const width = (s) => [...s].reduce((a, c) => a + (EM[c] !== undefined ? EM[c] : 0.55), 0);
const NBSP = "\u00A0";

/** La hora con espacios fijos al inicio para que quede centrada sobre la fecha (si la fecha es más ancha). */
function centered(time, date) {
  const n = Math.max(0, Math.round((width(date) - width(time)) / 2 / EM[" "]));
  return NBSP.repeat(n) + time;
}

const COLORS = { white: "#FFFFFF", yellow: "#FFD54F", cyan: "#4DD0E1", green: "#81C784", orange: "#FFB74D", pink: "#F48FB1", black: "#000000" };
const TRANSPARENT = "#00000000";
const SIZES = ["small", "normal", "large", "xlarge"];

const setting = (key) => {
  try {
    return kino.config.get(key);
  } catch (e) {
    return undefined;
  }
};

/** La respuesta del slot: un solo elemento con la hora y la fecha, y cuándo volver a preguntar (un minuto es lo máximo que permite Kino). */
export async function playerSlot(context) {
  const { time, date } = clockParts(new Date(), context && context.lang, setting("format") === "12");
  // Cada apartado tiene su ajuste: "fixed" (siempre visible, elemento "clock-fixed") u "hide" (solo con los controles, elemento "clock").
  // Si el ajuste falta: TV en vivo queda fijo y series y películas con los controles.
  const live = !!(context && context.live === true);
  const mode = setting(live ? "liveMode" : "vodMode");
  const fixed = mode === "fixed" || mode === "hide" ? mode === "fixed" : live;
  const item = { id: fixed ? "clock-fixed" : "clock", text: `${centered(time, date)}\n${date}`, background: TRANSPARENT };

  const size = setting("size");
  if (SIZES.includes(size) && size !== "normal") item.size = size;

  const color = COLORS[setting("color")];
  if (color) item.color = color;

  return { items: [item], refreshMs: 60000 };
}

/** El slot no tiene botones, así que Kino nunca llama esto; la capacidad igual exige la exportación. */
export async function playerSlotAction() {
  return null;
}

// ===== Pantalla del menú (nuevo) =====

export async function screen({ state }) {
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  const p = clockParts(new Date(now), kino.lang, setting("format") === "12");
  return {
    type: "SingleChildScrollView",
    every: [{ ms: 1000, event: "tick" }],
    children: [
      {
        type: "Column",
        key: "clock",
        gap: 4,
        padding: { compact: 16, expanded: 24 },
        minHeight: { compact: 340, expanded: 400 },
        crossAxisAlignment: "center",
        mainAxisAlignment: "center",
        children: [
          { type: "Text", key: "time", text: p.time, style: "h1", bold: true, textAlign: "center", fill: true },
          { type: "Text", text: p.date, style: "caption", color: "muted", textAlign: "center", fill: true },
        ],
      },
    ],
  };
}

export async function screenEvent({ name }) {
  if (name === "open" || name === "tick") {
    return { state: { now: Date.now() } };
  }
  return null;
}
