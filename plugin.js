const MEXICO = -360; // CDMX: UTC-6, sin horario de verano

// Si no se logra saber dónde estás, se usa esta ciudad.
const DEFAULT_PLACE = { lat: 19.43, lon: -99.13 }; // Ciudad de México

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
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

// Hora (hh:mm y segundos por separado), día de la semana y resto de la fecha.
function parts(now) {
  const d = new Date(now + offsetMin(now) * 60000);
  const hm = pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
  const sec = pad(d.getUTCSeconds());
  const weekday = DAYS[d.getUTCDay()];
  const rest = d.getUTCDate() + " de " + MONTHS[d.getUTCMonth()] + " de " + d.getUTCFullYear();
  return { hm, sec, weekday, rest, time: hm + ":" + sec, date: weekday + " " + rest };
}

// Luna: un símbolo de texto (no emoji) para poder pintarla de gris.
const MOON = "☾";
const SUN = "☀️";
const CLOUD = "☁️";
const RAIN = "🌧️";

// Código de clima (WMO) -> sol, nube o nube con lluvia
function icon(code) {
  if (code <= 1) return SUN;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return RAIN;
  return CLOUD;
}

// Palabra corta que acompaña al icono del clima.
function describe(e) {
  if (e === MOON) return { es: "Noche despejada", en: "Clear night" };
  if (e === SUN) return { es: "Despejado", en: "Clear" };
  if (e === RAIN) return { es: "Lluvia", en: "Rain" };
  return { es: "Nublado", en: "Cloudy" };
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

// Clima de tu lugar: pronóstico de HOY de día; de noche, el cielo de ahora (luna gris si está despejado).
// Se guarda 25 min en kino.storage para no pedirlo a cada rato.
// La temperatura (t) se sigue calculando, pero la pantalla no la dibuja.
async function loadWeather() {
  try {
    const cached = kino.storage.get("wx4");
    if (cached) {
      const w = JSON.parse(cached);
      if (w && typeof w.e === "string") return w;
    }
  } catch (e) {}
  try {
    const place = await loadPlace();
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" + place.lat + "&longitude=" + place.lon +
      "&current=weather_code,is_day,temperature_2m&daily=weather_code&forecast_days=1&timezone=auto";
    const r = await kino.fetch(url, { timeoutMs: 8000 });
    if (!r.ok) return null;
    const j = r.json();
    const arr = j && j.daily && (j.daily.weather_code || j.daily.weathercode);
    let code = arr && arr[0];
    const cur = j && j.current;
    const night = !!cur && cur.is_day === 0;
    if (night && typeof cur.weather_code === "number") code = cur.weather_code;
    if (typeof code !== "number") return null;
    const t = cur && typeof cur.temperature_2m === "number" ? Math.round(cur.temperature_2m) + "°C" : "";
    const w = { e: night && code <= 1 ? MOON : icon(code), t: t };
    try {
      kino.storage.set("wx4", JSON.stringify(w), { ttlMs: 25 * 60 * 1000 });
    } catch (e) {}
    return w;
  } catch (e) {
    return null;
  }
}

// Tarjeta del clima: icono grande y una palabra. Mientras carga, un esqueleto.
function weatherCard(wx, wxDone) {
  if (wx) {
    const d = describe(wx);
    return {
      type: "Card",
      key: "weather",
      variant: "filled",
      minWidth: 160,
      padding: 24,
      children: [
        { type: "Text", text: wx, style: "h1", textAlign: "center", fill: true, ...(wx === MOON ? { color: "muted" } : {}) },
        { type: "Text", text: d.es, textEn: d.en, style: "caption", color: "muted", textAlign: "center", fill: true },
      ],
    };
  }
  if (wxDone) return null;
  return { type: "Skeleton", key: "weather-loading", shape: "block", width: 160, height: 96 };
}

// El reloj: hora grande con segundos pequeños y grises, fecha centrada y tarjeta del clima.
// Lo usan la pantalla del menú y el panel del reproductor.
function clockContent(now, wx, wxDone) {
  const p = parts(now);
  const card = weatherCard(wx, wxDone);
  return {
    type: "Column",
    key: "clock",
    gap: 24,
    padding: { compact: 16, expanded: 24 },
    minHeight: { compact: 400, expanded: 480 },
    crossAxisAlignment: "center",
    mainAxisAlignment: "center",
    children: [
      {
        type: "Row",
        key: "time",
        gap: 4,
        mainAxisAlignment: "center",
        crossAxisAlignment: "end",
        children: [
          { type: "Text", text: p.hm, style: "h1", bold: true },
          { type: "Text", text: ":" + p.sec, style: "h3", color: "muted" },
        ],
      },
      {
        type: "Column",
        key: "date",
        gap: 4,
        fill: true,
        crossAxisAlignment: "center",
        children: [
          { type: "Text", text: p.weekday, style: "h2", textAlign: "center", fill: true },
          { type: "Text", text: p.rest, style: "h5", color: "muted", textAlign: "center", fill: true },
        ],
      },
      ...(card ? [card] : []),
    ],
  };
}

// Pantalla del menú (solo dibuja; el clima se pide en screenEvent)
export async function screen({ state }) {
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  const wx = state && typeof state.wx === "string" ? state.wx : "";
  const wxDone = !!state && state.wxDone === true;
  return {
    type: "Scaffold",
    every: [
      { ms: 1000, event: "tick" },
      { ms: 30 * 60 * 1000, event: "weather" },
    ],
    appBar: {
      type: "AppBar",
      mergeWithKinoBar: true,
      dense: true,
      title: "Reloj",
      titleEn: "Clock",
      leading: { type: "IconButton", icon: "close", labelText: "Cerrar", labelTextEn: "Close", onPressed: { close: true } },
    },
    body: { type: "SingleChildScrollView", children: [clockContent(now, wx, wxDone)] },
  };
}

export async function screenEvent({ name }) {
  if (name === "open" || name === "weather") {
    const w = await loadWeather();
    return { state: w ? { now: Date.now(), wx: w.e, temp: w.t || "", wxDone: true } : { now: Date.now(), wxDone: true } };
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
    root: clockContent(now, wx, true),
  };
}
