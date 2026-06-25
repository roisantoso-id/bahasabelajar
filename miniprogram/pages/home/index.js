const api = require('../../utils/api')

Page({
  data: {
    loading: true,
    home: { streak: 0, newRemaining: 0, reviewDue: 0, learnedWords: 0, totalWords: 500, checkin: {} },
    progress: 0,
    greeting: 'Selamat pagi',
    dateLabel: ''
  },
  onShow() {
    this.getTabBar().setData({ selected: 0 })
    const now = new Date()
    const hour = now.getHours()
    this.setData({
      greeting: hour < 12 ? 'Selamat pagi' : hour < 18 ? 'Selamat siang' : 'Selamat malam',
      dateLabel: `${now.getMonth() + 1}月${now.getDate()}日 · 今日计划`
    })
    this.load()
  },
  async load() {
    try {
      const home = await api.get('/api/home')
      const done = home.checkin.new_learned + home.checkin.reviewed
      const total = home.newTarget + home.reviewDue + home.checkin.reviewed
      const progress = home.checkin.completed ? 100 : Math.min(100, Math.round(done / Math.max(1, total) * 100))
      this.setData({ home, progress, loading: false })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message, icon: 'none', duration: 2600 })
    }
  },
  startLearn() { wx.navigateTo({ url: '/pages/study/index?mode=learn' }) },
  startGrammar() { wx.navigateTo({ url: '/pages/grammar/index?lesson=2' }) },
  startReview() { wx.navigateTo({ url: '/pages/study/index?mode=review' }) }
})
