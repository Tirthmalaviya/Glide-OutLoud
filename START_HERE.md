# Glide Game 1.0.1 — installation and acceptance checks

## Update the working app

1. Download Glide_Game_Android_Test.apk. Start your existing Pixel 6 emulator.
2. Drag the APK onto the emulator and let it update Glide Game. **Do not uninstall or clear storage.** The app ID and test signing certificate are unchanged.
3. Open Glide Game. Existing players, ages, XP, badges and completed results are retained. Each existing player receives an independent copy of the previous shared settings. An old invalid target such as `p,m,` is cleared rather than pretending to be a sound selection.
4. The current 0.2.2 offline TTS voices, recognition models, decoder and audio-capture method are unchanged. Already-installed English/Finnish voices do not need downloading again. If this is a fresh device, use the existing Offline voice setup.
5. Open the grown-up area. Select each player, open **Practice settings**, select their language, sound focus, hold time and suggested quest, then Save plan. Start practice from that area or return to the welcome screen.

## New workflow

- The selected player's name and practice language are visible on the quest menu and exercises. Player switching and age editing are in the grown-up area.
- **Suggested quest** can be chosen by an adult, or rotate automatically: Say → Find → Balloon. Following a speech session with items marked for more practice, Find is suggested next. Free quest choice remains available.
- Say / Find can contain 3, 5 or 8 activities. Balloon still contains three balloons. A sound focus with fewer eligible items uses each available item once and shows its actual count on the quest card.
- The speech button shows Ready, Preparing, Listening, Checking and Feedback. During listening, its label changes to Finish recording; the existing second-tap finish action is retained. Listen, Try again and Skip remain available at appropriate times. Adult approval is inside Adult help, which opens automatically in adult-check mode.
- Listen and find uses explicit First… then… audio with a pause for two-picture sequences.
- Balloon checks a quiet baseline, asks for a test sound, and then starts practice. Use a comfortable voice. Touch assistance is labelled and recorded separately, including when the button remains held across balloons. The microphone still measures sound level; it does not identify a vowel or assess breathing.
- The back arrow / Android Back offers Save and leave once meaningful progress exists. Completed items and current selection state resume later in the same quest. A partially filled balloon restarts; completed balloons are retained. Changing the player's practice plan/language clears incompatible unfinished quests, not completed results.
- Only completed quests award XP and appear in Results. Leaving an unfinished quest does not award XP. You can change player to keep the other child's draft separate.

## Sound selection and content

The sound selector uses explicitly tagged **word-initial consonant sounds**, including sounds at the start of a word inside a sentence or blend. It does not search arbitrary letters or score phonemes. When focused, alternative answer labels with a different starting sound are excluded (for example puppy is not a /d/ answer for dog). Without a focus, the existing accepted alternatives remain. English and Finnish have separate banks and age bands. The number next to a sound is the available Say content for the chosen language and age. Empty selections are disabled; there is no fallback to unrelated content.

- English: **78 word entries** (46 basic, 32 longer) and **32 sentences**.
- Finnish: **83 word entries** (47 basic, 36 longer) and **32 sentences**.
- Ages 3–4 use basic words; 5–7 use the language's longer-word bank; 8–10 use sentences for Say. Find uses 2 / 4 / 6 pictures, with two ordered targets at the oldest level.
- Say shuffles within selection priorities, avoids the last two sessions when alternatives exist, and prioritises difficult items after that recent window. Items are not duplicated within one Say quest. Find reduces reuse of targets within the current quest as well as recent history. Repetition is intentional when a focused pool is small.
- Content was curated and checked for consistency, not certified by a Finnish/English speech therapist. Word-length bands are practical content bands, not validated developmental norms. A professional should review content and target plans before clinical use.

## Results and reports

Results separates recognizer matches, adult approvals, first-try matches/finds, retry items, skips and assisted balloons. These are counts of practice outcomes, **not pronunciation-accuracy percentages**. Word/sentence attempts count encountered non-skipped exercise entries; they are not a unique vocabulary count. An item with several tries is counted once in that summary.

Open any session from the history table to inspect its targets, recognised text, attempts and outcomes. New sessions include a practice-setting snapshot. Earlier sessions retain their results but cannot reconstruct settings the old version never recorded. Filter by quest if useful. PDF export prints the selected player's results and the currently opened session review using Android's existing print service.

## Backup and restore

In Backup & information:

1. Choose Save backup file and save the JSON through Android's file picker. This contains every player's settings, completed history, XP and badges. Keep it private: names and recognised text are included. Audio and offline voice packs are not included; unfinished quests are excluded.
2. Choose a backup to restore. The app validates it and previews the number of players and completed sessions before asking to replace current data. Cancel leaves current data unchanged.
3. Confirm only when you want a replacement; it does not merge. A recovery copy is kept locally before replacement. Undo the last restore returns to that copy. It does not resurrect data after uninstalling/clearing app storage. Export to a separate safe location before doing that.

Backup files are limited to 4 MB. Invalid/oversized files are rejected. The app needs no broad storage permission and has no INTERNET permission. The grown-up arithmetic gate is an accidental-access deterrent, not an authentication system.

## Open and build the project

Unzip the project. In Android Studio choose Open and select **GlideGameAndroid**, containing settings.gradle. Use the bundled compatible JDK (17 or newer compatible with Gradle 8.13), SDK Platform 35, and normal build tools. Sync, select app and your emulator, then Run. First build setup downloads Gradle/Android/ONNX dependencies. The installed app's speech engine works offline.

Terminal: `chmod +x gradlew` then `./gradlew assembleDebug`. Output: `app/build/outputs/apk/debug/app-debug.apk`.

This project keeps the original intentionally public test key so it can update your test APK. Use a private production key before publishing. Do not publish this test-signed APK as a store release.

Edit interface files in `web/`. `content.js` holds separate language banks; `practice.js` handles personal plans, migration, selection, metrics and backup validation; `therapist.js` drives the adult area. BackupFiles.java adds Android's document picker. The speech freeze is recorded in SPEECH_FREEZE.json.

Optional developer checks:

- `node tests/check.cjs`
- `node tests/practice.cjs`
- `python3 tools/verify_release.py --apk /absolute/path/to/Glide_Game_Android_Test.apk`
- `tests/ui.cjs` uses Playwright/Chromium with a simulated native bridge. For optional UI tests, run `npm install`, `npx playwright install chromium`, then `npm run test:ui`. Set PLAYWRIGHT_CHROMIUM to a Chromium/headless-shell executable if needed.

## What still needs device acceptance

See DEVICE_TEST_CHECKLIST.md. Browser tests simulate native calls: they cannot prove Android microphone behaviour, file-picker lifecycle, TTS playback, PDF printing or physical-device performance. Compilation and package checks are separate from those tests. The user's 0.2.2 speech path was approved; that path is preserved, but the enlarged content and updated UI still need acceptance on an actual Android phone/tablet. This build is not a clinical assessment or a claim of perfect recognition.
