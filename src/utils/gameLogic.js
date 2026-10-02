import { getGenerationRange } from '../config/generationRanges.js';
import { getPokemon, getSpeciesIndex, preloadImage } from './pokemonApi.js';

export const MAX_ATTEMPTS = 2;
export const CHOICE_COUNT = 4;
export const POINTS_BY_ATTEMPT = { 1: 2, 2: 1 };
export const SESSION_LENGTH = 10; // Pokémon per game; results + leaderboard save after the last one
const RECENT_MEMORY = 30;

export const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random id in range, avoiding recently seen Pokémon where possible. */
export function pickTargetId({ start, end }, recentIds = []) {
  const size = end - start + 1;
  const avoid = new Set(recentIds.slice(-Math.min(RECENT_MEMORY, Math.floor(size / 2))));
  for (let i = 0; i < 60; i++) {
    const id = randomInt(start, end);
    if (!avoid.has(id)) return id;
  }
  return randomInt(start, end);
}

export function pickDistractors(target, { start, end }, speciesIndex, count = CHOICE_COUNT - 1) {
  const picked = new Map();
  let guard = 0;
  while (picked.size < count && guard++ < 500) {
    const id = randomInt(start, end);
    const entry = speciesIndex.get(id);
    if (!entry || id === target.id || picked.has(id) || entry.name === target.name) continue;
    picked.set(id, { id, name: entry.name });
  }
  return [...picked.values()];
}

/** Fetch everything a round needs, including the decoded artwork. */
export async function prepareRound(genId, recentIds) {
  const range = getGenerationRange(genId);
  const speciesIndex = await getSpeciesIndex();
  const id = pickTargetId(range, recentIds);
  const pokemon = await getPokemon(id);
  await preloadImage(pokemon.artwork);
  const distractors = pickDistractors(pokemon, range, speciesIndex);
  return {
    genId,
    pokemon,
    choices: shuffle([{ id: pokemon.id, name: pokemon.name }, ...distractors]),
  };
}

export const rememberId = (recentIds, id) => [...recentIds, id].slice(-RECENT_MEMORY);

/* ---------- Typed answers ---------- */

export function normalizeAnswer(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // é -> e
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .replace(/[\s\-_'’‘`.:]/g, '');
}

export function isCorrectGuess(input, pokemon) {
  const guess = normalizeAnswer(input);
  if (!guess) return false;
  return [pokemon.name, pokemon.slug].some((n) => normalizeAnswer(n) === guess);
}

/** "Pikachu" -> "P______" (keeps spaces and punctuation visible) */
export function makeHint(name) {
  return [...name].map((ch, i) => (i === 0 || !/[a-z0-9é]/i.test(ch) ? ch : '_')).join('');
}

/* ---------- Score ---------- */

export const initialStats = () => ({ score: 0, attempted: 0, correct: 0, streak: 0, bestStreak: 0 });

export const pointsForAttempt = (attemptNumber) => POINTS_BY_ATTEMPT[attemptNumber] ?? 0;

export function applyResult(stats, { correct, points }) {
  const streak = correct ? stats.streak + 1 : 0;
  return {
    score: stats.score + points,
    attempted: stats.attempted + 1,
    correct: stats.correct + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
}

export const pad2 = (n) => String(n).padStart(2, '0');
