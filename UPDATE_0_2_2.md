# 0.2.2 — speech-focused replacement

The old synthesized prompt recordings and Whisper runtime were removed from the active app. A fully bundled, variable-length CTC recognizer now handles English/Finnish, with a neural speech detector for endpointing. Model preparation is moved ahead of practice where possible. A Listening event appears only when audio capture has actually started, and a second Speak tap can end the recording without waiting for its maximum duration.

The Android app uses only an installed, matching-language local TTS voice for pronunciation. Missing language data opens an explicit setup dialog; there is no wrong-language or questionable-recording fallback. The grown-up settings include an offline voice readiness/setup action. Language voices must be downloaded once if absent, then tested without network access.

The interface's existing safe-area/card fixes, content, rewards, player IDs, storage schema and application identity are retained. Install over the previous APK, without uninstalling, to retain progress.
