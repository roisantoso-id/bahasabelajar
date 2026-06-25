const api = require('../../utils/api')

Page({
  data: {
    loading: true,
    rules: [],
    expanded: -1,
    lesson: 2
  },
  onLoad(options) {
    if (options.lesson) this.setData({ lesson: Number(options.lesson) })
    this.load()
  },
  async load() {
    try {
      const rules = await api.get(`/api/grammar?lesson=${this.data.lesson}`)
      this.setData({ rules, loading: false })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message, icon: 'none' })
    }
  },
  toggle(e) {
    const idx = e.currentTarget.dataset.idx
    this.setData({ expanded: this.data.expanded === idx ? -1 : idx })
  },
  close() { wx.navigateBack() }
})
