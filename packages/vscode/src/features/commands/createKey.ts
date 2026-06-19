import * as vscode from 'vscode';
import { TranslationStore } from '../../services/translationStore';
import { setNestedValue } from '../../utils/jsonUtils';

export async function registerCreateKeyCommand(
  context: vscode.ExtensionContext,
  store: TranslationStore,
): Promise<void> {
  const command = vscode.commands.registerCommand('localive.createKey', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selection = editor.document.getText(editor.selection);
    if (!selection) {
      vscode.window.showWarningMessage('Select text to create a translation key for.');
      return;
    }

    const keyName = await vscode.window.showInputBox({
      prompt: 'Enter the translation key',
      value: selection.toLowerCase().replace(/\s+/gu, '.'),
    });

    if (!keyName) {
      return;
    }

    const localeFiles = store.getLocaleFileData();
    if (localeFiles.length === 0) {
      vscode.window.showErrorMessage('No locale files found. Open a workspace with localive configuration.');
      return;
    }

    const defaultLocale = store.getDefaultLocale() ?? 'en';
    for (const file of localeFiles) {
      const value = file.locale === defaultLocale ? selection : keyName;
      await insertKeyIntoFile(file.path, keyName, value);
    }

    vscode.window.showInformationMessage(`Localive: created key "${keyName}" in ${localeFiles.length} locale file(s)`);
  });

  context.subscriptions.push(command);
}

async function insertKeyIntoFile(
  filePath: string,
  key: string,
  value: string,
): Promise<void> {
  const uri = vscode.Uri.file(filePath);
  let doc: vscode.TextDocument;
  try {
    doc = await vscode.workspace.openTextDocument(uri);
  } catch {
    return;
  }

  const text = doc.getText();
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    setNestedValue(data, key, value);

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      doc.positionAt(0),
      doc.positionAt(text.length),
    );
    edit.replace(uri, fullRange, JSON.stringify(data, null, 2) + '\n');
    await vscode.workspace.applyEdit(edit);
  } catch {
    vscode.window.showErrorMessage(`Localive: failed to update ${filePath}`);
  }
}