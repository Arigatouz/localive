import type { Plugin, ViteDevServer } from 'vite';
import { createHostValidator } from './host-validation';
import { createIntegrationHooks } from './integration';
import { createMiddleware, type LocaliveServerConfig } from './middleware';

export type LocaliveViteOptions = LocaliveServerConfig;

export function localiveVite(options: LocaliveViteOptions): Plugin {
  const { integration } = options;

  return {
    name: '@localive/vite',
    apply: 'serve',
    ...(integration && createIntegrationHooks(integration)),

    configureServer(server: ViteDevServer) {
      const middleware = createMiddleware(options, {
        isAllowedHost: createHostValidator(server.config.server),
        onSaved: (path) => server.ws.send('localive:update', { path }),
      });

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

      if (integration?.handleRequest) {
        server.middlewares.use((req, _res, next) => integration.handleRequest?.(req, next));
      }

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