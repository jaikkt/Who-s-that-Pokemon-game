import { useEffect, useRef } from 'react';

function headline(correct, total) {
  if (correct >= total * 0.8) return 'GREAT JOB!';
  if (correct >= total * 0.5) return 'NICE WORK!';
  return 'KEEP TRAINING!';
}

/** End-of-game summary. PLAY AGAIN is the main action. */
export default function ResultsScreen({ result, onPlayAgain, onLeaderboard, onMenu }) {
  const againRef = useRef(null);
  useEffect(() => {
    againRef.current?.focus({ preventScroll: true });
  }, []);

  const rows = [
    ['SCORE', result.score],
    ['CORRECT', `${result.correct}/${result.attempted}`],
    ['BEST STREAK', result.bestStreak],
  ];

  return (
    <div className="menu">
      <div className="menu__header">
        <span className="pokeball-icon" />
        <span className="menu__heading">Game complete</span>
      </div>

      <div className="textbox results">
        <p className="results__title">{headline(result.correct, result.attempted)}</p>
        <dl className="stat-rows">
          {rows.map(([label, value]) => (
            <div key={label} className="stat-rows__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {result.newHigh && <p className="results__badge">NEW HIGH SCORE!</p>}
      </div>

      <button ref={againRef} className="bar-btn bar-btn--start" onClick={onPlayAgain}>
        PLAY AGAIN
      </button>
      <div className="menu__secondary">
        <button className="chip-btn" onClick={onLeaderboard}>
          LEADERBOARD
        </button>
        <button className="chip-btn" onClick={onMenu}>
          MAIN MENU
        </button>
      </div>
    </div>
  );
}
