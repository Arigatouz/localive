import { createBuilder } from '@angular-devkit/architect';
import { localiveBuilder } from './builders';

export { createLocaliveBuilder, localiveBuilder } from './builders';
export type { LocaliveBuilderOptions, LocaliveDevServerOptions } from './schema';
export { createMiddleware as createLocaliveMiddleware } from '@localive/vite';
export default createBuilder(localiveBuilder);