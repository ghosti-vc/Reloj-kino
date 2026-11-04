const MEXICO = -360; // CDMX: UTC-6, sin horario de verano

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

// El reloj: la hora en h4 (un poco más grande) y la fecha en h5, todo centrado.
// Lo usan la pantalla del menú y el panel del reproductor.
function clockContent(now) {
  const p = parts(now);
  return {
    type: "Column",
    key: "clock",
    gap: 8,
    padding: { compact: 16, expanded: 24 },
    crossAxisAlignment: "center",
    mainAxisAlignment: "start",
    children: [
      {
        type: "Column",
        key: "body",
        gap: 24,
        minHeight: { compact: 340, expanded: 400 },
        crossAxisAlignment: "center",
        mainAxisAlignment: "center",
        children: [
          {
            type: "Column",
            key: "date",
            gap: 4,
            fill: true,
            crossAxisAlignment: "center",
            children: [
              {
                type: "Row",
                key: "time",
                gap: 4,
                mainAxisAlignment: "center",
                crossAxisAlignment: "center",
                children: [
                  { type: "Text", text: p.hm, style: "h3", bold: true },
                ],
              },
              { type: "Text", text: p.weekday, style: "h5", color: "muted", textAlign: "center", fill: true },
              { type: "Text", text: p.rest, style: "h5", color: "muted", textAlign: "center", fill: true },
            ],
          },
        ],
      },
    ],
  };
}

// Pantalla del menú
export async function screen({ state }) {
  const now = state && typeof state.now === "number" ? state.now : Date.now();
  return {
    type: "SingleChildScrollView",
    every: [{ ms: 10000, event: "tick" }],
    children: [clockContent(now)],
  };
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
        { type: "status", text: parts(now).hm },
        { type: "text", text: parts(now).date },
      ],
    };
  }
  return {
    format: "screen",
    title: "Reloj",
    titleEn: "Clock",
    refreshMs: 2000,
    root: clockContent(now),
  };
}
 