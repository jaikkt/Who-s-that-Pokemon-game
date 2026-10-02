function SpeakerIcon({ muted }) {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" shapeRendering="crispEdges">
      <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
      {muted ? (
        <path d="M11 5l4 6M15 5l-4 6" stroke="currentColor" strokeWidth="2" />
      ) : (
        <>
          <rect x="11" y="6" width="2" height="4" fill="currentColor" />
          <rect x="14" y="4" width="2" height="8" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

export function MuteButton({ muted, onToggle, small }) {
  return (
    <button
      className={`icon-btn ${small ? 'icon-btn--small' : ''} ${muted ? 'is-off' : ''}`}
      onClick={onToggle}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      aria-pressed={muted}
      title={muted ? 'Sound off (Select)' : 'Sound on (Select)'}
    >
      <SpeakerIcon muted={muted} />
    </button>
  );
}

export default function BottomBar({ onCry, cryAvailable, cryBlocked, onMenu, muted, onToggleMute }) {
  return (
    <div className="bottom-bar">
      <button
        className={`icon-btn icon-btn--cry ${cryBlocked ? 'is-attention' : ''}`}
        onClick={onCry}
        disabled={!cryAvailable || muted}
        aria-label="Play cry again"
        title={cryAvailable ? 'Play cry (X)' : 'Cry plays after the reveal'}
      >
        <span className="icon-btn__note">♪</span>
      </button>
      <button className="bar-btn bar-btn--menu" onClick={onMenu}>
        MENU
      </button>
      <MuteButton muted={muted} onToggle={onToggleMute} />
    </div>
  );
}
