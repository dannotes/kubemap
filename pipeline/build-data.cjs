#!/usr/bin/env node
/**
 * kubemap data pipeline
 * Fetches cncf/people, enriches with geocoding, outputs static JSON for the frontend.
 * Run: node pipeline/build-data.cjs
 */

const fs = require('fs');
const path = require('path');
const { CITY_COORDS, COUNTRY_COORDS, COUNTRY_FLAGS } = require('./geo-data.cjs');

const DATA_URL = 'https://raw.githubusercontent.com/cncf/people/main/people.json';
const IMG_BASE = 'https://raw.githubusercontent.com/cncf/people/main/images/';
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');
const GEOCACHE_PATH = path.join(__dirname, 'geocache.json');

// ─── Helpers ───────────────────────────────────────────────────────────────

function slugify(s) {
  return (s || '').toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
}

function hashStr(s) {
  let h = 0;
  for (const c of (s || '')) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}

function stripHtml(s) {
  if (!s) return '';
  return s.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function truncateAtSentence(text, maxLen) {
  if (!text || text.length <= maxLen) return text || '';
  // Find the last sentence-ending punctuation within maxLen
  const chunk = text.slice(0, maxLen);
  const lastEnd = Math.max(chunk.lastIndexOf('. '), chunk.lastIndexOf('! '), chunk.lastIndexOf('? '));
  if (lastEnd > maxLen * 0.4) return chunk.slice(0, lastEnd + 1);
  // Fallback: cut at last space
  const lastSpace = chunk.lastIndexOf(' ');
  return (lastSpace > 0 ? chunk.slice(0, lastSpace) : chunk) + '…';
}

function isGolden(cat) {
  if (!cat) return false;
  if (Array.isArray(cat)) return cat.some(c => /golden/i.test(c));
  return /golden/i.test(String(cat));
}

function isKube(cat) {
  if (!cat) return false;
  if (Array.isArray(cat)) return cat.some(c => /kubestronaut/i.test(c));
  return /kubestronaut/i.test(String(cat));
}

function isAmb(cat) {
  if (!cat) return false;
  if (Array.isArray(cat)) return cat.some(c => /ambassador/i.test(c));
  return /ambassador/i.test(String(cat));
}

// ─── Geocoding ─────────────────────────────────────────────────────────────

// Load persistent cache
let geoCache = {};
try {
  if (fs.existsSync(GEOCACHE_PATH)) {
    geoCache = JSON.parse(fs.readFileSync(GEOCACHE_PATH, 'utf-8'));
    console.log(`   📦 Loaded ${Object.keys(geoCache).length} cached geocode entries`);
  }
} catch { /* ignore */ }

function saveGeoCache() {
  fs.writeFileSync(GEOCACHE_PATH, JSON.stringify(geoCache, null, 2));
}

const cityKeys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
const countryKeys = Object.keys(COUNTRY_COORDS).sort((a, b) => b.length - a.length);

function geocodeLocal(loc) {
  if (!loc) return null;
  const s = loc.toLowerCase().trim();
  for (const k of cityKeys) {
    if (s.includes(k)) return CITY_COORDS[k];
  }
  for (const k of countryKeys) {
    if (s.includes(k)) return COUNTRY_COORDS[k];
  }
  return null;
}

// Nominatim geocoder with rate limiting (1 req/sec per OSM policy)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
let lastNominatimCall = 0;

async function geocodeNominatim(loc) {
  if (!loc) return null;
  const key = loc.toLowerCase().trim();

  // Check cache first
  if (geoCache[key]) return geoCache[key];

  // Rate limit: 1 request per second
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimCall));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastNominatimCall = Date.now();

  try {
    const params = new URLSearchParams({
      q: loc,
      format: 'json',
      limit: '1',
      addressdetails: '0',
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': 'kubemap.dev/1.0 (community Kubestronaut map)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      const result = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geoCache[key] = result;
      return result;
    }
    // Cache null result too to avoid re-querying
    geoCache[key] = null;
    return null;
  } catch {
    return null;
  }
}

// Combined geocoder: try cache/Nominatim first (high precision), fallback to local lookup
async function geocode(loc) {
  if (!loc) return null;
  const key = loc.toLowerCase().trim();

  // Check Nominatim cache first (higher precision)
  if (key in geoCache) {
    return geoCache[key]; // may be null (cached miss)
  }

  // Fallback to local lookup (immediate, no API call)
  return geocodeLocal(loc);
}

// Country name normalization map
const COUNTRY_ALIASES = {
  'us': 'United States', 'usa': 'United States', 'united states': 'United States',
  'united states of america': 'United States', 'united of states': 'United States',
  'uk': 'United Kingdom', 'united kingdom': 'United Kingdom',
  'england': 'United Kingdom', 'scotland': 'United Kingdom',
  'uae': 'United Arab Emirates', 'united arab emirates': 'United Arab Emirates',
  'czechia': 'Czech Republic', 'czech republic': 'Czech Republic',
  'saudi arabia': 'Saudi Arabia', 'saudia arabia': 'Saudi Arabia',
  'swtizerland': 'Switzerland', 'swizerland': 'Switzerland', 'switzerland': 'Switzerland',
  'korea': 'South Korea', 'south korea': 'South Korea',
  'russian federation': 'Russia', 'russia': 'Russia',
  'netherland': 'Netherlands', 'netherlands': 'Netherlands',
  'texas': 'United States', 'florida': 'United States', 'california': 'United States',
  'colorado': 'United States', 'virginia': 'United States', 'georgia, us': 'United States',
  'new york state': 'United States', 'washington state': 'United States',
  'massachusetts': 'United States', 'oregon': 'United States', 'ohio': 'United States',
  'michigan': 'United States', 'illinois': 'United States', 'pennsylvania': 'United States',
  'north carolina': 'United States', 'arizona': 'United States', 'indiana': 'United States',
  'minnesota': 'United States', 'wisconsin': 'United States', 'tennessee': 'United States',
  'maryland': 'United States', 'connecticut': 'United States', 'new jersey': 'United States',
  'bosnia': 'Bosnia and Herzegovina', 'bosnia and herzegovina': 'Bosnia and Herzegovina',
  'macedonia': 'North Macedonia', 'north macedonia': 'North Macedonia',
  "cote d'ivoire": "Cote d'Ivoire", 'ivory coast': "Cote d'Ivoire",
  // ISO 3166-1 alpha-2 codes (used by Bevy API)
  'in': 'India', 'mx': 'Mexico', 'ca': 'Canada', 'tr': 'Turkey', 'gb': 'United Kingdom',
  'de': 'Germany', 'fr': 'France', 'br': 'Brazil', 'au': 'Australia', 'jp': 'Japan',
  'kr': 'South Korea', 'cn': 'China', 'sg': 'Singapore', 'nl': 'Netherlands', 'se': 'Sweden',
  'es': 'Spain', 'it': 'Italy', 'pl': 'Poland', 'no': 'Norway', 'dk': 'Denmark',
  'ch': 'Switzerland', 'at': 'Austria', 'be': 'Belgium', 'fi': 'Finland', 'ie': 'Ireland',
  'pt': 'Portugal', 'cz': 'Czech Republic', 'il': 'Israel', 'za': 'South Africa',
  'ng': 'Nigeria', 'eg': 'Egypt', 'ke': 'Kenya', 'gh': 'Ghana', 'co': 'Colombia',
  'ar': 'Argentina', 'cl': 'Chile', 'pe': 'Peru', 'ec': 'Ecuador', 'pa': 'Panama',
  'my': 'Malaysia', 'id': 'Indonesia', 'ph': 'Philippines', 'th': 'Thailand', 'vn': 'Vietnam',
  'tw': 'Taiwan', 'hk': 'Hong Kong', 'nz': 'New Zealand', 'ro': 'Romania', 'hu': 'Hungary',
  'gr': 'Greece', 'hr': 'Croatia', 'rs': 'Serbia', 'bg': 'Bulgaria', 'sk': 'Slovakia',
  'lt': 'Lithuania', 'lv': 'Latvia', 'ee': 'Estonia', 'si': 'Slovenia',
};

function parseCountry(loc) {
  if (!loc) return 'Unknown';
  const s = loc.toLowerCase().trim();
  for (const k of countryKeys) {
    if (s.includes(k)) {
      if (COUNTRY_ALIASES[k]) return COUNTRY_ALIASES[k];
      return k.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    }
  }
  return 'Unknown';
}

// ─── Enrich ────────────────────────────────────────────────────────────────

async function enrich(raw) {
  const out = [];
  const slugCounts = {};

  // Collect unique locations that need Nominatim geocoding
  const uniqueLocs = new Set();
  for (const p of raw) {
    const cat = p.category || p.categories;
    if (!isKube(cat) && !isGolden(cat) && !isAmb(cat)) continue;
    const loc = (p.location || '').trim();
    if (loc) uniqueLocs.add(loc);
  }

  // Geocode uncached locations via Nominatim
  const uncached = [...uniqueLocs].filter(loc => !(loc.toLowerCase().trim() in geoCache));
  if (uncached.length > 0) {
    console.log(`   🌐 Geocoding ${uncached.length} new locations via Nominatim (${uncached.length}s est.)...`);
    let done = 0;
    for (const loc of uncached) {
      await geocodeNominatim(loc);
      done++;
      if (done % 50 === 0) {
        console.log(`      ${done}/${uncached.length} done...`);
        saveGeoCache(); // Save periodically in case of interruption
      }
    }
    saveGeoCache();
    console.log(`   ✅ Geocoded ${done} locations`);
  }

  for (const p of raw) {
    const cat = p.category || p.categories;
    if (!isKube(cat) && !isGolden(cat) && !isAmb(cat)) continue;

    const loc = (p.location || '').trim();
    const coords = await geocode(loc);
    if (!coords) continue;

    const country = parseCountry(loc);
    const tier = isGolden(cat) ? 'golden' : (isKube(cat) ? 'regular' : 'ambassador');
    const img = p.image && p.image !== 'phippy.jpg' ? p.image : null;

    let baseSlug = slugify(p.name);
    if (!baseSlug) baseSlug = 'unknown';
    slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
    const slug = slugCounts[baseSlug] > 1
      ? `${baseSlug}-${slugCounts[baseSlug]}`
      : baseSlug;

    out.push({
      id: slug,
      name: p.name || 'Unknown',
      bio: stripHtml(p.bio).slice(0, 600),
      pronouns: p.pronouns || '',
      company: (p.company || '').trim(),
      location: loc,
      country,
      flag: COUNTRY_FLAGS[country] || '🌐',
      lat: coords[0],
      lon: coords[1],
      tier,
      image: img,
      isAmbassador: isAmb(cat),
      socials: {
        github: p.github || null,
        linkedin: p.linkedin || null,
        twitter: p.twitter || null,
        bluesky: p.bluesky || null,
        website: p.website || null,
        youtube: p.youtube || null,
      },
      projects: Array.isArray(p.projects) ? p.projects : [],
      languages: Array.isArray(p.languages) ? p.languages : [],
    });
  }

  return out;
}

// ─── Stats ─────────────────────────────────────────────────────────────────

function computeStats(people) {
  const total = people.length;
  const golden = people.filter(p => p.tier === 'golden').length;
  const regular = people.filter(p => p.tier === 'regular').length;
  const ambassadors = people.filter(p => p.isAmbassador).length;
  const countries = {};
  const companies = {};
  const cities = {};

  for (const p of people) {
    // Countries
    if (p.country !== 'Unknown') {
      if (!countries[p.country]) countries[p.country] = { count: 0, golden: 0, flag: p.flag };
      countries[p.country].count++;
      if (p.tier === 'golden') countries[p.country].golden++;
    }

    // Companies
    if (p.company) {
      if (!companies[p.company]) companies[p.company] = { count: 0, golden: 0 };
      companies[p.company].count++;
      if (p.tier === 'golden') companies[p.company].golden++;
    }

    // Cities (first token of location)
    if (p.location) {
      const city = p.location.split(',')[0].trim();
      if (city) {
        if (!cities[city]) cities[city] = { count: 0, golden: 0, country: p.country, flag: p.flag };
        cities[city].count++;
        if (p.tier === 'golden') cities[city].golden++;
      }
    }
  }

  const topCountries = Object.entries(countries)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([name, data]) => ({ name, ...data }));

  const topCompanies = Object.entries(companies)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([name, data]) => ({ name, ...data }));

  const topCities = Object.entries(cities)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 50)
    .map(([name, data]) => ({ name, ...data }));

  return {
    total,
    golden,
    regular,
    ambassadors,
    countryCount: Object.keys(countries).length,
    topCountries,
    topCompanies,
    topCities,
    generatedAt: new Date().toISOString(),
  };
}

// ─── KCD Events ───────────────────────────────────────────────────────────

const BEVY_API = 'https://community.cncf.io/api/event/';

async function fetchKCDEvents() {
  const events = [];
  let page = 1;
  const maxPages = 65; // ~6500 events / 100 per page

  while (page <= maxPages) {
    const url = `${BEVY_API}?ordering=-start_date&page_size=100&page=${page}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'kubemap.dev/1.0 (community Kubestronaut map)' },
    });
    if (!res.ok) break;
    const data = await res.json();
    const results = data.results || [];
    if (!results.length) break;

    for (const e of results) {
      const title = (e.title || '').toLowerCase();
      if (title.includes('kcd') || title.includes('kubernetes community day')) {
        const ch = e.chapter || {};
        const city = (ch.city || '').trim();
        const countryName = (ch.country_name || '').trim() || COUNTRY_ALIASES[(ch.country || '').toLowerCase()] || parseCountry(city);
        const loc = city ? `${city}, ${countryName}` : countryName;
        const coords = await geocode(loc) || geocodeLocal(loc);

        if (coords) {
          const startDate = e.start_date ? e.start_date.split('T')[0] : null;
          const endDate = e.end_date ? e.end_date.split('T')[0] : null;
          if (!startDate) continue;

          // Only include upcoming or recent events (within last 30 days)
          const eventDate = new Date(startDate);
          const daysAgo = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysAgo > 30) continue;

          // Extract description (strip HTML)
          const rawDesc = (ch.description || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();

          events.push({
            id: slugify(e.title),
            title: e.title,
            description: truncateAtSentence(rawDesc, 400),
            startDate,
            endDate,
            city: city || countryName,
            country: countryName,
            flag: COUNTRY_FLAGS[countryName] || '🌐',
            lat: coords[0],
            lon: coords[1],
            url: e.url || '',
            logo: ch.logo?.thumbnail_url || null,
          });
        }
      }
    }

    // Stop early if we've gone past upcoming events
    const oldest = results[results.length - 1];
    if (oldest && oldest.start_date) {
      const d = new Date(oldest.start_date);
      const daysAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo > 60) break;
    }

    page++;
  }

  // Sort by start date ascending (soonest first)
  events.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return events;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('📡 Fetching cncf/people...');
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const raw = await res.json();
  console.log(`   ${raw.length} total entries in people.json`);

  console.log('🔧 Enriching data...');
  const people = await enrich(raw);
  console.log(`   ${people.length} people enriched with coordinates`);

  // Check precision improvement
  const highPrec = people.filter(p => {
    const latDec = (p.lat.toString().split('.')[1] || '').length;
    return latDec >= 4;
  }).length;
  console.log(`   📍 ${highPrec} people with high-precision coordinates (≥4 decimals)`);

  // Check what we missed
  const missed = raw.filter(p => {
    const cat = p.category || p.categories;
    if (!isKube(cat) && !isGolden(cat) && !isAmb(cat)) return false;
    if (!p.location) return false;
    const loc = p.location.toLowerCase().trim();
    return !(loc in geoCache) && !geocodeLocal(p.location);
  });
  if (missed.length > 0) {
    console.log(`   ⚠️  ${missed.length} people could not be geocoded:`);
    const missedLocs = [...new Set(missed.map(p => p.location))].sort();
    missedLocs.forEach(l => console.log(`      - "${l}"`));
  }

  console.log('📊 Computing stats...');
  const stats = computeStats(people);
  console.log(`   ${stats.countryCount} countries, ${stats.golden} golden, ${stats.ambassadors} ambassadors`);

  // Write output
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Core data — what the map/wall/graph/leaderboard need (fast initial load)
  const core = people.map(({ bio, pronouns, socials, languages, ...rest }) => rest);
  const coreJson = JSON.stringify(core);
  fs.writeFileSync(path.join(OUT_DIR, 'people-core.json'), coreJson);
  console.log(`   people-core.json: ${(coreJson.length / 1024).toFixed(0)}KB`);

  // Detail data — keyed by id, loaded lazily for profile panel/page
  const details = {};
  for (const p of people) {
    details[p.id] = { bio: p.bio, pronouns: p.pronouns, socials: p.socials, languages: p.languages };
  }
  const detailsJson = JSON.stringify(details);
  fs.writeFileSync(path.join(OUT_DIR, 'people-details.json'), detailsJson);
  console.log(`   people-details.json: ${(detailsJson.length / 1024).toFixed(0)}KB`);

  const statsJson = JSON.stringify(stats, null, 2);
  fs.writeFileSync(path.join(OUT_DIR, 'stats.json'), statsJson);
  console.log(`   stats.json: ${(statsJson.length / 1024).toFixed(0)}KB`);

  console.log('📅 Fetching KCD events...');
  const events = await fetchKCDEvents();
  const eventsJson = JSON.stringify(events);
  fs.writeFileSync(path.join(OUT_DIR, 'events.json'), eventsJson);
  console.log(`   events.json: ${events.length} upcoming events (${(eventsJson.length / 1024).toFixed(0)}KB)`);

  console.log('✅ Done!');
}

main().catch(e => { console.error('❌', e); process.exit(1); });
