import { useMemo } from 'react';

const SCREEN_W = 480;
const SCREEN_H = 360;

/**
 * Builds the jagged "burst" edge as a clip-path polygon. The burst is centred left of
 * middle and reaches further left than right, matching the reference composition.
 */
function buildBurstPolygon() {
  const cx = SCREEN_W * 0.3;
  const cy = SCREEN_H * 0.5;
  const points = [];
  const spikes = 96;
  let seed = 7;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const base = 236 - 66 * Math.cos(angle);
    const r = i % 2 === 0 ? base + 10 + rand() * 22 : base - 8 - rand() * 12;
    const x = ((cx + Math.cos(angle) * r) / SCREEN_W) * 100;
    const y = ((cy + Math.sin(angle) * r) / SCREEN_H) * 100;
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  return `polygon(${points.join(', ')})`;
}

function titleSize(name) {
  const len = name.length;
  if (len <= 7) return 24;
  if (len <= 9) return 20;
  if (len <= 11) return 17;
  return 14;
}

export default function WhosThatPokemon({ pokemon, revealed, loading }) {
  const burstClip = useMemo(buildBurstPolygon, []);
  const upperName = pokemon?.name.toUpperCase() ?? '';

  return (
    <div className={`wtp ${revealed ? 'is-revealed' : ''}`}>
      <div className="wtp__red" />
      <div className="wtp__burst" style={{ clipPath: burstClip }}>
        <div className="wtp__rays" />
      </div>

      {pokemon && (
        <div className="wtp__mon" key={pokemon.id}>
          {pokemon.artwork ? (
            <img
              className="wtp__img"
              src={pokemon.artwork}
              alt={revealed ? pokemon.name : 'Mystery Pokémon silhouette'}
              draggable="false"
            />
          ) : (
            <div className="wtp__missing">?</div>
          )}
        </div>
      )}

      {revealed && <div className="wtp__flash" key={`flash-${pokemon?.id}`} />}

      <div className="wtp__question outline-text" aria-hidden="true">?</div>

      <div className="wtp__title outline-text" aria-live="polite">
        {revealed && pokemon ? (
          <span className="wtp__reveal-name" key={pokemon.id} style={{ fontSize: titleSize(pokemon.name) + 4 }}>
            <span className="wtp__its">IT'S</span>
            <span style={{ fontSize: titleSize(pokemon.name) }}>{upperName}!</span>
          </span>
        ) : (
          <>
            <span>WHO'S THAT</span>
            <span>POKÉMON?</span>
          </>
        )}
      </div>

      {loading && (
        <div className="wtp__loading">
          <span className="pokeball-icon pokeball-icon--spin" />
        </div>
      )}
    </div>
  );
}
