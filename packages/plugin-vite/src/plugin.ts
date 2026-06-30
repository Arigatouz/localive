import type { Plugin, ViteDevServer } from 'vite';
import { createMiddleware } from './middleware';
import type { DevServerConfig } from './types';

export interface LocaliveViteOptions extends DevServerConfig {}

export function localiveVite(options: LocaliveViteOptions): Plugin {
  return {
    name: '@localive/vite',
    apply: 'serve',

    configureServer(server: ViteDevServer) {
      const middleware = createMiddleware(options);

      server.middlewares.use((req, res, next) => {
        middleware(req, res).then(() => {
          // If middleware didn't send a response, pass to next
          if (!res.headersSent) {
            next();
          }
        }).catch((err) => {
          console.error('[localive] Middleware error:', err);
          next();
        });
      });

      // After a successful save, the middleware sends the response.
      // We need to broadcast the update to connected clients via HMR.
      // Hook into the middleware to detect successful saves and broadcast.
      server.middlewares.use((req, res, next) => {
        // Intercept after the write middleware processes — if the response
        // was sent with 200, broadcast an HMR update so the browser reloads.
        const originalEnd = res.end.bind(res);
        let broadcastSent = false;
        res.end = function (...args: unknown[]) {
          if (!broadcastSent && res.statusCode === 200) {
            broadcastSent = true;
            try {
              const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
              server.ws.send('localive:update', { path: url.pathname });
            } catch {
              // Ignore broadcast errors — non-critical
            }
          }
          return (originalEnd as Function)(...args);
        } as typeof res.end;
        next();
      });

      // WebSocket support for multi-tab sync
      if (options.ws) {
        setupWebSocket(server, options.wsPort);
      }
    },
  };
}

function setupWebSocket(server: ViteDevServer, _port?: number) {
  // Use Vite's built-in HMR WebSocket for simplicity
  // In production, this would use a separate ws server
  server.ws.on('connection', () => {
    // Client connected
  });
}