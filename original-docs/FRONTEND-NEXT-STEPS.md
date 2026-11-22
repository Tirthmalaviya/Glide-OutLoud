# Android frontend: first update

Run from this folder:

    python3 -m http.server 8080 --directory frontend

Open http://localhost:8080 in Chrome.

Changes: removes Google Fonts requests and uses system fonts; adds tablet layouts,
compact landscape rules, safe-area padding, minimum control heights and reduced-motion support.
Existing games and backend API contract are preserved.

This is frontend source, not an APK. Browser speech recognition remains a demo
and must not be described as offline. The offline engine must be integrated and
tested on Android by the team. Speech synthesis also needs verification on the
actual device; bundled recorded prompts are an option for predictable offline audio.

Check on Android phone and tablet: welcome -> menu -> each exercise -> reward;
rotate during each screen; check long Finnish labels, audio controls, and therapist tables.

Next: agree Android packaging with the speech developer, then bundle the chosen
recognizer, models and audio assets. A local laptop Python backend is not on-device Android recognition.
