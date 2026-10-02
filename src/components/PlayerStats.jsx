import { accuracy } from '../utils/playerStorage.js';

/** Top-screen trainer card: one trainer's lifetime stats (leaderboard + results). */
export default function PlayerStats({ player, badge }) {
  if (!player) {
    return (
      <div className="trainer-card">
        <div className="trainer-card__panel trainer-card__panel--empty">
          <p>No Trainers yet</p>
        </div>
      </div>
    );
  }

  const rows = [
    ['Total Score', player.totalScore],
    ['High Score', player.highScore],
    ['Games Played', player.gamesPlayed],
    ['Correct', player.correctAnswers],
    ['Accuracy', `${accuracy(player)}%`],
    ['Best Streak', player.bestStreak],
  ];

  return (
    <div className="trainer-card">
      <div className="trainer-card__panel">
        <div className="trainer-card__head">
          <span>TRAINER CARD</span>
          {badge && <span className="trainer-card__badge">{badge}</span>}
        </div>
        <p className="trainer-card__name">{player.name}</p>
        <dl className="stat-rows stat-rows--card">
          {rows.map(([label, value]) => (
            <div key={label} className="stat-rows__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
