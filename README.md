# M+M 小站

两位PK小朋友 Work & Play — 极简收藏夹应用

## 功能
- 📌 收藏应用和游戏链接，分标签管理
- 🎨 内置 80+ emoji 图标，新增时随机分配或手动选择
- 🔐 增删改操作需密码保护（密码：`kingsoft`）
- 🔄 多设备同步（Node.js 服务端存储）
- 📱 全平台自适应（Safari / Firefox / Chrome / 移动端）

## 部署
- 线上地址：https://app.mplusm.site
- 服务器：43.133.145.77（腾讯云轻量）
- 进程守护：PM2（`pm2 status`）
- 端口：3456（Nginx 反代）

## 本地运行
```bash
node server.js
# 访问 http://localhost:3456
```

## 文件说明
| 文件 | 说明 |
|------|------|
| `index.html` | 前端页面（纯 HTML+CSS+JS，无依赖） |
| `server.js`  | Node.js 后端（静态服务 + /api/data 接口） |
| `data.json`  | 数据存储文件（勿删） |
| `package.json` | 项目配置 |
