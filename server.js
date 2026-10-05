// SAI Logistics - backend server (Node.js, koi npm package nathi joiti)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!process.env.ADMIN_PASSWORD) {
  console.warn('\n⚠  ADMIN_PASSWORD set nathi, default "admin123" vaprai rahyo che. Live karva pehla badlo!\n');
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// ---------- nana helpers ----------
const sessions = new Map(); // token -> expiry time
const SESSION_MS = 8 * 60 * 60 * 1000;
const hits = new Map();     // ip -> [timestamps]  (spam rokva mate)

function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 50_000) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

function getCookie(req, name) {
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function isAdmin(req) {
  const t = getCookie(req, 'sai_admin');
  const exp = t && sessions.get(t);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(t); return false; }
  return true;
}

function clientIp(req) {
  return req.socket.remoteAddress || 'unknown';
}

function rateLimited(ip, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr);
  return false;
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

// ---------- API ----------
async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  // Public: services list (database ma thi)
  if (route === 'GET /api/services') {
    const rows = db.prepare('SELECT slug, title, description, icon FROM services ORDER BY sort_order').all();
    return send(res, 200, rows);
  }

  // Public: contact / quote form
  if (route === 'POST /api/inquiries') {
    if (rateLimited(clientIp(req))) return send(res, 429, { error: 'Ghana request thai gaya. Thodi var pachi try karo.' });
    let body;
    try { body = await readJson(req); } catch { return send(res, 400, { error: 'Invalid request' }); }

    // Honeypot: bot hase to aa field bhari deshe
    if (body.website) return send(res, 200, { ok: true });

    const d = {
      name: clean(body.name, 100), email: clean(body.email, 150), phone: clean(body.phone, 30),
      company: clean(body.company, 150), service: clean(body.service, 100), message: clean(body.message, 2000),
    };
    const errors = {};
    if (d.name.length < 2) errors.name = 'Naam lakho';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errors.email = 'Sacho email lakho';
    if (!/^[0-9+\-\s()]{7,20}$/.test(d.phone)) errors.phone = 'Sacho phone number lakho';
    if (d.message.length < 5) errors.message = 'Message lakho';
    if (Object.keys(errors).length) return send(res, 400, { error: 'Form ma bhul che', errors });

    const info = db.prepare(
      'INSERT INTO inquiries (name, email, phone, company, service, message, ip) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(d.name, d.email, d.phone, d.company || null, d.service || null, d.message, clientIp(req));
    return send(res, 201, { ok: true, id: Number(info.lastInsertRowid) });
  }

  // Admin login / logout / status
  if (route === 'POST /api/admin/login') {
    if (rateLimited('login:' + clientIp(req), 8, 15 * 60_000)) return send(res, 429, { error: 'Ghana try thai gaya. 15 minute pachi try karo.' });
    let body;
    try { body = await readJson(req); } catch { return send(res, 400, { error: 'Invalid request' }); }
    if (!safeEqual(body.password ?? '', ADMIN_PASSWORD)) return send(res, 401, { error: 'Password khotu che' });
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_MS);
    return send(res, 200, { ok: true }, {
      'Set-Cookie': `sai_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`,
    });
  }
  if (route === 'POST /api/admin/logout') {
    const t = getCookie(req, 'sai_admin'); if (t) sessions.delete(t);
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'sai_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }
  if (route === 'GET /api/admin/me') return send(res, 200, { admin: isAdmin(req) });

  // Admin only
  if (url.pathname.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return send(res, 401, { error: 'Login jaruri che' });

    if (route === 'GET /api/admin/inquiries') {
      const status = url.searchParams.get('status');
      const rows = ['new', 'contacted', 'closed'].includes(status)
        ? db.prepare('SELECT * FROM inquiries WHERE status = ? ORDER BY id DESC').all(status)
        : db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all();
      const counts = db.prepare('SELECT status, COUNT(*) AS c FROM inquiries GROUP BY status').all();
      return send(res, 200, { rows, counts });
    }

    const m = url.pathname.match(/^\/api\/admin\/inquiries\/(\d+)$/);
    if (m && req.method === 'PATCH') {
      let body;
      try { body = await readJson(req); } catch { return send(res, 400, { error: 'Invalid request' }); }
      if (!['new', 'contacted', 'closed'].includes(body.status)) return send(res, 400, { error: 'Invalid status' });
      const r = db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(body.status, Number(m[1]));
      return send(res, r.changes ? 200 : 404, r.changes ? { ok: true } : { error: 'Not found' });
    }
    if (m && req.method === 'DELETE') {
      const r = db.prepare('DELETE FROM inquiries WHERE id = ?').run(Number(m[1]));
      return send(res, r.changes ? 200 : 404, r.changes ? { ok: true } : { error: 'Not found' });
    }
  }

  return send(res, 404, { error: 'API route nathi malyo' });
}

// ---------- static files (frontend) ----------
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  if (p === '/admin') p = '/admin.html';
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Page not found');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    return serveStatic(req, res, url);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => console.log(`✅ SAI Logistics chalu che: http://localhost:${PORT}\n   Admin panel: http://localhost:${PORT}/admin`));
