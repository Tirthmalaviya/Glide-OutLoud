# Update 0.2.1

Install the updated APK over the previous Glide Game installation by dragging it onto the emulator. Application ID and test signing certificate are unchanged, version code is now 2, and existing profiles, sessions, XP and badges remain in the same app-private preferences. Do not uninstall or clear app storage to update.

Changes requested:
- Finnish glide-level labels use a bounded text size and can wrap inside their dashboard cards. Long result tags wrap as well.
- Android insets are applied to a native parent FrameLayout, which sizes the WebView below the status bar/camera cutout and above the gesture bar. This replaces ineffective padding on the WebView itself. Top buttons remain the same controls and appearance.
- Recordings stop after approximately 0.8 seconds of silence after a word or 1.1 seconds after sentence speech, subject to the existing 4/6-second maximum. Quiet recordings receive bounded gain; DC offset and unused silence are removed. Silent/noise-only inputs do not receive a guessed success.
- English uses compact English-only tiny.en Q8 weights; Finnish uses Finnish-NLP's Finnish-tuned tiny weights. The Finnish decoder uses a reduced 768-token audio context, tested on the prompt clips to reduce CPU time. Intel builds now enable Android x86_64 ABI baseline SSE4.2 optimizations; optional AVX instructions are not required.
- All 68 English/Finnish prompt WAV files were replaced with Piper neural voices at the same paths. The Android app stays offline. WebView asset caching is disabled so an update uses the new recordings and CSS.

No target-answer prompt, fuzzy-match shortcut or automatic pass was added to the recognizer. Matching, age levels, content, rewards, profiles and game navigation are unchanged.

Validation: game regression tests and audio-file coverage pass. Independent Java waveform tests cover silence/noise rejection, release timing, trimming, gain and finite/clipped output. Both native architectures and Android Java compile; APK signing, resource compression/alignment and included assets are checked. Synthetic-prompt ASR trials compare decoder settings but are not evidence of accuracy on children or real microphones. Short isolated words, particularly Finnish, remain difficult. Please retest actual speech accuracy and speed, the two top-bar controls and the Finnish dashboard label in your existing emulator.
