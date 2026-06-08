// ── HLS Proxy: routes external streams through our server to bypass CORS ──
app.get('/proxy', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url');
  if (!/^https?:\/\/.test(targetUrl)) return res.status(400).send('Invalid url');

  try {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const proxyReq = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': parsed.origin + '/',
        'Accept': '*/*',
      },
      rejectUnauthorized: false,
      timeout: 15000,
    }, (proxyRes) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');

      const ct = proxyRes.headers['content-type'] || '';
      const isManifest = ct.includes('mpegURL') || ct.includes('m3u8') || targetUrl.endsWith('.m3u8');

      if (isManifest) {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', chunk => body += chunk);
        proxyRes.on('end', () => {
          const base = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
          const origin = parsed.origin;
          const rewritten = body.split('\n').map(line => {
            line = line.trim();
            if (line.startsWith('#')) {
              return line.replace(/URI="([^"]+)"/g, (_, uri) => {
                const abs = uri.startsWith('http') ? uri : (uri.startsWith('/') ? origin + uri : base + uri);
                return 'URI="/proxy?url=' + encodeURIComponent(abs) + '"';
              });
            }
            if (!line || line.startsWith('#')) return line;
            const abs = line.startsWith('http') ? line : (line.startsWith('/') ? origin + line : base + line);
            return '/proxy?url=' + encodeURIComponent(abs);
          }).join('\n');
          res.setHeader('Content-Type', 'application/x-mpegURL');
          res.send(rewritten);
        });
      } else {
        res.setHeader('Content-Type', ct || 'application/octet-stream');
        proxyRes.pipe(res);
      }
    });

    proxyReq.on('error', err => { console.error('Proxy error:', err.message); res.status(502).send('Proxy error'); });
    proxyReq.on('timeout', () => { proxyReq.destroy(); res.status(504).send('Timeout'); });
    proxyReq.end();
  } catch (err) {
    res.status(400).send('Bad URL');
  }
});

app.options('/proxy', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

console.log('📡 HLS proxy enabled at /proxy?url=...');

// Initialize database
Database.init();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Football Stream running on port ${PORT}`);
  console.log(`📺 Live + Upcoming (7 days)`);
  console.log(`📊 Stats: http://localhost:${PORT}/stats`);
  console.log(`🔗 http://localhost:${PORT}`);
});