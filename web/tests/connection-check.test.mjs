import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLineConnection, checkFacebookConnection } from '../src/lib/connection-check.ts';

test('no token does not call provider', async () => {
  const forbidden = async () => { throw new Error('must not call'); };
  assert.match(await checkLineConnection('', forbidden), /ยังไม่ได้ตั้งค่า/);
  assert.match(await checkFacebookConnection('123', '', forbidden), /ยังไม่ได้ตั้งค่า/);
});
test('LINE checks provider without leaking token or response body', async () => {
  let seen;
  const response = await checkLineConnection('SECRET_TOKEN', async (url, init) => { seen = {url, init}; return new Response('SECRET_TOKEN', {status: 403}); });
  assert.match(response, /403/); assert.doesNotMatch(response, /SECRET_TOKEN/);
  assert.equal(seen.url, 'https://api.line.me/v2/bot/info');
  assert.equal(seen.init.headers.Authorization, 'Bearer SECRET_TOKEN');
});
test('Facebook rejects bad id and confirms matching response', async () => {
  assert.match(await checkFacebookConnection('../invalid', 'token'), /ตัวเลข/);
  assert.match(await checkFacebookConnection('123', 'token', async () => Response.json({id:'123'})), /ตอบรับ/);
  assert.match(await checkFacebookConnection('123', 'token', async () => Response.json({id:'999'})), /ไม่ตรง/);
});
