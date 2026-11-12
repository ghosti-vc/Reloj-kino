// Reloj del reproductor: la hora arriba y la fecha debajo, en dos líneas de un mismo elemento. Fondo transparente.
// En TV en vivo se puede mover el reloj a la izquierda (ajuste "liveLeft"); en series y películas no se mueve.
// Kino deja como máximo 3 elementos por plugin: "ends" (con los controles), "clock" (con los controles) y "clock-fixed" (fijo).

const DAYS = { es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const MONTHS = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const pad = (n) => String(n).padStart(2, "0");

function langOf(lang) {
  return typeof lang === "string" && lang.toLowerCase().startsWith("en") ? "en" : "es";
}

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

const EM = { ":": 0.26, " ": 0.25, i: 0.24, j: 0.24, l: 0.24, t: 0.33, f: 0.33, r: 0.34, m: 0.85, w: 0.75 };
const width = (s) => [...s].reduce((a, c) => a + (EM[c] !== undefined ? EM[c] : 0.55), 0);
const NBSP = "\u00A0";

function centered(time, date) {
  const n = Math.max(0, Math.round((width(date) - width(time)) / 2 / EM[" "]));
  return NBSP.repeat(n) + time;
}

const COLORS = { white: "#FFFFFF", yellow: "#FFD54F", cyan: "#4DD0E1", green: "#81C784", orange: "#FFB74D", pink: "#F48FB1", black: "#000000" };
const TRANSPARENT = "#00000000";
const SIZES = ["small", "normal", "large", "xlarge"];

// Si el reloj se mueve hacia el lado contrario, cambia -1 por 1.
const LEFT_SIGN = -1;

const setting = (key) => {
  try {
    return kino.config.get(key);
  } catch (e) {
    return undefined;
  }
};

function endsText(context, hour12) {
  if (!context || context.live === true) return null;
  const pos = context.positionMs;
  const dur = context.durationMs;
  if (typeof pos !== "number" || typeof dur !== "number" || !Number.isFinite(pos) || !Number.isFinite(dur) || dur <= 0 || pos < 0) return null;
  const speed = context.player && typeof context.player.speed === "number" && context.player.speed > 0 ? context.player.speed : 1;
  const { time } = clockParts(new Date(Date.now() + Math.max(0, dur - pos) / speed), context.lang, hour12);
  return langOf(context.lang) === "en" ? `Ends at ${time}` : `Termina a las ${time}`;
}

export async function playerSlot(context) {
  const hour12 = setting("format") === "12";
  const { time, date } = clockParts(new Date(), context && context.lang, hour12);
  const live = !!(context && context.live === true);
  const mode = setting(live ? "liveMode" : "vodMode");
  const fixed = mode === "fixed" || mode === "hide" ? mode === "fixed" : live;

  const size = setting("size");
  const color = COLORS[setting("color")];
  // Desplazamiento a la izquierda: solo en TV en vivo.
  const leftN = live ? Number(setting("liveLeft")) : 0;
  const left = Number.isFinite(leftN) && leftN > 0 ? LEFT_SIGN * leftN : 0;

  const dress = (it) => {
    it.background = TRANSPARENT;
    if (SIZES.includes(size) && size !== "normal") it.size = size;
    if (color) it.color = color;
    if (left !== 0) it.left = left;
    return it;
  };

  const endsMode = setting("endsAt");
  const ends = endsMode === "fixed" || endsMode === "hide" ? endsText(context, hour12) : null;
  const endsFixed = endsMode === "fixed";

  const items = [];
  if (ends && endsFixed && fixed) {
    items.push(dress({ id: "clock-fixed", text: `${centered(time, ends)}\n${ends}` }));
  } else {
    items.push(dress({ id: fixed ? "clock-fixed" : "clock", text: `${centered(time, date)}\n${date}` }));
    if (ends) {
      items.push(dress({ id: endsFixed ? "clock-fixed" : "ends", text: ends }));
    }
  }

  return { items, refreshMs: 60000 };
}

export async function playerSlotAction() {
  return null;
}

// ===== Pantalla del menú =====

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
