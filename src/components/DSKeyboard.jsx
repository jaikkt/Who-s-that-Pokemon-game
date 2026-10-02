import { useEffect, useRef, useState } from 'react';

const ROWS = ['abcdefghij', 'klmnopqrst', 'uvwxyz', '0123456789'];

/**
 * Diamond/Pearl-style name-entry keyboard: a slotted answer field with BACK / OK, then a
 * touch keyboard. The physical keyboard works too (letters, digits, space, Backspace, Enter).
 * Keys it handles are stopped in the capture phase so App's shortcuts (M, C, Enter) don't fire.
 *
 * ghost: optional hint shown in empty slots (e.g. "P______" after a wrong guess).
 * flashKey: change it to flash the field red (wrong answer / invalid name).
 */
export default function DSKeyboard({ value, onChange, onSubmit, maxLength = 12, ghost = '', status, statusBad, flashKey = 0, disabled }) {
  const [pressed, setPressed] = useState(null);
  const pressTimer = useRef(null);
  const latest = useRef(null);
  latest.current = { value, onChange, onSubmit, maxLength, disabled };

  const blink = (key) => {
    setPressed(key);
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressed(null), 110);
  };

  const type = (ch) => {
    const { value: v, onChange: change, maxLength: max, disabled: off } = latest.current;
    if (off || v.length >= max) return;
    if (ch === ' ' && (!v || v.endsWith(' '))) return;
    change(v + ch);
  };

  const back = () => {
    const { value: v, onChange: change, disabled: off } = latest.current;
    if (!off && v) change(v.slice(0, -1));
  };

  const ok = () => {
    if (!latest.current.disabled) latest.current.onSubmit();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (latest.current.disabled || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (/^[a-z0-9]$/i.test(k)) {
        type(k.toLowerCase());
        blink(k.toLowerCase());
      } else if (k === ' ') {
        type(' ');
        blink('space');
      } else if (k === 'Backspace') {
        back();
        blink('back');
      } else if (k === 'Enter') {
        if (!e.repeat) ok();
        blink('ok');
      } else {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      clearTimeout(pressTimer.current);
    };
  }, []);

  const keyClass = (id, extra = '') => `ds-kb__key ${extra} ${pressed === id ? 'is-pressed' : ''}`;

  return (
    <div className={`ds-kb ${disabled ? 'is-disabled' : ''}`}>
      <div className="ds-kb__top">
        <div
          key={flashKey}
          className={`ds-kb__field ${flashKey ? 'is-flash' : ''}`}
          role="textbox"
          aria-readonly="true"
          aria-label={`Entered: ${value || 'nothing yet'}`}
        >
          {Array.from({ length: maxLength }, (_, i) => {
            const ch = value[i];
            const hint = !ch && ghost[i] && ghost[i] !== '_' && ghost[i] !== ' ' ? ghost[i] : '';
            return (
              <span
                key={i}
                className={`ds-kb__slot ${i === value.length && !disabled ? 'is-caret' : ''} ${hint ? 'is-ghost' : ''}`}
              >
                {(ch ?? hint).toUpperCase()}
              </span>
            );
          })}
        </div>
        <button className={keyClass('back', 'ds-kb__fn')} onClick={back} disabled={disabled}>
          BACK
        </button>
        <button className={keyClass('ok', 'ds-kb__fn ds-kb__fn--ok')} onClick={ok} disabled={disabled}>
          OK
        </button>
      </div>

      <p className={`ds-kb__status ${statusBad ? 'is-bad' : ''}`} aria-live="polite">
        {status}
      </p>

      <div className="ds-kb__keys">
        {ROWS.map((row) => (
          <div className="ds-kb__row" key={row}>
            {[...row].map((ch) => (
              <button key={ch} className={keyClass(ch)} onClick={() => type(ch)} disabled={disabled} aria-label={ch}>
                {ch}
              </button>
            ))}
            {row === 'uvwxyz' && (
              <button className={keyClass('space', 'ds-kb__key--space')} onClick={() => type(' ')} disabled={disabled}>
                SPACE
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
