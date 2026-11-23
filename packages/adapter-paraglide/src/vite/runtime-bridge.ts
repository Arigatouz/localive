import { createRequire } from 'node:module';
import { join } from 'node:path';

export const RUNTIME_BRIDGE_ID = 'virtual:localive-paraglide-runtime';
const RESOLVED_ID = `\0${RUNTIME_BRIDGE_ID}`;

export interface RuntimeBridgeOptions {
  /** Folders where Svelte is looked up, in order. */
  searchFolders: string[];
  /**
   * File of the runtime module, imported by path because Vite would discover a bare
   * specifier only when the first edit-mode page loads, then re-optimize and reload it.
   */
  runtimeFile: string;
}

export function resolveRuntimeBridge(source: string): string | null {
  return source === RUNTIME_BRIDGE_ID ? RESOLVED_ID : null;
}

/**
 * The module instrumented messages import `tag` from.
 * When Svelte resolves from one of the folders, it also makes drafts reactive.
 */
export function loadRuntimeBridge(id: string, { searchFolders, runtimeFile }: RuntimeBridgeOptions): string | null {
  if (id !== RESOLVED_ID) return null;

  const runtime = JSON.stringify(runtimeFile.replaceAll('\\', '/'));
  const exportTag = `export { tag } from ${runtime};\n`;
  if (!searchFolders.some(resolvesSvelte)) return exportTag;
  return `import { createSubscriber } from 'svelte/reactivity';
import { useSubscriber } from ${runtime};
useSubscriber(createSubscriber);
${exportTag}`;
}

function resolvesSvelte(folder: string): boolean {
  try {
    createRequire(join(folder, 'package.json')).resolve('svelte/package.json');
    return true;
  } catch {
    return false;
  }
}
