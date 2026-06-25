const api = require('../../utils/api')

Page({
  data: {
    mode: 'learn', loading: true, empty: false, revealed: false, done: false,
    queue: [], index: 0, total: 0, completed: 0, wrongTotal: 0,
    word: { word: '', pos: '', meaning: '', examples: [], level: 1 }, progress: 0
  },
  onLoad(options) {
    this.setData({ mode: options.mode === 'review' ? 'review' : 'learn' })
    this.load()
  },
  async load() {
    try {
      const list = await api.get(this.data.mode === 'learn' ? '/api/learn/new' : '/api/review/due')
      const queue = list.map(item => ({ ...item, wrongTimes: 0 }))
      this.setData({ queue, total: list.length, loading: false, empty: !list.length })
      if (list.length) this.showWord()
    } catch (e) {
      this.setData({ loading: false, empty: true })
      wx.showToast({ title: e.message, icon: 'none' })
    }
  },
  showWord() {
    const word = this.data.queue[this.data.index]
    if (!word) return this.finish()
    this.setData({
      word,
      revealed: false,
      progress: Math.round(this.data.completed / Math.max(1, this.data.total) * 100)
    })
  },
  revealKnown() { this.setData({ revealed: true }) },
  revealUnknown() {
    const queue = this.data.queue
    const index = this.data.index
    queue[index].wrongTimes += 1
    queue.splice(Math.min(index + 4, queue.length), 0, { ...queue[index], retry: true })
    this.setData({ queue, word: queue[index], revealed: true, wrongTotal: this.data.wrongTotal + 1 })
  },
  chooseEasy() { this.submit('easy') },
  chooseKnown() { this.submit('known') },
  nextAfterWrong() { this.advance(false) },
  async submit(result) {
    const word = this.data.word
    try {
      if (this.data.mode === 'learn') {
        await api.post('/api/learn/result', {
          wordId: word.id,
          result: word.wrongTimes ? 'failed' : result,
          wrongTimes: word.wrongTimes
        })
      } else {
        await api.post('/api/review/result', {
          wordId: word.id,
          correct: !word.wrongTimes,
          wrongTimes: word.wrongTimes
        })
      }
      this.advance(true)
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' })
    }
  },
  advance(countDone) {
    this.setData({
      index: this.data.index + 1,
      completed: this.data.completed + (countDone ? 1 : 0)
    })
    this.showWord()
  },
  finish() { this.setData({ done: true, progress: 100 }) },
  close() { wx.navigateBack() },
  backHome() { wx.navigateBack() }
})
