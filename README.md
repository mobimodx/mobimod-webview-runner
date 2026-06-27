# Mobimod WebView Runner

Config-driven **Capacitor** Android shell. It renders the **exact same `app-shell`** that the
web builder preview (`/v2/builder`) uses, so the Android output is **pixel-identical to the preview**.

`src/shell/*` is a copy of `mobimod/src/lib/appshell/*` (the single source of truth). Keep them in sync
(`cp ../mobimod/src/lib/appshell/* src/shell/`).

## How a build happens (end to end)

1. User designs in the web builder → clicks **APK & AAB oluştur**.
2. Backend saves the project and calls GitHub **`repository_dispatch`** (event `build-app`) on THIS repo,
   with `client_payload = { projectId, buildId, configUrl }`.
3. `.github/workflows/build.yml`:
   - downloads `configUrl` → `src/app-config.json`
   - `npm ci` → `apply-config` → `vite build` → `cap add android` → Gradle
   - **always** builds an installable **debug APK** (no secrets required)
   - if a keystore secret is present, also builds a **signed release AAB + APK**
   - publishes a GitHub Release with the artifacts and **notifies the backend** (`/result`) with the download URLs.
4. Builder polls status and shows the **APK / AAB download** buttons.

## One-time setup

### A) This runner repo (GitHub)
Push this folder to a new GitHub repo. Add repo **Secrets**:

| Secret | Required | Purpose |
|---|---|---|
| `BACKEND_URL` | yes | e.g. `http://72.62.43.54` — where to POST build results |
| `BUILD_WEBHOOK_SECRET` | yes | shared secret, must equal backend env `BUILD_WEBHOOK_SECRET` |
| `ANDROID_KEYSTORE_BASE64` | for release | `base64 -w0 release.jks` |
| `STORE_PASSWORD` / `KEY_ALIAS` / `KEY_PASSWORD` | for release | keystore creds |

> Debug APK builds with **no** keystore — real, installable output works immediately.
> Release AAB (for Google Play) needs the keystore secrets above.

Create a keystore once:
```
keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mobimod
base64 -w0 release.jks   # -> ANDROID_KEYSTORE_BASE64
```

### B) Backend (mobimod) env
Set on the server (`.env` / PM2 env), then restart:

| Env | Purpose |
|---|---|
| `GH_RUNNER_REPO` | `owner/repo` of THIS runner repo |
| `GH_TOKEN` | GitHub PAT with `repo` scope (to dispatch the workflow) |
| `BUILD_WEBHOOK_SECRET` | same value as the runner secret |
| `NEXT_PUBLIC_SITE_URL` | public base URL (used to build `configUrl`) |

When these are set, the builder's **APK & AAB oluştur** triggers a real GitHub Actions build.
Without them, projects are saved and marked **queued** (pipeline simply not connected yet).

## Local test
```
npm ci
curl -fsSL "<configUrl>" -o src/app-config.json   # or edit src/app-config.json
npm run apply-config && npm run build
npx cap add android && npx cap sync android
cd android && ./gradlew assembleDebug              # -> app-debug.apk
```

## Manual run (no backend)
Actions tab → **build-app** → *Run workflow* → paste a `configUrl`
(e.g. `http://72.62.43.54/api/builder/projects/<id>/config`).
