// export const knownServices = [
//   'gutter-guard',
//   'gutter-installation',
//   'gutter-cleaning',
//   'eavestrough-installation',
//   'eavestrough-cleaning',
//   'eavestrough-repair',
//   'soffit-fascia-installation-services',
//   'soffit-fascia-repair',
//   'downspout-installation-services',
//   'window-installation-services',
//   'door-installation-services',
//   'thermal-acoustical-cellulose-insulation-installation-services',
//   'window-cleaning-services',
//   'window-cleaning',
//   'home-maintenance-services',
//   'gutter-repair-services',
// ];

// export const knownPages = {
//   about: 'about',
//   contact: 'contact',
//   faq: 'faq',
//   'terms-of-service': 'terms',
//   'privacy-policy': 'privacy',
//   reviews: 'reviews',
//   'contact-us': 'contact',
//   about: 'about',
// };

// export function classifyUrl(url) {
//   const slug = url.replace('https://homeservicesolutions.ca/', '').replace(/\/$/, '');

//   if (/^\d{4}\/\d{2}\/\d{2}\//.test(slug)) {
//     return { url, type: 'blog', slug };
//   }

//   if (slug.startsWith('blog/')) return { url, type: 'blog', slug };
//   if (slug.startsWith('service-areas/')) return { url, type: 'city', slug };
//   if (slug.startsWith('alu-rex')) return { url, type: 'product', slug };
//   if (slug.startsWith('services/')) return { url, type: 'service', slug };
//   if (knownServices.includes(slug)) return { url, type: 'service', slug };
//   if (knownPages[slug]) return { url, type: 'page', slug };

//   return { url, type: 'unknown', slug };
// }

// utils/classifyUrl.js  (ESM)
import { fetchUserLocations } from '../services/fetchUserLocations.js';
import { fetchUserServices } from '../services/fetchUserServices.js';

// páginas estáticas
export const knownPages = {
  about: 'about',
  contact: 'contact',
  faq: 'faq',
  'terms-of-service': 'terms',
  'privacy-policy': 'privacy',
  reviews: 'reviews',
  'contact-us': 'contact',
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = (t) =>
  String(t || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const slugFromUrl = (url) => {
  try {
    const u = new URL(url);
    return decodeURIComponent((u.pathname || '/').toLowerCase()).replace(/^\/|\/$/g, '');
  } catch {
    return String(url).replace(/^https?:\/\/[^/]+\//i, '').replace(/\/$/, '').toLowerCase();
  }
};

// --------- CIDADES (dinâmico + robusto) ----------
let citySlugs = null;
let cityPatterns = null;

function pickLocName(raw) {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  return raw.slug || raw.name || raw.city || raw.label || '';
}

function citySlugCandidates(nameRaw) {
  const out = new Set();
  const full = slugify(nameRaw);
  if (full) out.add(full);

  // parte antes da vírgula: "Kitchener, ON" -> "kitchener"
  const beforeComma = nameRaw.split(',')[0];
  const beforeCommaSlug = slugify(beforeComma);
  if (beforeCommaSlug) out.add(beforeCommaSlug);

  // expandir regiões: "kitchener-waterloo" -> "kitchener", "waterloo"
  for (const p of full.split('-')) if (p && p.length >= 3) out.add(p);

  // variantes st-/saint-
  const variants = [...out];
  for (const s of variants) {
    if (s.startsWith('st-')) out.add(s.replace(/^st-/, 'saint-'));
    if (s.startsWith('saint-')) out.add(s.replace(/^saint-/, 'st-'));
  }
  return [...out];
}

async function ensureCities() {
  if (citySlugs && cityPatterns) return;
  const locs = await fetchUserLocations();
  const names = (Array.isArray(locs) ? locs : []).map(pickLocName).filter(Boolean);

  const set = new Set();
  for (const n of names) for (const c of citySlugCandidates(n)) set.add(c);

  citySlugs = [...set];
  cityPatterns = citySlugs.map(s => new RegExp(`(?:^|/|-)${esc(s)}(?:/|$|-)`, 'i'));
}

function matchCities(slug) {
  const hits = [];
  for (let i = 0; i < citySlugs.length; i++) {
    if (cityPatterns[i].test(slug)) hits.push(citySlugs[i]);
  }
  return [...new Set(hits)];
}

// --------- SERVIÇOS (dinâmico) ----------
let serviceSlugs = null;
let servicePatterns = null;

function pickServiceNames(raw) {
  const out = [];
  if (!raw) return out;
  if (typeof raw === 'string') out.push(raw);
  else if (typeof raw === 'object') {
    if (raw.slug) out.push(raw.slug);
    if (raw.name) out.push(raw.name);
    if (Array.isArray(raw.keywords)) out.push(...raw.keywords);
  }
  return out;
}

async function ensureServices() {
  if (serviceSlugs && servicePatterns) return;
  const services = await fetchUserServices();
  const set = new Set();

  for (const s of (Array.isArray(services) ? services : [])) {
    for (const name of pickServiceNames(s)) {
      const sl = slugify(name);
      if (sl) set.add(sl);
    }
  }

  serviceSlugs = [...set];
  servicePatterns = serviceSlugs.map(s => new RegExp(`(?:^|/|-)${esc(s)}(?:/|$|-)`, 'i'));
}

function matchServices(slug) {
  const hits = [];
  for (let i = 0; i < serviceSlugs.length; i++) {
    if (servicePatterns[i].test(slug)) hits.push(serviceSlugs[i]);
  }
  return [...new Set(hits)];
}

// --------- CLASSIFIER ----------
/**
 * Multi-rótulo:
 * - se tiver serviço + cidade ⇒ type = 'city' e types inclui ['city','service']
 */
export async function classifyUrl(url) {
  await Promise.all([ensureCities(), ensureServices()]);

  const slug = slugFromUrl(url);
  const types = new Set();
  let primary = 'unknown';

  // básicas
  if (/^\d{4}\/\d{2}\/\d{2}\//.test(slug) || slug.startsWith('blog/')) { types.add('blog'); primary = 'blog'; }
  if (slug.startsWith('tag/')) { types.add('tag'); if (primary === 'unknown') primary = 'tag'; }
  if (slug.startsWith('category/')) { types.add('category'); if (primary === 'unknown') primary = 'category'; }
  if (slug.startsWith('alu-rex')) { types.add('product'); if (primary === 'unknown') primary = 'product'; }
  if (knownPages[slug]) { types.add('page'); if (primary === 'unknown') primary = 'page'; }

  // city por prefixo
  if (slug.startsWith('service-areas/')) { types.add('city'); if (primary === 'unknown') primary = 'city'; }

  // detectar cidade/serviço em qualquer parte
  const cities = matchCities(slug);
  const services = matchServices(slug);
  if (cities.length) types.add('city');
  if (services.length) types.add('service');

  // prioridade final
  if (primary === 'unknown') {
    if (cities.length && services.length) primary = 'city';
    else if (cities.length) primary = 'city';
    else if (services.length) primary = 'service';
  }
  if (types.size === 0) types.add('unknown');

  return { url, slug, type: primary, types: [...types], cities, services };
}

// pré-aquecimento (opcional)
export async function initUrlClassifier() {
  await Promise.all([ensureCities(), ensureServices()]);
}
