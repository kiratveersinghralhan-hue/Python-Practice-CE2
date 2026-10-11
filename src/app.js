import { createQuiz, createBalancedExam, scoreQuiz, secondsLeft, formatTime, EXAM_SIZE, EXAM_SECONDS } from './engine.js';
import { read, write, remove, saveResult, leaderboard } from './storage.js';
import * as cloud from './cloud.js';

const app = document.querySelector('#app');
let bank = [];
let quiz = null;
let answers = [];
let index = 0;
let mode = '';
let deadline = 0;
let startedAt = 0;
let currentTopic = 'all';
let currentDifficulty = 'all';
let nickname = read('nickname', '');
let ticker = null;
let navigationEvents = new AbortController();
let latestResult = null;

const TOPIC_PRACTICE_MAP = {
  0: 'Input, types & f-strings',
  1: 'Variables & operators',
  2: 'Boolean & comparison',
  3: 'Conditions',
  4: 'For loops & range',
  5: 'While loops',
  6: 'Break, continue & pass',
  7: 'Syntax & debugging',
  8: 'Algorithms & pseudocode',
  9: 'Mutable vs immutable',
  10: 'Technical terms',
  11: 'Lab programs',
};

const lessons = [
  {
    title: 'Input, types & f-strings',
    description:
      'input() returns a string by default. Convert it when needed, then use f-strings to print neat, readable output.',
    code: `name = input("Enter name: ")\nage = int(input("Enter age: "))\nprint(f"{name} will be {age + 1} next year.")`,
    trap: 'Common trap: input() does not automatically return an int. If you add two raw inputs, Python joins text instead of adding numbers.',
  },
  {
    title: 'Variables & operators',
    description:
      'Variables store values. Operators like +, -, *, /, // and % work differently, so learn what each one actually returns.',
    code: `x = 17\nprint(x / 5)\nprint(x // 5)\nprint(x % 5)`,
    trap: 'Students often confuse / with //. The first gives true division; the second gives floor division.',
  },
  {
    title: 'Boolean logic & comparisons',
    description:
      'Use comparison operators with and, or, and not. Solve questions by checking each condition separately first.',
    code: `x = 7\nprint(x > 5 and x < 10)\nprint(not (x == 7))`,
    trap: 'Do not guess. Evaluate both comparison parts first, then apply and/or/not.',
  },
  {
    title: 'if, elif, else',
    description:
      'Selection statements help Python choose between alternatives. Indentation decides which statements belong to each branch.',
    code: `marks = 72\nif marks >= 80:\n    print("A")\nelif marks >= 60:\n    print("B")\nelse:\n    print("C")`,
    trap: 'elif runs only if earlier conditions were false. = is assignment; == is comparison.',
  },
  {
    title: 'for loops & range()',
    description:
      'range(start, stop, step) excludes the stop value. Many CE2 questions are built on that single rule.',
    code: `for i in range(2, 10, 3):\n    print(i)`,
    trap: 'The stop value is never printed. For the example above, the output is 2, 5, 8.',
  },
  {
    title: 'while loops',
    description:
      'A while loop runs while its condition stays true. Update the loop variable correctly or the loop may never stop.',
    code: `x = 5\nwhile x > 0:\n    print(x)\n    x -= 1`,
    trap: 'If you forget x -= 1, the loop becomes infinite because the condition never changes.',
  },
  {
    title: 'break, continue & pass',
    description:
      'break exits a loop, continue skips the current iteration, and pass does nothing but keeps syntax valid.',
    code: `for i in range(5):\n    if i == 2:\n        continue\n    print(i)`,
    trap: 'continue does not end the loop. It skips only the rest of the current iteration.',
  },
  {
    title: 'Strings, indexing & small output traps',
    description:
      'Strings support indexing and slicing. Remember that the first character is at index 0.',
    code: `word = "python"\nprint(word[0])\nprint(word[-1])\nprint(word[1:4])`,
    trap: 'Negative indexes count from the end. Slices exclude the stop index just like range().',
  },
  {
    title: 'Algorithms & pseudocode',
    description:
      'An algorithm is a step-by-step solution. Pseudocode helps you plan program logic before writing Python syntax.',
    code: `START\nINPUT n\nsum = 0\nFOR i = 1 TO n\n    sum = sum + i\nOUTPUT sum\nSTOP`,
    trap: 'Do not treat pseudocode like exact Python syntax. Focus on the logical steps: input → process → output.',
  },
  {
    title: 'Mutable vs immutable',
    description:
      'Lists are mutable, but strings, numbers and tuples are immutable. This changes how assignments behave.',
    code: `a = [1, 2]\nb = a\nb.append(3)\nprint(a)`,
    trap: 'Because both names refer to the same list, changing b also changes a.',
  },
  {
    title: 'Technical terms that appear in viva and MCQs',
    description:
      'Know identifiers, literals, keywords, operators, operands, expressions, statements, and comments.',
    code: `total_marks = 50\n# total_marks is an identifier\n# 50 is a literal`,
    trap: 'Keywords such as for, if and class cannot be used as identifiers.',
  },
  {
    title: 'Lab-style number programs',
    description:
      'Many first-sem questions come from common lab tasks: prime, palindrome, factorial, sum of digits, Armstrong number, and more.',
    code: `n = 153\ns = 0\ntemp = n\nwhile temp > 0:\n    digit = temp % 10\n    s += digit ** 3\n    temp //= 10\nprint(s == n)`,
    trap: 'For number problems, % extracts the last digit and // removes the last digit.',
  },
];

const revisionCards = [
  ['input() by default', 'input() returns a string. Use int(input()) or float(input()) when numerical calculation is needed.'],
  ['Identifier rules', 'Valid identifiers can use letters, digits and underscores, but cannot start with a digit or use spaces/hyphens.'],
  ['Mutable vs immutable', 'Lists and dictionaries are mutable. Strings, tuples, ints and floats are immutable.'],
  ['Algorithm vs pseudocode', 'An algorithm is the logic. Pseudocode is a human-readable way to write that logic before actual code.'],
  ['Common error names', 'SyntaxError = invalid syntax; IndentationError = wrong block spacing; TypeError = invalid type usage; NameError = undefined name.'],
  ['Loop boundaries', 'range(start, stop, step) excludes stop. Count loop iterations carefully before answering output questions.'],
  ['Digit problems', 'Use % 10 to get the last digit and // 10 to remove the last digit.'],
  ['f-strings', 'Use f"..." and write variables or expressions inside {} braces.'],
  ['Tracing output', 'Go line by line. Update one variable at a time. Never jump straight to the final option.'],
  ['Logical errors', 'Code can run successfully and still be wrong. That is a logical error, not a syntax/runtime error.'],
];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function topics() {
  return [...new Set(bank.map((q) => q.topic))].sort();
}

function history() {
  return read('history', []);
}

function mistakesSet() {
  return new Set(read('mistakes', []));
}

function stats() {
  const h = history();
  const attempted = h.reduce((sum, r) => sum + (r.answered || 0), 0);
  const correct = h.reduce((sum, r) => sum + (r.correct || 0), 0);
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const exams = h.filter((r) => r.mode === 'exam').length;
  return { attempted, accuracy, exams };
}

function weakTopics() {
  const topicStats = new Map();
  for (const attempt of history()) {
    for (const detail of attempt.details || []) {
      const key = detail.question.topic;
      if (!topicStats.has(key)) topicStats.set(key, { total: 0, wrong: 0 });
      const row = topicStats.get(key);
      row.total += 1;
      if (!detail.isCorrect) row.wrong += 1;
    }
  }
  return [...topicStats.entries()]
    .filter(([, item]) => item.total >= 2)
    .sort((a, b) => b[1].wrong / b[1].total - a[1].wrong / a[1].total)
    .slice(0, 4);
}

function shouldShowIntro() {
  try {
    return !sessionStorage.getItem('ce2arena_intro_seen');
  } catch {
    return false;
  }
}

function dismissIntro(remember = true) {
  try {
    if (remember) sessionStorage.setItem('ce2arena_intro_seen', '1');
  } catch {}
  document.querySelector('.intro-overlay')?.classList.add('hidden');
}

function attachIntroEvents() {
  document.querySelector('#enter-arena')?.addEventListener('click', () => dismissIntro(true));
  document.querySelector('#skip-intro')?.addEventListener('click', () => dismissIntro(true));
}

function shell(body, active = 'dashboard', { showIntro = false } = {}) {
  navigationEvents.abort();
  navigationEvents = new AbortController();
  document.body.classList.remove('nav-open');
  app.innerHTML = `
    <div class="layout">
      <div class="sidebar-backdrop" id="sidebar-backdrop" aria-hidden="true"></div>
      <aside class="sidebar" id="app-sidebar" aria-label="Main navigation">
        <div class="mobile-sidebar-head"><span>EXPLORE ARENA</span><button type="button" id="close-sidebar" class="sidebar-icon-btn" aria-label="Close navigation">✕</button></div>
        <a class="brand" href="#dashboard">
          <span class="brand-icon">⌘</span>
          <span>CE2<span class="brand-muted"> / PYTHON</span><small>THE PRACTICE ARENA</small></span>
        </a>
        <div class="side-label">WORKSPACE</div>
        <nav>
          ${[
            ['dashboard', '◫', 'Overview'],
            ['practice', '◇', 'Practice'],
            ['exam', '◷', 'Mock exam'],
            ['mistakes', '↻', 'Mistake review'],
            ['leaderboard', '♛', 'Leaderboard'],
            ['learn', '✧', 'Python foundations'],
            ['traplab', '⚡', 'Exam trap lab'],
            ['revision', '▤', 'Quick revision'],
            ['admin', '⚙', 'Admin analytics'],
          ].map(([id, icon, label]) => `<a href="#${id}" class="nav-link ${active === id ? 'active' : ''}"><span>${icon}</span>${label}</a>`).join('')}
        </nav>
        <div class="sidebar-foot"><span class="online-dot"></span> Offline ready <small>Progress saved on this device</small></div>
      </aside>
      <main class="main">
        <header class="topbar">
          <button type="button" id="open-sidebar" class="sidebar-icon-btn menu-toggle" aria-label="Open navigation" aria-controls="app-sidebar" aria-expanded="false"><span class="menu-lines"><i></i><i></i><i></i></span></button>
          <div class="crumb">ARENA <span>/</span> ${esc(active.toUpperCase())}</div>
          <div class="top-right">
            <span class="local-pill">${cloud.configured() ? "◉ FIREBASE READY" : "◉ OFFLINE MODE"}</span>
            <span class="avatar">${esc((nickname || 'G')[0].toUpperCase())}</span>
          </div>
        </header>
        <div class="content">${body}</div>
      </main>
    </div>
    ${showIntro ? introMarkup() : ''}
  `;
  attachSidebarEvents();
  if (showIntro) attachIntroEvents();
}

function attachSidebarEvents() {
  const sidebar = document.querySelector('#app-sidebar');
  const backdrop = document.querySelector('#sidebar-backdrop');
  const opener = document.querySelector('#open-sidebar');
  const closer = document.querySelector('#close-sidebar');
  let lastFocus = null;
  const setOpen = (open) => {
    const visible = open && window.matchMedia('(max-width: 960px)').matches;
    sidebar.classList.toggle('is-open', visible);
    backdrop.classList.toggle('is-open', visible);
    document.body.classList.toggle('nav-open', visible);
    opener.setAttribute('aria-expanded', String(visible));
    sidebar.inert = !visible && window.matchMedia('(max-width: 960px)').matches;
    if (visible) { lastFocus = document.activeElement; closer.focus(); }
    else if (open === false && lastFocus && lastFocus.isConnected) { lastFocus.focus(); lastFocus = null; }
  };
  opener.addEventListener('click', () => setOpen(true));
  closer.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  sidebar.querySelectorAll('nav a, .brand').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  const onKeydown = (event) => {
    if (!sidebar.classList.contains('is-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
    if (event.key === 'Tab') {
      const items = [...sidebar.querySelectorAll('button:not([disabled]), a[href]')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', onKeydown, { signal: navigationEvents.signal });
  const query = window.matchMedia('(max-width: 960px)');
  const onResize = () => {
    if (!query.matches) { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-open'); document.body.classList.remove('nav-open'); sidebar.inert = false; opener.setAttribute('aria-expanded', 'false'); }
    else sidebar.inert = !sidebar.classList.contains('is-open');
  };
  query.addEventListener('change', onResize, { signal: navigationEvents.signal });
  onResize();
}

function introMarkup() {
  return `
    <div class="intro-overlay">
      <div class="intro-card">
        <div class="intro-copy">
          <span class="overline">WELCOME / CE2 PYTHON PRACTICE ARENA</span>
          <h1>Practice smarter.<br/><em>Walk in confident.</em></h1>
          <p>An exam-focused Python arena for first-sem students: faster revision, stronger fundamentals, trick-question training, and a smoother prep flow.</p>
          <div class="intro-actions">
            <button class="btn primary" id="enter-arena">Enter arena ↗</button>
            <button class="btn secondary" id="skip-intro">Skip intro</button>
          </div>
          <div class="hero-caption"><span class="sparkle">✦</span> 3D welcome scene · smooth motion · lightweight static site</div>
        </div>
        <div class="intro-scene" aria-hidden="true">
          <div class="scene-glow"></div>
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>
          <div class="intro-cube">
            <div class="cube-face front">{ }</div>
            <div class="cube-face back">if</div>
            <div class="cube-face right">for</div>
            <div class="cube-face left">[]</div>
            <div class="cube-face top">Py</div>
            <div class="cube-face bottom">CE2</div>
          </div>
          <div class="scene-chip chip-a">OUTPUT TRACING</div>
          <div class="scene-chip chip-b">MOCK EXAM</div>
          <div class="scene-chip chip-c">DEBUGGING</div>
        </div>
      </div>
    </div>
  `;
}

function dashboard() {
  clearInterval(ticker);
  const s = stats();
  const recent = history();
  const mistakes = [...mistakesSet()];
  const weak = weakTopics();
  const totalHard = bank.filter((q) => q.difficulty === 'hard').length;
  shell(`
    <div class="eyebrow">YOUR LEARNING SPACE <span class="status-dot"></span></div>
    <section class="hero">
      <div class="hero-copy">
        <span class="overline">FUNDAMENTAL PROGRAMMING • CE2</span>
        <h1>Learn the logic.<br/><em>Own the exam.</em></h1>
        <p>Practice Python the way first-sem university tests actually feel: short code, output tracing, debugging, algorithms, pseudocode, and common trap questions.</p>
        <div class="action-row">
          <button class="btn primary" id="start-practice">Start practicing <span>↗</span></button>
          <button class="btn secondary" id="start-exam">Take mock exam <span>↗</span></button>
        </div>
        <div class="hero-caption"><span class="sparkle">✦</span> ${bank.length} practice questions <span>·</span> ${totalHard} tougher exam-trap questions</div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="code-top"><span>● ● ●</span><span>arena.py</span><span>↗</span></div>
        <pre><span class="purple">def</span> <span class="aqua">crack_ce2</span>():
    topics = [<span class="lime">"logic"</span>, <span class="lime">"tracing"</span>, <span class="lime">"debugging"</span>]
    <span class="purple">for</span> topic <span class="purple">in</span> topics:
        <span class="aqua">practice</span>(topic)
    <span class="purple">return</span> <span class="lime">"exam ready"</span>

<span class="muted"># less panic, more pattern recognition.</span></pre>
        <div class="floating-chip">✓ FIRST-SEM STYLE TRAINING</div>
      </div>
    </section>
    <section class="metrics">
      <div class="metric"><span>QUESTIONS ATTEMPTED</span><strong>${s.attempted}</strong><small>Every answer counts ↗</small></div>
      <div class="metric"><span>OVERALL ACCURACY</span><strong>${s.accuracy}<i>%</i></strong><small>Across all saved sessions</small></div>
      <div class="metric"><span>MOCK EXAMS TAKEN</span><strong>${s.exams}</strong><small>60 questions · 45 minutes</small></div>
      <div class="metric highlight-metric"><span>MISTAKES TO REVISIT</span><strong>${mistakes.length}</strong><a href="#mistakes">Review now →</a></div>
    </section>
    <div class="section-heading"><div><span class="eyebrow">CHOOSE YOUR PATH</span><h2>Train the way you need.</h2></div><span class="subtle">Build confidence, accuracy and speed.</span></div>
    <section class="mode-grid">
      <button class="mode-card" id="mode-practice"><span class="mode-symbol purple-bg">⌘</span><span class="mode-name">Quick practice <span>↗</span></span><span>10 randomized questions with instant feedback and explanations.</span><span class="tag">AT YOUR OWN PACE</span></button>
      <button class="mode-card" id="mode-exam"><span class="mode-symbol teal-bg">◷</span><span class="mode-name">Exam simulation <span>↗</span></span><span>60 questions, 45-minute timer, score out of 15 marks.</span><span class="tag">REAL EXAM FEEL</span></button>
      <button class="mode-card" id="mode-mistakes"><span class="mode-symbol amber-bg">↺</span><span class="mode-name">Mistake review <span>↗</span></span><span>Turn wrong answers into learning and close weak areas.</span><span class="tag">${mistakes.length} TO REVISIT</span></button>
      <button class="mode-card" id="mode-learn"><span class="mode-symbol teal-bg">✧</span><span class="mode-name">Python foundations <span>↗</span></span><span>Lessons on syntax, algorithms, technical terms and core logic.</span><span class="tag">12 GUIDED LESSONS</span></button>
      <button class="mode-card" id="mode-trap"><span class="mode-symbol purple-bg">⚡</span><span class="mode-name">Exam trap lab <span>↗</span></span><span>Special practice for short tricky questions and debugging traps.</span><span class="tag">HIGHER DIFFICULTY</span></button>
      <button class="mode-card" id="mode-revision"><span class="mode-symbol amber-bg">▤</span><span class="mode-name">Quick revision <span>↗</span></span><span>Fast reminders for definitions, rules and common mistakes.</span><span class="tag">LAST-MINUTE READY</span></button>
    </section>
    <section class="lower-grid">
      <div class="panel">
        <div class="panel-head"><h3>Recent activity</h3><a href="#leaderboard">View scores →</a></div>
        ${recent.length ? recent.slice(0, 5).map((r) => `
          <div class="history-line">
            <span class="history-icon">${r.mode === 'exam' ? '◷' : '◇'}</span>
            <div><strong>${r.mode === 'exam' ? 'Mock exam' : 'Practice session'}</strong><small>${new Date(r.date).toLocaleDateString()} · ${r.answered} answered</small></div>
            <b>${r.correct}/${r.total}</b>
          </div>`).join('') : '<div class="empty-small">No saved attempts yet. Start with a practice round.</div>'}
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Weak-topic recommendations</h3><span class="eyebrow">PERSONALISED</span></div>
        ${weak.length ? weak.map(([topic, row]) => `
          <div class="focus-row">
            <div><strong>${esc(topic)}</strong><small>${row.wrong} misses across ${row.total} attempts</small></div>
            <button data-topic="${esc(topic)}">Practice →</button>
          </div>`).join('') : '<div class="empty-small">Practice a few questions to unlock topic-wise recommendations.</div>'}
      </div>
    </section>
    <footer class="footer">CE2 PYTHON PRACTICE ARENA <span>Local-only web app. No signup, no server, no secret keys — just practice.</span></footer>
  `, 'dashboard', { showIntro: shouldShowIntro() });

  const go = (hash) => () => { location.hash = hash; };
  document.querySelector('#start-practice').onclick = go('practice');
  document.querySelector('#start-exam').onclick = go('exam');
  document.querySelector('#mode-practice').onclick = go('practice');
  document.querySelector('#mode-exam').onclick = go('exam');
  document.querySelector('#mode-mistakes').onclick = go('mistakes');
  document.querySelector('#mode-learn').onclick = go('learn');
  document.querySelector('#mode-trap').onclick = go('traplab');
  document.querySelector('#mode-revision').onclick = go('revision');
  document.querySelectorAll('[data-topic]').forEach((button) => {
    button.onclick = () => {
      currentTopic = button.dataset.topic;
      location.hash = 'practice';
    };
  });
}

function setup(kind) {
  clearInterval(ticker);
  const exam = kind === 'exam';
  shell(`
    <div class="eyebrow">${exam ? 'EXAM SIMULATION' : 'PRACTICE LAB'}</div>
    <div class="page-title"><h1>${exam ? 'Your next mock exam.' : 'Customize your practice.'}</h1><p>${exam ? 'Exactly 60 MCQs · 45-minute timer · score out of 15 marks.' : 'Choose topic and difficulty, then get a fresh 10-question practice set.'}</p></div>
    <div class="setup-card">
      <div class="setup-icon">${exam ? '◷' : '◇'}</div>
      <h2>${exam ? 'Ready when you are.' : 'Build your own session.'}</h2>
      ${exam ? '<div class="info-strip">No immediate feedback during the exam. The test auto-submits when the timer reaches zero.</div>' : `
        <label class="field-label" for="topic">TOPIC</label>
        <select id="topic">
          <option value="all">All topics — mixed practice</option>
          ${topics().map((topic) => `<option value="${esc(topic)}" ${currentTopic === topic ? 'selected' : ''}>${esc(topic)}</option>`).join('')}
        </select>
        <label class="field-label" for="difficulty">DIFFICULTY</label>
        <select id="difficulty">
          <option value="all">All difficulties</option>
          <option value="easy" ${currentDifficulty === 'easy' ? 'selected' : ''}>Easy</option>
          <option value="medium" ${currentDifficulty === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="hard" ${currentDifficulty === 'hard' ? 'selected' : ''}>Hard / exam traps</option>
        </select>
      `}
      <button class="btn primary wide" id="begin">${exam ? 'Begin 45-minute exam' : 'Begin practice'} ↗</button>
    </div>
  `, kind);

  document.querySelector('#begin').onclick = () => {
    try {
      if (!exam) {
        currentTopic = document.querySelector('#topic').value;
        currentDifficulty = document.querySelector('#difficulty').value;
      }
      const pool = bank.filter((q) =>
        (exam || currentTopic === 'all' || q.topic === currentTopic) &&
        (exam || currentDifficulty === 'all' || q.difficulty === currentDifficulty)
      );
      const count = exam ? EXAM_SIZE : Math.min(10, pool.length);
      if (!pool.length || count < 1) throw new Error('No questions available for the selected filters.');
      quiz = exam ? createBalancedExam(bank) : createQuiz(bank, {
        count,
        topic: exam ? 'all' : currentTopic,
        difficulty: exam ? 'all' : currentDifficulty,
      });
      answers = Array(quiz.length).fill(null);
      index = 0;
      mode = kind;
      startedAt = Date.now();
      deadline = exam ? startedAt + EXAM_SECONDS * 1000 : 0;
      latestResult = null;
      persistActive();
      location.hash = 'session';
      renderQuestion();
    } catch (error) {
      alert(error.message);
    }
  };
}

function currentQuestion() {
  return bank.find((item) => item.id === quiz[index].id);
}

function persistActive() {
  write('active', { quiz, answers, index, mode, deadline, startedAt });
}

function renderQuestion() {
  if (!quiz) {
    dashboard();
    return;
  }
  if (mode === 'exam' && secondsLeft(deadline) === 0) {
    finish(true);
    return;
  }

  const q = currentQuestion();
  const selected = answers[index];
  const correctOption = quiz[index].options.findIndex((opt) => opt.originalIndex === q.correct);
  const locked = mode !== 'exam' && selected !== null;
  const answeredCount = answers.filter((value) => value !== null).length;

  shell(`
    <div class="quiz-heading">
      <button class="back-link" id="quit">← Leave session</button>
      <span class="quiz-kind">${mode === 'exam' ? '◷ LIVE EXAM' : '◇ PRACTICE MODE'}</span>
    </div>
    <div class="quiz-top">
      <div><div class="eyebrow">QUESTION ${index + 1} OF ${quiz.length}</div><h2>${mode === 'exam' ? 'Mock examination' : 'Practice session'}</h2></div>
      <div class="quiz-info">
        ${mode === 'exam' ? `<span class="timer" id="timer">◷ ${formatTime(secondsLeft(deadline))}</span>` : '<span class="small-info">Instant feedback ON</span>'}
        <span class="small-info">${answeredCount}/${quiz.length} answered</span>
      </div>
    </div>
    <div class="progress-track"><div style="width:${((index + 1) / quiz.length) * 100}%"></div></div>
    <div class="question-layout">
      <article class="question-card">
        <div class="question-meta"><span class="topic-pill">${esc(q.topic)}</span><span>${esc(q.difficulty.toUpperCase())}</span></div>
        <h3>${esc(q.prompt)}</h3>
        ${q.code ? `<div class="code-block"><div class="code-label">PYTHON <span>● ● ●</span></div><pre><code>${esc(q.code)}</code></pre></div>` : ''}
        <div class="choices">
          ${quiz[index].options.map((option, optionIndex) => `
            <button class="choice ${selected === optionIndex ? 'chosen' : ''} ${locked && optionIndex === correctOption ? 'correct' : ''} ${locked && selected === optionIndex && optionIndex !== correctOption ? 'wrong' : ''}" data-choice="${optionIndex}" ${locked ? 'disabled' : ''}>
              <span class="choice-letter">${'ABCD'[optionIndex]}</span>
              <span>${esc(option.text)}</span>
              ${locked && optionIndex === correctOption ? '<b>✓</b>' : locked && selected === optionIndex ? '<b>✕</b>' : ''}
            </button>`).join('')}
        </div>
        ${locked ? `
          <div class="feedback ${selected === correctOption ? 'positive' : 'negative'}">
            <strong>${selected === correctOption ? '✓ Correct! Nice work.' : '✕ Not quite. Learn the idea.'}</strong>
            <p>${esc(q.explanation)}</p>
          </div>
        ` : ''}
        <div class="question-actions">
          <button class="btn secondary" id="prev" ${index === 0 ? 'disabled' : ''}>← Previous</button>
          <button class="btn primary" id="next">${index === quiz.length - 1 ? 'Finish / submit' : 'Next question →'}</button>
        </div>
      </article>
      <aside class="navigator">
        <div class="panel-head"><h3>Question map</h3><span>${answeredCount}/${quiz.length}</span></div>
        <div class="number-grid">${quiz.map((_, i) => `<button class="number ${i === index ? 'current' : ''} ${answers[i] !== null ? 'answered' : ''}" data-index="${i}" aria-label="Go to question ${i + 1}">${i + 1}</button>`).join('')}</div>
        <div class="legend"><span>● Current</span><span>● Answered</span><span>○ Not answered</span></div>
        ${mode === 'exam' ? '<p class="navigator-note">Answers stay hidden until submission.</p>' : '<p class="navigator-note">Choose an option to reveal the explanation.</p>'}
      </aside>
    </div>
  `, mode);

  document.querySelectorAll('[data-choice]').forEach((button) => {
    button.onclick = () => {
      answers[index] = Number(button.dataset.choice);
      persistActive();
      renderQuestion();
    };
  });
  document.querySelectorAll('[data-index]').forEach((button) => {
    button.onclick = () => {
      index = Number(button.dataset.index);
      persistActive();
      renderQuestion();
    };
  });
  document.querySelector('#prev').onclick = () => {
    index -= 1;
    persistActive();
    renderQuestion();
  };
  document.querySelector('#next').onclick = () => {
    if (index === quiz.length - 1) confirmSubmit();
    else {
      index += 1;
      persistActive();
      renderQuestion();
    }
  };
  document.querySelector('#quit').onclick = () => {
    if (confirm('Leave this session? Your current attempt will be discarded.')) {
      clearInterval(ticker);
      remove('active');
      quiz = null;
      answers = [];
      location.hash = 'dashboard';
    }
  };

  clearInterval(ticker);
  if (mode === 'exam') {
    ticker = setInterval(() => {
      const left = secondsLeft(deadline);
      const timer = document.querySelector('#timer');
      if (timer) timer.textContent = `◷ ${formatTime(left)}`;
      if (left === 0) finish(true);
    }, 500);
  }
}

function confirmSubmit() {
  if (mode === 'exam') {
    if (confirm('Submit the exam now? Unanswered questions will score zero.')) finish(false);
  } else {
    finish(false);
  }
}

function finish(autoSubmitted = false) {
  clearInterval(ticker);
  if (!quiz) return;
  const scored = scoreQuiz(bank, quiz, answers);
  const timeTaken = Math.min(mode === 'exam' ? EXAM_SECONDS : 999999, Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
  const result = {
    id: Date.now(),
    date: new Date().toISOString(),
    mode,
    correct: scored.correct,
    incorrect: scored.incorrect,
    unanswered: scored.unanswered,
    answered: scored.correct + scored.incorrect,
    total: quiz.length,
    marks: scored.marks,
    percent: scored.percent,
    timeTaken,
    nickname: mode === 'exam' ? nickname : '',
    details: scored.details,
    autoSubmitted,
  };

  const mistakes = mistakesSet();
  for (const detail of scored.details) {
    if (detail.isCorrect) mistakes.delete(detail.question.id);
    else mistakes.add(detail.question.id);
  }
  write('mistakes', [...mistakes]);
  saveResult(result);
  latestResult = result;
  remove('active');
  quiz = null;
  answers = [];
  location.hash = 'results';
  renderResults();
}

function renderResults() {
  const result = latestResult || history()[0];
  if (!result) {
    dashboard();
    return;
  }
  shell(`
    <section class="result-hero">
      <div class="result-icon">${result.mode === 'exam' ? '◷' : '◇'}</div>
      <h1>${result.mode === 'exam' ? 'Mock exam complete.' : 'Practice complete.'}</h1>
      <p>${result.autoSubmitted ? 'Time expired, so the exam was submitted automatically.' : 'Your session is complete. Review every answer and learn from every mistake.'}</p>
      <div class="big-score">${result.marks.toFixed(2)}<small> / ${result.mode === 'exam' ? '15' : (result.total * 0.25).toFixed(2)}</small></div>
    </section>
    <div class="result-metrics">
      <div class="metric"><span>CORRECT</span><strong>${result.correct}</strong></div>
      <div class="metric"><span>INCORRECT</span><strong>${result.incorrect}</strong></div>
      <div class="metric"><span>UNANSWERED</span><strong>${result.unanswered}</strong></div>
      <div class="metric"><span>ACCURACY</span><strong>${result.percent}%</strong></div>
      <div class="metric"><span>TIME TAKEN</span><strong>${formatTime(result.timeTaken)}</strong></div>
    </div>
    ${result.mode === 'exam' ? `
      <div class="name-card panel">
        <div><h3>Save this score to the leaderboard</h3><p>${cloud.configured() ? "Save your score on the shared leaderboard (Firebase Spark)." : "Leaderboard is local until Firebase is configured."}</p></div>
        <div class="name-entry">
          <input id="nickname-input" maxlength="24" placeholder="Enter your name" value="${esc(result.nickname || nickname)}" aria-label="Leaderboard name" />
          <button class="btn primary" id="save-name">Save name</button>
        </div>
        <small id="name-status">${result.nickname ? `Saved as ${esc(result.nickname)}.` : 'Enter your name to appear on the leaderboard.'}</small>
      </div>
    ` : ''}
    <div class="result-controls">
      <button class="btn primary" id="retake">${result.mode === 'exam' ? 'Retake mock exam' : 'Practice again'} ↗</button>
      <button class="btn secondary" id="home">Back to dashboard</button>
    </div>
    <div class="section-heading"><div><span class="eyebrow">LEARN FROM EACH ANSWER</span><h2>Full answer review</h2></div></div>
    <div class="review-list">
      ${result.details.map((detail, i) => `
        <details class="review-entry">
          <summary>
            <span class="${detail.isCorrect ? 'ok' : 'bad'}">${detail.isCorrect ? '✓' : detail.selected === null ? '–' : '✕'}</span>
            <span>Q${i + 1}. ${esc(detail.question.prompt)}${detail.question.code ? ' (code question)' : ''}</span>
            <span class="review-topic">${esc(detail.question.topic)}</span>
          </summary>
          <div class="review-body">
            ${detail.question.code ? `<pre>${esc(detail.question.code)}</pre>` : ''}
            <p><b>Your answer:</b> ${detail.selected === null ? 'Unanswered' : esc(detail.options[detail.selected]?.text)}</p>
            <p><b>Correct answer:</b> ${esc(detail.options[detail.correctOption].text)}</p>
            <p>${esc(detail.question.explanation)}</p>
          </div>
        </details>
      `).join('')}
    </div>
  `, 'dashboard');

  document.querySelector('#retake').onclick = () => { location.hash = result.mode === 'exam' ? 'exam' : 'practice'; };
  document.querySelector('#home').onclick = () => { location.hash = 'dashboard'; };
  document.querySelector('#save-name')?.addEventListener('click', async () => {
    const value = document.querySelector('#nickname-input').value.trim();
    const status = document.querySelector('#name-status');
    if (value.length < 2) {
      status.textContent = 'Enter at least 2 characters.';
      return;
    }
    nickname = value;
    write('nickname', nickname);
    result.nickname = nickname;
    const all = history();
    const row = all.find((item) => item.id === result.id);
    if (row) {
      row.nickname = nickname;
      write('history', all);
    }
    status.textContent = 'Saved locally. Synchronising…';
    try {
      const saved = await cloud.saveExamScore(result, nickname);
      status.textContent = saved.synced
        ? saved.analyticsSynced ? '✓ Saved to the live leaderboard and analytics.' : '✓ Leaderboard updated; analytics upload needs retry.'
        : '✓ Saved locally. ' + saved.reason;
    } catch (error) {
      status.textContent = '✓ Saved locally. Online sync failed: ' + error.message;
    }
  });
}

function scoreRows(rows) {
  return rows.length ? rows.map((row, i) => `
    <div class="table-row">
      <span class="rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}</span>
      <strong>${esc(row.nickname)}</strong>
      <b>${Number(row.marks).toFixed(2)} / 15</b>
      <span>${formatTime(row.timeTaken)}</span>
    </div>`).join('') : '<div class="empty-small">No named exam scores yet. Finish a mock exam and save your name.</div>';
}

function leader() {
  cloud.stopScores();
  const online = cloud.configured();
  shell(`
    <div class="eyebrow">STUDENT RANKINGS · ${online ? 'LIVE' : 'ON-DEVICE'}</div>
    <div class="page-title"><h1>${online ? 'Live leaderboard.' : 'Local leaderboard.'}</h1><p>${online ? 'Top marks from students across devices. Updates arrive automatically.' : 'Firebase is not connected, so these scores belong to this device only.'}</p></div>
    <div class="panel leaderboard-panel">
      <div class="table-row table-head"><span>RANK</span><span>NAME</span><span>SCORE</span><span>TIME</span></div>
      <div id="score-rows">${online ? '<div class="empty-small">Connecting to live leaderboard…</div>' : scoreRows(leaderboard())}</div>
    </div>
    <div class="info-strip">${online ? 'Best exam scores are shared; raw per-exam topic analytics are private. Rankings use submitted browser scores and are not cheating-proof.' : 'Use the included Firebase setup guide to enable the shared leaderboard.'}</div>
  `, 'leaderboard');
  if (online) cloud.watchScores(rows => {
    const node = document.querySelector('#score-rows');
    if (node && location.hash === '#leaderboard') node.innerHTML = scoreRows(rows);
  }, error => {
    const node = document.querySelector('#score-rows');
    if (node) node.innerHTML = `<div class="empty-small">Live scoreboard unavailable: ${esc(error.message)}. Local records are shown below.</div>${scoreRows(leaderboard())}`;
  }).catch(error => {
    const node = document.querySelector('#score-rows');
    if (node) node.innerHTML = `<div class="empty-small">${esc(error.message)}. Showing on-device scores.</div>${scoreRows(leaderboard())}`;
  });
}

function admin() {
  cloud.stopScores();
  const ready = cloud.configured();
  shell(`
    <div class="eyebrow">RESTRICTED / ADMIN CONTROL</div>
    <section class="admin-hero">
      <span class="overline">CE2 ARENA / PERFORMANCE STUDIO</span>
      <h1>Know how your class <em>is performing.</em></h1>
      <p>Private, aggregate insights into submitted mock exams and topic-level strengths. Access requires the configured admin account and Firestore security rules.</p>
      <div class="lesson-hero-stats"><span>STUDENT RANKINGS</span><span>TOPIC ACCURACY</span><span>RECENT SUBMISSIONS</span></div>
    </section>
    <div class="panel admin-panel">
      ${!ready ? '<p>Firebase has not been configured. Offline quiz features continue to work; private admin analytics require Firebase Spark.</p>' : `
        <div class="admin-auth">
          <label class="field-label" for="admin-email">ADMIN EMAIL</label>
          <input id="admin-email" type="email" autocomplete="username" placeholder="admin@example.com" />
          <label class="field-label" for="admin-password">PASSWORD</label>
          <input id="admin-password" type="password" autocomplete="current-password" placeholder="Your Firebase Auth password" />
          <div class="action-row"><button class="btn primary" id="admin-login">Sign in securely</button><button class="btn secondary" id="admin-logout">Sign out</button><button class="btn secondary" id="admin-refresh">Refresh report</button></div>
        </div>
        <p id="admin-status">${cloud.isAdmin() ? 'Signed in as admin.' : 'Sign in using the admin account you created in Firebase Authentication.'}</p>
        <div id="admin-report"></div>
      `}
    </div>
  `, 'admin');
  if (!ready) return;
  const status = document.querySelector('#admin-status');
  document.querySelector('#admin-login').onclick = async () => {
    status.textContent = 'Authenticating…';
    try {
      await cloud.loginAdmin(document.querySelector('#admin-email').value.trim(), document.querySelector('#admin-password').value);
      document.querySelector('#admin-password').value = '';
      status.textContent = 'Admin session authenticated.';
      await renderAdminReport();
    } catch (error) { status.textContent = `Access denied: ${error.message}`; }
  };
  document.querySelector('#admin-logout').onclick = async () => {
    try { await cloud.logoutAdmin(); status.textContent = 'Signed out.'; document.querySelector('#admin-report').innerHTML = ''; }
    catch (error) { status.textContent = error.message; }
  };
  document.querySelector('#admin-refresh').onclick = renderAdminReport;
  if (cloud.isAdmin()) renderAdminReport();
}

async function renderAdminReport() {
  const target = document.querySelector('#admin-report');
  const status = document.querySelector('#admin-status');
  if (!target) return;
  target.innerHTML = '<div class="empty-small">Loading recent submissions…</div>';
  try {
    const { scores, attempts } = await cloud.adminReport();
    if (!document.querySelector('#admin-report')) return;
    const topicStats = new Map();
    for (const attempt of attempts) {
      for (const [topic, item] of Object.entries(attempt.topics || {})) {
        const row = topicStats.get(topic) || { total: 0, correct: 0 };
        row.total += item.total;
        row.correct += item.correct;
        topicStats.set(topic, row);
      }
    }
    const average = attempts.length ? (attempts.reduce((s, a) => s + a.marks, 0) / attempts.length).toFixed(2) : '—';
    target.innerHTML = `
      <div class="admin-metrics">
        <div class="metric"><span>STUDENTS ON BOARD</span><strong>${scores.length}</strong><small>Top 200 records</small></div>
        <div class="metric"><span>RECENT EXAMS</span><strong>${attempts.length}</strong><small>Latest 200 submissions</small></div>
        <div class="metric"><span>AVERAGE MARKS</span><strong>${average}</strong><small>Out of 15</small></div>
      </div>
      <div class="admin-columns">
        <div class="panel"><h3>Topic accuracy</h3>${[...topicStats].sort((a,b) => a[1].correct/a[1].total - b[1].correct/b[1].total).map(([name, item]) => `<div class="admin-topic"><span>${esc(name)}</span><b>${Math.round(item.correct / item.total * 100)}%</b><div class="admin-track"><span style="width:${Math.round(item.correct/item.total*100)}%"></span></div></div>`).join('') || '<p>No submissions yet.</p>'}</div>
        <div class="panel"><h3>Recent student exams</h3>${attempts.slice(0, 30).map(item => `<div class="admin-student"><span>${esc(item.nickname)}</span><strong>${Number(item.marks).toFixed(2)}/15</strong><small>${item.correct}/60 correct</small></div>`).join('') || '<p>No submissions yet.</p>'}</div>
      </div>
      <div class="info-strip">This report shows at most 200 recent attempts and 200 leaderboard records to limit Spark reads. Scores are client-submitted, so treat them as informal practice analytics rather than verified grades.</div>
    `;
    status.textContent = 'Private report loaded successfully.';
  } catch (error) { target.innerHTML = ''; status.textContent = 'Cannot load admin analytics: ' + error.message; }
}

function mistakesView() {
  const ids = [...mistakesSet()];
  const pool = bank.filter((item) => ids.includes(item.id));
  shell(`
    <div class="eyebrow">FOCUSED IMPROVEMENT</div>
    <div class="page-title"><h1>Mistake review.</h1><p>Everything you missed or skipped is collected here for targeted revision.</p></div>
    <div class="setup-card">
      <div class="setup-icon">↺</div>
      <h2>${pool.length} questions ready for review</h2>
      <p>${pool.length ? 'Run a fresh session from your mistakes only.' : 'No mistakes stored right now. Wrong or skipped questions will appear here automatically.'}</p>
      <button class="btn primary wide" id="begin-mistakes" ${pool.length ? '' : 'disabled'}>Review mistakes ↗</button>
    </div>
  `, 'mistakes');
  document.querySelector('#begin-mistakes').onclick = () => {
    quiz = createQuiz(pool, { count: Math.min(10, pool.length) });
    answers = Array(quiz.length).fill(null);
    index = 0;
    mode = 'practice';
    startedAt = Date.now();
    deadline = 0;
    latestResult = null;
    persistActive();
    location.hash = 'session';
    renderQuestion();
  };
}

function revision() {
  shell(`
    <div class="eyebrow">LAST-MINUTE HELP</div>
    <div class="page-title"><h1>Quick revision sheet.</h1><p>Important reminders for CE2: short, crisp, and exam-oriented.</p></div>
    <div class="notes-grid">
      ${revisionCards.map(([title, text], i) => `
        <article class="note-card">
          <span class="note-index">${String(i + 1).padStart(2, '0')}</span>
          <h3>${esc(title)}</h3>
          <p>${esc(text)}</p>
        </article>
      `).join('')}
    </div>
    <button class="btn primary" id="revise-practice">Practise now ↗</button>
  `, 'revision');
  document.querySelector('#revise-practice').onclick = () => { location.hash = 'practice'; };
}

function learn() {
  shell(`
    <div class="eyebrow">LEARN → TRY → MASTER</div>
    <section class="lesson-hero">
      <span class="overline">YOUR PYTHON FIELD GUIDE</span>
      <h1>Start from basics.<br/><em>Train for the real paper.</em></h1>
      <p>Beginner-friendly lessons covering Python fundamentals, lab-style logic, algorithms, pseudocode, mutable vs immutable objects, and technical terms that often appear in CE2 and viva questions.</p>
      <div class="lesson-hero-stats"><span>${lessons.length} LESSONS</span><span>CODE EXAMPLES</span><span>COMMON EXAM TRAPS</span></div>
    </section>
    <div class="section-heading"><div><span class="eyebrow">THE LEARNING PATH</span><h2>Python foundations</h2></div></div>
    <div class="lesson-list">
      ${lessons.map((lesson, i) => `
        <details class="lesson-item" ${i === 0 ? 'open' : ''}>
          <summary>
            <span class="lesson-number">${String(i + 1).padStart(2, '0')}</span>
            <strong>${esc(lesson.title)}</strong>
            <span class="lesson-arrow">↗</span>
          </summary>
          <div class="lesson-detail">
            <p>${esc(lesson.description)}</p>
            <div class="lesson-code-header"><span>● ● ●</span><span>example.py</span><span>PYTHON 3</span></div>
            <pre>${esc(lesson.code)}</pre>
            <div class="lesson-trap"><b>⚡ EXAM TRAP</b><p>${esc(lesson.trap)}</p></div>
            <button class="btn primary lesson-practice" data-lesson="${i}">Practise this area ↗</button>
          </div>
        </details>
      `).join('')}
    </div>
  `, 'learn');
  document.querySelectorAll('[data-lesson]').forEach((button) => {
    button.onclick = () => {
      currentTopic = TOPIC_PRACTICE_MAP[Number(button.dataset.lesson)] || 'all';
      currentDifficulty = 'all';
      if (!topics().includes(currentTopic)) currentTopic = 'all';
      location.hash = 'practice';
    };
  });
}

function traplab() {
  const pool = bank.filter((q) =>
    q.difficulty === 'hard' ||
    ['Syntax & debugging', 'Errors & exceptions', 'Debugging', 'Technical terms', 'Lab programs', 'Algorithms & pseudocode'].includes(q.topic) ||
    String(q.id).startsWith('lab-')
  );
  shell(`
    <div class="eyebrow">THE DEBUGGING CHALLENGE</div>
    <section class="trap-hero">
      <span class="overline">EXAM TRAP LAB / HARD MODE</span>
      <h1>Catch the trap.<br/><em>Beat the confusion.</em></h1>
      <p>Short but tricky first-sem style questions: missing colons, wrong brackets, output tracing, type conversion, pseudocode logic, mutable-vs-immutable confusion, and lab-style code.</p>
      <div class="lesson-hero-stats"><span>${pool.length} CHALLENGES</span><span>IMMEDIATE FEEDBACK</span><span>NO TIME PRESSURE</span></div>
      <button class="btn primary" id="play-traps">Take a 10-question challenge ↗</button>
    </section>
    <div class="section-heading"><div><span class="eyebrow">WHAT YOU'LL FACE</span><h2>Trap categories</h2></div></div>
    <div class="trap-grid">
      <article><span>01 / SYNTAX</span><h3>Colon, bracket and indentation slips</h3><pre>if score >= 10
    print("Pass")</pre><p>Spot whether the problem is syntax, indentation, or logic.</p></article>
      <article><span>02 / TYPES</span><h3>input() returns text</h3><pre>a = input()
b = input()
print(a + b)</pre><p>Know when Python concatenates strings and when explicit conversion is required.</p></article>
      <article><span>03 / F-STRINGS</span><h3>Expressions inside braces</h3><pre>x = 5
print(f"{x + 2}")</pre><p>F-strings evaluate expressions inside braces and then convert the result to text.</p></article>
      <article><span>04 / MUTABILITY</span><h3>One list, two names</h3><pre>a = [1, 2]
b = a
b.append(3)
print(a)</pre><p>Understand how aliasing affects lists and why immutable types behave differently.</p></article>
      <article><span>05 / PSEUDOCODE</span><h3>Trace the logic</h3><pre>INPUT n
sum = 0
FOR i = 1 TO n
    sum = sum + i</pre><p>Translate language-independent steps into actual meaning.</p></article>
      <article><span>06 / LAB LOGIC</span><h3>Digits, prime, palindrome</h3><pre>digit = n % 10
n = n // 10</pre><p>Recognize the common patterns behind number-based lab programs.</p></article>
    </div>
  `, 'traplab');
  document.querySelector('#play-traps').onclick = () => {
    quiz = createQuiz(pool, { count: Math.min(10, pool.length) });
    answers = Array(quiz.length).fill(null);
    index = 0;
    mode = 'practice';
    startedAt = Date.now();
    deadline = 0;
    latestResult = null;
    persistActive();
    location.hash = 'session';
    renderQuestion();
  };
}

function route() {
  cloud.stopScores();
  const hash = location.hash.slice(1) || 'dashboard';
  if (quiz && hash !== 'session') {
    if (!confirm('Leave your current session and discard this attempt?')) {
      location.hash = 'session';
      return;
    }
    clearInterval(ticker);
    quiz = null;
    answers = [];
    remove('active');
  }

  if (hash === 'practice') setup('practice');
  else if (hash === 'exam') setup('exam');
  else if (hash === 'session') renderQuestion();
  else if (hash === 'results') renderResults();
  else if (hash === 'mistakes') mistakesView();
  else if (hash === 'leaderboard') leader();
  else if (hash === 'admin') admin();
  else if (hash === 'learn') learn();
  else if (hash === 'traplab') traplab();
  else if (hash === 'revision') revision();
  else dashboard();
}

async function init() {
  try {
    const response = await fetch('data/questions.json');
    if (!response.ok) throw new Error('Could not fetch question bank.');
    bank = await response.json();
    window.addEventListener('hashchange', route);

    const active = read('active', null);
    if (active?.quiz?.length && active.quiz.every((item) => bank.some((q) => q.id === item.id))) {
      ({ quiz, answers, index, mode, deadline, startedAt } = active);
      if (mode === 'exam' && secondsLeft(deadline) === 0) {
        finish(true);
        return;
      }
      location.hash = 'session';
      renderQuestion();
      return;
    }

    route();
  } catch (error) {
    app.innerHTML = `
      <div class="fatal panel">
        <h1>Unable to load the arena</h1>
        <p>${esc(error.message)}</p>
        <p>Run this app through a local server or GitHub Pages, not a file:// URL.</p>
        <button class="btn primary" onclick="location.reload()">Try again</button>
      </div>
    `;
  }
}

init();
