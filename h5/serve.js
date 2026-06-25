// 极简静态服务器，只服务 h5 目录
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
const PORT = process.env.PORT || 4173
const TYPES = { '.html':'text/html;charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json' }

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const file = path.join(ROOT, p)
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden') }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found') }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' })
    res.end(buf)
  })
}).listen(PORT, () => console.log(`h5 server on http://0.0.0.0:${PORT}`))
