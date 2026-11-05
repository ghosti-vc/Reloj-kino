// Reloj del reproductor: la hora arriba y la fecha debajo, en dos elementos (uno más pequeño que el otro).
// Siempre usa la hora del aparato, con fondo transparente. Solo se ajustan el tamaño y el color de la letra.
// Sin red y sin botones.

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

/** La hora "HH:mm" y la fecha ("mar 4 nov" en español, "Tue Nov 4" en inglés) del instante [now] en el reloj del aparato. */
function clockParts(now, lang) {
  const l = langOf(lang);
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const day = DAYS[l][now.getDay()];
  const month = MONTHS[l][now.getMonth()];
  const d = now.getDate();
  const date = l === "en" ? `${day} ${month} ${d}` : `${day} ${d} ${month}`;
  return { time, date };
}

const COLORS = { white: "#FFFFFF", yellow: "#FFD54F", cyan: "#4DD0E1", green: "#81C784", orange: "#FFB74D", pink: "#F48FB1", black: "#000000" };
const TRANSPARENT = "#00000000";

// Tamaños de Kino, de menor a mayor. La fecha usa siempre un escalón menos que la hora (con "small" no hay más abajo).
const SIZES = ["small", "normal", "large", "xlarge"];
// Proporción aproximada de cada tamaño, solo para estimar el centrado (ajústala si en la TV se ve corrido).
const SCALE = { small: 0.75, normal: 1, large: 1.25, xlarge: 1.5 };
const NBSP = "\u00A0";

const setting = (key) => {
  try {
    return kino.config.get(key);
  } catch (e) {
    return undefined;
  }
};

/** Ancho aproximado de un texto en "dígitos": espacios y dos puntos valen la mitad. */
const width = (s) => [...s].reduce((a, c) => a + (c === " " || c === ":" ? 0.5 : 1), 0);

/**
 * Centra la hora sobre la fecha. Los elementos se pegan al borde derecho, así que a la hora le agregamos espacios fijos
 * al final: la corren hacia la izquierda justo la mitad de lo que la fecha es más ancha.
 */
function centered(time, date, timeSize, dateSize) {
  const St = SCALE[timeSize];
  const Sd = SCALE[dateSize];
  const n = Math.max(0, Math.round((width(date) * Sd - width(time) * St) / St));
  return time + NBSP.repeat(n);
}

/** La respuesta del slot: dos elementos, hora y fecha, y cuándo volver a preguntar (un minuto es lo máximo que permite Kino). */
export async function playerSlot(context) {
  const { time, date } = clockParts(new Date(), context && context.lang);

  const chosen = setting("size");
  const timeSize = SIZES.includes(chosen) ? chosen : "normal";
  const dateSize = SIZES[Math.max(0, SIZES.indexOf(timeSize) - 1)];

  const clock = { id: "clock", text: centered(time, date, timeSize, dateSize), background: TRANSPARENT };
  const day = { id: "date", text: date, background: TRANSPARENT };

  if (timeSize !== "normal") clock.size = timeSize;
  if (dateSize !== "normal") day.size = dateSize;

  const color = COLORS[setting("color")];
  if (color) {
    clock.color = color;
    day.color = color;
  }

  return { items: [clock, day], refreshMs: 60000 };
}

/** El slot no tiene botones, así que Kino nunca llama esto; la capacidad igual exige la exportación. */
export async function playerSlotAction() {
  return null;
}
