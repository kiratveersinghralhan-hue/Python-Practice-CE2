# CE2 Python Practice Arena

Free, static, mobile-first Python exam practice site. No sign-in, backend, paid APIs, or database required.

## Features

- 250+ structured MCQs, shuffled questions and shuffled answer options
- 10-question guided practice with explanations; topic and difficulty filters
- 60-question mock exams, 45-minute timer, score up to 15, automatic timeout submission, answer review
- Mistake review, revision notes, history, progress stats, weak-area recommendations
- Named, **local-only** leaderboard. All saved names/scores remain in each student's browser and **cannot be seen by other devices**. An online/shared leaderboard requires a server or third-party service.

## Run locally

You need Python 3, or any static development server. From this folder:

```sh
python -m http.server 5173
```

Open http://localhost:5173 . Do not open `index.html` using `file://`; the question bank is fetched over HTTP.

## Tests and build

Install Node.js 20+. No dependencies or npm install needed.

```sh
npm test
npm run check
npm run build
```

`dist/` is the published static folder. The question generator is `scripts/generate_bank.py` and requires Python 3; it checks printed outputs by executing the snippets. **Do not run arbitrary user-submitted question code** in that generator.

## GitHub Pages deployment (free)

1. Create a new **public** GitHub repository such as `ce2-python-practice-arena`.
2. Upload the ZIP's **contents** (not the ZIP itself) to the repository root, including `.github/workflows/deploy.yml`.
3. Commit to the `main` branch.
4. In **Settings → Pages → Build and deployment**, set **Source: GitHub Actions**.
5. Go to **Actions** and verify the `Deploy static arena` workflow succeeds. The Pages URL will look like `https://USERNAME.github.io/ce2-python-practice-arena/`.
6. For future edits, commit and push again; the workflow redeploys automatically.

## User data and privacy

Scores, answers, history and nickname are persisted in browser localStorage. Clearing site data, using incognito, or changing devices loses access to that copy. The exam timer deadline is saved and recalculated from the real time after refresh, but the app cannot submit or notify while the tab is closed; submission occurs when the app is opened again. This is not a proctored or tamper-proof exam.

## Content and testing limitations

Questions are **original practice questions, not official CE2 questions**. Generated output-tracing examples were run with Python at generation time. Automated checks validate structure, unique prompts/code pairs, quiz selection, scoring and timer arithmetic. Browser visual regression, Safari hardware testing, full independent educational peer review of explanations, accessibility audit, and full exam end-to-end automated browser coverage have **not** been performed. For a high-stakes exam, independently review question content.

## Adding questions

Edit `data/questions.json` with `{ "id": "unique-id", "topic": "...", "difficulty": "easy", "prompt": "...", "code": "optional Python", "options": ["A","B","C","D"], "correct": 0, "explanation": "..." }`. `correct` is zero-based. Run `npm test` after changes.
