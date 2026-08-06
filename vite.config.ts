import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function vocabEscapeProxyPlugin() {
  return {
    name: 'vocab-escape-proxy-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        console.log('[Vocab Proxy Request]:', req.url);
        if (req.url && req.url.startsWith('/vocab-escape-proxy')) {
          const subPath = req.url.replace(/^\/vocab-escape-proxy/, '') || '/';
          const targetUrl = 'https://vocab-escape.vercel.app' + subPath;
          try {
            const response = await fetch(targetUrl);
            res.statusCode = response.status;
            
            // Forward headers except x-frame-options and content-security-policy
            response.headers.forEach((value: string, key: string) => {
              const lower = key.toLowerCase();
              if (lower !== 'x-frame-options' && lower !== 'content-security-policy' && lower !== 'frame-options' && lower !== 'content-length') {
                res.setHeader(key, value);
              }
            });

            if (subPath === '/' || subPath === '/index.html' || (response.headers.get('content-type') && response.headers.get('content-type')!.includes('text/html'))) {
              let html = await response.text();
              html = html.replace('<head>', '<head><base href="/vocab-escape-proxy/">');
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(html);
              return;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.end(buffer);
            return;
          } catch (err) {
            console.error('Error proxying vocab-escape:', err);
            res.statusCode = 500;
            res.end('Proxy error');
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), vocabEscapeProxyPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_FIREBASE_CONFIG': JSON.stringify(env.VITE_FIREBASE_CONFIG || env.FIREBASE_CONFIG),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID),
      'process.env.VITE_FIREBASE_DATABASE_ID': JSON.stringify(env.VITE_FIREBASE_DATABASE_ID || env.FIREBASE_DATABASE_ID),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
