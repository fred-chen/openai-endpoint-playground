// dev-proxy.js —— 本地开发用的轻量代理（仅开发/自测用，不是生产网关）
//
// 解决两件事：
//  1) 混合内容：GitHub Pages 是 https，不能直接 fetch 你的 http 端点；
//     浏览器访问 http://localhost 的本地页面时没有该限制。
//  2) CORS：代理统一注入 Access-Control-Allow-Origin。
// 另外 localhost 页面能解析到你内网的 ai395，公网 Pages 不能。
//
// 用法：
//   node dev-proxy.js                        # 默认端口 8787
//   TARGET=http://ai395:8080 node dev-proxy.js
//   node dev-proxy.js http://ai395:8080 8787 # 位置参数：目标URL [端口]
//
// 然后在本地打开 http://localhost:8787/ 这个页面，端点填：http://localhost:8787/v1
//
// 安全：无鉴权、仅监听 127.0.0.1、仅用于本地调试。不要把带 key 的请求发到不受信主机。

const http = require('http');
const { request } = require('http');
const { readFile } = require('fs/promises');
const path = require('path');

const args = process.argv.slice(2);
const TARGET = (args[0] || process.env.TARGET || 'http://ai395:8080').replace(/\/+$/, '');
const PORT = parseInt(args[1] || process.env.PORT || '8787', 10);
const HOST = '127.0.0.1';

const t = new URL(TARGET);

// 允许通过 ?target= 或 X-Proxy-Target 头临时切换上游（方便测别的端点，仍是 http）
function resolveTarget(req) {
  const h = req.headers['x-proxy-target'];
  if (h) { try { return new URL(h); } catch { /* ignore */ } }
  const q = new URL(req.url, 'http://x').searchParams.get('target');
  if (q) { try { return new URL(q); } catch { /* ignore */ } }
  return t;
}

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Authorization,Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// 读取仓库里的 openai-chat.html 作为本地页面（同源，无任何混合内容/CORS 问题）
async function serveApp(req, res) {
  try {
    const html = await readFile(path.join(__dirname, 'openai-chat.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
  } catch (e) {
    res.writeHead(500); res.end('openai-chat.html not found: ' + e.message);
  }
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://' + HOST);
  if (u.pathname === '/' || u.pathname === '/index.html' || u.pathname === '/openai-chat.html') {
    if (req.method === 'GET') return serveApp(req, res);
  }
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const up = resolveTarget(req);
  const headers = Object.assign({}, req.headers, { host: up.host });
  const opts = {
    method: req.method, hostname: up.hostname, port: up.port || (up.protocol === 'https:' ? 443 : 80),
    path: up.pathname + up.search, headers,
  };
  const p = request(opts, (ur) => {
    const h = Object.assign({}, ur.headers);
    h['access-control-allow-origin'] = req.headers.origin || '*'; // 覆盖上游 CORS
    res.writeHead(ur.statusCode, h);
    ur.pipe(res);
  });
  p.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json', 'access-control-allow-origin': req.headers.origin || '*' });
    res.end(JSON.stringify({ error: { message: 'proxy upstream error: ' + e.message } }));
  });
  req.pipe(p);
}).listen(PORT, HOST, () => {
  console.log(`openai-endpoint-playground dev proxy`);
  console.log(`  page    : http://${HOST}:${PORT}/`);
  console.log(`  endpoint: http://${HOST}:${PORT}/v1   →  ${TARGET}`);
  console.log(`  (临时切上游：在页面里点“代理此端点”，或 ?target= / X-Proxy-Target)`);
});
