import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loginResponse } from '../src/lib/login-response.ts';

test('accepts only an explicit JSON success', async () => {
  assert.equal((await loginResponse(new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json' } }))).ok, true);
  assert.equal((await loginResponse(new Response('<html>proxy</html>', { status: 200, headers: { 'Content-Type': 'text/html' } }))).ok, false);
});
test('reports 403 HTML without throwing or exposing response', async () => {
  const result = await loginResponse(new Response('<html>blocked</html>', { status: 403, headers: { 'Content-Type': 'text/html' } }));
  assert.match(result.error, /403/);
  assert.doesNotMatch(result.error, /blocked/);
});
test('handles malformed JSON and expected server errors', async () => {
  const headers = { 'Content-Type': 'application/json' };
  assert.equal((await loginResponse(new Response('invalid', { status: 500, headers }))).ok, false);
  assert.equal((await loginResponse(new Response('{"error":"ผิด"}', { status: 401, headers }))).error, 'ผิด');
});
