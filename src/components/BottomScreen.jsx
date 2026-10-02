import StartMenu from './StartMenu.jsx';
import ScoreBar from './ScoreBar.jsx';
import MultipleChoice from './MultipleChoice.jsx';
import TypeAnswer from './TypeAnswer.jsx';
import RevealScreen from './RevealScreen.jsx';
import BottomBar from './BottomBar.jsx';
import PlayerSelect from './PlayerSelect.jsx';
import AddPlayer from './AddPlayer.jsx';
import Leaderboard from './Leaderboard.jsx';
import ResultsScreen from './ResultsScreen.jsx';
import { SESSION_LENGTH } from '../utils/gameLogic.js';

export default function BottomScreen(props) {
  const { phase, settings, round, stats, muted, cryBlocked, error, cursor } = props;
  const { onSettings, onStart, onToggleMute, onPick, onCursor, onTypeGuess, onNext, onMenu, onCry, onRetry } = props;
  const { trainers } = props;

  // Full-screen menus (no score bar / bottom bar).
  let menu = null;
  if (phase === 'players') {
    menu = (
      <PlayerSelect
        players={trainers.players}
        currentId={trainers.currentId}
        onSelect={trainers.onSelect}
        onPlay={trainers.onPlay}
        onLeaderboard={trainers.onLeaderboard}
        onAdd={trainers.onAdd}
        muted={muted}
        onToggleMute={onToggleMute}
      />
    );
  } else if (phase === 'addPlayer') {
    menu = <AddPlayer onSave={trainers.onSave} onCancel={trainers.onCancelAdd} />;
  } else if (phase === 'leaderboard') {
    menu = (
      <Leaderboard
        ranked={trainers.ranked}
        sort={trainers.sort}
        cursor={trainers.lbCursor}
        currentId={trainers.currentId}
        onSort={trainers.onSort}
        onCursor={trainers.onLbCursor}
        onBack={trainers.onCloseLeaderboard}
      />
    );
  } else if (phase === 'results') {
    menu = (
      <ResultsScreen
        result={trainers.lastResult}
        onPlayAgain={onStart}
        onLeaderboard={trainers.onLeaderboard}
        onMenu={onMenu}
      />
    );
  } else if (phase === 'menu') {
    menu = (
      <StartMenu
        settings={settings}
        onChange={onSettings}
        onStart={onStart}
        trainerName={trainers.currentName}
        onChangeUser={trainers.onChangeUser}
        muted={muted}
        onToggleMute={onToggleMute}
      />
    );
  }
  if (menu) {
    return (
      <div className="bottom-screen screen-enter" key={phase}>
        {menu}
      </div>
    );
  }

  const bar = (
    <BottomBar
      onCry={onCry}
      cryAvailable={Boolean(round?.pokemon?.cry) && phase === 'revealed'}
      cryBlocked={cryBlocked}
      onMenu={onMenu}
      muted={muted}
      onToggleMute={onToggleMute}
    />
  );

  let body;
  if (phase === 'loading') {
    body = (
      <div className="textbox status-box">
        <span className="pokeball-icon pokeball-icon--spin" />
        <p>Something is rustling in the tall grass...</p>
      </div>
    );
  } else if (phase === 'error') {
    body = (
      <div className="status-error">
        <div className="textbox status-box">
          <p>Couldn't reach PokéAPI.</p>
          <p className="status-box__detail">{error} — check your connection and try again.</p>
        </div>
        <button className="move-btn move-btn--yellow move-btn--next" onClick={onRetry}>
          <span className="move-btn__face">
            <span className="move-btn__name">TRY AGAIN</span>
          </span>
        </button>
      </div>
    );
  } else if (phase === 'revealed') {
    body = (
      <RevealScreen
        pokemon={round.pokemon}
        outcome={round.outcome}
        points={round.points}
        onNext={onNext}
        nextLabel={stats.attempted >= SESSION_LENGTH ? 'SEE RESULTS' : 'NEXT POKÉMON'}
      />
    );
  } else if (settings.mode === 'type') {
    body = (
      <TypeAnswer
        roundId={round.pokemon.id}
        attemptsLeft={round.attemptsLeft}
        wrongGuesses={round.wrongGuesses}
        hint={round.hint}
        locked={round.attemptsLeft <= 0}
        onGuess={onTypeGuess}
      />
    );
  } else {
    body = (
      <MultipleChoice
        choices={round.choices}
        wrongIds={round.wrongIds}
        cursor={cursor}
        locked={round.attemptsLeft <= 0}
        onPick={onPick}
        onCursor={onCursor}
      />
    );
  }

  return (
    <div className="bottom-screen">
      <ScoreBar
        stats={stats}
        question={Math.min(stats.attempted + (phase === 'revealed' ? 0 : 1), SESSION_LENGTH)}
        attemptsLeft={phase === 'guessing' ? round.attemptsLeft : null}
      />
      <div className="bottom-screen__body screen-enter" key={`${phase}-${round?.pokemon?.id ?? 'x'}`}>
        {body}
      </div>
      {bar}
    </div>
  );
}
