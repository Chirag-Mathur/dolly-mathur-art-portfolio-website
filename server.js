const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PAINTINGS_DIR = path.join(ROOT, 'images', 'paintings');
const META_FILE = path.join(ROOT, 'data', 'paintings-meta.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getPaintings() {
  const config = safeReadJson(META_FILE);
  const supported = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);

  let files = [];
  try {
    files = fs
      .readdirSync(PAINTINGS_DIR)
      .filter((name) => supported.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    files = [];
  }

  return files.map((filename, index) => {
    const meta = config[filename] || {};
    const defaultTitle = filename
      .replace(path.extname(filename), '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      id: index + 1,
      filename,
      image: `/images/paintings/${encodeURIComponent(filename)}`,
      title: meta.title || defaultTitle,
      description: meta.description || 'A vivid original piece from the artist collection.',
      price: typeof meta.price === 'string' && meta.price.trim() ? meta.price : null,
      medium: meta.medium || null,
      year: meta.year || null
    };
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (requestPath === '/api/paintings') {
    const paintings = getPaintings();
    sendJson(res, 200, { paintings });
    return;
  }

  const target = requestPath === '/' ? '/index.html' : requestPath;
  const normalized = path.normalize(target).replace(/^\.+/, '');
  const fullPath = path.join(ROOT, normalized);

  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  sendFile(res, fullPath);
});

server.listen(PORT, () => {
  console.log(`Painter showcase running at http://localhost:${PORT}`);
});
