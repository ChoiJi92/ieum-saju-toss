import assert from 'node:assert/strict';
import { nextCareAction, nextStreakMilestone } from '../src/lib/spirit-economy';

assert.deepEqual(nextStreakMilestone(1), { day: 3, daysLeft: 2, reward: 20 });
assert.equal(nextStreakMilestone(30), null);

assert.equal(
  nextCareAction({ feed: true, pet: false, meditate: false }),
  'pet',
);
assert.equal(
  nextCareAction({ feed: true, pet: true, meditate: false }),
  'meditate',
);
assert.equal(
  nextCareAction({ feed: true, pet: true, meditate: true }),
  null,
);

console.log('retention selectors: ok');
