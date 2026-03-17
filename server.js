const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = 3456;
const DATA_FILE = path.join(__dirname, 'data.json');
const STATIC    = path.join(__dirname);

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    tags:  [{ id: 'app', name: '应用' }, { id: 'game', name: '游戏' }],
    links: []
  }, null, 2));
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API: GET /api/geo ── 解析访客 IP 归属地
  if (url === '/api/geo' && req.method === 'GET') {
    // 获取真实 IP（考虑反向代理）
    const clientIp = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '')
      .split(',')[0].trim().replace('::ffff:', '');

    // 本地/内网 IP 直接返回
    if (!clientIp || clientIp === '127.0.0.1' || clientIp.startsWith('192.168') || clientIp.startsWith('10.')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ city: '本地', region: '', country: '' }));
      return;
    }

    // 调用 ip-api.com 免费 API（无需 key，每分钟 45 次限额）
    const geoUrl = `http://ip-api.com/json/${clientIp}?lang=zh-CN&fields=status,city,regionName,country`;
    http.get(geoUrl, (apiRes) => {
      let raw = '';
      apiRes.on('data', c => raw += c);
      apiRes.on('end', () => {
        try {
          const geo = JSON.parse(raw);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            city:    geo.city    || '',
            region:  geo.regionName || '',
            country: geo.country || '',
            ip:      clientIp,
          }));
        } catch {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ city: '', region: '', country: '' }));
        }
      });
    }).on('error', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ city: '', region: '', country: '' }));
    });
    return;
  }

  // ── API: GET /api/data ──
  if (url === '/api/data' && req.method === 'GET') {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    return;
  }

  // ── API: POST /api/data ──
  if (url === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400); res.end('Bad Request');
      }
    });
    return;
  }

  // ── Static files ──
  let filePath = path.join(STATIC, url === '/' ? 'index.html' : url);
  // 防止路径穿越
  if (!filePath.startsWith(STATIC)) { res.writeHead(403); res.end(); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback → index.html
      fs.readFile(path.join(STATIC, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`M+M小站 running at http://127.0.0.1:${PORT}`);
});
