#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const packagePath = 'packages/cli/package.json';
const requested = process.argv[2];

function run(command, args, capture = false) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  })?.trim();
}

function fail(message) {
  console.error(`Release aborted: ${message}`);
  process.exit(1);
}

function nextVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/u.test(bump ?? '')) return bump;
  if (!['patch', 'minor', 'major'].includes(bump)) {
    fail('use patch, minor, major, or an exact x.y.z version');
  }
  const parts = current.split('.').map(Number);
  if (bump === 'patch') parts[2] += 1;
  if (bump === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  }
  if (bump === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  }
  return parts.join('.');
}

if (run('git', ['branch', '--show-current'], true) !== 'main') {
  fail('switch to main first');
}
if (run('git', ['status', '--porcelain'], true)) {
  fail('commit all changes first');
}
run('git', ['fetch', 'origin', 'main']);
if (run('git', ['rev-parse', 'HEAD'], true) !== run('git', ['rev-parse', 'origin/main'], true)) {
  fail('main must exactly match origin/main');
}

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const targetVersion = nextVersion(packageJson.version, requested);
const tag = `v${targetVersion}`;
if (run('git', ['tag', '--list', tag], true)) fail(`${tag} already exists locally`);
if (run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`], true)) {
  fail(`${tag} already exists remotely`);
}

run('npm', ['test']);
packageJson.version = targetVersion;
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
run('npm', ['install', '--package-lock-only', '--ignore-scripts']);
run('npm', ['test']);
run('npm', ['pack', '--dry-run', '--workspace', 'exportdou']);
run('git', ['add', packagePath, 'package-lock.json']);
run('git', ['commit', '-m', `Release exportdou ${tag}`]);
run('git', ['tag', '-a', tag, '-m', `Release exportdou ${tag}`]);
run('git', ['push', '--atomic', 'origin', 'main', tag]);
console.log(`Released ${tag}; GitHub Actions will publish it to npm.`);
