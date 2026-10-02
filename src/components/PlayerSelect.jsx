import { useEffect, useRef } from 'react';
import { MuteButton } from './BottomBar.jsx';

/** Save-file style trainer picker: list, then PLAY GAME, then LEADERBOARD / + ADD USER. */
export default function PlayerSelect({ players, currentId, onSelect, onPlay, onLeaderboard, onAdd, muted, onToggleMute }) {
  const listRef = useRef(null);

  // Keep the cursor row visible when the D-pad moves it.
  useEffect(() => {
    listRef.current?.querySelector('.is-cursor')?.scrollIntoView({ block: 'nearest' });
  }, [currentId]);

  return (
    <div className="menu">
      <div className="menu__header">
        <span className="pokeball-icon" />
        <span className="menu__heading">Choose your Trainer</span>
        <MuteButton muted={muted} onToggle={onToggleMute} small />
      </div>

      <div className="dp-list" ref={listRef} role="listbox" aria-label="Trainers">
        {players.length === 0 ? (
          <p className="dp-list__empty">No Trainers yet. Press PLAY GAME to make one!</p>
        ) : (
          players.map((p) => (
            <button
              key={p.id}
              role="option"
              aria-selected={p.id === currentId}
              className={`dp-list__row ${p.id === currentId ? 'is-cursor' : ''}`}
              onClick={() => onSelect(p.id)}
              onDoubleClick={onPlay}
            >
              <span className="dp-list__name">{p.name}</span>
              <span className="dp-list__value">{p.totalScore} PTS</span>
            </button>
          ))
        )}
      </div>

      <button className="bar-btn bar-btn--start" onClick={onPlay}>
        PLAY GAME
      </button>
      <div className="menu__secondary">
        <button className="chip-btn" onClick={onLeaderboard}>
          LEADERBOARD
        </button>
        <button className="chip-btn" onClick={onAdd}>
          + ADD USER
        </button>
      </div>
    </div>
  );
}
