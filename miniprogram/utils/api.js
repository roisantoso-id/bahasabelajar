function request(path, options = {}) {
  const app = getApp()
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBase}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: { 'content-type': 'application/json' },
      success: ({ statusCode, data }) => {
        if (statusCode >= 200 && statusCode < 300) resolve(data)
        else reject(new Error(data && data.error ? data.error : `请求失败 ${statusCode}`))
      },
      fail: () => reject(new Error('连接不到学习服务器，请在设置中检查地址'))
    })
  })
}

module.exports = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', data }),
  put: (path, data) => request(path, { method: 'PUT', data })
}
