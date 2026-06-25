# BahasaBelajar

扇贝式印尼语单词学习小程序，包含 500 个高频词、双语例句、间隔复习、学习日历和本地 SQLite 数据库。

## 项目结构

- `miniprogram/`：微信小程序客户端（当前正式界面）
- `server.js`、`db.js`、`srs.js`：Node.js + SQLite 学习服务
- `seed/words.json`：500 个印尼语种子词
- `public/`：早期 Web 预览版，保留作浏览器调试

## 本地启动

1. 运行学习服务：`node server.js`
2. 在微信开发者工具中导入本仓库根目录
3. 开发者工具中已关闭域名校验；模拟器默认连接 `http://127.0.0.1:3000`
4. 真机测试时，在小程序「设置」页把服务地址改成启动日志里的局域网地址，例如 `http://192.168.1.7:3000`

## 发布说明

微信小程序不能直接执行 sqlite3。当前架构由小程序调用 Node API，SQLite 数据仍落在服务端的 `data.db`。正式发布时需要把 Node 服务部署到已备案的 HTTPS 域名，并在微信公众平台配置 request 合法域名。

在 `project.config.json` 中把 `touristappid` 替换为正式小程序 AppID 后即可上传。
