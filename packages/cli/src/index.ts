import type { ExtractResult, RunCliOptions, SyncResult, TypesResult, ValidateResult } from './contracts';
import { extractKeys } from './extract';
import { syncLocaleFiles } from './sync';
import { generateTypes } from './types';
import { validateKeys } from './validate';

export { extractKeys } from './extract';
export { validateKeys } from './validate';
export { syncLocaleFiles } from './sync';
export { generateTypes } from './types';
export type * from './contracts';

type CommandResult = ExtractResult | ValidateResult | SyncResult | TypesResult;

export async function runCli(argv: string[], options: RunCliOptions = {}): Promise<number> {
  const stdout = options.stdout ?? console;
  const cwd = options.cwd ?? process.cwd();

  const [command, ...rest] = argv;
  const parsed = parseArgs(rest);

  if (!command || parsed.flags.help) {
    stdout.log(renderHelp());
    return command ? 0 : 1;
  }

  try {
    switch (command) {
      case 'extract': {
        const result = extractKeys({ cwd, sourceRoots: parsed.values.source });
        printResult(stdout, parsed.flags.json, result);
        return 0;
      }
      case 'validate': {
        const result = validateKeys({ cwd, sourceRoots: parsed.values.source, localeFiles: parsed.values.localeFile });
        printResult(stdout, parsed.flags.json, result);
        return result.ok ? 0 : 1;
      }
      case 'sync': {
        const missingValue = parsed.values.missingValue[0] as 'empty' | 'source' | undefined;
        const result = syncLocaleFiles({
          cwd,
          sourceRoots: parsed.values.source,
          localeFiles: parsed.values.localeFile,
          sourceLocale: parsed.values.sourceLocale[0],
          missingValue,
        });
        printResult(stdout, parsed.flags.json, result);
        return 0;
      }
      case 'types': {
        const result = generateTypes({
          cwd,
          localeFiles: parsed.values.localeFile,
          outFile: parsed.values.out[0],
        });
        printResult(stdout, parsed.flags.json, result);
        return 0;
      }
      default:
        stdout.error(`Unknown command: ${command}`);
        stdout.log(renderHelp());
        return 1;
    }
  } catch (error) {
    stdout.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}

function parseArgs(args: string[]): {
  flags: { help: boolean; json: boolean };
  values: Record<string, string[]>;
} {
  const flags = { help: false, json: false };
  const values: Record<string, string[]> = {
    source: [],
    localeFile: [],
    sourceLocale: [],
    missingValue: [],
    out: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      continue;
    }
    if (arg === '--json') {
      flags.json = true;
      continue;
    }

    const value = args[index + 1];
    switch (arg) {
      case '--source':
        pushValue(values.source, value);
        index += 1;
        break;
      case '--locale-file':
        pushValue(values.localeFile, value);
        index += 1;
        break;
      case '--source-locale':
        pushValue(values.sourceLocale, value);
        index += 1;
        break;
      case '--missing-value':
        pushValue(values.missingValue, value);
        index += 1;
        break;
      case '--out':
        pushValue(values.out, value);
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return { flags, values };
}

function pushValue(values: string[], value: string | undefined): void {
  if (!value) {
    throw new Error('Missing option value');
  }
  values.push(value);
}

function printResult(stdout: Pick<Console, 'log' | 'error'>, asJson: boolean, result: CommandResult): void {
  if (asJson) {
    stdout.log(JSON.stringify(result, null, 2));
    return;
  }

  stdout.log(formatResult(result));
}

function formatResult(result: CommandResult): string {
  if ('syncResults' in result) {
    return `Synced ${result.syncResults.length} locale files`;
  }
  if ('localeResults' in result) {
    return result.ok ? 'Validation passed' : 'Validation failed';
  }
  if ('outFile' in result) {
    return `Wrote ${result.keys.length} keys to ${result.outFile}`;
  }
  return `Extracted ${result.keys.length} keys`;
}

function renderHelp(): string {
  return [
    'Usage: localive <command> [options]',
    '',
    'Commands:',
    '  extract                 Extract translation keys from source files',
    '  validate                Validate locale files against extracted keys',
    '  sync                    Add missing keys to locale files',
    '  types                   Generate TranslationKey declarations',
    '',
    'Options:',
    '  --source <path>         Source root to scan; defaults to src',
    '  --locale-file <path>    Locale JSON file; defaults to src/locales/*.json',
    '  --source-locale <code>  Locale used when syncing with source values',
    '  --missing-value <kind>  Missing sync value strategy: empty or source',
    '  --out <path>            Output file for generated types',
    '  --json                  Print structured JSON output',
    '  --help                  Show help',
  ].join('\n');
}
