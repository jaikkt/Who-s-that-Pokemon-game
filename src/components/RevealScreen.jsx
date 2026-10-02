import { useEffect, useRef } from 'react';

const RESULT_COPY = {
  2: 'Got it first try!',
  1: 'Got it on the second try.',
  0: 'Out of tries this time.',
};

export default function RevealScreen({ pokemon, outcome, points, onNext, nextLabel = 'NEXT POKÉMON' }) {
  const nextRef = useRef(null);
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, []);

  const no = String(pokemon.id).padStart(4, '0');

  return (
    <div className="reveal">
      <div className="textbox reveal__box">
        <p className="reveal__name">It's {pokemon.name}!</p>
        <p className={`reveal__result ${outcome === 'correct' ? 'is-good' : 'is-bad'}`}>
          {RESULT_COPY[points]} <b>+{points}</b>
        </p>
        <div className="reveal__info">
          <span>No.{no}</span>
          {pokemon.generation && <span>{pokemon.generation.region}</span>}
          <span className="reveal__types">
            {pokemon.types.map((t) => (
              <span key={t} className={`type-chip type-chip--${t}`}>
                {t.slice(0, 6).toUpperCase()}
              </span>
            ))}
          </span>
        </div>
      </div>
      <button ref={nextRef} className="move-btn move-btn--yellow move-btn--next" onClick={onNext}>
        <span className="move-btn__face">
          <span className="move-btn__name">{nextLabel}</span>
        </span>
      </button>
    </div>
  );
}
