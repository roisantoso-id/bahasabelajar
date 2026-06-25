const api = require('../../utils/api')
Page({
  data: { month: '', monthLabel: '', cells: [], streak: 0, totalDays: 0, weeks: ['日', '一', '二', '三', '四', '五', '六'] },
  onShow() {
    this.getTabBar().setData({ selected: 2 })
    if (!this.data.month) this.setData({ month: this.formatMonth(new Date()) })
    this.load()
  },
  formatMonth(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` },
  shiftMonth(e) {
    const [year, month] = this.data.month.split('-').map(Number)
    this.setData({ month: this.formatMonth(new Date(year, month - 1 + Number(e.currentTarget.dataset.delta), 1)) })
    this.load()
  },
  async load() {
    try {
      const data = await api.get(`/api/checkins?month=${this.data.month}`)
      const [year, month] = this.data.month.split('-').map(Number)
      const first = new Date(year, month - 1, 1).getDay()
      const count = new Date(year, month, 0).getDate()
      const map = {}; data.days.forEach(d => { map[Number(d.date.slice(-2))] = d })
      const today = new Date(); const cells = []
      for (let i = 0; i < first; i++) cells.push({ key: `blank-${i}`, blank: true })
      for (let day = 1; day <= count; day++) {
        const info = map[day] || {}; const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate()
        cells.push({ key: `day-${day}`, day, today: isToday, done: info.completed === 1, active: (info.new_learned || 0) + (info.reviewed || 0) > 0 })
      }
      this.setData({ cells, streak: data.streak, totalDays: data.totalDays, monthLabel: `${year}年 ${month}月` })
    } catch (e) { wx.showToast({ title: e.message, icon: 'none' }) }
  }
})
