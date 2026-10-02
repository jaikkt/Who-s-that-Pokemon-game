import TitleScreen from './TitleScreen.jsx';
import WhosThatPokemon from './WhosThatPokemon.jsx';
import PlayerStats from './PlayerStats.jsx';

export default function TopScreen({ phase, round, statsPlayer, statsBadge }) {
  if (phase === 'players') return <TitleScreen subtitle="Choose your Trainer" prompt={null} />;
  if (phase === 'addPlayer') return <TitleScreen subtitle="A new Trainer appears!" prompt={null} />;
  if (phase === 'menu') return <TitleScreen />;
  if (phase === 'leaderboard' || phase === 'results') return <PlayerStats player={statsPlayer} badge={statsBadge} />;
  return (
    <WhosThatPokemon
      pokemon={phase === 'loading' || phase === 'error' ? null : round?.pokemon}
      revealed={phase === 'revealed'}
      loading={phase === 'loading'}
    />
  );
}
