import * as vscode from 'vscode';
import { TranslationStore } from '../services/translationStore';
import { findKeyAtOffset } from '../utils/keyParser';

const TRIGGER_CHARS = ['\'', '"', '.', '`'];

export function registerCompletionProvider(
  context: vscode.ExtensionContext,
  store: TranslationStore,
  selector: vscode.DocumentSelector,
): void {
  const provider = vscode.languages.registerCompletionItemProvider(
    selector,
    {
      provideCompletionItems(document, position, _token, _context) {
        const text = document.getText();
        const offset = document.offsetAt(position);

        const partialMatch = findKeyAtOffset(text, offset);
        if (partialMatch) {
          const prefix = partialMatch.key;
          const items = store
            .getKeys()
            .filter((k) => k.startsWith(prefix) && k !== prefix)
            .map(
              (k) =>
                new vscode.CompletionItem(k, vscode.CompletionItemKind.Value),
            );
          return items.length > 0 ? items : undefined;
        }

        const keys = store.getKeys();
        if (keys.length === 0) {
          return undefined;
        }

        return keys.map(
          (k) =>
            new vscode.CompletionItem(k, vscode.CompletionItemKind.Value),
        );
      },
    },
    ...TRIGGER_CHARS,
  );

  context.subscriptions.push(provider);
}