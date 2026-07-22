export type ParsedArgs = {
  command: string | null;
  flags: Map<string, string | boolean>;
  positionals: string[];
};

const VALUE_FLAGS = new Set([
  '--api-key',
  '--format',
  '--limit',
  '--output',
  '--poll-interval',
  '--timeout',
]);

export function parseArgs(argv: string[]): ParsedArgs {
  const flags = new Map<string, string | boolean>();
  const positionals: string[] = [];
  let endOfFlags = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--') {
      endOfFlags = true;
      continue;
    }
    if (!endOfFlags && value?.startsWith('--')) {
      const equalsAt = value.indexOf('=');
      if (equalsAt > 2) {
        flags.set(value.slice(0, equalsAt), value.slice(equalsAt + 1));
        continue;
      }
      if (VALUE_FLAGS.has(value)) {
        const next = argv[index + 1];
        if (!next || next.startsWith('--')) {
          throw new Error(`${value} requires a value`);
        }
        flags.set(value, next);
        index += 1;
        continue;
      }
      flags.set(value, true);
      continue;
    }
    if (value != null) positionals.push(value);
  }

  return {
    command: positionals.shift() ?? null,
    flags,
    positionals,
  };
}

export function hasFlag(args: ParsedArgs, name: string): boolean {
  return args.flags.get(name) === true;
}

export function option(args: ParsedArgs, name: string): string | null {
  const value = args.flags.get(name);
  return typeof value === 'string' ? value : null;
}

export function numberOption(
  args: ParsedArgs,
  name: string,
  fallback: number,
): number {
  const value = option(args, name);
  if (value == null) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number`);
  return parsed;
}
