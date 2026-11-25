import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapConfig } from '../src/lib/bootstrap.ts';

const saved = { ...process.env };
afterEach(() => { process.env = { ...saved }; });
const hash = '$2b$12$' + 'A'.repeat(53);
function setup() {
  process.env.BOOTSTRAP_LOGIN_ENABLED = 'true';
  process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH = hash;
  process.env.BOOTSTRAP_LOGIN_EXPIRES_AT = new Date(Date.now() + 3600000).toISOString();
}
test('disabled, missing, invalid and expired configuration fails closed', () => {
  delete process.env.BOOTSTRAP_LOGIN_ENABLED;
  assert.equal(bootstrapConfig(), null);
  setup(); process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH = '$2b$10$' + 'A'.repeat(53);
  assert.equal(bootstrapConfig(), null);
  setup(); process.env.BOOTSTRAP_LOGIN_EXPIRES_AT = new Date(Date.now() - 1000).toISOString();
  assert.equal(bootstrapConfig(), null);
  setup(); process.env.BOOTSTRAP_LOGIN_EXPIRES_AT = '2099-01-01';
  assert.equal(bootstrapConfig(), null);
});
test('valid configuration produces stable fingerprint and expiry', () => {
  setup();
  assert.equal(bootstrapConfig().hash, hash);
  assert.equal(bootstrapConfig().fingerprint.length, 64);
  assert.ok(bootstrapConfig().expiry > Date.now());
});
