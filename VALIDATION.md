# Validation — Glide Game 1.0.0, 1 November 2026

## Passed in this build environment

- **514 logic/content/prompt-routing checks**: exercise sessions, double taps, retries, skips, XP/badges, manual recording finish, accepted text matching, correct locale/text forwarded for all word and sentence entries.
- **581 personal-data/content checks**: legacy migration; independent settings and languages; retained XP/history; sound-tag selection without unrelated fallback; per-language age pools; distinct picture choices; focus-specific synonym labels; no duplicate Say items; recent-content avoidance and later difficult-item review; separated metrics; backup round trips; invalid formats, duplicate players, broken session references, invalid outcomes and oversized/invalid data rejection; draft isolation; duplicate-session completion protection.
- **158 real-Chromium workflow/layout checks**, using a simulated native bridge: adult gate, individual settings, saving feedback, older session review, backup preview/cancel/restore/recovery, active-player identity, second-tap Finish label/action, speech feedback, saved-quest resumption, retry progression, next quest suggestion, First… then… prompts, sequence-step resumption, balloon microphone readiness, no page-wide horizontal overflow and usable touch targets. Screen sizes: 360×740, 393×780, 800×1280, 1024×600 and 667×375; both languages. Internal layout screenshots were inspected. Tables and player lists intentionally scroll within their containers; short landscape screens may scroll vertically.
- Java 17 compilation against Android API 35, ONNX Runtime Android 1.23.2 Java interfaces, D8 dex generation and resource linking.
- Android resource and native-library ZIP alignment, model SHA-256 checks, asset equality, CRC checks and APK signature verification. Signing certificate and application ID match the 0.2.2 test build; versionCode increases from 3 to 4.
- The following are unchanged from the user-approved 0.2.2 source: LocalVoice.java, LocalSpeech.java, CtcDecoder.java, SpeechAudio.java, the complete native capture() method, and original shared app.js (including GG.speak and exact answer matching). The three ONNX models and configurations match MODEL_ARTIFACTS.json. Both arm64-v8a and x86_64 native runtime libraries are copied unchanged from the verified baseline APK. SPEECH_FREEZE.json and tools/verify_release.py record and check this boundary.

## Not tested here

- Installation, update migration on an actual Android installation, Android launch, native document picker/export/import, background/activity lifecycle, TalkBack, Android PDF printing or actual system voice playback in 1.0.0.
- Physical phone/tablet performance, recording latency, recognition accuracy, children's voices, the expanded content through a real microphone, and all supported Android/voice-engine combinations.
- Android Studio Gradle sync on the user's Mac. The supplied APK was compiled using official SDK aapt2, Java, D8, zipalign and apksigner rather than a complete Gradle installation in this container. The normal Gradle project and wrapper are included.
- Independent native-speaker/therapist certification of expanded content, therapeutic effectiveness, client approval or clinical validation.

The browser bridge tests simulate Android services and do not replace device tests. Prior 0.2.2 recognition fixtures and benchmarks are historical evidence only, not new speed/accuracy measurements for this release. DEVICE_TEST_CHECKLIST.md records the outstanding acceptance work explicitly as Not run.

## Behaviour and scope notes

Personal settings are migrated once from the old shared plan into independent profile objects. Invalid legacy comma-separated targets are cleared. New sound selection tags word-initial consonant sounds (including words within sentences/blends); it is selection metadata, not phoneme scoring. The balloon measures sound level, not vowel identity or breathing. Repetition is prioritised by recorded exercise outcomes, not a clinical adaptation algorithm.

The dashboard uses separate activity counts, not a combined success/accuracy percentage. Completed sessions are saved with a personal-plan snapshot; legacy settings cannot be reconstructed. Backups contain completed data and personal settings but exclude drafts, recorded audio and system voice packs. Restore replaces, does not merge, and saves a recovery copy first.

The existing public test key is included for updating test installations. This is an acceptance build, not a store-signed/clinically certified product. Physical-device and content sign-off remain necessary before declaring a production/client release complete.
