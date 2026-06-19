import * as vscode from 'vscode';
import { TranslationStore } from '../services/translationStore';
import { findKeyAtOffset } from '../utils/keyParser';

export function registerHoverProvider(
  context: vscode.ExtensionContext,
  store: TranslationStore,
  selector: vscode.DocumentSelector,
): void {
  const provider = vscode.languages.registerHoverProvider(selector, {
    provideHover(document, position, _token) {
      const offset = document.offsetAt(position);
      const match = findKeyAtOffset(document.getText(), offset);
      if (!match) {
        return undefined;
      }

      const allTranslations = store.getAllTranslations(match.key);
      if (allTranslations.size === 0) {
        return undefined;
      }

      const lines: string[] = [`**Localive** — \`${match.key}\`\n`];
      for (const [locale, entry] of allTranslations) {
        lines.push(`- **${locale}**: ${entry.value}`);
      }

      const range = new vscode.Range(
        document.positionAt(match.start),
        document.positionAt(match.end),
      );

      return new vscode.Hover(lines.join('\n'), range);
    },
  });

  context.subscriptions.push(provider);
}