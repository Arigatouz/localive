import type { DevServerConfig as BaseConfig } from '@localive/vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface DevServerConfig extends BaseConfig {}

export type NextFunction = (err?: Error) => void;

export interface WebpackMiddleware {
  (req: IncomingMessage, res: ServerResponse, next: NextFunction): void;
}

export interface WebpackDevServer {
  app?: {
    use?(middleware: WebpackMiddleware): void;
  };
  onBeforeSetupMiddleware?: (devServer: WebpackDevServer) => void;
  setupMiddlewares?: WebpackMiddlewareSetupHandler;
}

export interface WebpackMiddlewareSetupHandler {
  (middlewares: WebpackMiddleware[], devServer: WebpackDevServer): WebpackMiddleware[];
}

export interface WebpackDevServerConfig {
  setupMiddlewares?: WebpackMiddlewareSetupHandler;
  onBeforeSetupMiddleware?: (devServer: WebpackDevServer) => void;
}
