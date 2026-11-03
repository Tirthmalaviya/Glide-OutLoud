/* Wanderwild local server — run with:  node server.js   then open http://localhost:8080
   - Serves the app from the web/ folder (no installs needed, Node 18 or newer).
   - Optional: Microsoft Azure AI Speech for pronunciation scoring and natural voices.
     Put AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in a file called .env next to this file (see .env.example).
     The key stays on this computer: the browser only receives a short-lived token from /api/speech-token.
   Without a key the app uses Chrome's built-in speech recognition instead. */
const http = require('http'), fs = require('fs'), path = require('path');
const HERE = __dirname, ROOT = path.join(__dirname, 'web'), PORT = Number(process.env.PORT || 8080);

// read .env (KEY=value lines) without extra packages
try {
  for (const line of fs.readFileSync(path.join(HERE, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) { /* no .env file: fine */ }
const KEY = process.env.AZURE_SPEECH_KEY || '', REGION = process.env.AZURE_SPEECH_REGION || '';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
let cached = { token: null, at: 0 };

async function speechToken(res) {
  if (!KEY || !REGION) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"not-configured"}'); }
  try {
    if (!cached.token || Date.now() - cached.at > 8 * 60 * 1000) {
      const r = await fetch(`https://${REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': KEY, 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!r.ok) throw new Error('Azure answered ' + r.status);
      cached = { token: await r.text(), at: Date.now() };
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ token: cached.token, region: REGION }));
  } catch (e) {
    console.error('Speech token failed:', e.message, '(check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION)');
    res.writeHead(502, { 'Content-Type': 'application/json' }); res.end('{"error":"token-failed"}');
  }
}

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/api/speech-token') return speechToken(res);
  const file = path.normalize(path.join(ROOT, url === '/' ? 'index.html' : url));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  Wanderwild is running:  http://localhost:${PORT}\n`);
  console.log(KEY && REGION ? `  Speech: Microsoft Azure (region ${REGION}) — pronunciation scores and natural voices.` : '  Speech: Chrome built-in recognition (add an Azure key in .env for pronunciation scores).');
  console.log('  Open the address in Google Chrome or Microsoft Edge. Press Ctrl+C to stop.\n');
});
