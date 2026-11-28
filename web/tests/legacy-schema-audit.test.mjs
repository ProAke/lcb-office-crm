import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditSchema, compareSchema, expected } from '../scripts/audit-legacy-schema.mjs';

test('reports only exact expected table and column names', () => {
  const rows = Object.entries(expected).flatMap(([table, cols]) => cols.map(column => ({table_name: table, column_name: column})));
  assert.ok(compareSchema(rows).every(r => r.present && !r.missing.length));
  const partial = compareSchema([{table_name:'tb_member', column_name:'id'}, {table_name:'other', column_name:'secret'}]);
  assert.equal(partial[0].present, true);
  assert.ok(partial[0].missing.includes('name'));
  assert.equal(partial[1].present, false);
  assert.doesNotMatch(JSON.stringify(partial), /secret/);
});
test('runs only parameterized metadata SELECT for fixed tables', async () => {
  let call;
  const result = await auditSchema({execute: async (...args) => { call = args; return [[], []]; }});
  assert.match(call[0], /^SELECT .*information_schema\.COLUMNS/);
  assert.match(call[0], /TABLE_SCHEMA = DATABASE\(\)/);
  assert.deepEqual(call[1], Object.keys(expected));
  assert.equal(result.length, 4);
  assert.ok(result.every(r => !r.present));
});
