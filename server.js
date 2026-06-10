'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { db, getSettings } = require('./db');
const srs = require('./srs');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// 本地日期 'YYYY-MM-DD'，FAKE_TODAY 环境变量可覆盖（测试跨天用）
function today() {
  if (process.env.FAKE_TODAY) return process.env.FAKE_TODAY;
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function rowToWord(r) {
  const w = { ...r, examples: JSON.parse(r.examples) };
  return w;
}

// ---------- 查询 ----------

function countNewRemaining() {
  return db.prepare(
    `SELECT COUNT(*) AS c FROM words w LEFT JOIN learning l ON l.word_id = w.id WHERE l.word_id IS NULL`
  ).get().c;
}

function countDue(date) {
  return db.prepare(
    `SELECT COUNT(*) AS c FROM learning WHERE status = 'reviewing' AND next_review_at <= ?`
  ).get(date).c;
}

function getCheckin(date) {
  return (
    db.prepare('SELECT * FROM checkins WHERE date = ?').get(date) || {
      date, new_learned: 0, reviewed: 0, completed: 0,
    }
  );
}

// 连续打卡天数：从 date（含）往前数 completed=1 的连续天；当天未完成则从昨天起算
function getStreak(date) {
  const rows = db.prepare(
    'SELECT date FROM checkins WHERE completed = 1 ORDER BY date DESC'
  ).all();
  const set = new Set(rows.map((r) => r.date));
  let d = set.has(date) ? date : srs.addDays(date, -1);
  let streak = 0;
  while (set.has(d)) {
    streak++;
    d = srs.addDays(d, -1);
  }
  return streak;
}

// 学习/复习结果落库后调用：更新当日打卡计数并判定是否达成
function bumpCheckin(date, field) {
  db.prepare(
    `INSERT INTO checkins (date, ${field}) VALUES (?, 1)
     ON CONFLICT(date) DO UPDATE SET ${field} = ${field} + 1`
  ).run(date);
  const settings = getSettings();
  const ci = getCheckin(date);
  // 目标新词数 = min(设置值, 实际还可学的)；词库学完后只要复习清零也算打卡
  const newTarget = Math.min(settings.daily_new_words, ci.new_learned + countNewRemaining());
  const done = ci.new_learned >= newTarget && countDue(date) === 0 ? 1 : 0;
  if (done !== ci.completed) {
    db.prepare('UPDATE checkins SET completed = ? WHERE date = ?').run(done, date);
    ci.completed = done;
  }
  return ci;
}

// ---------- API handlers ----------

const routes = {
  'GET /api/home'(req, url) {
    const t = today();
    const settings = getSettings();
    const ci = getCheckin(t);
    const newRemaining = Math.max(0, Math.min(settings.daily_new_words - ci.new_learned, countNewRemaining()));
    const stats = db.prepare(
      `SELECT
        (SELECT COUNT(*) FROM words) AS totalWords,
        (SELECT COUNT(*) FROM learning) AS learnedWords,
        (SELECT COUNT(*) FROM learning WHERE status = 'mastered') AS masteredWords`
    ).get();
    return {
      today: t,
      streak: getStreak(t),
      checkin: ci,
      newTarget: settings.daily_new_words,
      newRemaining,
      reviewDue: countDue(t),
      ...stats,
    };
  },

  'GET /api/learn/new'(req, url) {
    const settings = getSettings();
    const ci = getCheckin(today());
    const def = Math.max(0, settings.daily_new_words - ci.new_learned);
    const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : def;
    const rows = db.prepare(
      `SELECT w.* FROM words w LEFT JOIN learning l ON l.word_id = w.id
       WHERE l.word_id IS NULL ORDER BY w.level, w.id LIMIT ?`
    ).all(limit);
    return rows.map(rowToWord);
  },

  'POST /api/learn/result'(req, url, body) {
    const { wordId, result, wrongTimes = 0 } = body;
    if (!wordId || !['easy', 'known', 'failed'].includes(result)) {
      throw httpError(400, 'wordId / result 参数无效');
    }
    const exists = db.prepare('SELECT id FROM words WHERE id = ?').get(wordId);
    if (!exists) throw httpError(404, '单词不存在');
    const already = db.prepare('SELECT word_id FROM learning WHERE word_id = ?').get(wordId);
    if (already) throw httpError(409, '该词已在学习记录中');
    const t = today();
    const st = srs.initialState(result, t);
    db.prepare(
      `INSERT INTO learning (word_id, stage, status, next_review_at, last_review_at, learned_at, correct_count, wrong_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(wordId, st.stage, st.status, st.next_review_at, t, t, result === 'failed' ? 0 : 1, wrongTimes);
    const checkin = bumpCheckin(t, 'new_learned');
    return { ok: true, checkin, streak: getStreak(t) };
  },

  'GET /api/review/due'(req, url) {
    const settings = getSettings();
    const limit = Number(url.searchParams.get('limit')) || settings.daily_review_limit;
    const t = today();
    const rows = db.prepare(
      `SELECT w.*, l.stage FROM learning l JOIN words w ON w.id = l.word_id
       WHERE l.status = 'reviewing' AND l.next_review_at <= ?
       ORDER BY l.next_review_at, w.id LIMIT ?`
    ).all(t, limit);
    return rows.map(rowToWord);
  },

  'POST /api/review/result'(req, url, body) {
    const { wordId, correct, wrongTimes = 0 } = body;
    if (!wordId || typeof correct !== 'boolean') throw httpError(400, 'wordId / correct 参数无效');
    const cur = db.prepare('SELECT * FROM learning WHERE word_id = ?').get(wordId);
    if (!cur) throw httpError(404, '没有该词的学习记录');
    const t = today();
    const st = srs.reviewState(cur.stage, correct, t);
    db.prepare(
      `UPDATE learning SET stage = ?, status = ?, next_review_at = ?, last_review_at = ?,
        correct_count = correct_count + ?, wrong_count = wrong_count + ?
       WHERE word_id = ?`
    ).run(st.stage, st.status, st.next_review_at, t, correct ? 1 : 0, correct ? wrongTimes : wrongTimes + 1, wordId);
    const checkin = bumpCheckin(t, 'reviewed');
    return { ok: true, checkin, streak: getStreak(t), mastered: st.status === 'mastered' };
  },

  'GET /api/words'(req, url) {
    const q = (url.searchParams.get('q') || '').trim();
    const level = url.searchParams.get('level');
    const status = url.searchParams.get('status'); // new | reviewing | mastered
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

    const conds = [];
    const params = [];
    if (q) {
      conds.push('(w.word LIKE ? OR w.meaning LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (level) {
      conds.push('w.level = ?');
      params.push(Number(level));
    }
    if (status === 'new') conds.push('l.word_id IS NULL');
    else if (status === 'reviewing') conds.push("l.status = 'reviewing'");
    else if (status === 'mastered') conds.push("l.status = 'mastered'");
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const base = `FROM words w LEFT JOIN learning l ON l.word_id = w.id ${where}`;
    const total = db.prepare(`SELECT COUNT(*) AS c ${base}`).get(...params).c;
    const rows = db.prepare(
      `SELECT w.*, l.stage, l.status, l.next_review_at ${base} ORDER BY w.level, w.id LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);
    return { total, items: rows.map(rowToWord) };
  },

  'GET /api/checkins'(req, url) {
    const month = url.searchParams.get('month') || today().slice(0, 7); // 'YYYY-MM'
    const days = db.prepare(
      "SELECT * FROM checkins WHERE date LIKE ? ORDER BY date"
    ).all(`${month}-%`);
    const totalDays = db.prepare('SELECT COUNT(*) AS c FROM checkins WHERE completed = 1').get().c;
    return { month, days, streak: getStreak(today()), totalDays };
  },

  'GET /api/settings'() {
    return getSettings();
  },

  'PUT /api/settings'(req, url, body) {
    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );
    for (const key of ['daily_new_words', 'daily_review_limit']) {
      if (body[key] != null) {
        const v = Number(body[key]);
        if (!Number.isInteger(v) || v < 1 || v > 500) throw httpError(400, `${key} 必须是 1-500 的整数`);
        upsert.run(key, String(v));
      }
    }
    return { ok: true, ...getSettings() };
  },
};

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// ---------- 静态文件 ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  let file = pathname === '/' ? '/index.html' : pathname;
  const full = path.normalize(path.join(PUBLIC_DIR, file));
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
}

// ---------- 服务器 ----------

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const key = `${req.method} ${url.pathname}`;
  const handler = routes[key];

  if (!handler) {
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
      return serveStatic(req, res, url.pathname);
    }
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'Not Found' }));
  }

  let raw = '';
  req.on('data', (chunk) => (raw += chunk));
  req.on('end', () => {
    try {
      const body = raw ? JSON.parse(raw) : {};
      const result = handler(req, url, body);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (e) {
      const status = e.status || (e instanceof SyntaxError ? 400 : 500);
      if (status === 500) console.error(e);
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`BahasaBelajar 已启动:`);
  console.log(`  本机:   http://localhost:${PORT}`);
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces || []) {
      if (i.family === 'IPv4' && !i.internal) {
        console.log(`  局域网: http://${i.address}:${PORT}  (手机同 WiFi 可访问)`);
      }
    }
  }
  if (process.env.FAKE_TODAY) console.log(`  ⚠ FAKE_TODAY=${process.env.FAKE_TODAY}`);
});
