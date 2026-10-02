import { useEffect, useState } from 'react';
import { normalizeAnswer } from '../utils/gameLogic.js';
import DSKeyboard from './DSKeyboard.jsx';

const FIELD_SLOTS = 12; // fits every Pokémon name once punctuation is optional

export default function TypeAnswer({ roundId, attemptsLeft, wrongGuesses, hint, locked, onGuess }) {
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');

  // Fresh field for every Pokémon.
  useEffect(() => {
    setText('');
    setNotice('');
  }, [roundId]);

  // After a wrong answer, clear the field so the next try starts straight away.
  useEffect(() => {
    if (wrongGuesses.length && !locked) {
      setText('');
      setNotice(`Not quite! ${attemptsLeft} try left.`);
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
      return;
    }
    onGuess(text);
  };

  return (
    <div className="type-answer">
      <DSKeyboard
        value={text}
        onChange={setText}
        onSubmit={submit}
        maxLength={Math.max(FIELD_SLOTS, hint?.length ?? 0)}
        ghost={hint ?? ''}
        status={notice || "Who's that Pokémon?"}
        statusBad={Boolean(notice)}
        flashKey={wrongGuesses.length}
        disabled={locked}
      />
    </div>
  );
}
