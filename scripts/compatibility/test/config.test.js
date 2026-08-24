import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { assertRunId, composeArgs, newRunId } from '../lib/config.js';

const composeFile = fs.readFileSync(
  new URL('../../../docker-compose.compatibility.yml', import.meta.url),
  'utf8',
);
const convergenceScenario = fs.readFileSync(
  new URL('../scenarios/convergence.js', import.meta.url),
  'utf8',
);

function serviceBlock(name) {
  const match = composeFile.match(new RegExp(`^  ${name}:\\r?\\n([\\s\\S]*?)(?=^  [a-z][a-z-]*:|^networks:)`, 'm'));
  assert.ok(match, `Expected ${name} service in the compatibility Compose file`);
  return match[1];
}

test('creates bounded unique run IDs', () => {
  const first = newRunId(new Date('2026-08-04T12:34:56Z'), '00000001');
  const second = newRunId(new Date('2026-08-04T12:34:56Z'), '00000002');
  assert.equal(first, 'run-20260804t123456z-00000001');
  assert.notEqual(first, second);
  assert.equal(assertRunId(first), first);
});

test('cleanup arguments are tied to one validated compatibility project', () => {
  const context = {
    runId: 'run-20260804t123456z-00000001',
    projectName: 'verigate-compat-00000001',
    envFile: 'ignored.env',
  };
  const args = composeArgs(context, ['down', '--volumes']);
  assert.deepEqual(args.slice(0, 4), [
    'compose', '--project-name', 'verigate-compat-00000001', '--env-file',
  ]);
  assert.ok(args.some((value) => value.endsWith('docker-compose.compatibility.yml')));
  assert.throws(() => composeArgs({ ...context, projectName: 'ordinary-root' }, ['down']), /Refusing/);
  assert.throws(() => assertRunId('../../unsafe'), /Unsafe/);
});

test('keeps disposable migrations outside the production recovery gate', () => {
  assert.match(serviceBlock('migration'), /NODE_ENV: development/);
  assert.match(serviceBlock('backend'), /NODE_ENV: production/);
});

test('uses the canonical account lifecycle tuple in disposable convergence data', () => {
  assert.match(convergenceScenario, /is_active = false, account_status = 'deactivated'/);
  assert.doesNotMatch(convergenceScenario, /identity_status = 'disabled'/);
});
