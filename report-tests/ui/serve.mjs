// Minimal static server for the generated report sites (tests only).
// /health answers before the sites exist, so it is the readiness check.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '.site');
const PORT = Number(process.env.PORT || 4318);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webm': 'video/webm',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/health') {
    res.writeHead(200).end('ok');
    return;
  }
  let path;
  try {
    path = normalize(decodeURIComponent(url.pathname)).replace(
      /^(\.\.[/\\])+/,
      ''
    );
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (path.endsWith('/') || path.endsWith(sep)) path += 'index.html';
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, '127.0.0.1', () =>
  console.log('serving ' + ROOT + ' on ' + PORT)
);
