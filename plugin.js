const MEXICO = -360; // CDMX: UTC-6, sin horario de verano

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

// La zona del aparato; si no la entrega, la de México.
function offsetMin(now) {
  let det = 0;
  try {
    det = -new Date(now).getTimezoneOffset();
  } catch (e) {
    det = 0;
  }
  return det ? det : MEXICO;
}

function parts(now) {
  const d = new Date(now + offsetMin(now) * 60000);
  return {
    time: pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()),
    date: DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MONTHS[d.getUTCMonth()] + " de " + d.getUTCFullYear(),
  };
}

export async function screen({ state }) {
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  const p = parts(now);
  return {
    type: "Column",
    every: { ms: 1000, event: "tick" },
    padding: { compact: 16, expanded: 48 },
    gap: 16,
    crossAxisAlignment: "center",
    mainAxisAlignment: "center",
    children: [
      { type: "Text", text: p.time, style: "h1", bold: true, textAlign: "center" },
      { type: "Text", text: p.date, style: "h4", color: "muted", textAlign: "center" },
    ],
  };
}

export async function screenEvent({ name }) {
  if (name === "open" || name === "tick") {
    return { state: { now: Date.now() } };
  }
  return null;
}