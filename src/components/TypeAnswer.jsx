import { useEffect, useRef, useState } from 'react';
import { normalizeAnswer } from '../utils/gameLogic.js';

export default function TypeAnswer({ roundId, attemptsLeft, wrongGuesses, hint, locked, onGuess }) {
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const inputRef = useRef(null);

  // Fresh field for every Pokémon.
  useEffect(() => {
    setText('');
    setNotice('');
    inputRef.current?.focus();
  }, [roundId]);

  // After a wrong answer, keep focus and select the text so retyping is quick.
  useEffect(() => {
    if (wrongGuesses.length && !locked) {
      setNotice(`Not quite! ${attemptsLeft} try left.`);
      inputRef.current?.select();
    }
  }, [wrongGuesses.length, attemptsLeft, locked]);

  const submit = () => {
    if (locked) return;
    const guess = normalizeAnswer(text);
    if (!guess) {
      setNotice('Type a name first.');
      return;
    }
    if (wrongGuesses.includes(guess)) {
      setNotice('You already tried that one.');
      inputRef.current?.select();
      return;
    }
    onGuess(text);
  };

  return (
    <div className="type-answer">
      <label className="textbox type-answer__box">
        <span className="type-answer__prompt">Who's that Pokémon?</span>
        <input
          ref={inputRef}
          className="type-answer__input"
          value={text}
          maxLength={24}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={locked}
          placeholder="Name..."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
        <span className="type-answer__meta">
          {hint ? <span className="type-answer__hint">Hint: {hint}</span> : <span />}
          <span className={`type-answer__notice ${wrongGuesses.length ? 'is-bad' : ''}`}>{notice}</span>
        </span>
      </label>
      <button className="move-btn move-btn--yellow move-btn--submit" onClick={submit} disabled={locked}>
        <span className="move-btn__face">
          <span className="move-btn__name">SUBMIT</span>
        </span>
      </button>
    </div>
  );
}
