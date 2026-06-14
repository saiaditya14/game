export const PLAYER_COLORS = ['#f9a8d4', '#a7e8b2', '#aee9ff', '#d8c4ff', '#ffe66d', '#ffc48f', '#b9b6ff', '#ffb48f'];
export const PLAYER_ICONS = ['heart', 'crown', 'sparkles', 'wand', 'gem', 'user', 'gift', 'heart'];

export const DEFAULT_RULES = Object.freeze({
  startingCash: 1500,
  auctions: true,
  doubleUndevelopedRent: true,
  freeParkJackpot: true,
  targetCashEnabled: false,
  targetCash: 5000,
});

const normal = (id, name, price, group, rents, mortgage, buildingCost) => ({
  id, name, type: 'property', kind: 'property', price, colorGroup: group, rents, mortgage, buildingCost,
});
const special = (id, name, type, price, mortgage) => ({ id, name, type, kind: type, price, mortgage });

const ASSETS = [
  normal(1, 'Snarl Swamp', 60, 'darkOlive', [2, 10, 30, 90, 160, 250], 30, 50),
  normal(3, 'Rotroot Fen', 70, 'darkOlive', [3, 15, 45, 135, 240, 350], 35, 50),
  normal(5, 'Ember Peak', 90, 'crimson', [5, 25, 75, 225, 350, 500], 45, 50),
  normal(6, 'Dragon Valley', 90, 'crimson', [5, 25, 75, 225, 350, 500], 45, 50),
  special(7, 'Fire Portal', 'portal', 200, 100),
  normal(8, 'Lava Roost', 100, 'crimson', [6, 30, 90, 270, 400, 550], 50, 50),
  normal(10, 'Scrapy Hollow', 120, 'darkGreen', [8, 40, 100, 300, 450, 600], 60, 50),
  normal(11, 'Goblin Camp', 120, 'darkGreen', [8, 40, 100, 300, 450, 600], 60, 50),
  special(12, 'Ruby', 'crystal', 200, 100),
  normal(13, 'Grim Burrows', 130, 'darkGreen', [9, 45, 125, 375, 500, 700], 65, 50),
  normal(15, 'Moon Shine', 150, 'darkBlue', [11, 55, 160, 475, 650, 800], 75, 100),
  normal(16, 'Starlit Bay', 150, 'darkBlue', [11, 55, 160, 475, 650, 800], 75, 100),
  special(17, 'Mana Wells', 'utility', 150, 75),
  normal(18, 'Dew Hollow', 160, 'darkBlue', [12, 60, 180, 500, 700, 900], 80, 100),
  normal(19, 'Iron Mine', 180, 'steelGray', [14, 70, 200, 550, 750, 950], 90, 100),
  normal(20, 'Stone Hold', 180, 'steelGray', [14, 70, 200, 550, 750, 950], 90, 100),
  special(21, 'Water Portal', 'portal', 200, 100),
  normal(22, 'Mithril Pass', 190, 'steelGray', [15, 75, 210, 575, 775, 975], 95, 100),
  normal(24, 'Dark Forest', 210, 'deepViolet', [17, 85, 240, 650, 840, 1025], 105, 150),
  normal(25, 'Thorny Grove', 210, 'deepViolet', [17, 85, 240, 650, 840, 1025], 105, 150),
  special(26, 'Emerald', 'crystal', 200, 100),
  normal(27, 'Misty Woods', 220, 'deepViolet', [18, 90, 250, 700, 875, 1050], 110, 150),
  normal(29, 'Sandy Camp', 240, 'burntAmber', [20, 100, 300, 750, 925, 1100], 120, 150),
  normal(31, 'Sunfire Dunes', 240, 'burntAmber', [20, 100, 300, 750, 925, 1100], 120, 150),
  normal(32, 'White Mirage', 250, 'burntAmber', [21, 105, 315, 775, 950, 1125], 125, 150),
  special(33, 'Ancient Runes', 'utility', 150, 75),
  normal(34, 'Winter Ridge', 270, 'babyBlue', [23, 115, 345, 825, 1000, 1175], 135, 150),
  special(35, 'Air Portal', 'portal', 200, 100),
  normal(36, 'Glacier Castle', 270, 'babyBlue', [23, 115, 345, 825, 1000, 1175], 135, 150),
  normal(37, 'Icevein Peak', 280, 'babyBlue', [24, 120, 360, 850, 1025, 1200], 140, 150),
  normal(38, 'Faerie Haven', 300, 'paleGreen', [26, 130, 390, 900, 1100, 1275], 150, 200),
  special(39, 'Topaz', 'crystal', 200, 100),
  normal(40, 'Elven Court', 300, 'paleGreen', [26, 130, 390, 900, 1100, 1275], 150, 200),
  normal(41, 'Hidden Vale', 310, 'paleGreen', [27, 140, 420, 950, 1150, 1350], 155, 200),
  normal(43, 'Dusk Gate', 330, 'deepIndigo', [29, 160, 480, 1050, 1250, 1450], 165, 200),
  normal(44, 'Shadow Reach', 330, 'deepIndigo', [29, 160, 480, 1050, 1250, 1450], 165, 200),
  special(45, 'Arcane Nexus', 'utility', 150, 75),
  normal(46, 'Black Hollow', 340, 'deepIndigo', [31, 165, 495, 1075, 1275, 1475], 170, 200),
  normal(48, 'Ashy Coast', 360, 'flameOrange', [38, 180, 520, 1150, 1350, 1550], 180, 200),
  special(49, 'Earth Portal', 'portal', 200, 100),
  normal(50, 'Ember Isle', 360, 'flameOrange', [38, 180, 520, 1150, 1350, 1550], 180, 200),
  normal(51, 'Sunlit Bay', 370, 'flameOrange', [42, 190, 550, 1200, 1450, 1650], 185, 200),
  normal(53, 'Heavens Keep', 390, 'white', [45, 195, 580, 1300, 1550, 1800], 195, 200),
  normal(55, 'Sky Palace', 400, 'white', [50, 200, 600, 1400, 1700, 2000], 200, 200),
];

export const ASSET_BY_ID = Object.freeze(Object.fromEntries(ASSETS.map((asset) => [asset.id, asset])));
export const PURCHASABLE_SPACE_IDS = Object.freeze(ASSETS.map((asset) => asset.id));

const board = [
  ['GO', 'go'], ['Snarl Swamp'], ['Charm Chest', 'chest'], ['Rotroot Fen'], ['Tribute Tax', 'tax'],
  ['Ember Peak'], ['Dragon Valley'], ['Fire Portal'], ['Lava Roost'], ['Chance', 'chance'],
  ['Scrapy Hollow'], ['Goblin Camp'], ['Ruby'], ['Grim Burrows'], ['Visiting', 'jail'],
  ['Moon Shine'], ['Starlit Bay'], ['Mana Wells'], ['Dew Hollow'], ['Iron Mine'], ['Stone Hold'],
  ['Water Portal'], ['Mithril Pass'], ['Charm Chest', 'chest'], ['Dark Forest'], ['Thorny Grove'],
  ['Emerald'], ['Misty Woods'], ['Free Park', 'parking'], ['Sandy Camp'], ['Chance', 'chance'],
  ['Sunfire Dunes'], ['White Mirage'], ['Ancient Runes'], ['Winter Ridge'], ['Air Portal'],
  ['Glacier Castle'], ['Icevein Peak'], ['Faerie Haven'], ['Topaz'], ['Elven Court'], ['Hidden Vale'],
  ['Go To Time Out', 'gotojail'], ['Dusk Gate'], ['Shadow Reach'], ['Arcane Nexus'], ['Black Hollow'],
  ['Charm Chest', 'chest'], ['Ashy Coast'], ['Earth Portal'], ['Ember Isle'], ['Sunlit Bay'],
  ['Treasury Tax', 'tax'], ['Heavens Keep'], ['Chance', 'chance'], ['Sky Palace'],
];

const gridFor = (id) => {
  if (id <= 14) return { gridArea: `15 / ${15 - id} / 16 / ${16 - id}`, edge: id === 14 ? 'left' : 'bottom' };
  if (id <= 28) return { gridArea: `${29 - id} / 1 / ${30 - id} / 2`, edge: id === 28 ? 'top' : 'left' };
  if (id <= 42) return { gridArea: `1 / ${id - 27} / 2 / ${id - 26}`, edge: id === 42 ? 'right' : 'top' };
  return { gridArea: `${id - 41} / 15 / ${id - 40} / 16`, edge: 'right' };
};

export const spaces = Object.freeze(board.map(([name, fallbackKind], id) => {
  const asset = ASSET_BY_ID[id];
  const corner = ['go', 'jail', 'parking', 'gotojail'].includes(fallbackKind);
  return {
    id,
    name,
    ...(asset || {}),
    kind: asset?.type || fallbackKind || 'property',
    isCorner: corner,
    corner: corner ? fallbackKind : undefined,
    ...gridFor(id),
  };
}));

export const BOARD_SPACE_COUNT = spaces.length;
export const COLOR_GROUPS = Object.freeze(
  ASSETS.filter((asset) => asset.type === 'property').reduce((groups, asset) => {
    groups[asset.colorGroup] = [...(groups[asset.colorGroup] || []), asset.id];
    return groups;
  }, {}),
);

export const createInitialOwnership = () => Object.fromEntries(
  PURCHASABLE_SPACE_IDS.map((id) => [id, { ownerId: null, mortgaged: false, buildings: 0 }]),
);
