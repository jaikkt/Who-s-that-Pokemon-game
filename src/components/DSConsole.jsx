import { useEffect, useRef } from 'react';

/**
 * The physical DS, built at a fixed 980×1000 design size (the reference proportions).
 * App scales the whole thing uniformly, so nothing inside ever reflows or stretches.
 * Both screens are 480×360 — a clean 4:3 like the real hardware.
 */
export default function DSConsole({ top, bottom, shakeKey, onButton, color }) {
  const screensRef = useRef([]);

  // Retrigger the shake animation each time shakeKey changes.
  useEffect(() => {
    if (!shakeKey) return;
    screensRef.current.forEach((el) => {
      if (!el) return;
      el.classList.remove('is-shaking');
      void el.offsetWidth;
      el.classList.add('is-shaking');
    });
  }, [shakeKey]);

  const press = (name) => (e) => {
    e.preventDefault();
    onButton(name);
  };

  return (
    <div className="ds" data-color={color} role="application" aria-label="Nintendo DS">
      {/* ---------- Upper lid ---------- */}
      <div className="ds-lid ds-lid--top" />
      <div className="ds-bezel ds-bezel--top" />
      {[
        [118, 50],
        [848, 50],
        [118, 412],
        [848, 412],
      ].map(([x, y]) => (
        <span key={`${x}-${y}`} className="ds-corner-mark" style={{ left: x, top: y }} />
      ))}
      <span className="ds-speaker" style={{ left: 108, top: 342 }} />
      <span className="ds-speaker" style={{ left: 842, top: 342 }} />
      <StatusIcons />

      <div className="ds-screen-frame ds-screen-frame--top">
        <div className="ds-screen" ref={(el) => (screensRef.current[0] = el)}>
          {top}
        </div>
      </div>

      {/* ---------- Hinge ---------- */}
      <div className="ds-hinge ds-hinge--left">
        <span className="ds-grill" />
        <span className="ds-grill" />
        <span className="ds-grill ds-grill--power" aria-hidden="true" />
      </div>
      <div className="ds-hinge ds-hinge--center">
        <span className="ds-camera" />
        <span className="ds-mic">MIC</span>
      </div>
      <div className="ds-hinge ds-hinge--right" />

      {/* ---------- Lower body ---------- */}
      <div className="ds-lid ds-lid--bottom" />
      <span className="ds-volume" />
      <div className="ds-bezel ds-bezel--bottom" />
      <div className="ds-screen-frame ds-screen-frame--bottom">
        <div className="ds-screen ds-screen--touch" ref={(el) => (screensRef.current[1] = el)}>
          {bottom}
        </div>
      </div>

      {/* D-pad */}
      <div className="ds-dpad">
        <div className="ds-dpad__cross">
          <div className="ds-dpad__bar ds-dpad__bar--h" />
          <div className="ds-dpad__bar ds-dpad__bar--v" />
        </div>
        <button className="ds-dpad__hit ds-dpad__hit--up" aria-label="D-pad up" onPointerDown={press('up')} />
        <button className="ds-dpad__hit ds-dpad__hit--down" aria-label="D-pad down" onPointerDown={press('down')} />
        <button className="ds-dpad__hit ds-dpad__hit--left" aria-label="D-pad left" onPointerDown={press('left')} />
        <button className="ds-dpad__hit ds-dpad__hit--right" aria-label="D-pad right" onPointerDown={press('right')} />
        <span className="ds-dpad__mark ds-dpad__mark--up" />
        <span className="ds-dpad__mark ds-dpad__mark--down" />
        <span className="ds-dpad__mark ds-dpad__mark--left" />
        <span className="ds-dpad__mark ds-dpad__mark--right" />
      </div>

      {/* Face buttons */}
      {[
        ['x', 865, 630],
        ['y', 812, 684],
        ['a', 918, 684],
        ['b', 865, 738],
      ].map(([name, x, y]) => (
        <button
          key={name}
          className="ds-face-btn"
          style={{ left: x - 26, top: y - 26 }}
          aria-label={`${name.toUpperCase()} button`}
          onPointerDown={press(name)}
        >
          {name.toUpperCase()}
        </button>
      ))}

      {/* Start / Select */}
      <button className="ds-small-btn" style={{ left: 783, top: 854 }} aria-label="Start" onPointerDown={press('start')} />
      <span className="ds-label" style={{ left: 818, top: 861 }}>START</span>
      <button className="ds-small-btn" style={{ left: 783, top: 908 }} aria-label="Select" onPointerDown={press('select')} />
      <span className="ds-label" style={{ left: 818, top: 915 }}>SELECT</span>

      {/* Power */}
      <span className="ds-label" style={{ left: 104, top: 915 }}>POWER</span>
      <button className="ds-power" aria-label="Power — back to menu" onPointerDown={press('power')}>
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <path d="M10 2v7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M5.6 5.2a6.5 6.5 0 1 0 8.8 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
      </button>
    </div>
  );
}

function StatusIcons() {
  return (
    <svg className="ds-status" viewBox="0 0 66 20" width="66" height="20" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9a10 10 0 0 1 14 0" />
        <path d="M6 12.5a5.5 5.5 0 0 1 8 0" />
      </g>
      <circle cx="10" cy="16" r="1.8" fill="currentColor" />
      <path d="M28 4h4v4h2v3l-3 3v4h-2v-4l-3-3V8h2z" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M54 3v6" />
        <path d="M49.5 6.2a6.3 6.3 0 1 0 9 0" />
      </g>
    </svg>
  );
}
