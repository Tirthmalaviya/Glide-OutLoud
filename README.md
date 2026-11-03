# Wanderwild

Speech-therapy and hand-skill games for children aged 3–10, in English and Finnish.
Turku University of Applied Sciences student project for Outloud (Wanderwild concept).

- **9 separate games.** Speech: Say It, Listen & Find, Owl's Mistakes, Sound Balloons, Mouth Gym.
  Hand skills: Trace the Trail, Draw Shapes, Bubble Pop, Two-Hand Helper.
- **Start-up flow:** splash → welcome (language) → permissions → *Who is playing?* (several children) → how to play → games.
- **Parent mode** (behind a simple sum): progress per game, words to practise, voice speed, speech-check strictness, players.
- **Speech recognition**, best available first:
  1. Microsoft Azure pronunciation assessment (scores every sound 0–100). Needs a key and the local server.
  2. Chrome / Edge built-in recognition.
  3. Android's recogniser in the APK.
  4. Tap answers when no microphone is available.

> Practice tool, not a clinical assessment. Content should be reviewed by a speech therapist and an occupational therapist before use with clients.

---

## Step 1 — Run it on your laptop (localhost)

You need **Node.js 18 or newer** (https://nodejs.org, choose *LTS*) and **Google Chrome** or **Microsoft Edge**.

1. Download or clone this repository.
2. Start the server:
   - **Windows:** double-click `start-windows.bat`.
   - **Mac:** double-click `start-mac.command`. The first time, right-click it and choose *Open*.
   - **Any system:** open a terminal in this folder and run `npm start` (or `node server.js`).
3. Chrome opens **http://localhost:8080**. If it doesn't, type the address yourself.
4. Allow the microphone when asked. `localhost` counts as a secure address, so the microphone works.
5. Stop the server with **Ctrl + C** in the terminal window.

Without an Azure key, the terminal says *“Speech: Chrome built-in recognition”*. Everything works, using Google's recogniser through Chrome.

## Step 2 — Turn on Azure speech recognition (pronunciation scores)

Azure checks *how well each sound was said*, not only which word was heard. It supports **en-US** and **fi-FI**.

1. Sign in at **https://portal.azure.com**. Students can use *Azure for Students*, which gives free credit and needs no card.
2. Click **Create a resource**, search for **Speech**, then **Create**.
   - Resource group: create one, for example `wanderwild`.
   - Region: **West Europe** or **North Europe**. Keep children's voices in the EU.
   - Name: for example `wanderwild-speech`.
   - Pricing tier: **Free F0**.
3. Click **Review + create**, then **Create**, then **Go to resource**.
4. Open **Keys and Endpoint**. Copy **KEY 1** and the **Location/Region** (for example `westeurope`).
5. In this folder, copy `.env.example` to a new file called **`.env`** and fill it in:
   ```
   AZURE_SPEECH_KEY=paste-key-1-here
   AZURE_SPEECH_REGION=westeurope
   ```
6. Restart the server. The terminal now says *“Speech: Microsoft Azure (region westeurope)”*.
7. Check it in the app: **Profile → Parent mode → Test the microphone**. The speech recognition line shows *Microsoft Azure pronunciation assessment*.

How it works:
- The key stays in `.env` on your computer. `.env` is listed in `.gitignore`, so it is never uploaded to GitHub.
- The browser only receives a 10-minute token from `http://localhost:8080/api/speech-token`.
- In *Say It*, a word counts when Azure recognises it **and** its accuracy score is at least **60** (*Gentle*) or **80** (*Strict*).
- If the score is low, the child is told which sound to practise.
- The owl's voice becomes a natural neural voice: `en-US-AnaNeural` (a child voice) or `fi-FI-NooraNeural`.

If the key is wrong or missing, the app quietly falls back to Chrome recognition. The terminal prints *“Speech token failed”*.

## Step 3 — Put it on GitHub

### 3a. Create the repository
1. On https://github.com, click **New repository**.
   - Name: `wanderwild`.
   - Visibility: **Public**. GitHub Pages and release downloads are free for public repositories.
   - Don't add a README. This folder already has one.
2. Upload the code, choosing **one** way:
   - **Website, no tools:** on the new repository page, use *uploading an existing file*. Drag in everything in this folder **except** `.env`, then click **Commit changes**.
     Note: the website can't upload the hidden `.github` folder. Use GitHub Desktop or git if you want the automatic website and APK.
   - **GitHub Desktop** (https://desktop.github.com): *File → Add local repository →* this folder → *Publish repository*.
   - **Terminal:**
     ```
     git init
     git add .
     git commit -m "Wanderwild prototype"
     git branch -M main
     git remote add origin https://github.com/<your-user>/wanderwild.git
     git push -u origin main
     ```
3. Give your supervisors access: **Settings → Collaborators → Add people**.

### 3b. Publish the web app (GitHub Pages)
1. In the repository, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Open the **Actions** tab. The *Deploy web app to GitHub Pages* workflow runs on every push to `main`. You can also start it by hand with *Run workflow*.
3. When it is green, the app is live at **https://&lt;your-user&gt;.github.io/wanderwild/**.
   It works on phones, tablets and laptops in Chrome, and the microphone works because the address is https.
   The hosted version uses Chrome recognition. Azure needs the server from Step 2; see *Hosting Azure online* below.

### 3c. Build the APK and get a phone download link
The *Build Android APK* workflow builds the app on GitHub's computers. Nothing needs installing.

- **Every push:** open **Actions → Build Android APK → the latest run**. Download **Wanderwild-apk** under *Artifacts*. You need to be signed in.
- **Public download link:** create a version tag. GitHub then makes a **Release** with the APK attached.
  - Website: **Releases → Draft a new release → Choose a tag →** type `v1.0.0` **→ Create new tag → Publish release**.
  - Or in a terminal: `git tag v1.0.0 && git push origin v1.0.0`.
  - A minute later the link works for anyone, on any phone:
    **https://github.com/&lt;your-user&gt;/wanderwild/releases/latest/download/Wanderwild.apk**
  - For each new version, use a new tag (`v1.0.1`, `v1.1.0`, …). The *latest* link always gives the newest APK.

## Step 4 — Install on an Android phone
1. Open the download link (or the APK file) on the phone, then **Download → Open**.
2. Android asks to allow installs from this source (Chrome, Files or Drive). Allow it once, then tap **Install**.
3. Set up speech once:
   - **Settings → System → Languages → Speech recognition / Voice input**: make sure *Speech Services by Google* is on, and download **English** and **Finnish** for offline use.
   - **Text-to-speech output**: install **English** and **Finnish** voices.
4. Updating: install the new APK over the old one. Players and progress are kept. Don't uninstall first.

The APK is a **test build** signed with the standard debug key. Before publishing on Google Play, create a private signing key in Android Studio (*Build → Generate Signed App Bundle*).

## Step 5 — Change the app

| What | Where |
|---|---|
| Words, sound pairs, sentences, mouth moves, shapes | `web/js/content.js` |
| Games and their levels | `web/js/lesson.js` |
| How each exercise works | `web/js/exercises.js` |
| Screens (start-up, menu, parent mode) | `web/js/app.js` |
| Speech recognition and answer checking | `web/js/speech.js`, `web/js/azure.js` |
| Balloon sound detector | `web/js/voice.js` |
| Colours, sizes, animations | `web/css/app.css` |
| Android shell (microphone, voice, recogniser, storage) | `android/app/src/main/java/fi/wanderwild/app/MainActivity.java` |

The Android app always contains the current `web/` folder; it is copied in at build time.
To build it yourself: install **Android Studio**, choose *Open* → the `android` folder, wait for Gradle sync, then *Run*.

## Step 6 — Tests
- `npm test`: speech-matching rules. These also run automatically on GitHub.
- `npm run e2e`: plays the whole app in a headless browser and takes about 25 minutes. It covers the start-up flow, every game and level, wrong answers, players, parent mode, the back button, layouts at five screen sizes, and the speech engines (with stand-ins).
  - First run `pip install playwright` and `python -m playwright install chromium`.
  - Start the server, then run the tests.

## Hosting Azure online (optional, later)
GitHub Pages only serves files. It can't keep the Azure key secret. To use Azure on the hosted version, run `server.js` on a small server and set `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` as environment variables, never in the code. Examples: Azure App Service (Free F1 plan), Render or Railway. Then open the app from that server's address.

## Privacy
- **Progress:** stays on the device, in the browser's storage or the Android app's private storage.
- **Voice:** with Azure, Chrome or Android's Google recogniser, the child's voice is sent to Microsoft or Google to be recognised. The app itself stores no recordings.
- **Before testing with children:** get the parents' written permission, use an EU region for Azure, and follow your school's data-protection guidance.

## Licences of included parts
Fluent Emoji Flat pictures (Microsoft, MIT), Baloo 2 and Nunito fonts (SIL OFL 1.1), Microsoft Cognitive Services Speech SDK (MIT). See `licenses/`.
