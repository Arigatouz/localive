import * as vscode from 'vscode';
import type { LocaliveConfig } from './configService';
import { parseLocaleFile, type LocaleFileData } from './localeScanner';

export class LocaleScanner implements vscode.Disposable {
  private watchers: vscode.FileSystemWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly debounceMs = 300;

  constructor(
    config: LocaliveConfig,
    private readonly onChange: (files: LocaleFileData[]) => void,
  ) {
    this.config = config;
  }

  private config: LocaliveConfig;

  async scan(): Promise<LocaleFileData[]> {
    const pattern = `{${this.config.localePaths.join(',')}}`;
    const uris = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
    const results: LocaleFileData[] = [];

    for (const uri of uris) {
      const doc = await vscode.workspace.openTextDocument(uri);
      const data = parseLocaleFile(uri.fsPath, doc.getText());
      if (data) {
        results.push(data);
      }
    }

    return results;
  }

  startWatching(): void {
    this.disposeWatchers();

    for (const pattern of this.config.localePaths) {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      const debouncedScan = () => this.debouncedScan();

      watcher.onDidChange(debouncedScan);
      watcher.onDidCreate(debouncedScan);
      watcher.onDidDelete(() => this.debouncedScan());

      this.watchers.push(watcher);
    }
  }

  updateConfig(config: LocaliveConfig): void {
    this.config = config;
    this.startWatching();
    this.debouncedScan();
  }

  dispose(): void {
    this.disposeWatchers();
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }
  }

  private disposeWatchers(): void {
    for (const w of this.watchers) {
      w.dispose();
    }
    this.watchers = [];
  }

  private debouncedScan(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.scan().then(this.onChange).catch(() => {});
    }, this.debounceMs);
  }
}