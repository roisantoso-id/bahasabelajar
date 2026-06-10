'use strict';
// SRS 纯逻辑：艾宾浩斯间隔表与状态变换，无任何 IO

const INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15, 6: 30, 7: 60 }; // stage -> 天数
const MAX_STAGE = 7;

// 'YYYY-MM-DD' + n 天 -> 'YYYY-MM-DD'
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

// 学新词的最终结果 -> 初始 SRS 状态
// result: 'easy'(太简单了) | 'known'(记住了) | 'failed'(经过不认识循环后通过)
function initialState(result, today) {
  const stage = result === 'easy' ? 3 : 1;
  return { stage, status: 'reviewing', next_review_at: addDays(today, INTERVALS[stage]) };
}

// 复习结果 -> 新 SRS 状态
// correct=true: 升一级，stage 7 再答对则 mastered
// correct=false: 降两级（最低 1），明天再见
function reviewState(stage, correct, today) {
  if (correct) {
    if (stage >= MAX_STAGE) {
      return { stage: MAX_STAGE, status: 'mastered', next_review_at: null };
    }
    const next = stage + 1;
    return { stage: next, status: 'reviewing', next_review_at: addDays(today, INTERVALS[next]) };
  }
  const next = Math.max(1, stage - 2);
  return { stage: next, status: 'reviewing', next_review_at: addDays(today, 1) };
}

module.exports = { INTERVALS, MAX_STAGE, addDays, initialState, reviewState };
