import { createRequire } from 'node:module';
import { join } from 'node:path';

export const RUNTIME_BRIDGE_ID = 'virtual:localive-paraglide-runtime';
const RESOLVED_ID = `\0${RUNTIME_BRIDGE_ID}`;
const RUNTIME = '@localive/adapter-paraglide/runtime';

export function resolveRuntimeBridge(source: string): string | null {
  return source === RUNTIME_BRIDGE_ID ? RESOLVED_ID : null;
}

/**
 * The module instrumented messages import `tag` from.
 * When Svelte resolves from the app's folder, it also makes drafts reactive.
 */
export function loadRuntimeBridge(id: string, appRoot: string): string | null {
  if (id !== RESOLVED_ID) return null;

  const exportTag = `export { tag } from ${JSON.stringify(RUNTIME)};\n`;
  if (!isSvelteInstalled(appRoot)) return exportTag;
  return `import { createSubscriber } from 'svelte/reactivity';
import { useSubscriber } from ${JSON.stringify(RUNTIME)};
useSubscriber(createSubscriber);
${exportTag}`;
}

function isSvelteInstalled(appRoot: string): boolean {
  try {
    createRequire(join(appRoot, 'package.json')).resolve('svelte/package.json');
    return true;
  } catch {
    return false;
  }
}
