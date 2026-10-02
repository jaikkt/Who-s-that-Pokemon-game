import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import DSConsole from './components/DSConsole.jsx';
import TopScreen from './components/TopScreen.jsx';
import BottomScreen from './components/BottomScreen.jsx';
import { MODES } from './components/StartMenu.jsx';
import ColorPicker, { DS_COLORS } from './components/ColorPicker.jsx';
import { GENERATION_OPTIONS } from './config/generationRanges.js';
import { audio } from './utils/audioManager.js';
import {
  MAX_ATTEMPTS,
  SESSION_LENGTH,
  applyResult,
  initialStats,
  isCorrectGuess,
  makeHint,
  normalizeAnswer,
  pointsForAttempt,
  prepareRound,
  rememberId,
} from './utils/gameLogic.js';
import {
  cleanName,
  createPlayer,
  loadCurrentId,
  loadPlayers,
  rankPlayers,
  recordSession,
  saveCurrentId,
  savePlayers,
} from './utils/playerStorage.js';

const DS_WIDTH = 980;
const DS_HEIGHT = 1000;
const PAGE_CHROME = 80; // room under the DS for the colour picker and key hints
const COLOR_KEY = 'wtp-ds-color';

function loadColor() {
  try {
    const saved = localStorage.getItem(COLOR_KEY);
    if (DS_COLORS.some((c) => c.id === saved)) return saved;
  } catch {
    // storage blocked (private mode etc.)
  }
  return DS_COLORS[0].id;
}

/** Uniformly scales the fixed-size DS to fit the viewport. */
function useFitScale() {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const s = Math.min((window.innerWidth * 0.96) / DS_WIDTH, (window.innerHeight * 0.94 - PAGE_CHROME) / DS_HEIGHT, 1.25);
      setScale(Math.max(s, 0.2));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return scale;
}

const isTypingTarget = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');

export default function App() {
  const scale = useFitScale();

  // phase: 'players' | 'addPlayer' | 'leaderboard' | 'menu' | 'loading' | 'guessing' | 'revealed' | 'results' | 'error'
  const [phase, setPhase] = useState('players');
  const [settings, setSettings] = useState({ gen: 'all', mode: 'choice' });
  const [round, setRound] = useState(null);
  const [stats, setStats] = useState(initialStats);
  const [muted, setMuted] = useState(false);
  const [cryBlocked, setCryBlocked] = useState(false);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [dsColor, setDsColor] = useState(loadColor);

  // Trainers (local profiles) and leaderboard view state.
  const [players, setPlayers] = useState(loadPlayers);
  const [currentId, setCurrentId] = useState(() => {
    const saved = loadCurrentId();
    const list = loadPlayers();
    return list.some((p) => p.id === saved) ? saved : list[0]?.id ?? null;
  });
  const [lbSort, setLbSort] = useState('total');
  const [lbCursor, setLbCursor] = useState(0);
  const [lbReturn, setLbReturn] = useState('players');
  const [lastResult, setLastResult] = useState(null);

  const currentPlayer = players.find((p) => p.id === currentId) ?? null;
  const ranked = rankPlayers(players, lbSort);

  const recentIds = useRef([]);
  const prefetched = useRef(null);
  const requestId = useRef(0);
  const timers = useRef([]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Clicking a button shouldn't move focus to it: keeps the text field focused when
  // SUBMIT is clicked, and stops Enter from re-pressing the last clicked button.
  useEffect(() => {
    const keepFocus = (e) => {
      if (e.target.closest?.('button')) e.preventDefault();
    };
    window.addEventListener('mousedown', keepFocus);
    return () => window.removeEventListener('mousedown', keepFocus);
  }, []);

  // Unlock Web Audio on the first interaction anywhere on the page.
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const playCry = useCallback(async (pokemon) => {
    if (!pokemon?.cry) return;
    const result = await audio.playCry(pokemon.cry);
    if (result.played) setCryBlocked(false);
    else if (result.blocked) setCryBlocked(true);
  }, []);

  /* ---------- Round lifecycle ---------- */

  const prefetchNext = (genId) => {
    const promise = prepareRound(genId, recentIds.current);
    promise.catch(() => {});
    prefetched.current = { genId, promise };
  };

  const loadRound = async (genId) => {
    clearTimers();
    audio.stopCry();
    const req = ++requestId.current;
    setPhase('loading');
    setError('');
    try {
      let data = null;
      const pre = prefetched.current;
      prefetched.current = null;
      if (pre?.genId === genId) data = await pre.promise.catch(() => null);
      if (!data) data = await prepareRound(genId, recentIds.current);
      if (req !== requestId.current) return; // player left while loading

      recentIds.current = rememberId(recentIds.current, data.pokemon.id);
      setRound({ ...data, attemptsLeft: MAX_ATTEMPTS, wrongIds: [], wrongGuesses: [], hint: null, outcome: null, points: 0 });
      setCursor(0);
      setPhase('guessing');
      later(() => audio.playIntro(), 420); // let the silhouette land first; the cry waits for the reveal
      prefetchNext(genId);
    } catch (err) {
      if (req !== requestId.current) return;
      setError(err?.message || 'Network error');
      setPhase('error');
    }
  };

  const startGame = () => {
    audio.unlock();
    audio.play('menuSelect');
    setStats(initialStats()); // a game is SESSION_LENGTH Pokémon, scored from zero
    loadRound(settings.gen);
  };

  const nextPokemon = () => {
    audio.play('menuSelect');
    if (stats.attempted >= SESSION_LENGTH) {
      clearTimers();
      audio.stopCry();
      prefetched.current = null;
      setPhase('results');
      return;
    }
    loadRound(settings.gen);
  };

  const goMenu = () => {
    requestId.current++;
    clearTimers();
    audio.stopCry();
    audio.play('menuSelect');
    setPhase('menu');
  };

  const reveal = (correct, attemptNumber, pokemon) => {
    const points = correct ? pointsForAttempt(attemptNumber) : 0;
    setRound((r) => ({ ...r, outcome: correct ? 'correct' : 'failed', points }));
    const next = applyResult(stats, { correct, points });
    setStats(next);
    if (next.attempted >= SESSION_LENGTH) finishSession(next);
    setPhase('revealed');
    audio.stopCry(); // cut the intro clip if it's still playing
    audio.play('reveal');
    if (correct) later(() => audio.play('correct'), 160);
    later(() => playCry(pokemon), 750);
  };

  /** Saves a finished game to the current trainer straight away. */
  const finishSession = (session) => {
    const newHigh = Boolean(currentPlayer) && session.score > currentPlayer.highScore;
    if (currentPlayer) {
      updatePlayers(players.map((p) => (p.id === currentPlayer.id ? recordSession(p, session) : p)));
    }
    setLastResult({ ...session, newHigh });
  };

  const registerWrong = (patch) => {
    audio.play('incorrect');
    setShakeKey((k) => k + 1);
    const left = round.attemptsLeft - 1;
    setRound((r) => ({ ...r, ...patch(r), attemptsLeft: left }));
    if (left <= 0) later(() => reveal(false, MAX_ATTEMPTS, round.pokemon), 550);
  };

  const canGuess = phase === 'guessing' && round && round.attemptsLeft > 0;
  const attemptNumber = round ? MAX_ATTEMPTS - round.attemptsLeft + 1 : 1;

  const pickChoice = (choice) => {
    if (!canGuess || !choice || round.wrongIds.includes(choice.id)) return;
    if (choice.id === round.pokemon.id) {
      reveal(true, attemptNumber, round.pokemon);
      return;
    }
    registerWrong((r) => ({ wrongIds: [...r.wrongIds, choice.id] }));
    // Move the D-pad cursor off the disabled answer.
    const nextIdx = round.choices.findIndex((c) => c.id !== choice.id && !round.wrongIds.includes(c.id));
    if (nextIdx >= 0) setCursor(nextIdx);
  };

  const typeGuess = (text) => {
    if (!canGuess) return;
    if (isCorrectGuess(text, round.pokemon)) {
      reveal(true, attemptNumber, round.pokemon);
      return;
    }
    registerWrong((r) => ({
      wrongGuesses: [...r.wrongGuesses, normalizeAnswer(text)],
      hint: makeHint(r.pokemon.name),
    }));
  };

  const toggleMute = () => {
    const next = !muted;
    audio.setMuted(next);
    setMuted(next);
    if (!next) audio.play('menuSelect');
  };

  /* ---------- Trainers ---------- */

  const updatePlayers = (next) => {
    setPlayers(next);
    savePlayers(next);
  };

  const selectPlayer = (id) => {
    setCurrentId(id);
    saveCurrentId(id);
  };

  const pickPlayer = (id) => {
    if (id === currentId) return;
    audio.play('menuSelect');
    selectPlayer(id);
  };

  const openAddPlayer = () => {
    audio.unlock();
    audio.play('menuSelect');
    setPhase('addPlayer');
  };

  const playGame = () => {
    if (!currentPlayer) {
      openAddPlayer();
      return;
    }
    audio.unlock();
    audio.play('menuSelect');
    setPhase('menu');
  };

  /** Returns an error message for the name-entry screen, or nothing on success. */
  const savePlayer = (rawName) => {
    const name = cleanName(rawName);
    let err = '';
    if (!name) err = 'Enter a name first.';
    else if (players.some((p) => p.name === name)) err = 'That name is taken.';
    if (err) {
      audio.play('incorrect');
      return err;
    }
    const player = createPlayer(name);
    updatePlayers([...players, player]);
    selectPlayer(player.id);
    audio.play('correct');
    setPhase('players');
    return '';
  };

  const changeUser = () => {
    requestId.current++;
    clearTimers();
    audio.stopCry();
    audio.play('menuSelect');
    setPhase('players');
  };

  const openLeaderboard = () => {
    audio.play('menuSelect');
    setLbReturn(phase === 'results' ? 'results' : 'players');
    setLbCursor(Math.max(0, ranked.findIndex((p) => p.id === currentId)));
    setPhase('leaderboard');
  };

  const closeLeaderboard = () => {
    audio.play('menuSelect');
    setPhase(lbReturn);
  };

  const sortLeaderboard = (sort) => {
    if (sort === lbSort) return;
    audio.play('menuSelect');
    const focusId = ranked[lbCursor]?.id;
    const next = rankPlayers(players, sort);
    setLbSort(sort);
    setLbCursor(Math.max(0, next.findIndex((p) => p.id === focusId)));
  };

  const moveList = (dir, length, index, apply) => {
    if (!length || (dir !== 'up' && dir !== 'down')) return;
    const nextIdx = (index + (dir === 'down' ? 1 : -1) + length) % length;
    if (nextIdx !== index) apply(nextIdx);
  };

  const changeColor = (id) => {
    audio.play('menuSelect');
    setDsColor(id);
    try {
      localStorage.setItem(COLOR_KEY, id);
    } catch {
      // not saved; colour still applies for this visit
    }
  };

  const updateSettings = (patch) => {
    audio.play('menuSelect');
    setSettings((s) => ({ ...s, ...patch }));
  };

  /* ---------- Hardware buttons + keyboard ---------- */

  const moveMenu = (dir) => {
    if (dir === 'left' || dir === 'right') {
      const idx = GENERATION_OPTIONS.findIndex((g) => g.id === settings.gen);
      const step = dir === 'right' ? 1 : -1;
      const next = GENERATION_OPTIONS[(idx + step + GENERATION_OPTIONS.length) % GENERATION_OPTIONS.length];
      updateSettings({ gen: next.id });
    } else {
      const idx = MODES.findIndex((m) => m.id === settings.mode);
      updateSettings({ mode: MODES[(idx + 1) % MODES.length].id });
    }
  };

  const moveCursor = (dir) => {
    audio.play('menuSelect');
    setCursor((c) => (dir === 'left' || dir === 'right' ? c ^ 1 : c ^ 2));
  };

  const handleButton = (name) => {
    switch (name) {
      case 'a':
      case 'start':
        if (phase === 'players') playGame();
        else if (phase === 'menu' || phase === 'results') startGame();
        else if (phase === 'revealed') nextPokemon();
        else if (phase === 'error') loadRound(settings.gen);
        else if (name === 'a' && phase === 'guessing' && settings.mode === 'choice') pickChoice(round.choices[cursor]);
        break;
      case 'b':
      case 'power':
        if (phase === 'menu') changeUser();
        else if (phase === 'leaderboard') closeLeaderboard();
        else if (phase === 'addPlayer') changeUser();
        else if (phase !== 'players') goMenu();
        break;
      case 'x':
      case 'y':
        if (phase === 'revealed') playCry(round?.pokemon);
        break;
      case 'select':
        toggleMute();
        break;
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        if (phase === 'players') {
          const idx = players.findIndex((p) => p.id === currentId);
          moveList(name, players.length, idx, (i) => pickPlayer(players[i].id));
        } else if (phase === 'leaderboard') {
          if (name === 'left' || name === 'right') sortLeaderboard(lbSort === 'total' ? 'high' : 'total');
          else
            moveList(name, ranked.length, lbCursor, (i) => {
              audio.play('menuSelect');
              setLbCursor(i);
            });
        } else if (phase === 'menu') moveMenu(name);
        else if (phase === 'guessing' && settings.mode === 'choice') moveCursor(name);
        break;
      default:
    }
  };

  const handlerRef = useRef(handleButton);
  handlerRef.current = handleButton;

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const target = e.target;
      const typing = isTypingTarget(target);
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

      if (e.key === 'Escape') {
        e.preventDefault();
        handlerRef.current('b');
      } else if (typing) {
        // Let the text field own every other key.
      } else if (map[e.key]) {
        e.preventDefault();
        handlerRef.current(map[e.key]);
      } else if (e.key === 'Enter') {
        // Focused buttons already activate natively on Enter.
        if (target?.tagName === 'BUTTON') return;
        e.preventDefault();
        handlerRef.current('a');
      } else if (e.key === 'm' || e.key === 'M') {
        handlerRef.current('select');
      } else if (e.key === 'c' || e.key === 'C') {
        handlerRef.current('x');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- Render ---------- */

  return (
    <main className="stage">
      <div className="ds-fit" style={{ width: DS_WIDTH * scale, height: DS_HEIGHT * scale }}>
        <div className="ds-scaler" style={{ transform: `scale(${scale})` }}>
          <DSConsole
            shakeKey={shakeKey}
            color={dsColor}
            onButton={handleButton}
            top={
              <TopScreen
                phase={phase}
                round={round}
                statsPlayer={phase === 'results' ? currentPlayer : ranked[lbCursor]}
                statsBadge={phase === 'results' && lastResult?.newHigh ? 'NEW BEST!' : ranked[lbCursor]?.id === currentId ? 'YOU' : null}
              />
            }
            bottom={
              <BottomScreen
                phase={phase}
                settings={settings}
                round={round}
                stats={stats}
                muted={muted}
                cryBlocked={cryBlocked}
                error={error}
                cursor={cursor}
                onSettings={updateSettings}
                onStart={startGame}
                trainers={{
                  players,
                  currentId,
                  currentName: currentPlayer?.name ?? '',
                  ranked,
                  sort: lbSort,
                  lbCursor,
                  lastResult,
                  onSelect: pickPlayer,
                  onPlay: playGame,
                  onAdd: openAddPlayer,
                  onSave: savePlayer,
                  onCancelAdd: changeUser,
                  onChangeUser: changeUser,
                  onLeaderboard: openLeaderboard,
                  onCloseLeaderboard: closeLeaderboard,
                  onSort: sortLeaderboard,
                  onLbCursor: (i) => {
                    if (i !== lbCursor) audio.play('menuSelect');
                    setLbCursor(i);
                  },
                }}
                onToggleMute={toggleMute}
                onPick={pickChoice}
                onCursor={setCursor}
                onTypeGuess={typeGuess}
                onNext={nextPokemon}
                onMenu={goMenu}
                onCry={() => playCry(round?.pokemon)}
                onRetry={() => loadRound(settings.gen)}
              />
            }
          />
        </div>
      </div>
      <ColorPicker value={dsColor} onChange={changeColor} />
      <p className="stage__keys">
        <kbd>Enter</kbd> A <kbd>Esc</kbd> B <kbd>Arrows</kbd> D-pad <kbd>C</kbd> cry <kbd>M</kbd> sound
      </p>
    </main>
  );
}
