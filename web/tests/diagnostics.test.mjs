import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordIncident, listIncidents } from '../src/lib/diagnostics.ts';

test('rejects arbitrary types and statuses and stores only allowed metadata', () => {
  assert.equal(recordIncident('user@example.com', 403), null);
  assert.equal(recordIncident('ui_error', 200), null);
  const old = console.error; console.error = () => {};
  try {
    const item = recordIncident('login_blocked', 403);
    assert.deepEqual(Object.keys(item).sort(), ['at', 'id', 'status', 'type']);
    assert.equal(listIncidents()[0].status, 403);
  } finally { console.error = old; }
});
