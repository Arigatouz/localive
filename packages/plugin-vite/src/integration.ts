import type { IncomingMessage } from 'node:http';
import type { Plugin } from 'vite';
import type { DevServerConfig, SaveResult, TranslationEntry } from './types';

/** The part of the bundler's plugin context that `transform` can use. */
export interface TransformContext {
  parse(code: string): unknown;
}

export interface TransformedModule {
  code: string;
  /** Source map as JSON. */
  map: string | null;
}

/**
 * Connects a message format that plain JSON files cannot express, such as compiled messages, to the dev server.
 * Integrations satisfy this shape structurally, so they need no dependency on this package.
 */
export interface LocaliveIntegration {
  /** Saves an entry, replacing the built-in JSON writer. */
  write(entry: TranslationEntry): SaveResult | Promise<SaveResult>;
  /** Returns the JSON-serializable data served at `GET <endpoint>/catalog`. */
  readCatalog(): unknown;
  /** Runs before Vite's own resolution, so it can claim virtual module ids. */
  resolveId?(source: string, importer?: string): string | null | Promise<string | null>;
  load?(id: string): string | null | Promise<string | null>;
  /** Runs after the other plugins have produced the module, with the bundler's context as `this`. */
  transform?(
    this: TransformContext,
    code: string,
    id: string,
  ): TransformedModule | null | Promise<TransformedModule | null>;
  /** Must call `next`, which continues the request and can be run inside a per-request scope. */
  handleRequest?(req: IncomingMessage, next: () => void): void;
}

/** Dev server options when an integration locates and writes the translations. */
export interface IntegrationServerConfig extends Partial<DevServerConfig> {
  integration: LocaliveIntegration;
}

export function createIntegrationHooks(
  integration: LocaliveIntegration,
): Pick<Plugin, 'enforce' | 'resolveId' | 'load' | 'transform'> {
  return {
    enforce: 'post',
    resolveId: {
      order: 'pre',
      handler(source, importer) {
        return integration.resolveId?.(source, importer) ?? null;
      },
    },
    load(id) {
      return integration.load?.(id) ?? null;
    },
    transform(code, id) {
      return integration.transform?.call(this, code, id) ?? null;
    },
  };
}
