import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkDatabaseConnection } from '../src/lib/database-check.ts';

const url = 'mysql://user:secret@db.example/test';
test('database probe requires valid configured mysql URL and database', async () => {
  const forbidden = async () => { throw new Error('should not probe'); };
  assert.match(await checkDatabaseConnection('', forbidden), /ยังไม่ได้ตั้งค่า/);
  for (const value of ['not a url', 'https://db/test', 'mysql://db/']) {
    assert.match(await checkDatabaseConnection(value, forbidden), /รูปแบบ/);
  }
});
test('successful connection does not claim CRM uses the database', async () => {
  let seen;
  const result = await checkDatabaseConnection(url, async value => { seen = value; });
  assert.equal(seen, url);
  assert.match(result, /SELECT 1/);
  assert.match(result, /ยังไม่ยืนยัน/);
});
test('errors are categorized without leaking connection information', async () => {
  for (const [code, expected] of [['ER_ACCESS_DENIED_ERROR', /ปฏิเสธบัญชี/], ['ER_BAD_DB_ERROR', /ไม่พบฐานข้อมูล/], ['SECRET', /ไม่สำเร็จ/]]) {
    const result = await checkDatabaseConnection(url, async () => { throw Object.assign(new Error(url), {code}); });
    assert.match(result, expected); assert.doesNotMatch(result, /secret|db\.example/);
  }
});
