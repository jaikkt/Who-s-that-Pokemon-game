const ACCENTS = ['yellow', 'lavender', 'pink', 'blue'];

export default function MultipleChoice({ choices, wrongIds, cursor, locked, onPick, onCursor }) {
  return (
    <div className="choices">
      {choices.map((choice, i) => {
        const isWrong = wrongIds.includes(choice.id);
        return (
          <button
            key={choice.id}
            className={`move-btn move-btn--${ACCENTS[i % ACCENTS.length]} ${isWrong ? 'is-wrong' : ''} ${
              cursor === i && !isWrong ? 'is-cursor' : ''
            }`}
            disabled={isWrong || locked}
            onClick={() => onPick(choice)}
            onPointerEnter={() => onCursor(i)}
          >
            <span className="move-btn__face">
              <span className="move-btn__name">{choice.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
