import * as vscode from 'vscode';
import { TranslationStore } from '../services/translationStore';
import { findAllKeys } from '../utils/keyParser';
import type { LocaliveConfig } from '../services/configService';

export class DiagnosticsManager implements vscode.Disposable {
  private collection: vscode.DiagnosticCollection;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly store: TranslationStore,
    private readonly config: LocaliveConfig,
  ) {
    this.collection = vscode.languages.createDiagnosticCollection('localive');
  }

  async refresh(): Promise<void> {
    this.collection.clear();
    const locales = this.getLocalesFromStore();
    if (locales.length === 0) {
      return;
    }

    const patterns = `{${this.config.sourcePaths.join(',')}}`;
    const files = await vscode.workspace.findFiles(patterns, '**/node_modules/**');

    for (const uri of files) {
      const doc = await vscode.workspace.openTextDocument(uri);
      const diagnostics = this.computeDiagnostics(doc.getText(), uri, locales);
      if (diagnostics.length > 0) {
        this.collection.set(uri, diagnostics);
      }
    }
  }

  dispose(): void {
    this.collection.dispose();
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
    }
  }

  private getLocalesFromStore(): string[] {
    return this.store.getLocales();
  }

  private computeDiagnostics(
    text: string,
    _uri: vscode.Uri,
    locales: string[],
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const matches = findAllKeys(text);

    for (const match of matches) {
      if (!this.store.hasKey(match.key)) {
        const startLine = this.getLineNumber(text, match.start);
        const endLine = this.getLineNumber(text, match.end);
        const startCol = match.start - (text.lastIndexOf('\n', match.start) + 1);
        const endCol = match.end - (text.lastIndexOf('\n', match.end) + 1);

        const range = new vscode.Range(
          new vscode.Position(startLine, startCol),
          new vscode.Position(endLine, endCol),
        );

        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Localive: key "${match.key}" not found in any locale file`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      } else {
        const missing = this.store.missingKeys(locales).get(match.key);
        if (missing && missing.length > 0) {
          const startLine = this.getLineNumber(text, match.start);
          const endLine = this.getLineNumber(text, match.end);
          const startCol = match.start - (text.lastIndexOf('\n', match.start) + 1);
          const endCol = match.end - (text.lastIndexOf('\n', match.end) + 1);

          const range = new vscode.Range(
            new vscode.Position(startLine, startCol),
            new vscode.Position(endLine, endCol),
          );

          diagnostics.push(
            new vscode.Diagnostic(
              range,
              `Localive: key "${match.key}" missing in locale(s): ${missing.join(', ')}`,
              vscode.DiagnosticSeverity.Information,
            ),
          );
        }
      }
    }

    return diagnostics;
  }

  private getLineNumber(text: string, offset: number): number {
    let line = 0;
    for (let i = 0; i < offset && i < text.length; i++) {
      if (text[i] === '\n') {
        line++;
      }
    }
    return line;
  }
}