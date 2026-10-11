# CE2 Python Practice Arena — V5

A premium static GitHub Pages Python practice website. Optional **Firebase Spark (free, no billing required)** provides a cross-device live leaderboard and owner-only admin analytics. **No Supabase, no paid APIs, no AI calls at runtime, no Blaze.**

## Features

- 379 existing Python MCQs and answers, inspired by first-sem Programming Fundamentals lab topics. Practice questions are not official university exam questions.
- 60 MCQs per mock exam, 45 minutes, marks out of 15, randomized answers/questions, automatic submission, explanatory review.
- Balanced mock exam difficulty: 18 easy / 30 medium / 12 hard.
- Unlimited practice, learning modules, mistakes review, trap lab and quick revision.
- CSS-based 3D welcome intro with reduced-motion support, premium dark UI, mobile slide-in sidebar.
- Local browser persistence for attempts and progress.
- Optional Firebase live leaderboard (top 50 best scores), nickname entry, anonymous student login.
- Authenticated admin page with private latest-200 attempts, marks, student and topic performance.

## Run / deploy

```bash
python -m http.server 5173
# open http://localhost:5173/
```

Node.js is only used for optional tests and static build:

```bash
npm run check
npm run build
```

For existing GitHub Pages: extract ZIP and upload all root files into the existing repository, preserving paths; **Settings → Pages → main branch → /(root)**. Do not upload ZIP itself. This project has relative URLs that work within a GitHub Pages repository subpath. The `.github/workflows/` workflow is optional; your branch deployment setting works without it.

**Firebase setup:** See [`FIREBASE-SPARK-SETUP.md`](./FIREBASE-SPARK-SETUP.md). By default, `src/firebase-config.js` contains placeholders; the site works completely as a LOCAL/OFFLINE-READY quiz and shows the local leaderboard until you configure the Firebase project and publish database rules. **Actual offline use still requires the initial page/questions to be loaded or cached by the browser; it is not a service-worker-powered offline PWA.**

## Architecture and security

- `src/app.js`: SPA routing, quizzes, score review, admin and leaderboard screens.
- `src/engine.js`: question shuffling, exam selection, scoring, timers.
- `src/storage.js`: local saved history, exam resume.
- `src/cloud.js`: optional Firebase Auth and Firestore integration via official CDN modules; imported only if configured.
- `src/firebase-config.js`: **public** client config + admin UID placeholder; no admin secret/password.
- `firestore.rules`: restrictive rules that separate public best scores from per-exam data.
- `data/questions.json`: separate question bank.
- `tests/`: engine and static integration tests.

The admin is protected with Firebase Authentication and Firestore rules. Public nickname/score data remains viewable by anyone (as intended). This is **not cheat-resistant**: users may tamper with client-submitted scores. No trusted grading or official user verification is provided.

## Testing limits

Automated tests verify quiz question bank schema, uniqueness, score math, 60-question selection and 18/30/12 distribution, answer shuffle, and timer utility. Syntax and build checks pass. Real Firebase permissions/sign-ins/read/write, iPhone Safari layout, and full browser end-to-end tests have NOT been verified without a live Firebase project and device/browser test environment. Do not assume these are production-vetted until tested.

## V6 redesign (October 2026)

V6 introduces the Spectrum Arena visual system: stronger typographic hierarchy, violet/teal glow accents, refined cards and controls, redesigned hero, and a lightweight CSS 3D intro with animated aurora, orbit paths, and particles. All learning content, exams, scores, Firebase interactions, Firestore rules, and admin workflows retain their V5 implementation.

**GitHub Pages update:** Commit the root `index.html`, `src/`, `data/`, `.github/`, and other project files into the existing repository. The included Pages workflow rebuilds from root; do not use a second Firebase Hosting project. The `dist/` folder is included for convenience.

**Responsive targets:** Media queries cover 320–350px phones, 350–420px, 420–700px, 700–960px tablets, standard laptops and wide desktops. Phones/tablets use a slide-in sidebar, not a bottom navbar. Reduced motion disables major decorative animations.

**Validation:** `npm run check` passes eight automated checks, including 60-question exam scoring and Firebase structure. `npm run build` passes. Headless Chromium launched, but navigation to the local test server was blocked by the environment (`ERR_BLOCKED_BY_ADMINISTRATOR`), so device-specific visual inspection and genuine multi-device Firebase writes were **not** verified here. Test physical Safari/iPhone and Android Chrome after deployment.

**Firebase:** `src/firebase-config.js` contains the public web SDK configuration already in the V5 live GitHub repository (not a privileged service key). Private admin sign-in still uses Firebase Authentication plus Firestore rules. Do not publish passwords or Firebase service-account keys. No paid plan, no Firebase Hosting, and no runtime AI services are added.
