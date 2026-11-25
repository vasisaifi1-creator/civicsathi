// Browser geolocation + reverse geocoding.
// No API key is required: BigDataCloud's client endpoint is used first, then
// OpenStreetMap's Nominatim as a fallback. Both are free and CORS-enabled.

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

// Wraps the browser Geolocation API in a Promise so callers can await it.
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      const err = new Error('Geolocation is not supported');
      err.code = 'unsupported';
      reject(err);
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      ...GEOLOCATION_OPTIONS,
      ...options,
    });
  });
}

function pick(...values) {
  for (const value of values) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (text) return text;
  }
  return '';
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

// Human-readable one-liner, e.g. "Sector 12, Agra, Uttar Pradesh, India".
function buildDisplayName({ locality, city, state, country }) {
  const parts = [];
  if (locality && locality !== city) parts.push(locality);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (country && country !== state) parts.push(country);
  return parts.join(', ');
}

// Normalised shape returned to the UI:
// { city, district, state, country, locality, postalCode, displayName, source }
function normalizeBigDataCloud(data) {
  const state = pick(data.principalSubdivision);
  const country = pick(data.countryName, data.countryCode);
  const locality = pick(data.locality);
  const city = pick(data.city) || (locality && locality !== state ? locality : '') || state;

  // Best-effort district lookup from the administrative levels BigDataCloud returns.
  const admin = Array.isArray(data.localityInfo?.administrative) ? data.localityInfo.administrative : [];
  const districtEntry = admin.find((a) => a && /district/i.test(`${a.description || ''} ${a.name || ''}`));
  const district = districtEntry
    ? pick(districtEntry.name).replace(/\s+(district|division|subdivision)$/i, '')
    : '';

  return {
    city,
    district: district && district !== city && district !== state ? district : '',
    state,
    country,
    locality: locality && locality !== city ? locality : '',
    postalCode: pick(data.postcode),
    displayName: buildDisplayName({ locality, city, state, country }),
    source: 'bigdatacloud',
  };
}

function normalizeNominatim(data) {
  const address = data.address || {};
  const state = pick(address.state);
  const district = pick(address.state_district, address.county);
  const country = pick(address.country);
  const locality = pick(
    address.suburb,
    address.neighbourhood,
    address.neighborhood,
    address.quarter,
    address.road
  );
  const city = pick(
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.county,
    district,
    state
  );
  const displayName = buildDisplayName({ locality, city, state, country });

  return {
    city,
    district: district && district !== city && district !== state ? district : '',
    state,
    country,
    locality: locality && locality !== city ? locality : '',
    postalCode: pick(address.postcode),
    displayName: displayName || pick(data.display_name),
    source: 'nominatim',
  };
}

export async function reverseGeocode(latitude, longitude, lang = 'en') {
  const language = lang === 'hi' ? 'hi' : 'en';
  const failures = [];

  // 1) BigDataCloud reverse-geocode-client: browser friendly, no API key.
  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}` +
      `&localityLanguage=${language}`;
    const data = await fetchJson(url);
    const place = normalizeBigDataCloud(data);
    if (place.city || place.locality || place.state) return place;
    throw new Error('No address returned');
  } catch (error) {
    failures.push(error);
  }

  // 2) OpenStreetMap Nominatim fallback.
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}` +
      `&zoom=18&addressdetails=1&accept-language=${language}`;
    const data = await fetchJson(url, { headers: { 'Accept-Language': language } });
    const place = normalizeNominatim(data);
    if (place.city || place.locality || place.state) return place;
    throw new Error('No address returned');
  } catch (error) {
    failures.push(error);
  }

  throw new Error(failures.map((e) => e?.message || String(e)).join(' | ') || 'Reverse geocoding failed');
}
