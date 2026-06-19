import * as vscode from 'vscode';
import { TranslationStore } from '../services/translationStore';
import { findAllKeys, findKeyAtOffset } from '../utils/keyParser';
import type { LocaliveConfig } from '../services/configService';

export function registerReferenceProvider(
  context: vscode.ExtensionContext,
  _store: TranslationStore,
  selector: vscode.DocumentSelector,
  config: LocaliveConfig,
): void {
  const provider = vscode.languages.registerReferenceProvider(selector, {
    async provideReferences(document, position, _context, _token) {
      const offset = document.offsetAt(position);
      const text = document.getText();
      const match = findKeyAtOffset(text, offset);
      if (!match) {
        return undefined;
      }

      const key = match.key;
      const locations: vscode.Location[] = [];

      const patterns = `{${config.sourcePaths.join(',')}}`;
      const files = await vscode.workspace.findFiles(patterns, '**/node_modules/**');

      for (const uri of files) {
        const doc = await vscode.workspace.openTextDocument(uri);
        const fileText = doc.getText();
        const matches = findAllKeys(fileText);

        for (const m of matches) {
          if (m.key === key) {
            const startPos = doc.positionAt(m.start);
            const endPos = doc.positionAt(m.end);
            locations.push(new vscode.Location(uri, new vscode.Range(startPos, endPos)));
          }
        }
      }

      return locations;
    },
  });

  context.subscriptions.push(provider);
}