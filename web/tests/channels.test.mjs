import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { publishToChannel } from '../src/lib/channels.ts';
const env = {...process.env}; const orig = globalThis.fetch;
afterEach(() => { process.env = {...env}; globalThis.fetch = orig; });
test('missing credentials and unsupported web fail without external calls', async () => {
  delete process.env.LINE_CHANNEL_ACCESS_TOKEN; globalThis.fetch = async () => { throw Error('unexpected network'); };
  assert.equal((await publishToChannel('line', 'hello')).ok, false);
  assert.equal((await publishToChannel('web', 'hello')).ok, false);
});
test('API acceptance and rejection are not conflated', async () => {
  process.env.LINE_CHANNEL_ACCESS_TOKEN='private-token';
  globalThis.fetch = async () => new Response('', {status: 200});
  assert.equal((await publishToChannel('line', 'hello')).ok, true);
  globalThis.fetch = async () => new Response('private-token', {status: 403});
  const result = await publishToChannel('line', 'hello');
  assert.equal(result.ok, false); assert.match(result.note, /403/); assert.doesNotMatch(result.note, /private-token/);
});
test('network interruption is uncertain and should not be retried blindly', async () => {
  process.env.LINE_CHANNEL_ACCESS_TOKEN='token'; globalThis.fetch = async () => { throw Error('timeout'); };
  const result=await publishToChannel('line','hello'); assert.equal(result.ok,false); assert.equal(result.uncertain,true);
});
