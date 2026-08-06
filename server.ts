import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy route for vocab-escape to strip X-Frame-Options and permit embedding in iframe
  app.use('/vocab-escape-proxy', async (req, res) => {
    const subPath = req.url || '/';
    const targetUrl = 'https://vocab-escape.vercel.app' + subPath;
    try {
      const response = await fetch(targetUrl);
      res.statusCode = response.status;

      // Forward headers except framing protections and length
      response.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (
          lower !== 'x-frame-options' &&
          lower !== 'content-security-policy' &&
          lower !== 'frame-options' &&
          lower !== 'content-length'
        ) {
          res.setHeader(key, value);
        }
      });

      if (
        subPath === '/' ||
        subPath === '/index.html' ||
        (response.headers.get('content-type') &&
          response.headers.get('content-type')!.includes('text/html'))
      ) {
        let html = await response.text();
        html = html.replace('<head>', '<head><base href="/vocab-escape-proxy/">');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.end(buffer);
    } catch (err) {
      console.error('Error proxying vocab-escape:', err);
      res.statusCode = 500;
      res.end('Proxy error');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
