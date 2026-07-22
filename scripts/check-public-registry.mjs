import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PUBLIC_REGISTRY = 'https://registry.npmjs.org/';
const PUBLIC_REGISTRY_HOST = 'registry.npmjs.org';

function fail(message) {
  console.error(`public-registry-check: ${message}`);
  process.exitCode = 1;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readNpmConfig() {
  return Object.fromEntries(
    readFileSync('.npmrc', 'utf8')
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && !line.startsWith(';'))
      .map((line) => {
        const separator = line.indexOf('=');
        return separator < 0
          ? [line, '']
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

function isLocalResolution(value) {
  return /^(?:\.\.?\/|packages\/)/u.test(value);
}

const trackedFiles = execFileSync('git', ['ls-files', '-z'])
  .toString()
  .split('\0')
  .filter(Boolean);
const dependencyConfigFiles = trackedFiles.filter((path) => (
  path.endsWith('/.npmrc')
    || path === '.npmrc'
    || path.endsWith('/package-lock.json')
    || path === 'package-lock.json'
    || path.endsWith('/npm-shrinkwrap.json')
    || path === 'npm-shrinkwrap.json'
    || path.endsWith('/pnpm-lock.yaml')
    || path === 'pnpm-lock.yaml'
    || path.endsWith('/yarn.lock')
    || path === 'yarn.lock'
));

for (const path of dependencyConfigFiles) {
  if (path !== '.npmrc' && path !== 'package-lock.json') {
    fail(`unexpected dependency source file: ${path}`);
  }
}

const npmConfig = readNpmConfig();
if (npmConfig.registry !== PUBLIC_REGISTRY) {
  fail(`.npmrc registry must be ${PUBLIC_REGISTRY}`);
}
if (npmConfig['replace-registry-host'] !== 'always') {
  fail('.npmrc replace-registry-host must be always');
}

const lock = readJson('package-lock.json');
for (const [packagePath, metadata] of Object.entries(lock.packages ?? {})) {
  if (!metadata || typeof metadata.resolved !== 'string') continue;
  if (isLocalResolution(metadata.resolved)) continue;

  try {
    const resolved = new URL(metadata.resolved);
    if (resolved.protocol !== 'https:' || resolved.hostname !== PUBLIC_REGISTRY_HOST) {
      fail(`${packagePath} resolves from ${resolved.origin}`);
    }
  } catch {
    fail(`${packagePath} has a non-public resolution: ${metadata.resolved}`);
  }
}

for (const path of trackedFiles.filter((file) => file.endsWith('package.json'))) {
  const manifest = readJson(path);
  const publishRegistry = manifest.publishConfig?.registry;
  if (publishRegistry && publishRegistry !== PUBLIC_REGISTRY) {
    fail(`${path} publishes to ${publishRegistry}`);
  }

  for (const section of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
      if (
        typeof specifier === 'string'
          && /^(?:https?:|git(?:\+|:)|github:)/iu.test(specifier)
      ) {
        fail(`${path} ${section}.${name} bypasses the public npm registry`);
      }
    }
  }
}

if (!process.exitCode) {
  console.log('All dependency sources use https://registry.npmjs.org/.');
}
