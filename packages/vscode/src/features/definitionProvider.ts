import * as vscode from 'vscode';
import { TranslationStore } from '../services/translationStore';
import { findKeyAtOffset } from '../utils/keyParser';

export function registerDefinitionProvider(
  context: vscode.ExtensionContext,
  store: TranslationStore,
  selector: vscode.DocumentSelector,
): void {
  const provider = vscode.languages.registerDefinitionProvider(selector, {
    provideDefinition(document, position, _token) {
      const offset = document.offsetAt(position);
      const match = findKeyAtOffset(document.getText(), offset);
      if (!match) {
        return undefined;
      }

      const locale = store.getDefaultLocale();
      if (!locale) {
        return undefined;
      }

      const locations: vscode.Location[] = [];

      for (const loc of store.getLocales()) {
        const localeFile = store.getLocaleFile(loc);
        if (localeFile) {
          locations.push(
            new vscode.Location(vscode.Uri.file(localeFile.path), new vscode.Position(0, 0)),
          );
        }
      }

      return locations;
    },
  });

  context.subscriptions.push(provider);
}