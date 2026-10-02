# Who's That Pokémon? — DS Edition: Project Documentation

This is a browser guessing game styled after Pokémon Diamond & Pearl and shown inside a recreated Nintendo DS. A random Pokémon from PokéAPI appears as a black silhouette while the "Who's that Pokémon?" clip plays, and the player gets two attempts to name it. Answers can be picked from four choices or typed on a Diamond & Pearl-style touch keyboard. Players pick a local Trainer profile, a game is 10 Pokémon, and each finished game is saved to that Trainer and shown on a leaderboard.

This document covers how to run the project, how the code is organised, how one round moves through the system, and how to change or extend each part.

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [How to play](#2-how-to-play)
3. [Tech stack](#3-tech-stack)
4. [Folder structure](#4-folder-structure)
5. [Architecture overview](#5-architecture-overview)
6. [Game state machine](#6-game-state-machine)
7. [The life of a round](#7-the-life-of-a-round)
8. [Data layer — `pokemonApi.js`](#8-data-layer--pokemonapijs)
9. [Game rules — `gameLogic.js`](#9-game-rules--gamelogicjs)
10. [Generation config — `generationRanges.js`](#10-generation-config--generationrangesjs)
11. [Audio — `audioManager.js`](#11-audio--audiomanagerjs)
12. [Components](#12-components)
13. [Input handling](#13-input-handling)
14. [The DS shell and scaling](#14-the-ds-shell-and-scaling)
15. [Styling system](#15-styling-system)
16. [Animations and timing](#16-animations-and-timing)
17. [Customisation guide](#17-customisation-guide)
18. [Known limitations](#18-known-limitations)
19. [Troubleshooting](#19-troubleshooting)
20. [Testing notes](#20-testing-notes)
21. [Ideas for future work](#21-ideas-for-future-work)

---

## 1. Quick start

You need Node.js 18 or newer.

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build into /dist
npm run preview   # serve the production build locally
```

The game needs an internet connection at runtime. It loads Pokémon data from `https://pokeapi.co`, artwork and cries from `raw.githubusercontent.com` (where PokéAPI hosts them), and the Press Start 2P font from Google Fonts.

To deploy, run `npm run build` and upload `/dist` to any static host (Vercel, Netlify, GitHub Pages and so on). There is no backend.

---

## 2. How to play

1. On the **Choose your Trainer** screen, pick your Trainer (or **+ ADD USER** to make one) and press **PLAY GAME**.
2. Pick a **generation** (All, or I–IX) and a **mode** (Multiple Choice or Type Answer), then press **START GAME**.
3. A silhouette slides onto the top screen and the "Who's that Pokémon?" clip plays. The Pokémon's cry is held back until the reveal so it can't give the answer away.
4. Answer on the bottom screen. You get **2 attempts**, shown as Poké Balls in the score bar.
5. When you answer correctly, or use up both attempts, the Pokémon is revealed with "IT'S [NAME]!".
6. Press **NEXT POKÉMON** to continue, or **MENU** to change settings (this abandons the current game).
7. After the 10th Pokémon, **SEE RESULTS** shows the game summary. The score is saved to your Trainer at that moment. From there: **PLAY AGAIN**, **LEADERBOARD** or **MAIN MENU**.

### Scoring

| Result | Points | Streak |
| --- | --- | --- |
| Correct on the first attempt | +2 | +1 |
| Correct on the second attempt | +1 | +1 |
| Both attempts wrong | +0 | resets to 0 |

### Controls

| Action | Mouse / touch | Keyboard | DS hardware button |
| --- | --- | --- | --- |
| Confirm, start, next Pokémon, retry | Tap the on-screen button | `Enter` | **A**, **START** |
| Pick the highlighted answer (Multiple Choice) | Tap the answer | `Enter` | **A** |
| Back to menu / back one screen | **MENU**, BACK, cancel | `Esc` | **B**, **POWER** |
| Choose a Trainer / leaderboard row | Tap the row | `↑` `↓` | D-pad up/down |
| Leaderboard TOTAL ⇄ HIGH | Tap the toggle | `←` `→` | D-pad left/right |
| Type a name (Type Answer, TRAINER NAME) | On-screen keys, BACK, OK | Letters, digits, space, `Backspace`, `Enter` | — |
| Move the answer cursor | Hover | Arrow keys | D-pad |
| Change generation (menu) | Tap a generation | `←` `→` | D-pad left/right |
| Change mode (menu) | Tap a mode | `↑` `↓` | D-pad up/down |
| Replay cry (after the reveal) | ♪ button | `C` | **X**, **Y** |
| Sound on/off | Speaker button | `M` | **SELECT** |

---

## 3. Tech stack

| Concern | Choice | Why |
| --- | --- | --- |
| UI | React 18 | Component structure as requested; simple state |
| Build | Vite 5 | Fast dev server, zero config |
| Styling | Plain CSS (4 files) | Exact control needed to match the DS / D&P look; no utility framework |
| Data | PokéAPI v2 (REST, no key) | Official artwork, cries and species list |
| Sound effects | Web Audio API synth | Works with no asset files; each sound can be swapped for a file |
| Font | Press Start 2P (Google Fonts) | Pixel UI type; optional local "Pokemon" font for headlines |

There are no runtime dependencies besides `react` and `react-dom`.

---

## 4. Folder structure

```
whos-that-pokemon/
├── index.html                  Page shell, favicon links, Google Fonts link, preconnects
├── package.json
├── vite.config.js
├── README.md                   Short run instructions
├── DOCUMENTATION.md            This file
├── favicon.png                 Source artwork for the icons (not served)
├── public/
│   ├── favicon-32.png          Browser-tab icon
│   ├── favicon-192.png         High-res / Android icon
│   ├── apple-touch-icon.png    iOS home-screen icon (180×180)
│   └── sounds/                 whos-that-pokemon.mp3 + replacement sound files
└── src/
    ├── main.jsx                React entry; imports the four stylesheets
    ├── App.jsx                 State machine, round lifecycle, input, scaling
    ├── config/
    │   └── generationRanges.js Generation → Pokédex ID ranges
    ├── utils/
    │   ├── pokemonApi.js       Fetching, caching, name formatting, image preload
    │   ├── gameLogic.js        Round prep, answer checks, hints, scoring, SESSION_LENGTH
    │   ├── playerStorage.js    Trainer profiles in localStorage, ranking
    │   └── audioManager.js     Cries, sound effects, mute
    ├── components/
    │   ├── DSConsole.jsx       The physical DS (fixed 980×1000 canvas)
    │   ├── TopScreen.jsx       Chooses what the top screen shows
    │   ├── TitleScreen.jsx     Start-menu top screen
    │   ├── WhosThatPokemon.jsx Silhouette / reveal top screen
    │   ├── BottomScreen.jsx    Chooses what the bottom screen shows
    │   ├── StartMenu.jsx       Generation + mode setup
    │   ├── ScoreBar.jsx        Score, streak, accuracy, attempts
    │   ├── MultipleChoice.jsx  2×2 D&P move-button grid
    │   ├── TypeAnswer.jsx      Typed-answer round (uses DSKeyboard)
    │   ├── DSKeyboard.jsx      D&P name-entry keyboard: slotted field, BACK / OK, keys
    │   ├── PlayerSelect.jsx    Choose your Trainer + PLAY GAME / LEADERBOARD / + ADD USER
    │   ├── AddPlayer.jsx       TRAINER NAME entry
    │   ├── Leaderboard.jsx     TRAINER RANKINGS, TOTAL | HIGH toggle
    │   ├── PlayerStats.jsx     Top-screen trainer card (lifetime stats)
    │   ├── ResultsScreen.jsx   End-of-game summary
    │   ├── RevealScreen.jsx    Result panel + NEXT POKÉMON
    │   ├── BottomBar.jsx       Cry / MENU / mute row (+ MuteButton)
    │   └── ColorPicker.jsx     DS colour swatches under the console (+ DS_COLORS)
    └── styles/
        ├── base.css            Fonts, colour tokens, page stage, shared bits
        ├── ds.css              Hardware shell
        ├── top-screen.css      Title screen + Who's That Pokémon
        └── bottom-screen.css   Menus, buttons, text boxes, score bar
```

---

## 5. Architecture overview

The code is split into three layers, and each one only talks to the layer below it.

```
┌──────────────────────────────────────────────────────────┐
│ Presentation (components/*)                              │
│ Pure-ish React components. Receive data + callbacks via  │
│ props. Hold only local UI state (e.g. the text field).   │
└───────────────▲──────────────────────────────────────────┘
                │ props / callbacks
┌───────────────┴──────────────────────────────────────────┐
│ Orchestration (App.jsx)                                  │
│ Owns game state, decides phase transitions, schedules    │
│ sounds/timers, maps buttons + keys to actions.           │
└───────────────▲──────────────────────────────────────────┘
                │ function calls
┌───────────────┴──────────────────────────────────────────┐
│ Logic & services (utils/*, config/*)                     │
│ No React. gameLogic = rules; pokemonApi = network +      │
│ cache; audioManager = sound; generationRanges = config.  │
└──────────────────────────────────────────────────────────┘
```

The layers follow a few rules:

- Components never call PokéAPI or the audio manager directly. They report what the user did, and `App.jsx` decides what happens next.
- The `utils/` files don't import React, so they can be unit-tested or reused elsewhere.
- Values that are tuning knobs (attempt count, points, generation ranges, sound files) each live in exactly one place.

---

## 6. Game state machine

`App.jsx` keeps a single `phase` string that decides what both screens render.

The game now starts on `players`. PLAY GAME goes to `menu` (or to `addPlayer` when there are no Trainers yet). The diagram below is the round loop inside a game. After the 10th reveal, NEXT becomes SEE RESULTS and goes to `results`. `leaderboard` can be opened from `players` or `results`, and BACK returns there.

```
            START GAME / A / Start
   ┌──────┐ ─────────────────────► ┌─────────┐   fetch ok    ┌──────────┐
   │ menu │                         │ loading │ ────────────► │ guessing │
   └──────┘ ◄───────────────────── └─────────┘               └────┬─────┘
      ▲          MENU / B / Esc         │ fetch failed            │ correct, or
      │          (from any phase)       ▼                         │ 2nd wrong answer
      │                            ┌───────┐                      ▼
      │                            │ error │               ┌──────────┐
      │                            └───┬───┘               │ revealed │
      │                       TRY AGAIN │                   └────┬─────┘
      │                                 └──► loading ◄───────────┘
      │                                                NEXT POKÉMON / A
      └─────────────────────────────────────────────────────────────────
```

| Phase | Top screen | Bottom screen |
| --- | --- | --- |
| `players` (start) | `TitleScreen` "Choose your Trainer" | `PlayerSelect` |
| `addPlayer` | `TitleScreen` "A new Trainer appears!" | `AddPlayer` (DSKeyboard) |
| `leaderboard` | `PlayerStats` for the cursor row | `Leaderboard` |
| `menu` | `TitleScreen` | `StartMenu` (header shows the Trainer + "change user") |
| `results` | `PlayerStats` for the current Trainer | `ResultsScreen` |
| `loading` | Burst background + spinning Poké Ball | Score bar + "Something is rustling…" |
| `guessing` | Silhouette, "?", "WHO'S THAT POKÉMON?" | Score bar + `MultipleChoice` or `TypeAnswer` + bottom bar |
| `revealed` | Full artwork + "IT'S [NAME]!" | Score bar + `RevealScreen` + bottom bar |
| `error` | Burst background | Error message + TRY AGAIN + bottom bar |

### State held in `App.jsx`

| State | Shape | Purpose |
| --- | --- | --- |
| `phase` | `'menu' \| 'loading' \| 'guessing' \| 'revealed' \| 'error'` | Which screen is active |
| `settings` | `{ gen: 'all' \| 1..9, mode: 'choice' \| 'type' }` | Menu selections |
| `round` | see below | The current Pokémon and attempt state |
| `stats` | `{ score, attempted, correct, streak, bestStreak }` | Session totals |
| `muted` | boolean | Mirrors `audio.muted` for the UI |
| `cryBlocked` | boolean | True when the browser refused to autoplay; makes ♪ flash |
| `error` | string | Message shown in the error phase |
| `cursor` | 0–3 | Highlighted answer for D-pad / keyboard play |
| `shakeKey` | number | Increments to retrigger the screen shake |

The `round` object:

```js
{
  genId,          // generation the round was drawn from
  pokemon,        // { id, slug, name, artwork, cry, generation, types }
  choices,        // [{ id, name }] × 4, shuffled (always built, used in choice mode)
  attemptsLeft,   // 2 → 1 → 0
  wrongIds,       // ids of disabled wrong choices (choice mode)
  wrongGuesses,   // normalised wrong typed answers (type mode)
  hint,           // e.g. "P______", set after the first wrong typed answer
  outcome,        // null | 'correct' | 'failed'
  points,         // 0 | 1 | 2, set on reveal
}
```

App.jsx also holds a few refs that aren't rendered:

- `recentIds`: the last 30 Pokémon shown, used to avoid repeats.
- `prefetched`: `{ genId, promise }` for the next round, loaded in the background.
- `requestId`: increments on every load and on going to the menu, so a slow response for an abandoned request is ignored.
- `timers`: every pending `setTimeout`, so they can all be cancelled when the player leaves a round.

---

## 7. The life of a round

This is what happens from pressing START GAME to the reveal.

1. **`startGame()`** unlocks Web Audio (it must happen inside a user gesture), plays the menu blip, and calls `loadRound(settings.gen)`.
2. **`loadRound(genId)`**:
   - cancels pending timers and stops any cry that is playing;
   - takes a new `requestId` and sets the phase to `loading`;
   - uses the prefetched round if it was prepared for the same generation, and otherwise calls `prepareRound()`;
   - if the player has left in the meantime (the `requestId` changed), it stops here;
   - adds the Pokémon to `recentIds`, builds a fresh `round`, resets the cursor and sets the phase to `guessing`;
   - plays the "Who's that Pokémon?" clip (`audio.playIntro()`) after **420 ms**, so the silhouette lands first. The cry is **not** played during guessing;
   - starts prefetching the next round right away.
3. **`prepareRound(genId, recentIds)`** in `gameLogic.js`:
   - gets the species index (cached after the first call);
   - picks a target ID in the range, avoiding recent ones;
   - fetches that Pokémon (cached);
   - **waits for the artwork to finish loading**, so the silhouette never appears half-drawn;
   - picks 3 distractors from the same range and shuffles all four.
4. **The player answers:**
   - **Correct**: `reveal(true, attemptNumber, pokemon)`.
   - **Wrong**: `registerWrong()` plays the incorrect sound, shakes both screens and decrements `attemptsLeft`. In choice mode the wrong button is disabled and the cursor moves to an enabled one. In type mode the guess is recorded and a hint appears. If no attempts are left, the reveal runs **550 ms** later with `correct = false`.
5. **`reveal()`** records the outcome and points, updates `stats`, switches to `revealed`, stops the intro clip if it is still playing, plays the reveal sound (plus the correct jingle at **+160 ms** for a right answer), and plays the cry at **+750 ms**. This is the first time the player hears the cry.
6. **NEXT POKÉMON** calls `loadRound()` again, which is usually instant thanks to the prefetch.

---

## 8. Data layer — `pokemonApi.js`

### Endpoints used

| Call | Endpoint | When | Used for |
| --- | --- | --- | --- |
| `getSpeciesIndex()` | `GET /pokemon-species?limit=1025` | Once per session | Names of every species, used for wrong answers |
| `getPokemon(id)` | `GET /pokemon/{id}` | Once per Pokémon shown | Artwork, cry, types |

So a typical round costs **one** API request (plus the artwork image and cry audio), and repeat Pokémon cost none.

### Caching

- `pokemonCache` is a `Map<id, Promise>`. Caching the *promise* rather than the result means two calls for the same ID made at the same time share one request.
- If a request fails, its entry is deleted so a retry can happen. The species index does the same.
- The cache lives in memory only and is cleared when the page reloads.

### The normalised Pokémon object

```js
{
  id: 25,
  slug: 'pikachu',                 // species name from the API
  name: 'Pikachu',                 // display name, via formatPokemonName()
  artwork: 'https://…/25.png',     // official artwork → HOME → front sprite → null
  cry: 'https://…/25.ogg',         // cries.latest → cries.legacy → null
  generation: { id: 1, label: 'Gen I', region: 'Kanto', … },
  types: ['electric'],
}
```

The display name comes from the **species** name, not the form name. That way Pokémon such as Giratina or Deoxys show as "Giratina" rather than "Giratina Altered".

### Name formatting

`formatPokemonName(slug)` title-cases hyphenated slugs (`great-tusk` → `Great Tusk`). A `SPECIAL_NAMES` table covers names that need punctuation or symbols:

`Nidoran♀`, `Nidoran♂`, `Mr. Mime`, `Mime Jr.`, `Mr. Rime`, `Farfetch'd`, `Sirfetch'd`, `Type: Null`, `Flabébé`, `Ho-Oh`, `Porygon-Z`, `Jangmo-o`, `Hakamo-o`, `Kommo-o`, `Wo-Chien`, `Chien-Pao`, `Ting-Lu`, `Chi-Yu`.

The correct answer and the distractors go through the same formatter, so the right answer never stands out by its formatting.

### `preloadImage(url)`

This returns a promise that resolves once the image has loaded, or immediately if there is no URL. It resolves `false` on failure rather than rejecting, because a missing image shouldn't stop the round. In that case the top screen shows a black "?" instead.

---

## 9. Game rules — `gameLogic.js`

### Constants

| Constant | Value | Meaning |
| --- | --- | --- |
| `MAX_ATTEMPTS` | `2` | Attempts per Pokémon |
| `CHOICE_COUNT` | `4` | Answers in choice mode |
| `POINTS_BY_ATTEMPT` | `{ 1: 2, 2: 1 }` | Points by the attempt the answer came on |
| `RECENT_MEMORY` | `30` | How many recent Pokémon to avoid repeating |

### Functions

| Function | What it does |
| --- | --- |
| `pickTargetId(range, recentIds)` | Random ID in range. Avoids up to the last 30 recent IDs, but never more than half the range, so small generations don't run out. Gives up after 60 tries and allows a repeat. |
| `pickDistractors(target, range, index)` | 3 unique IDs in the same range whose names differ from the target's. |
| `prepareRound(genId, recentIds)` | Everything a round needs (see §7). |
| `rememberId(recent, id)` | Adds an ID to the recent list, capped at 30. |
| `normalizeAnswer(text)` | Normalises text for comparison (see below). |
| `isCorrectGuess(input, pokemon)` | Compares the normalised input against the display name and the slug. |
| `makeHint(name)` | `"Pikachu"` → `"P______"`. Spaces and punctuation stay visible. |
| `applyResult(stats, { correct, points })` | Returns updated stats, including `bestStreak`. |
| `shuffle`, `randomInt`, `pad2` | Helpers. |

### Typed-answer matching

`normalizeAnswer()` applies these steps in order:

1. trims the text and lowercases it;
2. strips accents (`é` → `e`);
3. maps `♀` → `f` and `♂` → `m`;
4. removes spaces, hyphens, underscores, apostrophes (straight and curly), backticks, periods and colons.

The table below shows the effect.

| Typed | Accepted for |
| --- | --- |
| `  PIKACHU ` | Pikachu |
| `mr mime`, `mr.mime`, `MrMime` | Mr. Mime |
| `farfetchd`, `farfetch'd` | Farfetch'd |
| `nidoran f`, `nidoran-f`, `nidoran♀` | Nidoran♀ |
| `flabebe` | Flabébé |
| `type null` | Type: Null |
| `hooh` | Ho-Oh |

`TypeAnswer` also checks guesses before they reach the game logic. An empty field shows "Type a name first." Repeating a wrong guess shows "You already tried that one." Neither costs an attempt.

---

### Games, Trainers and the leaderboard (`playerStorage.js`)

**A game is `SESSION_LENGTH` (10) Pokémon.** `startGame()` resets `stats` to zero. `stats` now means "this game", and the score bar shows `Q n/10`. When the 10th reveal happens, `finishSession()` saves it to the current Trainer immediately, so closing the tab on the results screen loses nothing. Leaving a game early with MENU doesn't save it.

Each Trainer is stored in `localStorage` under `wtp-players`. The selected Trainer is under `wtp-current-player` and the DS colour under `wtp-ds-color`:

```js
{ id, name, totalScore, gamesPlayed, correctAnswers, totalQuestions, bestStreak, highScore, createdAt }
```

- `recordSession(player, session)` adds the game's score, correct answers and questions, and increments `gamesPlayed`. It keeps the max of `bestStreak` and of `highScore` (best single game).
- `rankPlayers(players, 'total' | 'high')` sorts by Total Score (default) or High Score, then by name.
- Names are 1–12 characters, uppercased with spaces collapsed (`cleanName`), and must be unique.
- Accuracy is `correctAnswers / totalQuestions`, rounded.
- All storage access is wrapped in try/catch. If storage is blocked, the game still works for that visit.

#### How a score reaches the leaderboard

1. Each answer goes through `reveal()` in `App.jsx`, which updates `stats` with the existing `applyResult()`.
2. When `stats.attempted` reaches `SESSION_LENGTH`, `reveal()` calls `finishSession(stats)`.
3. `finishSession()` runs `recordSession()` on the current Trainer. `updatePlayers()` puts the result in React state and writes it to `localStorage` in the same step. It also stores `lastResult` (the game's stats plus `newHigh`) for the results screen.
4. The 10th reveal's button reads **SEE RESULTS**. `nextPokemon()` then switches to `results` instead of loading another round.

#### How the leaderboard is built

- App never stores a ranked list. It computes `ranked = rankPlayers(players, lbSort)` on every render, so the leaderboard always matches the saved data.
- App's leaderboard state:

  | State | Meaning |
  | --- | --- |
  | `lbSort` | `'total'` or `'high'` |
  | `lbCursor` | Index of the highlighted row in `ranked` |
  | `lbReturn` | The phase BACK returns to: `players` or `results` |

- Opening the leaderboard puts the cursor on the current Trainer. Switching TOTAL ⇄ HIGH keeps the cursor on the same Trainer at their new position.
- **Bottom screen** (`Leaderboard.jsx`):
  - one row per Trainer: rank, name and the score for the active sort;
  - ★ marks the current Trainer;
  - ranks 1–3 are tinted gold, silver and bronze;
  - the red arrow marks `lbCursor`.
- **Top screen** (`PlayerStats.jsx`):
  - the trainer card for the highlighted row;
  - a **YOU** badge when that row is the current Trainer;
  - a **NEW BEST!** badge on the results screen.

#### Limitations

- **Local only.** Scores aren't shared across browsers or devices, and clearing site data deletes every Trainer.
- **Not tamper-proof.** Anyone can edit `wtp-players` in devtools.
- **No way to delete or rename a Trainer** from the UI yet.
- **Moving to an online leaderboard** (Supabase, Firebase, a small API) only touches `loadPlayers()`, `savePlayers()` and the `finishSession()` call. The screens only see the `players` array.

---

## 10. Generation config — `generationRanges.js`

All Pokédex ranges are defined here and nowhere else:

| Gen | Region | IDs |
| --- | --- | --- |
| I | Kanto | 1–151 |
| II | Johto | 152–251 |
| III | Hoenn | 252–386 |
| IV | Sinnoh | 387–493 |
| V | Unova | 494–649 |
| VI | Kalos | 650–721 |
| VII | Alola | 722–809 |
| VIII | Galar | 810–905 |
| IX | Paldea | 906–1025 |

Several values are derived from this list:

- `MAX_POKEMON_ID` (the highest `end`), which also sets the species-list `limit`;
- `ALL_GENERATIONS`, covering 1 to `MAX_POKEMON_ID`;
- `GENERATION_OPTIONS`, the menu buttons in display order;
- `getGenerationRange(genId)` and `getGenerationForId(id)`.

**To add Gen 10:** append `{ id: 10, label: 'Gen X', region: '…', start: 1026, end: … }`. The menu, the "All" range, the species fetch and the reveal labels all pick it up automatically. The menu grid is 5 columns, so an 11th button wraps to a third row; adjust `.menu__gens` if you want a different layout.

---

## 11. Audio — `audioManager.js`

A single exported instance, `audio`, handles all sound.

### Sound effects

| Key | Plays when | Built-in synth sound |
| --- | --- | --- |
| `menuSelect` | Any menu choice, start, next, D-pad move | Two quick high square-wave blips |
| `incorrect` | A wrong answer | Two descending sawtooth notes |
| `correct` | A correct answer (160 ms after reveal) | C–E–G arpeggio, then a held chord |
| `reveal` | Every reveal | Rising triangle sweep plus a burst of noise |

**To replace a sound:** put a file in `public/sounds/` and set its path:

```js
export const SOUND_FILES = {
  menuSelect: null,
  incorrect: '/sounds/wrong.mp3',
  correct: '/sounds/correct.mp3',
  reveal: null,               // null keeps the synth version
};
```

### "Who's that Pokémon?" clip

`audio.playIntro()` plays `INTRO_FILE` (`/sounds/whos-that-pokemon.mp3`) when a silhouette appears. It shares the cry channel, so `audio.stopCry()` and muting stop it, and a cry stops it.

### Cries

Cries play only after the reveal. The ♪ button and X / Y / `C` are disabled while guessing.

`audio.playCry(url)`:

- does nothing if muted or if there is no URL;
- ignores calls less than **300 ms** after the previous one, so rapid clicking can't stack cries;
- **stops any cry already playing** before starting a new one;
- resolves to `{ played, blocked }`. `blocked: true` means the browser refused autoplay (`NotAllowedError`), and App then makes the ♪ button flash.

Unsupported formats and failed downloads resolve `{ played: false, blocked: false }`, and the round carries on silently.

### Unlocking and muting

- Browsers keep Web Audio suspended until the user interacts with the page. `audio.unlock()` runs on the first pointer or key press anywhere, and again when START GAME is pressed.
- The intro clip and cries all play through **one reused `<audio>` element** (`audio.voice`). `unlock()` plays a silent clip on it during the first click. Safari only allows `play()` from a timer on an element that was already played during a user gesture, and a fresh `new Audio()` each time would be blocked.
- `audio.setMuted(true)` also stops the current cry. Mute applies to both cries and sound effects. The ♪ button is disabled while muted.

---

## 12. Components

Every component receives its data and callbacks as props, as described in §5.

### `DSConsole`
**Props:** `top`, `bottom` (React nodes), `shakeKey`, `onButton(name)`

Renders the hardware and places the two screen contents into 480×360 screen slots. Hardware buttons call `onButton` with one of these names: `'a' 'b' 'x' 'y' 'start' 'select' 'up' 'down' 'left' 'right' 'power'`. They use `onPointerDown` so they respond immediately on touch. When `shakeKey` changes, the component removes the `is-shaking` class from both screens, forces a reflow, and adds it back, which restarts the animation every time.

### `TopScreen`
**Props:** `phase`, `round`

Shows `TitleScreen` in the menu phase and `WhosThatPokemon` in every other phase. While loading or in an error, it passes `pokemon={null}` so the old Pokémon disappears.

### `TitleScreen`
Static. It shows rotating sky-blue rays, a bobbing Poké Ball with a "?", the outlined title, the subtitle and a blinking "PRESS START" over a red band.

### `WhosThatPokemon`
**Props:** `pokemon`, `revealed`, `loading`

The screen is built from these layers, bottom to top:

1. `.wtp__red`: diagonal red streaks that slide slowly.
2. `.wtp__burst`: the blue-white burst. Its jagged edge is a `clip-path` polygon from `buildBurstPolygon()`: 96 points around (30%, 50%), alternating long and short spikes, with the radius shrinking towards the right so the red side shows. A fixed seed keeps the shape identical on every render, and it is computed once with `useMemo`.
3. `.wtp__rays`: thin conic-gradient rays, faded out near the centre with a mask.
4. `.wtp__mon`: the artwork with `filter: brightness(0)`. It has `key={pokemon.id}`, so the slide-in animation replays for each new Pokémon.
5. `.wtp__flash`: a white flash that only exists on reveal.
6. `.wtp__question`: the bobbing "?", which spins away on reveal.
7. `.wtp__title`: "WHO'S THAT / POKÉMON?", or on reveal "IT'S" plus the name, sized by name length (24 / 20 / 17 / 14 px).

The silhouette and the reveal use **the same `<img>`**. Revealing only removes the filter, so there is no second image to load.

### `BottomScreen`
Picks the bottom content for the current phase and lays it out as score bar → body → bottom bar. The body has a `key` built from the phase and Pokémon ID, so it fades in on every change.

### `StartMenu`
**Props:** `settings`, `onChange(patch)`, `onStart`, `stats`, `onResetStats`, `muted`, `onToggleMute`

It has a header strip (title, a reset link that only appears once a round has been played, and a mute button), 10 generation chips in a 5×2 grid, 2 mode buttons and START GAME. Both groups use `role="radiogroup"` / `role="radio"` with `aria-checked`. It also exports `MODES`, which App uses for D-pad cycling.

### `ScoreBar`
**Props:** `stats`, `attemptsLeft` (`null` hides the balls)

Shows `SCORE 04  STREAK 3  5/7` and, while guessing, one Poké Ball per remaining attempt. Spent attempts are greyed out.

### `MultipleChoice`
**Props:** `choices`, `wrongIds`, `cursor`, `locked`, `onPick(choice)`, `onCursor(i)`

A 2×2 grid. The accent colours by position are yellow, lavender, pink-grey and blue. Wrong answers get `is-wrong`, which shakes and flashes red once and then stays greyed and disabled. Hovering an answer moves the D-pad cursor to it, so mouse and keyboard stay in sync.

### `TypeAnswer`
**Props:** `roundId`, `attemptsLeft`, `wrongGuesses`, `hint`, `locked`, `onGuess(text)`

It keeps its own `text` and `notice` state, which reset whenever `roundId` changes, and renders a `DSKeyboard`. After a wrong guess the field flashes red, clears, and shows the hint (first letter + blanks) greyed in the slots, with "Not quite! 1 try left."

### `DSKeyboard`
**Props:** `value`, `onChange`, `onSubmit`, `maxLength`, `ghost`, `status`, `statusBad`, `flashKey`, `disabled`

The Diamond & Pearl name-entry screen: a slotted field with BACK and OK on its right, a status line, then keys `a–j`, `k–t`, `u–z` + SPACE, `0–9`. There is no HTML input. A capture-phase `keydown` listener on `window` also accepts the physical keyboard (letters, digits, space, Backspace, Enter) and stops those keys, so App's shortcuts (`M`, `C`, Enter→A) don't fire while typing. `Esc` is not handled, so it still means B. Changing `flashKey` flashes the field red.

### `PlayerSelect`, `AddPlayer`, `Leaderboard`, `ResultsScreen`, `PlayerStats`
Full-screen bottom menus built from the same parts as `StartMenu` (`menu__header`, `bar-btn--start` for the main action, `chip-btn` for secondary ones). Lists use `dp-list__row` with the red arrow cursor. `PlayerStats` is the top-screen trainer card (Total Score, High Score, Games Played, Correct, Accuracy, Best Streak).

### `RevealScreen`
**Props:** `pokemon`, `outcome`, `points`, `onNext`

A D&P text box showing "It's [Name]!", a result line ("Got it first try! +2" and so on), the Pokédex number, region and coloured type chips. NEXT POKÉMON is focused when the panel mounts, so Enter continues.

### `BottomBar` / `MuteButton`
The ♪ cry button, a wide blue MENU bar styled like D&P's CANCEL bar, and the mute toggle. `MuteButton` is also used in the menu header in a smaller size.

---

## 13. Input handling

All input ends up in one function, `handleButton(name)` in `App.jsx`, so the on-screen DS buttons and the keyboard always do the same thing.

### What each button does in each phase

Trainer screens: on `players`, A/START = PLAY GAME and ↑↓ change Trainer. On `leaderboard`, ↑↓ move the cursor, ←→ toggle TOTAL/HIGH and B goes back. On `addPlayer`, B cancels. On `results`, A/START = PLAY AGAIN and B = main menu. On `menu`, B = change user.

| Button | menu | guessing (choice) | guessing (type) | revealed | error |
| --- | --- | --- | --- | --- | --- |
| A | Start game | Pick the cursor answer | — | Next Pokémon / See results | Retry |
| START | Start game | — | — | Next Pokémon / See results | Retry |
| B / POWER | Change user | Menu | Menu | Menu | Menu |
| X / Y | — | — | — | Replay cry | — |
| SELECT | Mute toggle | Mute toggle | Mute toggle | Mute toggle | Mute toggle |
| ← → | Previous/next generation | Move cursor across | — | — | — |
| ↑ ↓ | Toggle mode | Move cursor between rows | — | — | — |

The cursor moves with XOR on the 2×2 grid: left/right does `cursor ^ 1` and up/down does `cursor ^ 2`.

### Keyboard rules

The keyboard listener is registered once and calls the latest `handleButton` through a ref, which avoids stale closures. It follows these rules:

- Held keys (`e.repeat`) are ignored.
- `Escape` always works, even while typing.
- While a `DSKeyboard` is on screen, it takes letters, digits, space, Backspace and Enter first (see `DSKeyboard`).
- `Enter` is ignored when a button has focus, because the browser already activates that button.
- `M` toggles mute and `C` replays the cry.

### Focus behaviour

A global `mousedown` listener calls `preventDefault()` on buttons, so clicking a button doesn't move keyboard focus to it. This has two effects. Clicking SUBMIT keeps the text field focused, and pressing Enter after clicking, say, the mute button won't press mute again. Keyboard users can still Tab to every button, and focused elements show a red `:focus-visible` ring.

---

## 14. The DS shell and scaling

### Fixed design canvas

The whole DS is laid out in absolute pixels on a **980 × 1000** canvas, the same proportions as the reference photo. Key positions:

| Part | Position (x, y) | Size |
| --- | --- | --- |
| Upper lid | 8, 6 | 964 × 462 |
| Top screen frame | 246, 50 | 492 × 372 (480 × 360 screen + 6 px border) |
| Hinge (left / centre / right) | 8 / 136 / 844, ~458 | — |
| Camera | centre of hinge | 32 px |
| Lower body | 8, 526 | 964 × 470 |
| Bottom screen frame | 246, 568 | 492 × 372 |
| D-pad | 62, 638 | 136 × 136 |
| X / Y / A / B centres | (865,630) (812,684) (918,684) (865,738) | 52 px |
| START / SELECT | 783,854 / 783,908 | 28 px |
| POWER | 172, 906 | 32 px |

Both screens are **480 × 360**, the DS's 4:3 ratio at 1.875× native resolution. All screen content is designed at that size.

### Scaling

`useFitScale()` in `App.jsx` calculates:

```
scale = min(viewportWidth × 0.96 / 980, viewportHeight × 0.92 / 1000, 1.25)
```

with a floor of 0.2, and recalculates on resize. The DS is then rendered inside:

- `.ds-fit`, sized to `980·scale × 1000·scale` so the page centres it correctly;
- `.ds-scaler`, a 980×1000 box with `transform: scale(scale)` from the top-left corner.

Because the console is scaled as one piece, **nothing inside ever reflows**. A phone shows exactly the same layout as a desktop, only smaller, which matches the "looking at a physical DS" goal. The keyboard legend under the DS is hidden below 640 px wide or 560 px tall.

### The D-pad outline

The D-pad is two overlapping bars. Its outline comes from stacked `drop-shadow()` filters on the wrapper rather than from `box-shadow`. Drop-shadows follow the combined shape of both bars, so the cross has one continuous outline with no seam in the middle.

---

## 15. Styling system

### Files

| File | Covers |
| --- | --- |
| `base.css` | `@font-face`, design tokens, page background, focus ring, `.outline-text`, `.pokeball-icon`, reduced-motion rules |
| `ds.css` | Every hardware part, the screen shake |
| `top-screen.css` | Title screen, Who's That Pokémon layers and animations |
| `bottom-screen.css` | Bottom background, score bar, move buttons, bar buttons, chips, text boxes, type chips, loading/error |

### Tokens (`:root` in `base.css`)

| Group | Tokens |
| --- | --- |
| Fonts | `--font-display` ("Pokemon" → Press Start 2P), `--font-ui` (Press Start 2P), `--font-hw` (rounded sans for printed hardware labels) |
| DS shell | `--ds-body #59c2db`, `--ds-body-hi`, `--ds-body-lo`, `--ds-edge`, `--ds-ink` |
| D&P UI | `--dp-ink #383838`, `--dp-paper`, `--dp-tan #cdc0a0`, `--dp-blue`, `--dp-blue-dark`, `--dp-red #e8392e` |
| Title art | `--wtp-yellow #ffcb05`, `--wtp-blue #2f63b0`, `--wtp-navy #1c3c78` |

### Diamond & Pearl building blocks

| Class | Looks like | Used for |
| --- | --- | --- |
| `.move-btn` + `--yellow/--lavender/--pink/--blue` | Battle move button: dark outline, coloured frame with darker sides, white-over-tan face, white text with a dark outline | Answers, mode buttons, SUBMIT, NEXT, TRY AGAIN |
| `.move-btn--compact`, `--submit`, `--next` | Size variants | Menu modes, wide action buttons |
| `.bar-btn` (`--menu`, `--start`) | The wide CANCEL bar (blue) / FIGHT-red START bar | MENU, START GAME |
| `.chip-btn` | Small beveled tab, turns yellow when selected | Generation picker |
| `.icon-btn` | Small square beveled button | Cry, mute |
| `.textbox` | D&P dialogue box with double blue-grey border | Type prompt, reveal panel, loading/error |
| `.type-chip--{type}` | Classic type colours for all 18 types | Reveal panel |
| `.outline-text` | Yellow fill, blue outline, navy drop shadow | Titles |

Each accent colour is just three variables (`--accent`, `--accent-dark`, `--accent-light`), so adding a colour is one line of CSS.

All "pressed" states move the button down by its shadow depth (3–4 px) and remove the shadow, which gives the physical button-press feel.

### Fonts

- **Press Start 2P** is loaded from Google Fonts in `index.html`.
- **"Pokemon"** is optional and only used if it is installed on the viewer's computer (`local('Pokemon Solid')`, `local('Pokemon')`). The site never depends on it. To ship a font file with the project, put it in `public/fonts/` and add `url('/fonts/yourfont.ttf') format('truetype')` to the `@font-face` in `base.css`.

---

## 16. Animations and timing

Every animation is short, in the range of a handheld game rather than a cinematic sequence.

| Animation | Duration | Where |
| --- | --- | --- |
| Silhouette slide-in with overshoot | 380 ms | `mon-in` |
| Silhouette → colour reveal | 420 ms (filter transition) | `.wtp__img` |
| Reveal scale pop | 360 ms | `reveal-pop` |
| White flash | 280 ms | `flash` |
| "?" spin-out | 200 ms | `.is-revealed .wtp__question` |
| "IT'S NAME!" pop-in | 320 ms | `name-pop` |
| Screen shake (wrong answer) | 300 ms, stepped | `screen-shake` |
| Wrong answer shake + red flash | 320 ms, stepped | `wrong-shake`, `wrong-flash` |
| Bottom content change | 200 ms fade + 6 px rise | `screen-enter` |
| Top screen fade | 200 ms | `screen-fade` |
| Button press | 60 ms | `transform` / `box-shadow` transitions |

These ambient loops run continuously but stay subtle: the rotating title rays (40 s per turn), the red streak slide (3 s), the burst pulse (2.4 s), the "?" bob (1.4 s), the cursor arrow nudge, and blinking "PRESS START".

### Scheduled events (App.jsx)

| Delay | Event |
| --- | --- |
| +420 ms after a round appears | Play the "Who's that Pokémon?" clip |
| +550 ms after the 2nd wrong answer | Reveal |
| +160 ms after a correct reveal | Correct jingle |
| +750 ms after any reveal | Play the cry |

All of these go through `later()`, so returning to the menu or loading a new round cancels any that haven't run yet.

**Reduced motion:** if the OS asks for reduced motion, every animation and transition runs in 1 ms and loops play only once.

---

## 17. Customisation guide

| I want to… | Change |
| --- | --- |
| Give 3 attempts | `MAX_ATTEMPTS` in `gameLogic.js`, plus an entry for attempt 3 in `POINTS_BY_ATTEMPT` (the score bar draws one ball per attempt automatically) |
| Change scoring | `POINTS_BY_ATTEMPT` in `gameLogic.js` |
| Make the reveal message match the new points | `RESULT_COPY` in `RevealScreen.jsx` (keyed by points) |
| Add Gen 10 | One entry in `GENERATIONS` (§10) |
| Replace a sound | `SOUND_FILES` in `audioManager.js` (§11) |
| Turn off the cry on reveal | Remove the `later(() => playCry(pokemon), 750)` line in `reveal()` |
| Replace the "Who's that Pokémon?" clip | Swap `public/sounds/whos-that-pokemon.mp3` or change `INTRO_FILE` in `audioManager.js` |
| Change the default menu choices | Initial `settings` state in `App.jsx` |
| Change how many Pokémon are in a game | `SESSION_LENGTH` in `gameLogic.js` |
| Change the favicon | Replace `favicon.png`, then regenerate the sizes: `sips -z 32 32 favicon.png --out public/favicon-32.png` (same for 192 and 180 → `apple-touch-icon.png`). Links are in `index.html` |
| Wipe all Trainers | In the browser console: `localStorage.removeItem('wtp-players')` |
| Change leaderboard sort keys | `rankPlayers()` in `playerStorage.js` and `SORTS` in `Leaderboard.jsx` |
| Add or edit a DS colour | Add an entry to `DS_COLORS` in `ColorPicker.jsx` and a matching `.ds[data-color='…']` block of `--ds-*` variables in `ds.css`. The default (Midnight Blue) is in `:root` in `base.css` |
| Change the stylus pointer | The `cursor: url(...)` SVG on `.ds, .ds *` in `ds.css` (hotspot `2 2` is the tip) |
| Reduce repeats more or less | `RECENT_MEMORY` in `gameLogic.js` |
| Change answer colours or order | `ACCENTS` in `MultipleChoice.jsx`; colours in `bottom-screen.css` |
| Recolour the DS (e.g. pink) | The `--ds-*` tokens in `base.css`; a few gradients in `ds.css` use literal blues (`#67c9e0`, `#8ad8eb`…) that also need updating |
| Change the burst shape | `buildBurstPolygon()` in `WhosThatPokemon.jsx` (centre, base radius `236 - 66·cos θ`, spike count and variance) |
| Hide the hint in type mode | Remove the `hint: makeHint(...)` line in `typeGuess()` |
| Use sprites instead of official artwork | Change the order of the fallbacks in `toPokemon()` in `pokemonApi.js` |

---

## 18. Known limitations

- **Cries in Safari.** PokéAPI serves cries as `.ogg`, which older Safari versions can't play. The game skips the cry silently in that case and the round is unaffected.
- **Generation comes from ID ranges,** not from the API's species data. It is correct for the default form of every species up to 1025.
- **Display names are formatted from slugs,** not taken from the API's localised names. The special-case table covers the known exceptions, but a future species with unusual punctuation may need an entry.
- **Trainer stats are saved locally only,** in `localStorage`. They aren't shared between devices, and a game left before the 10th Pokémon isn't saved. See §9 "Games, Trainers and the leaderboard".
- **The prefetched round is thrown away** if the generation changes before it is used. That costs one wasted request, with no visible effect.
- **Distractors are random** within the generation, so some rounds are easy (very different names). They aren't matched by type or name length.
- **The reveal hands over to the result panel** rather than highlighting the correct answer button in the grid.
- **English only.**
- **Fan project.** Pokémon names, artwork and cries belong to Nintendo, Game Freak and The Pokémon Company, and are loaded at runtime from PokéAPI. Keep this in mind before publishing or monetising.

---

## 19. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| "Couldn't reach PokéAPI" on the bottom screen | No internet, PokéAPI is down, or the request was blocked (ad blocker, school/office network). Press TRY AGAIN. |
| No cry plays and the ♪ button flashes | The browser blocked autoplay. Tap ♪ once; later cries usually play normally. |
| No cry and ♪ doesn't flash | The Pokémon has no cry, the format isn't supported (see Safari above), sound is muted, or the system volume is off. |
| Sound effects are silent but cries work | Web Audio hasn't been unlocked yet. Click anywhere on the page once. |
| The tab still shows the old ❓ icon | Browsers cache favicons. Hard-refresh (Cmd+Shift+R); Safari may need a restart. |
| Leaderboard is empty / Trainers vanished | Different browser or profile, private window, or site data was cleared. Trainers live in that browser's `localStorage` only. |
| Text appears in a plain monospace font | Google Fonts didn't load (offline or blocked). The game still works. |
| The DS looks tiny | The window is very short. Scaling fits height first; enlarge the window or zoom out. |
| Enter does nothing in type mode | The text field isn't focused. Click into it; Enter inside the field submits. |
| Arrow keys move the text cursor instead of the D-pad | Expected while typing. Press Esc to leave, or click outside the field. |

---

## 20. Testing notes

During development the game was run in headless Chromium against a **mocked PokéAPI**, because the build environment had no access to the real API. The mock returned fake species names, a placeholder creature image and a failing cry URL. These parts were checked end to end:

- menu rendering, generation and mode selection;
- starting a round, the silhouette and the attempt indicators;
- a wrong answer (disabled button, spent ball, shake), then a correct answer and the reveal;
- type mode: a wrong guess with hint and notice, then a correct guess typed with extra spaces and capitals;
- score, streak and accuracy totals (2 pts, streak 2, 2/2 after two second-try wins);
- a missing cry (404) not breaking the round;
- scaling at 1440×900 and at 390×844.

Live artwork and cries from the real PokéAPI should be checked on first run.

### Suggested manual checklist

- [ ] All generations load, including Gen IX.
- [ ] Cries play in Chrome and Firefox; Safari degrades quietly.
- [ ] Long names (Crabominable, Squawkabilly, Iron Valiant) fit on the buttons and in the title.
- [ ] Special names match when typed: `mr mime`, `farfetchd`, `nidoran f`, `type null`, `flabebe`.
- [ ] Pressing MENU during loading doesn't jump back into a round.
- [ ] Rapid ♪ clicks never overlap cries.
- [ ] Mute silences everything, and unmuting restores it.
- [ ] D-pad and keyboard can play a full choice-mode round without the mouse.
- [ ] The layout holds on a phone in both orientations.

### Easy unit-test targets

`gameLogic.js` has no React or network code apart from `prepareRound`, so these functions can be tested directly with Vitest: `normalizeAnswer`, `isCorrectGuess`, `makeHint`, `applyResult`, `pickTargetId`, `pickDistractors`. `formatPokemonName` in `pokemonApi.js` is also pure.

---

## 21. Ideas for future work

- An online leaderboard shared between devices (see the limitations in §9).
- Delete / rename a Trainer from the Trainer screen.
- A difficulty setting: distractors of the same type or similar name length, or a cry-only mode with no silhouette.
- Timed rounds.
- Highlight the correct answer in the grid during the reveal.
- Use the API's localised species names for other languages.
- Real D&P-style sound effects in `public/sounds/`.
