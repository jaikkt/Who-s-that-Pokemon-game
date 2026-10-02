import { useEffect, useRef } from 'react';

const SORTS = [
  { id: 'total', label: 'TOTAL' },
  { id: 'high', label: 'HIGH' },
];

/** TRAINER RANKINGS. The cursor row's full stats show on the top screen (PlayerStats). */
export default function Leaderboard({ ranked, sort, cursor, currentId, onSort, onCursor, onBack }) {
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.querySelector('.is-cursor')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  return (
    <div className="menu">
      <div className="menu__header">
        <span className="pokeball-icon" />
        <span className="menu__heading">TRAINER RANKINGS</span>
        <span className="seg" role="radiogroup" aria-label="Rank by">
          {SORTS.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={sort === s.id}
              className={`seg__btn ${sort === s.id ? 'is-selected' : ''}`}
              onClick={() => onSort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </span>
      </div>

      <div className="dp-list dp-list--ranks" ref={listRef} role="listbox" aria-label="Rankings">
        {ranked.length === 0 ? (
          <p className="dp-list__empty">No Trainers yet.</p>
        ) : (
          ranked.map((p, i) => (
            <button
              key={p.id}
              role="option"
              aria-selected={i === cursor}
              className={`dp-list__row ${i === cursor ? 'is-cursor' : ''} ${i < 3 ? `is-rank-${i + 1}` : ''}`}
              onClick={() => onCursor(i)}
            >
              <span className="dp-list__rank">{i + 1}.</span>
              <span className="dp-list__name">
                {p.name}
                {p.id === currentId && <span className="dp-list__star" aria-label="(you)"> ★</span>}
              </span>
              <span className="dp-list__value">{sort === 'high' ? p.highScore : p.totalScore}</span>
            </button>
          ))
        )}
      </div>

      <button className="bar-btn bar-btn--back" onClick={onBack}>
        BACK
      </button>
    </div>
  );
}
