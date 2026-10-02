import { MAX_POKEMON_ID, getGenerationForId } from '../config/generationRanges.js';

const BASE_URL = 'https://pokeapi.co/api/v2';

// id -> Promise<Pokemon>. Caching the promise also de-dupes in-flight requests.
const pokemonCache = new Map();
let speciesIndexPromise = null;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PokéAPI responded ${res.status}`);
  return res.json();
}

function idFromUrl(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : NaN;
}

/* ---------- Name formatting ---------- */

const SPECIAL_NAMES = {
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'mr-mime': 'Mr. Mime',
  'mime-jr': 'Mime Jr.',
  'mr-rime': 'Mr. Rime',
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  'type-null': 'Type: Null',
  flabebe: 'Flabébé',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
  'wo-chien': 'Wo-Chien',
  'chien-pao': 'Chien-Pao',
  'ting-lu': 'Ting-Lu',
  'chi-yu': 'Chi-Yu',
};

/** "great-tusk" -> "Great Tusk", "mr-mime" -> "Mr. Mime" */
export function formatPokemonName(slug) {
  if (SPECIAL_NAMES[slug]) return SPECIAL_NAMES[slug];
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/* ---------- Species index (one request, used for wrong-answer names) ---------- */

/** Map<id, { id, slug, name }> for every species up to MAX_POKEMON_ID. */
export function getSpeciesIndex() {
  if (!speciesIndexPromise) {
    speciesIndexPromise = getJSON(`${BASE_URL}/pokemon-species?limit=${MAX_POKEMON_ID}`)
      .then((data) => {
        const index = new Map();
        for (const entry of data.results) {
          const id = idFromUrl(entry.url);
          if (id >= 1 && id <= MAX_POKEMON_ID) {
            index.set(id, { id, slug: entry.name, name: formatPokemonName(entry.name) });
          }
        }
        return index;
      })
      .catch((err) => {
        speciesIndexPromise = null; // allow a retry
        throw err;
      });
  }
  return speciesIndexPromise;
}

/* ---------- Single Pokémon ---------- */

function toPokemon(data) {
  const slug = data.species?.name ?? data.name;
  const sprites = data.sprites ?? {};
  return {
    id: data.id,
    slug,
    name: formatPokemonName(slug),
    artwork:
      sprites.other?.['official-artwork']?.front_default ??
      sprites.other?.home?.front_default ??
      sprites.front_default ??
      null,
    cry: data.cries?.latest ?? data.cries?.legacy ?? null,
    generation: getGenerationForId(data.id),
    types: (data.types ?? []).map((t) => t.type.name),
  };
}

export function getPokemon(id) {
  if (!pokemonCache.has(id)) {
    const request = getJSON(`${BASE_URL}/pokemon/${id}`)
      .then(toPokemon)
      .catch((err) => {
        pokemonCache.delete(id);
        throw err;
      });
    pokemonCache.set(id, request);
  }
  return pokemonCache.get(id);
}

/** Resolves once the image is decoded (or fails), so silhouettes never pop in half-loaded. */
export function preloadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
