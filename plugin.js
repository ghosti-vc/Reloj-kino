const MEXICO = -360; // CDMX: UTC-6, sin horario de verano

// Si no se logra saber dónde estás, se usa esta ciudad.
const DEFAULT_PLACE = { city: "Ciudad de México", lat: 19.43, lon: -99.13 };

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

// Dónde estás, por la dirección de internet del aparato (aproximado). Se guarda 6 horas.
async function loadPlace() {
  try {
    const c = kino.storage.get("place");
    if (c) {
      const p = JSON.parse(c);
      if (p && typeof p.lat === "number" && typeof p.lon === "number") return p;
    }
  } catch (e) {}
  try {
    const r = await kino.fetch("https://ipwho.is/", { timeoutMs: 8000 });
    if (r.ok) {
      const j = r.json();
      if (j && j.success !== false && typeof j.latitude === "number" && typeof j.longitude === "number") {
        const p = {
          city: typeof j.city === "string" ? j.city : "",
          lat: Math.round(j.latitude * 100) / 100,
          lon: Math.round(j.longitude * 100) / 100,
        };
        try {
          kino.storage.set("place", JSON.stringify(p), { ttlMs: 6 * 60 * 60 * 1000 });
        } catch (e) {}
        return p;
      }
    }
  } catch (e) {}
  return DEFAULT_PLACE;
}

// Clima de tu lugar: pronóstico de HOY de día; de noche, el cielo de ahora (🌙 si está despejado).
// Se guarda 25 min en kino.storage para no pedirlo a cada rato.
async function loadWeather() {
  try {
    const cached = kino.storage.get("wx2");
    if (cached) {
      const w = JSON.parse(cached);
      if (w && typeof w.e === "string") return w;
    }
  } catch (e) {}
  try {
    const place = await loadPlace();
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" + place.lat + "&longitude=" + place.lon +
      "&current=weather_code,is_day&daily=weather_code&forecast_days=1&timezone=auto";
    const r = await kino.fetch(url, { timeoutMs: 8000 });
    if (!r.ok) return null;
    const j = r.json();
    const arr = j && j.daily && (j.daily.weather_code || j.daily.weathercode);
    let code = arr && arr[0];
    const cur = j && j.current;
    const night = !!cur && cur.is_day === 0;
    if (night && typeof cur.weather_code === "number") code = cur.weather_code;
    if (typeof code !== "number") return null;
    const w = { e: night && code <= 1 ? "🌙" : icon(code), city: place.city || "" };
    try {
      kino.storage.set("wx2", JSON.stringify(w), { ttlMs: 25 * 60 * 1000 });
    } catch (e) {}
    return w;
  } catch (e) {
    return null;
  }
}

// Solo clima, hora, fecha y ciudad. Sin botones.
function clockTree(now, wx, city) {
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
      ...(city ? [{ type: "Text", text: "📍 " + city, style: "p", color: "muted", textAlign: "center" }] : []),
    ],
  };
}

// Pantalla del menú (solo dibuja; el clima se pide en screenEvent)
export async function screen({ state }) {
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  const wx = state && typeof state.wx === "string" ? state.wx : "";
  const city = state && typeof state.city === "string" ? state.city : "";
  const tree = clockTree(now, wx, city);
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
    const w = await loadWeather();
    return { state: w ? { now: Date.now(), wx: w.e, city: w.city } : { now: Date.now() } };
  }
  if (name === "tick") {
    return { state: { now: Date.now() } };
  }
  return null;
}

// Botón del reproductor: abre un panel con el reloj
export async function panel(context) {
  const now = Date.now();
  const w = await loadWeather();
  const wx = w ? w.e : "";
  const city = w ? w.city : "";
  if (!(context.features || []).includes("screen")) {
    return {
      title: "Reloj",
      refreshMs: 2000,
      elements: [
        { type: "status", text: (wx ? wx + " " : "") + parts(now).time },
        { type: "text", text: parts(now).date + (city ? " · " + city : "") },
      ],
    };
  }
  return {
    format: "screen",
    title: "Reloj",
    titleEn: "Clock",
    refreshMs: 2000,
    root: clockTree(now, wx, city),
  };
}
