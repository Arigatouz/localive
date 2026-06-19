import * as vscode from 'vscode';
import { TranslationStore } from '../../services/translationStore';
import { findAllKeys } from '../../utils/keyParser';
import { getNestedValue, deleteNestedValue, setNestedValue } from '../../utils/jsonUtils';

export async function registerRenameKeyCommand(
  context: vscode.ExtensionContext,
  store: TranslationStore,
  config: { sourcePaths: string[] },
): Promise<void> {
  const command = vscode.commands.registerCommand('localive.renameKey', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const offset = editor.document.offsetAt(editor.selection.active);
    const text = editor.document.getText();
    const match = findAllKeys(text).find((m) => offset >= m.start && offset <= m.end);
    if (!match) {
      vscode.window.showWarningMessage('No translation key found at cursor position.');
      return;
    }

    const oldKey = match.key;
    const newKey = await vscode.window.showInputBox({
      prompt: `Rename translation key "${oldKey}" to:`,
      value: oldKey,
    });

    if (!newKey || newKey === oldKey) {
      return;
    }

    const localeFiles = store.getLocaleFileData();
    for (const file of localeFiles) {
      await renameKeyInFile(file.path, oldKey, newKey);
    }

    const patterns = `{${config.sourcePaths.join(',')}}`;
    const files = await vscode.workspace.findFiles(patterns, '**/node_modules/**');
    for (const uri of files) {
      const doc = await vscode.workspace.openTextDocument(uri);
      const fileText = doc.getText();
      const edits: { start: number; end: number; replacement: string }[] = [];
      const matches = findAllKeys(fileText);

      for (const m of matches) {
        if (m.key === oldKey) {
          edits.push({
            start: m.start,
            end: m.end,
            replacement: newKey,
          });
        }
      }

      if (edits.length > 0) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        for (const edit of edits) {
          const startPos = doc.positionAt(edit.start);
          const endPos = doc.positionAt(edit.end);
          workspaceEdit.replace(uri, new vscode.Range(startPos, endPos), edit.replacement);
        }
        await vscode.workspace.applyEdit(workspaceEdit);
      }
    }

    vscode.window.showInformationMessage(`Localive: renamed "${oldKey}" → "${newKey}"`);
  });

  context.subscriptions.push(command);
}

async function renameKeyInFile(
  filePath: string,
  oldKey: string,
  newKey: string,
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
    const value = getNestedValue(data, oldKey);
    if (value === undefined) {
      return;
    }
    deleteNestedValue(data, oldKey);
    setNestedValue(data, newKey, value as string);

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