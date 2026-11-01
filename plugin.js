const MEXICO = -360; // CDMX: UTC-6, sin horario de verano

// Ciudad para el clima (por defecto Ciudad de México). Cambia estos dos números por los de tu ciudad.
const LAT = 19.43;
const LON = -99.13;

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

// Código de clima (WMO) -> sol, nube o nube con lluvia
function icon(code) {
  if (code <= 1) return "☀️";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "🌧️";
  return "☁️";
}

// Pronóstico de HOY. Se guarda 25 min en kino.storage para no pedirlo a cada rato.
async function loadWeather() {
  try {
    const cached = kino.storage.get("wx");
    if (cached) return cached;
  } catch (e) {}
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON +
      "&daily=weather_code&forecast_days=1&timezone=auto";
    const r = await kino.fetch(url, { timeoutMs: 8000 });
    if (!r.ok) return null;
    const j = r.json();
    const d = j && j.daily;
    const arr = d && (d.weather_code || d.weathercode);
    const code = arr && arr[0];
    if (typeof code !== "number") return null;
    const em = icon(code);
    try {
      kino.storage.set("wx", em, { ttlMs: 25 * 60 * 1000 });
    } catch (e) {}
    return em;
  } catch (e) {
    return null;
  }
}

// Solo hora, fecha y el clima. Sin botones.
function clockTree(now, wx) {
  const p = parts(now);
  return {
    type: "Column",
    gap: 8,
    crossAxisAlignment: "center",
    mainAxisAlignment: "center",
    children: [
      ...(wx ? [{ type: "Text", text: wx, style: "h1", textAlign: "center" }] : []),
      { type: "Text", text: p.time, style: "h1", bold: true, textAlign: "center" },
      { type: "Text", text: p.date, style: "h4", color: "muted", textAlign: "center" },
    ],
  };
}

// Pantalla del menú (solo dibuja; el clima se pide en screenEvent)
export async function screen({ state }) {
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  const wx = state && typeof state.wx === "string" ? state.wx : "";
  const tree = clockTree(now, wx);
  tree.every = [
    { ms: 1000, event: "tick" },
    { ms: 30 * 60 * 1000, event: "weather" },
  ];
  tree.padding = { compact: 16, expanded: 48 };
  tree.gap = 16;
  return tree;
}

export async function screenEvent({ name }) {
  if (name === "open" || name === "weather") {
    const wx = await loadWeather();
    return { state: wx ? { now: Date.now(), wx: wx } : { now: Date.now() } };
  }
  if (name === "tick") {
    return { state: { now: Date.now() } };
  }
  return null;
}

// Botón del reproductor: abre un panel con el reloj
export async function panel(context) {
  const now = Date.now();
  const wx = (await loadWeather()) || "";
  if (!(context.features || []).includes("screen")) {
    return {
      title: "Reloj",
      refreshMs: 2000,
      elements: [
        { type: "status", text: (wx ? wx + " " : "") + parts(now).time },
        { type: "text", text: parts(now).date },
      ],
    };
  }
  return {
    format: "screen",
    title: "Reloj",
    titleEn: "Clock",
    refreshMs: 2000,
    root: clockTree(now, wx),
  };
}
 