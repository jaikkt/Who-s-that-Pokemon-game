import TitleScreen from './TitleScreen.jsx';
import WhosThatPokemon from './WhosThatPokemon.jsx';

export default function TopScreen({ phase, round }) {
  if (phase === 'menu') return <TitleScreen />;
  return (
    <WhosThatPokemon
      pokemon={phase === 'loading' || phase === 'error' ? null : round?.pokemon}
      revealed={phase === 'revealed'}
      loading={phase === 'loading'}
    />
  );
}
