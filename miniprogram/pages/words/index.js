const api = require('../../utils/api')
Page({
  data: { query: '', level: '', status: '', total: 0, items: [], offset: 0, loading: false, expanded: -1,
    filters: [
      { label: '全部', value: '' }, { label: '入门', value: '1' }, { label: '初级', value: '2' },
      { label: '中级', value: '3' }, { label: '复习中', value: 'reviewing' }, { label: '已掌握', value: 'mastered' }
    ]
  },
  onShow() { this.getTabBar().setData({ selected: 1 }); if (!this.data.items.length) this.load(true) },
  onPullDownRefresh() { this.load(true).finally(wx.stopPullDownRefresh) },
  onReachBottom() { this.load(false) },
  onInput(e) { this.setData({ query: e.detail.value }); clearTimeout(this.timer); this.timer = setTimeout(() => this.load(true), 350) },
  pickFilter(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ level: /^[1-3]$/.test(value) ? value : '', status: /reviewing|mastered/.test(value) ? value : '' })
    this.load(true)
  },
  toggle(e) { const id = e.currentTarget.dataset.id; this.setData({ expanded: this.data.expanded === id ? -1 : id }) },
  async load(reset) {
    if (this.data.loading) return
    const offset = reset ? 0 : this.data.offset
    if (!reset && this.data.items.length >= this.data.total) return
    this.setData({ loading: true })
    try {
      const q = encodeURIComponent(this.data.query)
      const data = await api.get(`/api/words?q=${q}&level=${this.data.level}&status=${this.data.status}&offset=${offset}&limit=30`)
      const incoming = data.items.map(item => ({ ...item, initial: item.word.charAt(0).toUpperCase() }))
      this.setData({ total: data.total, items: reset ? incoming : this.data.items.concat(incoming), offset: offset + incoming.length, loading: false })
    } catch (e) { this.setData({ loading: false }); wx.showToast({ title: e.message, icon: 'none' }) }
  }
})
