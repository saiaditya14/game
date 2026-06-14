import test from 'node:test';
import assert from 'node:assert/strict';
import { createRollVisualTracker, projectPlayersForTeleport } from './rollVisuals.js';

test('a roll is emitted once even when later room updates repeat the same roll object', () => {
  const tracker = createRollVisualTracker();
  tracker.observe({ id: 'room', latest_roll: null });

  const roll = { id: 'roll-1', from: 0, to: 8 };
  assert.deepEqual(tracker.observe({ id: 'room', latest_roll: roll }), roll);
  assert.equal(tracker.observe({ id: 'room', latest_roll: { ...roll }, pending_action: { type: 'bought' } }), null);
  assert.equal(tracker.observe({ id: 'room', latest_roll: { ...roll }, auction: null }), null);
});

test('a resumed room does not replay its historical latest roll', () => {
  const tracker = createRollVisualTracker();
  assert.equal(tracker.observe({ id: 'room', latest_roll: { id: 'old-roll' } }), null);
  assert.deepEqual(
    tracker.observe({ id: 'room', latest_roll: { id: 'new-roll', from: 8, to: 14 } }),
    { id: 'new-roll', from: 8, to: 14 },
  );
});

test('switching rooms establishes a new baseline without replaying movement', () => {
  const tracker = createRollVisualTracker();
  tracker.observe({ id: 'one', latest_roll: { id: 'one-roll' } });
  assert.equal(tracker.observe({ id: 'two', latest_roll: { id: 'two-roll' } }), null);
});

test('the moving token has one visual position per teleport phase', () => {
  const players = [{ id: 'moving', position: 12 }, { id: 'other', position: 4 }];
  const roll = { id: 'roll', playerId: 'moving', from: 3, to: 12 };

  assert.deepEqual(projectPlayersForTeleport(players, roll, 'departing'), [
    { id: 'moving', position: 3 },
    { id: 'other', position: 4 },
  ]);
  assert.deepEqual(projectPlayersForTeleport(players, roll, 'arriving'), players);
  assert.equal(projectPlayersForTeleport(players, roll, 'settled'), players);
});
