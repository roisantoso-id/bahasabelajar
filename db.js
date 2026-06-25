'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'data.db');
const SEED_PATH = path.join(__dirname, 'seed', 'words.json');
const GRAMMAR_SEED_PATH = path.join(__dirname, 'seed', 'grammar.json');

const db = new DatabaseSync(DB_PATH);

db.exec(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS words (
  id       INTEGER PRIMARY KEY,
  word     TEXT NOT NULL UNIQUE,
  pos      TEXT NOT NULL,
  meaning  TEXT NOT NULL,
  examples TEXT NOT NULL,
  level    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS learning (
  word_id        INTEGER PRIMARY KEY REFERENCES words(id),
  stage          INTEGER NOT NULL DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'reviewing',
  next_review_at TEXT,
  last_review_at TEXT,
  learned_at     TEXT NOT NULL,
  correct_count  INTEGER NOT NULL DEFAULT 0,
  wrong_count    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_learning_due ON learning(next_review_at) WHERE status = 'reviewing';

CREATE TABLE IF NOT EXISTS checkins (
  date        TEXT PRIMARY KEY,
  new_learned INTEGER NOT NULL DEFAULT 0,
  reviewed    INTEGER NOT NULL DEFAULT 0,
  completed   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grammar (
  id       INTEGER PRIMARY KEY,
  lesson   INTEGER NOT NULL,
  pattern  TEXT NOT NULL,
  meaning  TEXT NOT NULL,
  explain  TEXT NOT NULL,
  examples TEXT NOT NULL
);
`);

// 首次启动：导入种子词库 + 默认设置（幂等，删 data.db 重启即重置）
function seedIfEmpty() {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM words').get();
  if (c > 0) return;
  if (!fs.existsSync(SEED_PATH)) {
    console.warn(`[db] 种子文件不存在: ${SEED_PATH}，词库为空`);
    return;
  }
  const words = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const insert = db.prepare(
    'INSERT INTO words (word, pos, meaning, examples, level) VALUES (?, ?, ?, ?, ?)'
  );
  db.exec('BEGIN');
  try {
    for (const w of words) {
      insert.run(w.word, w.pos, w.meaning, JSON.stringify(w.examples), w.level);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  console.log(`[db] 已导入 ${words.length} 个种子单词`);
}

const DEFAULT_SETTINGS = { daily_new_words: '10', daily_review_limit: '100' };
function initSettings() {
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insert.run(k, v);
}

function seedGrammarIfEmpty() {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM grammar').get();
  if (c > 0) return;
  if (!fs.existsSync(GRAMMAR_SEED_PATH)) return;
  const items = JSON.parse(fs.readFileSync(GRAMMAR_SEED_PATH, 'utf8'));
  const insert = db.prepare(
    'INSERT INTO grammar (lesson, pattern, meaning, explain, examples) VALUES (?, ?, ?, ?, ?)'
  );
  db.exec('BEGIN');
  try {
    for (const g of items) {
      insert.run(g.lesson, g.pattern, g.meaning, g.explain, JSON.stringify(g.examples));
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  console.log(`[db] 已导入 ${items.length} 条语法规则`);
}

seedIfEmpty();
seedGrammarIfEmpty();
initSettings();

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = {};
  for (const r of rows) s[r.key] = Number(r.value);
  return s;
}

module.exports = { db, getSettings };
