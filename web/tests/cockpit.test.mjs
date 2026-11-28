import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bangkokDate, cockpitBookings } from '../src/lib/cockpit.ts';

test('shop date uses Bangkok rather than UTC across midnight', () => {
  assert.equal(bangkokDate(new Date('2026-11-08T16:59:59Z')), '2026-11-08');
  assert.equal(bangkokDate(new Date('2026-11-08T17:00:00Z')), '2026-11-09');
});
test('classifies open bookings by day and sorts without mutating input', () => {
  const rows = [
    {id: 1, date: '2026-11-10', time: '09:00', status: 'confirmed'},
    {id: 2, date: '2026-11-09', time: '15:00', status: 'pending'},
    {id: 3, date: '2026-11-08', time: '10:00', status: 'in_service'},
    {id: 4, date: '2026-11-09', time: '08:00', status: 'confirmed'},
    {id: 5, date: '2026-11-09', time: '07:00', status: 'done'},
    {id: 6, date: '2026-11-07', time: '07:00', status: 'cancelled'},
  ];
  const result = cockpitBookings(rows, '2026-11-09');
  assert.deepEqual(result.today.map(b => b.id), [4, 2]);
  assert.deepEqual(result.overdue.map(b => b.id), [3]);
  assert.deepEqual(result.upcoming.map(b => b.id), [1]);
  assert.deepEqual(rows.map(b => b.id), [1, 2, 3, 4, 5, 6]);
});
