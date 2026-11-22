# Glide Game 1.0.1

Offline Android practice app retaining the user-approved 0.2.2 speech implementation. Three quests, separate English/Finnish content, personal player plans, saved progress, session review, PDF reporting and document-picker backup/restore.

Start with START_HERE.md. Validation is in VALIDATION.md; real-device acceptance remains in DEVICE_TEST_CHECKLIST.md. The app recognises text and measures sound level; it does not diagnose speech or provide clinical pronunciation scores.

Android Studio / Gradle: `./gradlew assembleDebug`. SDK 35, min SDK 26, Java 17, arm64-v8a and x86_64, ONNX Runtime Android 1.23.2. The source includes the public test-signing key for in-place test updates; publishing needs a private production key.
