const locale = (lang) => (lang === 'hi' ? 'hi-IN' : 'en-IN');

export function formatDate(value, lang = 'en') {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value, lang = 'en') {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(locale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(n, lang = 'en') {
  return Number(n ?? 0).toLocaleString(locale(lang));
}

// "2026-11" -> "Nov" / "नव॰"
export function formatMonth(yyyyMm, lang = 'en') {
  const d = new Date(`${yyyyMm}-01T00:00:00`);
  if (Number.isNaN(d.getTime())) return yyyyMm;
  return d.toLocaleDateString(locale(lang), { month: 'short' });
}

export function shortLocation(c) {
  return [c.locality, c.city].filter(Boolean).join(', ');
}

export function fullLocation(c) {
  return [c.locality, c.city, c.state].filter(Boolean).join(', ');
}

export function mapLink(lat, lng) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}
