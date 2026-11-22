# Glide Game 1.0.1 — name change only

This is the user-approved 1.0.0 application renamed to **Glide Game**. The launcher label, app titles, English/Finnish branding labels, report title, suggested backup filename and project documentation use the new name. Version code 5 identifies this update.

The app ID, signing certificate, saved-data keys, bridge/event identifiers and backup format remain stable to support updating the existing installation and opening previous backups. Some internal identifiers therefore retain the old spelling; they are not displayed as the app name.

The speech models, native libraries, four speech implementation/helper source files, capture method, vocabulary, exercise selection, settings, scoring, layout and assets are unchanged. Shared app.js differs only in display text. Native Java classes were rebuilt from the same source with only the branding strings changed. Android Studio can also rebuild the included source using the existing Gradle configuration.

Checked on 22 November 2026: 514 existing game/content checks and 581 existing data/selection checks passed. Source/binary comparisons confirm the narrow rename; model hashes, assets, resource/native alignment, APK signature and update-certificate identity were verified. A new physical-device run was not performed here.

Install the APK over the existing app. Do not uninstall or clear app storage. Existing profiles and progress use the same storage identity. The source folder is now GlideGameAndroid; open that folder in Android Studio.
