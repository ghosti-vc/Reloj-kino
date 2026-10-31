const MEXICO = -360; // CDMX: UTC-6, sin horario de verano

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

// La zona del aparato; si no la entrega (0), la de México.
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

// Solo hora y fecha, sin botones.
function clockTree(now) {
  const p = parts(now);
  return {
    type: "Column",
    gap: 8,
    crossAxisAlignment: "center",
    mainAxisAlignment: "center",
    children: [
      { type: "Text", text: p.time, style: "h1", bold: true, textAlign: "center" },
      { type: "Text", text: p.date, style: "h4", color: "muted", textAlign: "center" },
    ],
  };
}

// Pantalla del menú
export async function screen({ state }) {
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  const tree = clockTree(now);
  tree.every = { ms: 1000, event: "tick" };
  tree.padding = { compact: 16, expanded: 48 };
  tree.gap = 16;
  return tree;
}

export async function screenEvent({ name }) {
  if (name === "open" || name === "tick") {
    return { state: { now: Date.now() } };
  }
  return null;
}

// Botón del reproductor: abre un panel con el reloj
export async function panel(context) {
  const now = Date.now();
  if (!(context.features || []).includes("screen")) {
    return {
      title: "Reloj",
      refreshMs: 2000,
      elements: [
        { type: "status", text: parts(now).time },
        { type: "text", text: parts(now).date },
      ],
    };
  }
  return {
    format: "screen",
    title: "Reloj",
    titleEn: "Clock",
    refreshMs: 2000,
    root: clockTree(now),
  };
}
