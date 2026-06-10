'use strict';

// ========== API helpers ==========
async function api(path, opts) {
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
function post(path, body) {
  return api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function put(path, body) {
  return api(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ========== Router ==========
const VIEWS = ['home', 'session', 'summary', 'words', 'calendar', 'settings'];
const TAB_VIEWS = ['home', 'words', 'calendar', 'settings'];

function showView(name) {
  VIEWS.forEach(v => {
    const el = $(`#view-${v}`);
    el.hidden = v !== name;
  });
  const tabbar = $('#tabbar');
  tabbar.hidden = !TAB_VIEWS.includes(name);
  $$('#tabbar .tab').forEach(a => a.classList.toggle('active', a.dataset.view === name));
}

function route() {
  const hash = location.hash.slice(1) || 'home';
  if (TAB_VIEWS.includes(hash)) {
    showView(hash);
    if (hash === 'home') loadHome();
    else if (hash === 'words') { wordsOffset = 0; loadWords(true); }
    else if (hash === 'calendar') loadCalendar();
    else if (hash === 'settings') loadSettings();
  }
}

window.addEventListener('hashchange', route);

// ========== Toast ==========
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.hidden = true, 2000);
}

// ========== Home ==========
async function loadHome() {
  try {
    const d = await api('/api/home');
    $('#home-streak').textContent = d.streak;
    $('#home-new-remaining').textContent = d.newRemaining;
    $('#home-review-due').textContent = d.reviewDue;
    $('#stat-learned').textContent = d.learnedWords;
    $('#stat-mastered').textContent = d.masteredWords;
    $('#stat-total').textContent = d.totalWords;
    $('#home-date').textContent = d.today;
    const total = d.checkin.new_learned + d.checkin.reviewed;
    const target = d.newTarget + d.reviewDue + d.checkin.reviewed;
    const pct = target > 0 ? Math.min(1, total / target) : (d.checkin.completed ? 1 : 0);
    setRing(pct);
    $('#home-done-tip').hidden = !d.checkin.completed;
  } catch (e) { toast('加载失败: ' + e.message); }
}

function setRing(pct) {
  const circ = 2 * Math.PI * 52;
  $('#ring-fg').style.strokeDashoffset = circ * (1 - pct);
  $('#ring-percent').textContent = Math.round(pct * 100) + '%';
}

$('#btn-learn').onclick = () => startSession('learn');
$('#btn-review').onclick = () => startSession('review');

// ========== Learning / Review Session ==========
let session = null; // { mode, queue, idx, totalCount, doneCount, wrongTotal }

async function startSession(mode) {
  try {
    let words;
    if (mode === 'learn') {
      words = await api('/api/learn/new');
    } else {
      words = await api('/api/review/due');
    }
    if (!words.length) {
      toast(mode === 'learn' ? '今日新词已学完' : '没有需要复习的单词');
      return;
    }
    session = {
      mode,
      queue: words.map(w => ({ ...w, wrongTimes: 0 })),
      idx: 0,
      totalCount: words.length,
      doneCount: 0,
      wrongTotal: 0,
    };
    showView('session');
    showCard();
  } catch (e) { toast('加载失败: ' + e.message); }
}

function showCard() {
  const s = session;
  if (s.idx >= s.queue.length) {
    finishSession();
    return;
  }
  const w = s.queue[s.idx];
  const levelNames = { 1: '入门', 2: '初级', 3: '中级' };
  $('#card-level').textContent = levelNames[w.level] || '';
  $('#card-word').textContent = w.word;
  $('#card-pos').textContent = w.pos;
  $('#card-answer').hidden = true;
  $('.card').scrollTop = 0;
  $('#actions-ask').hidden = false;
  $('#actions-learn-confirm').hidden = true;
  $('#actions-next').hidden = true;
  updateProgress();
}

function updateProgress() {
  const s = session;
  const pct = s.totalCount > 0 ? (s.doneCount / s.totalCount * 100) : 0;
  $('#session-progress-fg').style.width = pct + '%';
  $('#session-count').textContent = `${s.doneCount}/${s.totalCount}`;
}

function revealAnswer() {
  const w = session.queue[session.idx];
  $('#card-meaning').textContent = w.meaning;
  const container = $('#card-examples');
  container.innerHTML = '';
  const examples = Array.isArray(w.examples) ? w.examples : [];
  examples.forEach(ex => {
    const div = document.createElement('div');
    div.className = 'example';
    const idText = highlightWord(ex.id, w.word);
    div.innerHTML = `<div class="id-sent">${idText}</div><div class="zh-sent">${esc(ex.zh)}</div>`;
    container.appendChild(div);
  });
  $('#card-answer').hidden = false;
  requestAnimationFrame(() => {
    $('#card-meaning').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function highlightWord(sentence, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(' + escaped + ')', 'gi');
  return esc(sentence).replace(re, '<b>$1</b>');
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// 认识
$('#btn-known').onclick = () => {
  revealAnswer();
  $('#actions-ask').hidden = true;
  if (session.mode === 'learn') {
    $('#actions-learn-confirm').hidden = false;
  } else {
    $('#actions-next').hidden = false;
    submitReviewResult(true);
  }
};

// 不认识
$('#btn-unknown').onclick = () => {
  const w = session.queue[session.idx];
  w.wrongTimes++;
  session.wrongTotal++;
  revealAnswer();
  $('#actions-ask').hidden = true;
  $('#actions-next').hidden = false;
  if (session.mode === 'learn') {
    // 回插到后面 3 个位置
    const insertAt = Math.min(session.idx + 4, session.queue.length);
    session.queue.splice(insertAt, 0, { ...w, _retry: true });
  } else {
    // 复习模式：回插 + 提交答错
    const insertAt = Math.min(session.idx + 4, session.queue.length);
    session.queue.splice(insertAt, 0, { ...w, _retry: true });
    submitReviewResult(false);
  }
};

// 学新词确认按钮
$('#btn-easy').onclick = () => submitLearnResult('easy');
$('#btn-got').onclick = () => submitLearnResult('known');

// 下一个
$('#btn-next').onclick = () => {
  session.idx++;
  showCard();
};

async function submitLearnResult(result) {
  const w = session.queue[session.idx];
  if (w._retry) {
    // 循环重现的词不再提交（只有首次出现时提交）
    session.doneCount++;
    session.idx++;
    showCard();
    return;
  }
  try {
    const r = await post('/api/learn/result', {
      wordId: w.id,
      result: w.wrongTimes > 0 ? 'failed' : result,
      wrongTimes: w.wrongTimes,
    });
    session.doneCount++;
    session._lastCheckin = r.checkin;
    session._lastStreak = r.streak;
    session.idx++;
    showCard();
  } catch (e) {
    if (e.message.includes('已在学习记录中')) {
      session.doneCount++;
      session.idx++;
      showCard();
    } else {
      toast('提交失败: ' + e.message);
    }
  }
}

let reviewSubmitted = new Set();

async function submitReviewResult(correct) {
  const w = session.queue[session.idx];
  if (reviewSubmitted.has(w.id)) return;
  if (!correct) return; // 答错时只回插，不提交——等最终答对时提交
  // 答对才提交
  reviewSubmitted.add(w.id);
  try {
    const r = await post('/api/review/result', {
      wordId: w.id,
      correct: w.wrongTimes === 0,
      wrongTimes: w.wrongTimes,
    });
    session.doneCount++;
    session._lastCheckin = r.checkin;
    session._lastStreak = r.streak;
    updateProgress();
  } catch (e) { toast('提交失败: ' + e.message); }
}

// 关闭按钮——复习模式下也要对第一次答错的未提交的词处理
$('#session-close').onclick = () => {
  session = null;
  reviewSubmitted = new Set();
  showView('home');
  loadHome();
  history.replaceState(null, '', '#home');
};

function finishSession() {
  const s = session;
  $('#summary-count').textContent = s.totalCount;
  $('#summary-wrong').textContent = s.wrongTotal;
  $('#summary-emoji').textContent = s.wrongTotal === 0 ? '🎉' : '💪';
  $('#summary-title').textContent = s.mode === 'learn' ? '学习完成' : '复习完成';
  showView('summary');

  if (s._lastCheckin && s._lastCheckin.completed) {
    setTimeout(() => showCheckinModal(s._lastStreak || 1), 500);
  }
}

$('#summary-back').onclick = () => {
  session = null;
  reviewSubmitted = new Set();
  showView('home');
  loadHome();
  history.replaceState(null, '', '#home');
};

// ========== Checkin Modal ==========
function showCheckinModal(streak) {
  $('#modal-streak').textContent = streak;
  $('#checkin-modal').hidden = false;
}
$('#modal-close').onclick = () => { $('#checkin-modal').hidden = true; };

// ========== Words Browser ==========
let wordsOffset = 0;
const WORDS_LIMIT = 50;
let wordsQuery = { q: '', level: '', status: '' };

async function loadWords(reset) {
  if (reset) {
    wordsOffset = 0;
    $('#word-list').innerHTML = '';
  }
  try {
    const params = new URLSearchParams({ offset: wordsOffset, limit: WORDS_LIMIT });
    if (wordsQuery.q) params.set('q', wordsQuery.q);
    if (wordsQuery.level) params.set('level', wordsQuery.level);
    if (wordsQuery.status) params.set('status', wordsQuery.status);
    const d = await api('/api/words?' + params);
    $('#words-total').textContent = `共 ${d.total} 个单词`;
    const ul = $('#word-list');
    d.items.forEach(w => {
      const li = document.createElement('li');
      li.className = 'word-item';
      const statusClass = !w.status ? 'new' : w.status === 'mastered' ? 'mastered' : 'reviewing';
      const statusText = !w.status ? '未学' : w.status === 'mastered' ? '已掌握' : `复习中 S${w.stage}`;
      li.innerHTML = `
        <div class="word-item-top">
          <span class="word-item-word">${esc(w.word)}</span>
          <span class="word-item-pos">${esc(w.pos)}</span>
          <span class="word-item-meaning">${esc(w.meaning)}</span>
          <span class="badge badge-${statusClass}">${statusText}</span>
        </div>`;
      const examples = Array.isArray(w.examples) ? w.examples : [];
      if (examples.length) {
        const detail = document.createElement('div');
        detail.className = 'word-item-detail';
        detail.hidden = true;
        detail.innerHTML = examples.map(ex =>
          `<div class="example"><div class="id-sent">${highlightWord(ex.id, w.word)}</div><div class="zh-sent">${esc(ex.zh)}</div></div>`
        ).join('');
        li.appendChild(detail);
        li.onclick = () => { detail.hidden = !detail.hidden; };
      }
      ul.appendChild(li);
    });
    wordsOffset += d.items.length;
    $('#words-more').hidden = wordsOffset >= d.total;
  } catch (e) { toast('加载失败: ' + e.message); }
}

$('#words-more').onclick = () => loadWords(false);

let searchTimer;
$('#words-search').oninput = (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { wordsQuery.q = e.target.value; loadWords(true); }, 300);
};

$('#words-level-chips').onclick = (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('#words-level-chips .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  wordsQuery.level = btn.dataset.level;
  loadWords(true);
};
$('#words-status-chips').onclick = (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  $$('#words-status-chips .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  wordsQuery.status = btn.dataset.status;
  loadWords(true);
};

// ========== Calendar ==========
let calMonth; // 'YYYY-MM'

async function loadCalendar(month) {
  if (!month) {
    const d = new Date();
    month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  calMonth = month;
  try {
    const d = await api('/api/checkins?month=' + month);
    $('#cal-streak').textContent = d.streak;
    $('#cal-total').textContent = d.totalDays;
    const [y, m] = month.split('-').map(Number);
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    $('#cal-month-label').textContent = `${y}年 ${monthNames[m - 1]}`;
    const doneSet = new Set(d.days.filter(x => x.completed).map(x => x.date));
    const partialSet = new Set(d.days.filter(x => !x.completed && (x.new_learned > 0 || x.reviewed > 0)).map(x => x.date));
    const todayStr = new Date().toISOString().slice(0, 10);
    const firstDay = new Date(y, m - 1, 1).getDay(); // 0=Sun
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon-based
    const daysInMonth = new Date(y, m, 0).getDate();
    const grid = $('#cal-grid');
    grid.innerHTML = '';
    for (let i = 0; i < offset; i++) {
      const sp = document.createElement('span');
      sp.className = 'cal-day';
      grid.appendChild(sp);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const sp = document.createElement('span');
      sp.className = 'cal-day';
      sp.textContent = day;
      if (doneSet.has(dateStr)) sp.classList.add('done');
      else if (partialSet.has(dateStr)) sp.classList.add('partial');
      if (dateStr === todayStr) sp.classList.add('today');
      if (dateStr > todayStr) sp.classList.add('future');
      grid.appendChild(sp);
    }
  } catch (e) { toast('加载失败: ' + e.message); }
}

$('#cal-prev').onclick = () => {
  const [y, m] = calMonth.split('-').map(Number);
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  loadCalendar(`${py}-${String(pm).padStart(2, '0')}`);
};
$('#cal-next').onclick = () => {
  const [y, m] = calMonth.split('-').map(Number);
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  loadCalendar(`${ny}-${String(nm).padStart(2, '0')}`);
};

// ========== Settings ==========
let currentSettings = {};

async function loadSettings() {
  try {
    currentSettings = await api('/api/settings');
    $('#set-new').textContent = currentSettings.daily_new_words;
    $('#set-review').textContent = currentSettings.daily_review_limit;
  } catch (e) { toast('加载失败: ' + e.message); }
}

$$('.stepper button').forEach(btn => {
  btn.onclick = async () => {
    const key = btn.dataset.key;
    const delta = Number(btn.dataset.delta);
    const cur = currentSettings[key] || 0;
    const next = Math.max(5, Math.min(500, cur + delta));
    if (next === cur) return;
    try {
      const r = await put('/api/settings', { [key]: next });
      currentSettings = r;
      $('#set-new').textContent = r.daily_new_words;
      $('#set-review').textContent = r.daily_review_limit;
      toast('已保存');
    } catch (e) { toast('保存失败: ' + e.message); }
  };
});

// ========== Init ==========
route();
if (!location.hash || location.hash === '#' || location.hash === '#home') loadHome();
