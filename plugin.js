const DEFAULT_OFFSET = -5; // Colombia: UTC-5, sin horario de verano

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

function offsetOf(state) {
  return state && typeof state.offset === "number" ? state.offset : DEFAULT_OFFSET;
}

function parts(now, offset) {
  const d = new Date(now + offset * 3600000);
  return {
    time: pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()),
    date:
      DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MONTHS[d.getUTCMonth()] + " de " + d.getUTCFullYear(),
  };
}

export async function screen({ state }) {
  const offset = offsetOf(state);
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  const p = parts(now, offset);
  const label = "UTC" + (offset >= 0 ? "+" : "") + offset;
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
      { type: "Text", text: "Zona horaria: " + label, style: "caption", color: "muted", textAlign: "center" },
      {
        type: "Row",
        gap: 12,
        mainAxisAlignment: "center",
        children: [
          { type: "Button", variant: "secondary", labelText: "− 1 hora", onPressed: "minus" },
          { type: "Button", variant: "secondary", labelText: "+ 1 hora", onPressed: "plus" },
        ],
      },
    ],
  };
}

async function loadOffset() {
  try {
    const v = await kino.storage.get("offset");
    const n = v === null || v === undefined ? NaN : Number(v);
    return Number.isFinite(n) ? n : DEFAULT_OFFSET;
  } catch (e) {
    return DEFAULT_OFFSET;
  }
}

export async function screenEvent({ name, state }) {
  if (name === "open") {
    return { state: { now: Date.now(), offset: await loadOffset() } };
  }
  if (name === "tick") {
    return { state: { now: Date.now() } };
  }
  if (name === "minus" || name === "plus") {
    let offset = offsetOf(state) + (name === "plus" ? 1 : -1);
    if (offset < -12) offset = -12;
    if (offset > 14) offset = 14;
    try {
      await kino.storage.set("offset", String(offset));
    } catch (e) {}
    return { state: { now: Date.now(), offset } };
  }
  return null;
}