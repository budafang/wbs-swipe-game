(() => {
  'use strict';

  const ROUND_SECONDS = 30;
  const QUESTIONS = [
    { text: '展覽主視覺', kind: 'WBS', reason: '主視覺是展覽要交付的成果。' },
    { text: '完成三款主視覺提案', kind: 'Activity', reason: '「完成提案」是為了產出主視覺而執行的工作。' },
    { text: '媒體邀請方案', kind: 'WBS', reason: '邀請方案是專案要交付的成果。' },
    { text: '整理媒體名單', kind: 'Activity', reason: '整理名單是完成媒體邀請工作的一項行動。' },
    { text: '展場空間配置', kind: 'WBS', reason: '空間配置是展覽規劃的成果。' },
    { text: '丈量場地', kind: 'Activity', reason: '丈量是取得場地資料時執行的工作。' },
    { text: '官方網站', kind: 'WBS', reason: '網站是展覽要建置並交付的成果。' },
    { text: '購買網域', kind: 'Activity', reason: '購買網域是建置網站過程中的一項工作。' },
    { text: '展場導覽手冊', kind: 'WBS', reason: '導覽手冊是要交付給觀眾使用的成果。' },
    { text: '校對導覽手冊內容', kind: 'Activity', reason: '校對是完成導覽手冊前執行的工作。' },
  ];

  const $ = (id) => document.getElementById(id);
  const screens = { intro: $('intro-screen'), game: $('game-screen'), result: $('result-screen') };
  const els = {
    start: $('start-button'), replay: $('replay-button'), card: $('question-card'), text: $('card-text'),
    count: $('question-count'), score: $('score-label'), progress: $('progress-fill'), timer: $('timer'),
    time: $('time-left'), timerRing: $('timer-ring'), feedback: $('card-feedback'), wbs: $('wbs-button'),
    activity: $('activity-button'), streak: $('streak-count'), announcement: $('announcement'),
    finalScore: $('final-score'), correct: $('correct-count'), best: $('best-streak'),
    resultTitle: $('result-title'), resultCopy: $('result-copy'), resultIcon: $('result-icon'),
    review: $('review-list'), reviewSummary: $('review-summary'),
  };
  const circumference = 2 * Math.PI * 18;
  let deck = [];
  let index = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let answers = [];
  let seconds = ROUND_SECONDS;
  let timerId = null;
  let locked = false;
  let pointerStart = null;

  function showScreen(screenName) {
    Object.entries(screens).forEach(([name, screen]) => { screen.hidden = name !== screenName; });
  }

  function shuffle(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function startGame() {
    window.clearInterval(timerId);
    deck = shuffle(QUESTIONS);
    index = 0; score = 0; streak = 0; bestStreak = 0; answers = [];
    seconds = ROUND_SECONDS; locked = false;
    els.timer.classList.remove('is-low');
    showScreen('game');
    updateTimer();
    renderQuestion();
    timerId = window.setInterval(() => {
      seconds -= 1;
      updateTimer();
      if (seconds <= 0) finishGame(true);
    }, 1000);
  }

  function updateTimer() {
    els.time.textContent = String(seconds);
    els.timer.setAttribute('aria-label', `剩餘時間 ${seconds} 秒`);
    els.timer.classList.toggle('is-low', seconds <= 8);
    els.timerRing.style.strokeDasharray = String(circumference);
    els.timerRing.style.strokeDashoffset = String(circumference * (1 - seconds / ROUND_SECONDS));
  }

  function renderQuestion() {
    if (index >= deck.length) { finishGame(false); return; }
    locked = false;
    const item = deck[index];
    els.card.className = 'question-card';
    els.card.style.transform = '';
    els.card.style.opacity = '';
    els.text.textContent = item.text;
    els.count.textContent = `第 ${index + 1} / ${deck.length} 題`;
    els.score.textContent = `${score} 分`;
    els.progress.style.width = `${(index / deck.length) * 100}%`;
    els.streak.textContent = String(streak);
    els.feedback.textContent = '';
  }

  function answer(choice) {
    if (locked || seconds <= 0 || index >= deck.length) return;
    locked = true;
    const item = deck[index];
    const correct = choice === item.kind;
    answers.push({ ...item, choice, correct });
    if (correct) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      score += 10 + Math.min(Math.max(streak - 1, 0) * 2, 10);
      els.card.classList.add('correct');
      els.feedback.textContent = '答對了！';
      els.announcement.textContent = `答對，${item.kind}。${item.reason}`;
    } else {
      streak = 0;
      els.card.classList.add('wrong');
      els.feedback.textContent = `正解：${item.kind}`;
      els.announcement.textContent = `答錯，正確答案是 ${item.kind}。${item.reason}`;
    }
    els.score.textContent = `${score} 分`;
    els.streak.textContent = String(streak);
    els.progress.style.width = `${((index + 1) / deck.length) * 100}%`;
    els.card.classList.add(choice === 'WBS' ? 'fly-left' : 'fly-right');
    window.setTimeout(() => {
      index += 1;
      if (seconds > 0) renderQuestion();
    }, 520);
  }

  function finishGame(timeUp) {
    if (screens.game.hidden) return;
    window.clearInterval(timerId);
    locked = true;
    const correct = answers.filter((item) => item.correct).length;
    const answered = answers.length;
    const unanswered = deck.slice(answered + (index >= answered ? 0 : 0));
    const missed = timeUp ? unanswered : [];
    els.finalScore.textContent = String(score);
    els.correct.textContent = `${correct} / 10`;
    els.best.textContent = String(bestStreak);
    els.reviewSummary.textContent = `答對 ${correct} 題${timeUp ? ` · 未作答 ${missed.length} 題` : ''}`;
    if (timeUp) {
      els.resultTitle.textContent = '時間到！';
      els.resultCopy.textContent = '快速回顧一下成果和工作，再挑戰一次吧。';
      els.resultIcon.textContent = '⌛';
    } else if (correct === 10) {
      els.resultTitle.textContent = '全部答對！';
      els.resultCopy.textContent = '你已經分得清楚交付成果和執行工作。';
      els.resultIcon.textContent = '✦';
    } else {
      els.resultTitle.textContent = '漂亮出手！';
      els.resultCopy.textContent = '看看解析，把成果和工作分得更清楚。';
      els.resultIcon.textContent = '✦';
    }
    renderReview(answers, missed);
    showScreen('result');
    els.announcement.textContent = timeUp ? '時間到，回合結束。' : '10 題完成，回合結束。';
  }

  function renderReview(done, missed) {
    els.review.replaceChildren();
    const entries = [...done, ...missed.map((item) => ({ ...item, choice: null, correct: false, unanswered: true }))];
    entries.forEach((item) => {
      const li = document.createElement('li');
      li.className = `review-item ${item.correct ? 'is-correct' : 'is-wrong'}`;
      const mark = document.createElement('span');
      mark.className = 'review-mark';
      mark.textContent = item.correct ? '✓' : item.unanswered ? '·' : '×';
      const copy = document.createElement('span');
      copy.className = 'review-text';
      copy.append(document.createTextNode(item.text));
      const answerLine = document.createElement('span');
      answerLine.className = 'review-answer';
      answerLine.textContent = item.unanswered ? `未作答 · 正解：${item.kind}` : item.correct ? `正解：${item.kind}` : `你選 ${item.choice} · 正解：${item.kind}`;
      const reason = document.createElement('span');
      reason.className = 'review-reason';
      reason.textContent = item.reason;
      copy.append(answerLine, reason);
      li.append(mark, copy);
      els.review.append(li);
    });
  }

  els.start.addEventListener('click', startGame);
  els.replay.addEventListener('click', startGame);
  els.wbs.addEventListener('click', () => answer('WBS'));
  els.activity.addEventListener('click', () => answer('Activity'));
  els.card.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); answer('WBS'); }
    if (event.key === 'ArrowRight') { event.preventDefault(); answer('Activity'); }
  });
  document.addEventListener('keydown', (event) => {
    if (screens.game.hidden) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); answer('WBS'); }
    if (event.key === 'ArrowRight') { event.preventDefault(); answer('Activity'); }
  });
  els.card.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY };
    els.card.setPointerCapture(event.pointerId);
  });
  els.card.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.15) answer(dx < 0 ? 'WBS' : 'Activity');
  });
  els.card.addEventListener('pointercancel', () => { pointerStart = null; });
})();
