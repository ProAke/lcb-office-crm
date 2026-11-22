import { test } from 'node:test';
import assert from 'node:assert/strict';
import { richMenuBounds } from '../src/lib/line/rich-menu-layout.ts';

test('six slots cover a 2500x1686 image in two ordered rows', () => {
  const b = richMenuBounds('grid6', 1686, 6);
  assert.deepEqual(b.map(({ x, y, width, height }) => [x, y, width, height]), [
    [0, 0, 833, 843], [833, 0, 833, 843], [1666, 0, 834, 843],
    [0, 843, 833, 843], [833, 843, 833, 843], [1666, 843, 834, 843],
  ]);
});
test('strip remains compatible and fills the image without gaps', () => {
  for (let n = 1; n <= 6; n++) {
    const areas = richMenuBounds('strip', 843, n);
    assert.equal(areas.reduce((sum, b) => sum + b.width, 0), 2500);
    assert.equal(areas.at(-1).x + areas.at(-1).width, 2500);
    assert.ok(areas.every(b => b.height === 843 && b.y === 0));
  }
});
test('invalid counts are rejected', () => {
  assert.throws(() => richMenuBounds('grid6', 1686, 5));
  assert.throws(() => richMenuBounds('strip', 843, 0));
});
