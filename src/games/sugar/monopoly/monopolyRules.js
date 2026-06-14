import { ASSET_BY_ID, BOARD_SPACE_COUNT, COLOR_GROUPS } from './monopolyData.js';

export const normalizePosition = (position) => ((Number(position) % BOARD_SPACE_COUNT) + BOARD_SPACE_COUNT) % BOARD_SPACE_COUNT;
export const passedGo = (from, total) => Number(from) + Number(total) >= BOARD_SPACE_COUNT;
export const tributeTax = (cash) => Math.min(200, Math.max(0, Math.floor(Number(cash) * 0.1)));
export const crystalBonus = (count) => [0, 10, 25, 65][Math.min(3, Math.max(0, Number(count) || 0))];
export const utilityMultiplier = (count) => [0, 4, 10, 15][Math.min(3, Math.max(0, Number(count) || 0))];
export const portalRent = (count) => [0, 25, 50, 100, 200][Math.min(4, Math.max(0, Number(count) || 0))];
export const unmortgageCost = (value) => Math.ceil(Number(value) * 1.1);

export const ownsCompleteGroup = (playerId, asset, ownership) => {
  if (!asset?.colorGroup) return false;
  return COLOR_GROUPS[asset.colorGroup].every((id) => ownership[id]?.ownerId === playerId);
};

export const calculateRent = ({ spaceId, ownership, ownerId, rolledTotal, doubleUndevelopedRent = true }) => {
  const asset = ASSET_BY_ID[spaceId];
  const deed = ownership[spaceId];
  if (!asset || !deed?.ownerId || deed.mortgaged) return 0;
  const ownedAssets = Object.entries(ownership)
    .filter(([, value]) => value.ownerId === ownerId && !value.mortgaged)
    .map(([id]) => ASSET_BY_ID[id])
    .filter(Boolean);
  if (asset.type === 'portal') return portalRent(ownedAssets.filter((item) => item.type === 'portal').length);
  if (asset.type === 'utility') {
    return Number(rolledTotal) * utilityMultiplier(ownedAssets.filter((item) => item.type === 'utility').length);
  }
  if (asset.type !== 'property') return 0;
  const buildings = Math.min(5, Math.max(0, Number(deed.buildings) || 0));
  let rent = asset.rents[buildings];
  if (!buildings && doubleUndevelopedRent && ownsCompleteGroup(ownerId, asset, ownership)) rent *= 2;
  return rent + crystalBonus(ownedAssets.filter((item) => item.type === 'crystal').length);
};

export const liquidationValue = (asset, buildings = 0) => (
  Math.floor((Number(asset?.buildingCost) || 0) * (Number(buildings) || 0) / 2)
);

export const canBuild = ({ playerId, spaceId, ownership, cash }) => {
  const asset = ASSET_BY_ID[spaceId];
  const deed = ownership[spaceId];
  return Boolean(
    asset?.type === 'property'
    && deed?.ownerId === playerId
    && !deed.mortgaged
    && Number(deed.buildings || 0) < 5
    && ownsCompleteGroup(playerId, asset, ownership)
    && Number(cash) >= asset.buildingCost,
  );
};

export const freeParkPayout = (ledger, currentRound) => (ledger || [])
  .filter((entry) => Number(entry.round) > Number(currentRound) - 5)
  .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
