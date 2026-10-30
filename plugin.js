const MEXICO = -360; // CDMX: UTC-6, sin horario de verano
const COLOMBIA = -300; // UTC-5

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

function zone(state, now) {
  const mode = state && state.mode === "manual" ? "manual" : "auto";
  if (mode === "auto") {
    let det = 0;
    try {
      det = -new Date(now).getTimezoneOffset();
    } catch (e) {
      det = 0;
    }
    if (det) return { min: det, note: "Automática (la del aparato)" };
    return { min: MEXICO, note: "Automática no disponible: usando México" };
  }
  const min = state && typeof state.offsetMin === "number" ? state.offsetMin : MEXICO;
  return { min, note: "Elegida por ti" };
}

function label(min) {
  const sign = min >= 0 ? "+" : "-";
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return "UTC" + sign + h + (m ? ":" + pad(m) : "");
}

function parts(now, min) {
  const d = new Date(now + min * 60000);
  return {
    hm: pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()),
    time: pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()),
    date: DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " de " + MONTHS[d.getUTCMonth()] + " de " + d.getUTCFullYear(),
  };
}

async function load() {
  try {
    const mode = await kino.storage.get("mode");
    const off = await kino.storage.get("offsetMin");
    const n = off === null || off === undefined ? NaN : Number(off);
    return {
      mode: mode === "manual" ? "manual" : "auto",
      offsetMin: Number.isFinite(n) ? n : MEXICO,
    };
  } catch (e) {
    return { mode: "auto", offsetMin: MEXICO };
  }
}

async function save(mode, offsetMin) {
  try {
    await kino.storage.set("mode", mode);
    await kino.storage.set("offsetMin", String(offsetMin));
  } catch (e) {}
}

function buttons() {
  return {
    type: "Row",
    wrap: true,
    gap: 12,
    children: [
      { type: "Button", variant: "secondary", labelText: "Automática", onPressed: "auto" },
      { type: "Button", variant: "secondary", labelText: "México", onPressed: "mx" },
      { type: "Button", variant: "secondary", labelText: "Colombia", onPressed: "co" },
      { type: "Button", variant: "secondary", labelText: "− 1 hora", onPressed: "minus" },
      { type: "Button", variant: "secondary", labelText: "+ 1 hora", onPressed: "plus" },
    ],
  };
}

// ---------- Pantalla completa (con segundos y botones de zona) ----------

export async function screen({ state }) {
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  const z = zone(state, now);
  const p = parts(now, z.min);
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
      { type: "Text", text: z.note + " · " + label(z.min), style: "caption", color: "muted", textAlign: "center" },
      buttons(),
    ],
  };
}

export async function screenEvent({ name, state }) {
  if (name === "open") {
    const s = await load();
    return { state: { now: Date.now(), mode: s.mode, offsetMin: s.offsetMin } };
  }
  if (name === "tick") {
    return { state: { now: Date.now() } };
  }
  const now = Date.now();
  const current = {
    mode: state && state.mode,
    offsetMin: state && typeof state.offsetMin === "number" ? state.offsetMin : MEXICO,
  };
  if (name === "auto") {
    await save("auto", current.offsetMin);
    return { state: { now, mode: "auto" } };
  }
  if (name === "mx" || name === "co") {
    const min = name === "mx" ? MEXICO : COLOMBIA;
    await save("manual", min);
    return { state: { now, mode: "manual", offsetMin: min } };
  }
  if (name === "minus" || name === "plus") {
    let min = zone(current, now).min + (name === "plus" ? 60 : -60);
    if (min < -720) min = -720;
    if (min > 840) min = 840;
    await save("manual", min);
    return { state: { now, mode: "manual", offsetMin: min } };
  }
  return null;
}

// ---------- Pestaña del reproductor: solo hora y fecha ----------

export async function panel(context) {
  const s = await load();
  const now = Date.now();
  const z = zone(s, now);
  const p = parts(now, z.min);
  const features = (context && context.features) || [];
  if (!features.includes("screen")) {
    return {
      title: "Reloj",
      titleEn: "Clock",
      refreshMs: 2000,
      elements: [{ type: "status", text: p.hm + " · " + p.date }],
    };
  }
  return {
    format: "screen",
    title: "Reloj",
    titleEn: "Clock",
    refreshMs: 2000,
    root: {
      type: "Column",
      gap: 8,
      crossAxisAlignment: "center",
      mainAxisAlignment: "center",
      children: [
        { type: "Text", text: p.hm, style: "h1", bold: true, textAlign: "center" },
        { type: "Text", text: p.date, style: "h4", color: "muted", textAlign: "center" },
      ],
    },
  };
}

export async function panelAction() {
  return null;
}