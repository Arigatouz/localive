import * as vscode from 'vscode';

export interface LocaliveConfig {
  localePaths: string[];
  defaultLocale: string;
  sourcePaths: string[];
}

const DEFAULT_CONFIG: LocaliveConfig = {
  localePaths: [
    'src/i18n/**/*.json',
    'src/locales/**/*.json',
    'public/locales/**/*.json',
  ],
  defaultLocale: 'en',
  sourcePaths: ['src/**/*.{ts,tsx,js,jsx,vue,svelte,html}'],
};

export function getConfig(): LocaliveConfig {
  const cfg = vscode.workspace.getConfiguration('localive');
  return {
    localePaths: cfg.get<string[]>('localePaths', DEFAULT_CONFIG.localePaths),
    defaultLocale: cfg.get<string>('defaultLocale', DEFAULT_CONFIG.defaultLocale),
    sourcePaths: cfg.get<string[]>('sourcePaths', DEFAULT_CONFIG.sourcePaths),
  };
}

export function onConfigChange(callback: (config: LocaliveConfig) => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('localive')) {
      callback(getConfig());
    }
  });
}