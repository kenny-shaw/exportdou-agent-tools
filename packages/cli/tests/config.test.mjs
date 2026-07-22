import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { clearApiKey, readApiKey, writeApiKey } from '../dist/config.js';

test('stores a credential atomically with private file permissions', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'exportdou-config-'));
  const target = join(directory, 'nested', 'config.json');
  const previous = process.env.EXPORTDOU_CONFIG_PATH;
  const previousEnvironmentKey = process.env.EXPORTDOU_API_KEY;
  process.env.EXPORTDOU_CONFIG_PATH = target;
  delete process.env.EXPORTDOU_API_KEY;
  t.after(() => {
    if (previous == null) delete process.env.EXPORTDOU_CONFIG_PATH;
    else process.env.EXPORTDOU_CONFIG_PATH = previous;
    if (previousEnvironmentKey == null) delete process.env.EXPORTDOU_API_KEY;
    else process.env.EXPORTDOU_API_KEY = previousEnvironmentKey;
  });

  await writeApiKey('ed_live_synthetic_secret');
  assert.equal(await readApiKey(), 'ed_live_synthetic_secret');
  assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), {
    apiKey: 'ed_live_synthetic_secret',
  });
  assert.equal((await stat(target)).mode & 0o777, 0o600);
  assert.equal(await clearApiKey(), true);
  assert.equal(await readApiKey(), null);
});

test('prefers the environment credential without writing it', async (t) => {
  const previous = process.env.EXPORTDOU_API_KEY;
  process.env.EXPORTDOU_API_KEY = 'ed_live_environment_secret';
  t.after(() => {
    if (previous == null) delete process.env.EXPORTDOU_API_KEY;
    else process.env.EXPORTDOU_API_KEY = previous;
  });
  assert.equal(await readApiKey(), 'ed_live_environment_secret');
});
