# Who's That Pokémon? — DS edition

A Diamond/Pearl-styled guessing game running inside a recreated Nintendo DS.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
```

## Controls
| Action | Mouse / touch | Keyboard | DS button |
| --- | --- | --- | --- |
| Confirm / start / next | tap the button | Enter | A, START |
| Back to menu | MENU | Esc | B, POWER |
| Move answer cursor, change menu options | — | Arrow keys | D-pad |
| Replay cry | ♪ button | C | X, Y |
| Sound on/off | speaker button | M | SELECT |

## Project map
```
src/
  App.jsx                    game state machine, input, DS scaling
  config/generationRanges.js generation ID ranges (append Gen 10 here)
  utils/pokemonApi.js        PokéAPI fetches + caching + name formatting
  utils/gameLogic.js         round prep, answer checking, scoring rules
  utils/audioManager.js      cries + replaceable sound effects
  components/
    DSConsole.jsx            hardware shell (fixed 980×1000 canvas)
    TopScreen.jsx            → TitleScreen / WhosThatPokemon
    BottomScreen.jsx         → StartMenu / MultipleChoice / TypeAnswer / RevealScreen
    ScoreBar.jsx, BottomBar.jsx
  styles/                    base, ds, top-screen, bottom-screen
```

## Swapping placeholders
- **Sound effects:** put files in `public/sounds/` and set paths in `SOUND_FILES` (`audioManager.js`). `null` = built-in chiptune synth.
- **Display font:** a locally installed "Pokemon Solid" font is used automatically for headline text; to bundle one, add a `url()` to the `@font-face` in `styles/base.css`.
- **Scoring / attempts:** `MAX_ATTEMPTS` and `POINTS_BY_ATTEMPT` in `gameLogic.js`.
