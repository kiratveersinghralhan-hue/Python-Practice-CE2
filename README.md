# CE2 Python Practice Arena — V3

A premium, mobile-first, fully static Python CE2 practice website.

## What's included

- 379 MCQs covering core Python, tricky output questions, f-strings, `input()`, technical terms, mutability, algorithms, pseudocode and lab-style programs.
- 60-question timed exams (45 minutes, 15 marks total), with a **fixed difficulty distribution of 18 easy + 30 medium + 12 hard**.
- Unlimited topic-wise practice and exam retakes; options and questions shuffled independently each session.
- Instant explanations in practice, full answer review after exams, mistake-review mode.
- 12 concise Python Foundations lessons, an Exam Trap Lab, and quick-revision notes.
- CSS-based animated 3D welcome cube (no external 3D library; reduced-motion compatible), refined button interactions.
- Saves history, exam attempts, nickname and mistakes in local browser storage.
- A **local-only leaderboard**; names and scores do not sync between devices. No Supabase, server, runtime AI or login.

### Reference material

The V3 question categories and learning content were informed by the uploaded university lab bundle, including programs for even/odd, divisibility, grading, loops, digits, factorial, palindrome, prime, perfect and Armstrong numbers. Lab material informs the practice scope; these are **not official exam questions**.

## Run locally

Requires Python 3 and a modern browser.

```bash
python -m http.server 5173
```

Then open `http://localhost:5173/`. Don't double-click `index.html` from your filesystem because the browser blocks JSON loading in that context.

Node.js is only needed for tests/build:

```bash
npm test
npm run build
```

## GitHub Pages deployment — easiest

1. Extract the ZIP and upload the folder **contents** to the root of your existing GitHub repository, preserving `src/`, `data/`, `tests/`, `scripts/` and other paths.
2. Go to **Settings → Pages**.
3. Select **Deploy from a branch**, `main`, `/(root)`, then Save.
4. Wait for Pages to finish; visit your existing repository Pages URL.
5. `index.html` uses relative paths, so it works under a GitHub repository subpath.

For updates, replace files with the same relative paths and commit.

## How questions work

- Questions live in `data/questions.json`, separate from UI components.
- Each question has `id`, `topic`, `prompt`, four `options`, `correct` (zero-based index), `explanation`, `difficulty`, and optional `code`.
- Engine lives in `src/engine.js`, UI in `src/app.js`, styling in `src/style.css`, persistence in `src/storage.js`.
- `scripts/build.mjs` copies the static deployable files into `dist/`.
- The exam uses 18 easy, 30 medium and 12 hard questions per 60 MCQ attempt.

## Verification and limitations

- Automated Node tests validate the bank schema/uniqueness, exam maximum score, unanswered scoring, shuffling, timer calculations, and difficulty distribution.
- App JavaScript syntax and static build are checked before delivery.
- Original and new questions need additional independent editorial review; passing schema tests does **not** prove each explanation is pedagogically perfect.
- Full physical-device (iPhone) and browser end-to-end QA was not completed in this environment.
- The leaderboard exists only in localStorage; clearing browser data deletes local results. There is no cross-device or anti-cheat synchronization.
- Questions are revision material, not sourced from an official CE2 examination.
