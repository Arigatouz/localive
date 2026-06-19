/**
 * Shared locale utilities — pure functions with no filesystem or platform dependencies.
 */

/**
 * Extract a locale name from a JSON file path.
 *
 * Given `"/project/src/locales/en.json"`, returns `"en"`.
 * Handles both POSIX and Windows path separators.
 */
export function localeFromPath(filePath: string): string {
  const fileName = filePath.split(/[\\/]/u).pop() ?? filePath;
  return fileName.replace(/\.json$/u, '');
}

/**
 * Deduplicate and sort a collection of keys.
 *
 * Accepts any iterable of strings and returns a sorted array
 * with duplicates removed.
 */
export function sortedKeys(keys: Iterable<string>): string[] {
  return [...new Set(keys)].sort();
}