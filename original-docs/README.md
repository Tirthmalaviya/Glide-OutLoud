# Glide Game

Speech therapy quests for children aged 3 to 10, in English and Finnish.
Outloud R&D project, Turku University of Applied Sciences.

## Folder

```
glide-game/
  frontend/            the app (phase 3)
    index.html         welcome: language, age, glide level
    games.html         pick a quest, badges
    say-word.html      quest 1: say the word
    find-it.html       quest 2: listen and find
    balloon.html       quest 3: voice balloon
    reward.html        stars, XP, badges
    therapist.html     therapist area: players, results, chart, settings
    css/style.css      colours, fonts, layout for every page
    js/app.js          languages, word lists, saved data, glide levels, badges
    js/api.js          calls to the backend, with fallbacks
  backend/             the Python backend (phase 4, next week)
```

## Run it

```
cd glide-game/frontend
python -m http.server 8080
```

Open http://localhost:8080 in Chrome or Edge.

## How speech is checked

The app picks the best way that works on the device:

1. **Backend running** (phase 4): audio is checked offline on the computer.
2. **No backend:** browser speech recognition, demo only (it uses the internet).
3. **Neither:** the grown-up taps "Said it right" or "Skip".

The therapist area shows whether the backend is connected.

## Where data is saved

Players, settings and results are saved in the browser (localStorage).
In phase 4 each finished quest is also sent to the backend at `POST /sessions`.
