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