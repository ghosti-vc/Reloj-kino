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