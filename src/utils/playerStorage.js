/**
 * Local trainer profiles, kept in localStorage. No accounts, no backend.
 * Every read/write is wrapped so blocked storage (private mode etc.) never breaks the game.
 */
const PLAYERS_KEY = 'wtp-players';
const CURRENT_KEY = 'wtp-current-player';

export const NAME_MAX = 12;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // not saved; the game keeps working for this visit
  }
}

const withDefaults = (p) => ({
  totalScore: 0,
  gamesPlayed: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  bestStreak: 0,
  highScore: 0,
  createdAt: Date.now(),
  ...p,
});

export function loadPlayers() {
  const list = read(PLAYERS_KEY, []);
  return Array.isArray(list) ? list.filter((p) => p?.id && p?.name).map(withDefaults) : [];
}

export const savePlayers = (players) => write(PLAYERS_KEY, players);
export const loadCurrentId = () => read(CURRENT_KEY, null);
export const saveCurrentId = (id) => write(CURRENT_KEY, id);

/** "  ash   ketchum " -> "ASH KETCHUM" (max 12 chars) */
export const cleanName = (name) => String(name).replace(/\s+/g, ' ').trim().toUpperCase().slice(0, NAME_MAX);

export function createPlayer(name) {
  return withDefaults({
    id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName(name),
    createdAt: Date.now(),
  });
}

/** Folds one finished game (the session stats from gameLogic) into a player's totals. */
export function recordSession(player, session) {
  return {
    ...player,
    totalScore: player.totalScore + session.score,
    gamesPlayed: player.gamesPlayed + 1,
    correctAnswers: player.correctAnswers + session.correct,
    totalQuestions: player.totalQuestions + session.attempted,
    bestStreak: Math.max(player.bestStreak, session.bestStreak),
    highScore: Math.max(player.highScore, session.score),
  };
}

export const accuracy = (p) => (p.totalQuestions ? Math.round((p.correctAnswers / p.totalQuestions) * 100) : 0);

/** sort: 'total' (Total Score, default) or 'high' (best single game). */
export function rankPlayers(players, sort = 'total') {
  const key = sort === 'high' ? 'highScore' : 'totalScore';
  return [...players].sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name));
}
