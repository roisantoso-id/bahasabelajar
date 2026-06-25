Component({
  data: {
    selected: 0,
    tabs: [
      { pagePath: '/pages/home/index', text: '今日', icon: '⌂' },
      { pagePath: '/pages/words/index', text: '词库', icon: 'A' },
      { pagePath: '/pages/calendar/index', text: '日历', icon: '▦' },
      { pagePath: '/pages/settings/index', text: '设置', icon: '◉' }
    ]
  },
  methods: {
    switchTab(e) { wx.switchTab({ url: e.currentTarget.dataset.path }) }
  }
})
