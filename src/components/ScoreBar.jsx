import { MAX_ATTEMPTS, SESSION_LENGTH, pad2 } from '../utils/gameLogic.js';

export default function ScoreBar({ stats, question, attemptsLeft }) {
  return (
    <div className="score-bar">
      <span className="score-bar__item">
        Q <b>{question}/{SESSION_LENGTH}</b>
      </span>
      <span className="score-bar__item">
        SCORE <b>{pad2(stats.score)}</b>
      </span>
      <span className="score-bar__item">
        STREAK <b>{stats.streak}</b>
      </span>
      <span className="score-bar__item score-bar__item--muted">
        {stats.correct}/{stats.attempted}
      </span>
      {attemptsLeft != null && (
        <span className="score-bar__attempts" aria-label={`${attemptsLeft} attempts left`}>
          {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
            <span key={i} className={`pokeball-icon ${i < attemptsLeft ? '' : 'is-spent'}`} />
          ))}
        </span>
      )}
    </div>
  );
}
