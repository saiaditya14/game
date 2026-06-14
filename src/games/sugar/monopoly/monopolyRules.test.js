import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialOwnership } from './monopolyData.js';
import {
  calculateRent, canBuild, crystalBonus, freeParkPayout, passedGo, tributeTax, unmortgageCost,
} from './monopolyRules.js';

test('GO, tax, crystal, mortgage, and Free Park helpers follow settled rules', () => {
  assert.equal(passedGo(52, 7), true);
  assert.equal(tributeTax(3500), 200);
  assert.equal(tributeTax(850), 85);
  assert.equal(crystalBonus(3), 65);
  assert.equal(unmortgageCost(75), 83);
  assert.equal(freeParkPayout([{ round: 1, amount: 20 }, { round: 4, amount: 100 }], 6), 100);
});

test('normal rent doubles for a full undeveloped group and adds crystal bonus once', () => {
  const ownership = createInitialOwnership();
  ownership[1].ownerId = 'owner';
  ownership[3].ownerId = 'owner';
  ownership[12].ownerId = 'owner';
  assert.equal(calculateRent({ spaceId: 1, ownership, ownerId: 'owner', rolledTotal: 8 }), 14);
  ownership[1].buildings = 2;
  assert.equal(calculateRent({ spaceId: 1, ownership, ownerId: 'owner', rolledTotal: 8 }), 40);
});

test('portal and three-utility rents scale by ownership count', () => {
  const ownership = createInitialOwnership();
  for (const id of [7, 21, 35, 49, 17, 33, 45]) ownership[id].ownerId = 'owner';
  assert.equal(calculateRent({ spaceId: 7, ownership, ownerId: 'owner', rolledTotal: 9 }), 200);
  assert.equal(calculateRent({ spaceId: 17, ownership, ownerId: 'owner', rolledTotal: 9 }), 135);
});

test('building requires ownership, cash, and the complete color group', () => {
  const ownership = createInitialOwnership();
  ownership[1].ownerId = 'owner';
  assert.equal(canBuild({ playerId: 'owner', spaceId: 1, ownership, cash: 500 }), false);
  ownership[3].ownerId = 'owner';
  assert.equal(canBuild({ playerId: 'owner', spaceId: 1, ownership, cash: 50 }), true);
});
