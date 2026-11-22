# Third-party components in 0.2.2

- ONNX Runtime Android 1.23.2, Microsoft, MIT. Maven com.microsoft.onnxruntime:onnxruntime-android:1.23.2. Native binaries are provided by Microsoft for arm64-v8a and x86_64. See licenses/ONNX_RUNTIME_MIT.txt and ONNX_RUNTIME_THIRD_PARTY_NOTICES.txt.
- English recognition: Meta/Facebook wav2vec2-base-960h, Apache 2.0, https://huggingface.co/facebook/wav2vec2-base-960h . Model card included in licenses/ASR_EN_MODEL_CARD.md.
- Finnish recognition: Finnish-NLP/wav2vec2-base-fi-voxpopuli-v2-finetuned, Apache 2.0, https://huggingface.co/Finnish-NLP/wav2vec2-base-fi-voxpopuli-v2-finetuned . Model card included in licenses/ASR_FI_MODEL_CARD.md.
- Modifications to recognition models: exported to ONNX opset 17 and dynamically quantized MatMul weights (signed int8, per-channel, reduced range). No training or exercise-target prompt was added. The optional KenLM language model was not included. Checksums and sizes of all shipped model files are in MODEL_ARTIFACTS.json. Apache 2.0 license is in licenses/APACHE_2_0.txt.
- Silero VAD, snakers4/silero-vad, MIT, https://github.com/snakers4/silero-vad . Unmodified ONNX model included for speech/silence detection. License in licenses/SILERO_VAD_MIT.txt.
- Pronunciation uses the user's installed Android offline text-to-speech voice. Android voice engines and voice data are not redistributed. No Piper, MMS, eSpeak, Whisper or unverified recorded pronunciation assets are shipped in the updated Android app.
- Two CC0 Finnish human recordings are included only as test fixtures, not as in-app prompt voices. Attribution is in tests/fixtures/ATTRIBUTION.md.
- Gradle wrapper 8.13: Apache 2.0, https://github.com/gradle/gradle/tree/v8.13.0 .
- Existing design, original word lists and artwork supplied by the project owner remain the property of their respective owners.
