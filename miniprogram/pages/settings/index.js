const api = require('../../utils/api')
Page({
  data: { daily_new_words: 10, daily_review_limit: 100, apiBase: '', saving: false },
  onShow() { this.getTabBar().setData({ selected: 3 }); this.setData({ apiBase: getApp().globalData.apiBase }); this.load() },
  async load() {
    try { this.setData(await api.get('/api/settings')) } catch (e) { /* 地址可在本页修复 */ }
  },
  step(e) {
    const key = e.currentTarget.dataset.key; const delta = Number(e.currentTarget.dataset.delta)
    const limits = key === 'daily_new_words' ? [5, 100] : [10, 500]
    this.setData({ [key]: Math.max(limits[0], Math.min(limits[1], this.data[key] + delta)) })
  },
  onAddress(e) { this.setData({ apiBase: e.detail.value }) },
  async save() {
    let address = this.data.apiBase.trim().replace(/\/$/, '')
    if (!/^https?:\/\//.test(address)) return wx.showToast({ title: '请输入完整的 http(s) 地址', icon: 'none' })
    getApp().globalData.apiBase = address; wx.setStorageSync('apiBase', address); this.setData({ saving: true })
    try {
      await api.put('/api/settings', { daily_new_words: this.data.daily_new_words, daily_review_limit: this.data.daily_review_limit })
      wx.showToast({ title: '设置已保存', icon: 'success' })
    } catch (e) { wx.showToast({ title: e.message, icon: 'none', duration: 2600 }) }
    this.setData({ saving: false })
  }
})
