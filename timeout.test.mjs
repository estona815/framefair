import test from 'node:test';
import assert from 'node:assert/strict';
import {withTimeout} from './timeout.mjs';

test('a stalled model load releases the waiting caller', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 5, 'Model timed out'), /Model timed out/);
});

test('a timed-out shared load can still resolve for a later retry', async () => {
  let complete;
  const shared = new Promise(resolve => { complete = resolve; });
  await assert.rejects(withTimeout(shared, 5, 'Model timed out'), /Model timed out/);
  complete('detector');
  assert.equal(await withTimeout(shared, 100, 'Model timed out'), 'detector');
});

test('model errors are preserved and successful loads return their actual value', async () => {
  const failure = new Error('Network unavailable');
  await assert.rejects(withTimeout(Promise.reject(failure), 100, 'Model timed out'), error => error === failure);
  const detector = {};
  assert.equal(await withTimeout(Promise.resolve(detector), 100, 'Model timed out'), detector);
});
