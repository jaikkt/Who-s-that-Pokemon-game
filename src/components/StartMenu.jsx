import { GENERATION_OPTIONS } from '../config/generationRanges.js';
import { MuteButton } from './BottomBar.jsx';

export const MODES = [
  { id: 'choice', label: 'Multiple Choice', accent: 'lavender' },
  { id: 'type', label: 'Type Answer', accent: 'pink' },
];

export default function StartMenu({ settings, onChange, onStart, trainerName, onChangeUser, muted, onToggleMute }) {
  return (
    <div className="menu">
      <div className="menu__header">
        <span className="pokeball-icon" />
        <span className="menu__heading">Game setup</span>
        <button className="menu__reset" onClick={onChangeUser} title="Change user (B)">
          {trainerName} · change user
        </button>
        <MuteButton muted={muted} onToggle={onToggleMute} small />
      </div>

      <p className="menu__label">Generation</p>
      <div className="menu__gens" role="radiogroup" aria-label="Generation">
        {GENERATION_OPTIONS.map((gen) => (
          <button
            key={gen.id}
            role="radio"
            aria-checked={settings.gen === gen.id}
            title={gen.region}
            className={`chip-btn ${settings.gen === gen.id ? 'is-selected' : ''}`}
            onClick={() => onChange({ gen: gen.id })}
          >
            {gen.id === 'all' ? 'ALL' : gen.label.replace('Gen ', '')}
          </button>
        ))}
      </div>

      <p className="menu__label">Game mode</p>
      <div className="menu__modes" role="radiogroup" aria-label="Game mode">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            role="radio"
            aria-checked={settings.mode === mode.id}
            className={`move-btn move-btn--${mode.accent} move-btn--compact ${
              settings.mode === mode.id ? 'is-selected' : 'is-unselected'
            }`}
            onClick={() => onChange({ mode: mode.id })}
          >
            <span className="move-btn__face">
              <span className="move-btn__name">{mode.label}</span>
            </span>
          </button>
        ))}
      </div>

      <button className="bar-btn bar-btn--start" onClick={onStart}>
        START GAME
      </button>
    </div>
  );
}
