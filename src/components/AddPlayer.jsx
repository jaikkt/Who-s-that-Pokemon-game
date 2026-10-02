import { useState } from 'react';
import { NAME_MAX } from '../utils/playerStorage.js';
import DSKeyboard from './DSKeyboard.jsx';

/** TRAINER NAME entry. onSave returns an error message, or nothing on success. */
export default function AddPlayer({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(0);

  const submit = () => {
    const err = onSave(name);
    if (err) {
      setError(err);
      setFlash((f) => f + 1);
    }
  };

  return (
    <div className="menu">
      <div className="menu__header">
        <span className="pokeball-icon" />
        <span className="menu__heading">TRAINER NAME</span>
        <button className="menu__reset" onClick={onCancel}>
          cancel
        </button>
      </div>
      <div className="name-entry">
        <DSKeyboard
          value={name}
          onChange={(v) => {
            setName(v);
            setError('');
          }}
          onSubmit={submit}
          maxLength={NAME_MAX}
          status={error || `Your name? ${name.trim().length}/${NAME_MAX}`}
          statusBad={Boolean(error)}
          flashKey={flash}
        />
      </div>
    </div>
  );
}
