/**
 * Central generation configuration.
 * To add a new generation (e.g. Gen 10) once PokéAPI has it, append one entry
 * to GENERATIONS — the menu, the "All" range and the random picker all derive from here.
 */
export const GENERATIONS = [
  { id: 1, label: 'Gen I', region: 'Kanto', start: 1, end: 151 },
  { id: 2, label: 'Gen II', region: 'Johto', start: 152, end: 251 },
  { id: 3, label: 'Gen III', region: 'Hoenn', start: 252, end: 386 },
  { id: 4, label: 'Gen IV', region: 'Sinnoh', start: 387, end: 493 },
  { id: 5, label: 'Gen V', region: 'Unova', start: 494, end: 649 },
  { id: 6, label: 'Gen VI', region: 'Kalos', start: 650, end: 721 },
  { id: 7, label: 'Gen VII', region: 'Alola', start: 722, end: 809 },
  { id: 8, label: 'Gen VIII', region: 'Galar', start: 810, end: 905 },
  { id: 9, label: 'Gen IX', region: 'Paldea', start: 906, end: 1025 },
];

export const MAX_POKEMON_ID = Math.max(...GENERATIONS.map((g) => g.end));

export const ALL_GENERATIONS = {
  id: 'all',
  label: 'All',
  region: 'National',
  start: 1,
  end: MAX_POKEMON_ID,
};

/** Options shown in the start menu, in display order. */
export const GENERATION_OPTIONS = [ALL_GENERATIONS, ...GENERATIONS];

export function getGenerationRange(genId) {
  return GENERATION_OPTIONS.find((g) => g.id === genId) ?? ALL_GENERATIONS;
}

export function getGenerationForId(pokemonId) {
  return GENERATIONS.find((g) => pokemonId >= g.start && pokemonId <= g.end) ?? null;
}
