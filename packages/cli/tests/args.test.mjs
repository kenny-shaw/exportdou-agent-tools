import assert from 'node:assert/strict';
import test from 'node:test';

import { hasFlag, option, parseArgs } from '../dist/args.js';

test('parses positionals, boolean flags and value flags', () => {
  const parsed = parseArgs([
    'export',
    'https://v.douyin.com/example/',
    '--limit',
    '1000',
    '--replies',
    '--format=xlsx',
  ]);
  assert.equal(parsed.command, 'export');
  assert.deepEqual(parsed.positionals, ['https://v.douyin.com/example/']);
  assert.equal(option(parsed, '--limit'), '1000');
  assert.equal(option(parsed, '--format'), 'xlsx');
  assert.equal(hasFlag(parsed, '--replies'), true);
});

test('supports -- before share text that starts like an option', () => {
  const parsed = parseArgs(['inspect', '--', '--synthetic-share-text']);
  assert.deepEqual(parsed.positionals, ['--synthetic-share-text']);
});
