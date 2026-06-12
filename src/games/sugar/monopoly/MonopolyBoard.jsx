import React from 'react';
import { BoardSpace } from './BoardSpace';
import { MonopolyDiceOverlay } from './MonopolyDiceOverlay';
import monopolyBoardCenterImage from '../../../../images/monopoly_board.jpeg';

export const spaces = [
  { id: 0, name: 'GO', kind: 'corner', corner: 'go', isCorner: true, gridArea: '15 / 15 / 16 / 16', edge: 'bottom' },
  { id: 1, name: 'Snarl Swamp', price: 60, colorGroup: 'darkOlive', gridArea: '15 / 14 / 16 / 15', edge: 'bottom' },
  { id: 2, name: 'Charm Chest', kind: 'chest', gridArea: '15 / 13 / 16 / 14', edge: 'bottom' },
  { id: 3, name: 'Rotroot Fen', price: 70, colorGroup: 'darkOlive', gridArea: '15 / 12 / 16 / 13', edge: 'bottom' },
  { id: 4, name: 'Tribute Tax', kind: 'tax', price: 200, gridArea: '15 / 11 / 16 / 12', edge: 'bottom' },
  { id: 5, name: 'Ember Peak', price: 90, colorGroup: 'crimson', gridArea: '15 / 10 / 16 / 11', edge: 'bottom' },
  { id: 6, name: 'Dragon Valley', price: 90, colorGroup: 'crimson', gridArea: '15 / 9 / 16 / 10', edge: 'bottom' },
  { id: 7, name: 'Fire Portal', kind: 'chance', gridArea: '15 / 8 / 16 / 9', edge: 'bottom' },
  { id: 8, name: 'Lava Roost', price: 100, colorGroup: 'crimson', gridArea: '15 / 7 / 16 / 8', edge: 'bottom' },
  { id: 9, name: 'Chance', kind: 'chance', gridArea: '15 / 6 / 16 / 7', edge: 'bottom' },
  { id: 10, name: 'Scrapy Hollow', price: 120, colorGroup: 'darkGreen', gridArea: '15 / 5 / 16 / 6', edge: 'bottom' },
  { id: 11, name: 'Goblin Camp', price: 120, colorGroup: 'darkGreen', gridArea: '15 / 4 / 16 / 5', edge: 'bottom' },
  { id: 12, name: 'Ruby', kind: 'gem', gridArea: '15 / 3 / 16 / 4', edge: 'bottom' },
  { id: 13, name: 'Grim Burrows', price: 130, colorGroup: 'darkGreen', gridArea: '15 / 2 / 16 / 3', edge: 'bottom' },

  { id: 14, name: 'Visiting', kind: 'corner', corner: 'jail', isCorner: true, gridArea: '15 / 1 / 16 / 2', edge: 'left' },
  { id: 15, name: 'Moon Shine', price: 150, colorGroup: 'darkBlue', gridArea: '14 / 1 / 15 / 2', edge: 'left' },
  { id: 16, name: 'Starlit Bay', price: 150, colorGroup: 'darkBlue', gridArea: '13 / 1 / 14 / 2', edge: 'left' },
  { id: 17, name: 'Mana Wells', kind: 'utility', gridArea: '12 / 1 / 13 / 2', edge: 'left' },
  { id: 18, name: 'Dew Hollow', price: 160, colorGroup: 'darkBlue', gridArea: '11 / 1 / 12 / 2', edge: 'left' },
  { id: 19, name: 'Iron Mine', price: 180, colorGroup: 'steelGray', gridArea: '10 / 1 / 11 / 2', edge: 'left' },
  { id: 20, name: 'Stone Hold', price: 180, colorGroup: 'steelGray', gridArea: '9 / 1 / 10 / 2', edge: 'left' },
  { id: 21, name: 'Water Portal', kind: 'chance', gridArea: '8 / 1 / 9 / 2', edge: 'left' },
  { id: 22, name: 'Mithril Pass', price: 190, colorGroup: 'steelGray', gridArea: '7 / 1 / 8 / 2', edge: 'left' },
  { id: 23, name: 'Charm Chest', kind: 'chest', gridArea: '6 / 1 / 7 / 2', edge: 'left' },
  { id: 24, name: 'Dark Forest', price: 210, colorGroup: 'deepViolet', gridArea: '5 / 1 / 6 / 2', edge: 'left' },
  { id: 25, name: 'Thorny Grove', price: 210, colorGroup: 'deepViolet', gridArea: '4 / 1 / 5 / 2', edge: 'left' },
  { id: 26, name: 'Emerald', kind: 'gem', gridArea: '3 / 1 / 4 / 2', edge: 'left' },
  { id: 27, name: 'Misty Woods', price: 220, colorGroup: 'deepViolet', gridArea: '2 / 1 / 3 / 2', edge: 'left' },

  { id: 28, name: 'Free Park', kind: 'corner', corner: 'parking', isCorner: true, gridArea: '1 / 1 / 2 / 2', edge: 'top' },
  { id: 29, name: 'Sandy Camp', price: 240, colorGroup: 'burntAmber', gridArea: '1 / 2 / 2 / 3', edge: 'top' },
  { id: 30, name: 'Chance', kind: 'chance', gridArea: '1 / 3 / 2 / 4', edge: 'top' },
  { id: 31, name: 'Sunfire Dunes', price: 240, colorGroup: 'burntAmber', gridArea: '1 / 4 / 2 / 5', edge: 'top' },
  { id: 32, name: 'White Mirage', price: 250, colorGroup: 'burntAmber', gridArea: '1 / 5 / 2 / 6', edge: 'top' },
  { id: 33, name: 'Ancient Runes', kind: 'utility', gridArea: '1 / 6 / 2 / 7', edge: 'top' },
  { id: 34, name: 'Winter Ridge', price: 270, colorGroup: 'babyBlue', gridArea: '1 / 7 / 2 / 8', edge: 'top' },
  { id: 35, name: 'Air Portal', kind: 'air', gridArea: '1 / 8 / 2 / 9', edge: 'top' },
  { id: 36, name: 'Glacier Castle', price: 270, colorGroup: 'babyBlue', gridArea: '1 / 9 / 2 / 10', edge: 'top' },
  { id: 37, name: 'Icevein Peak', price: 280, colorGroup: 'babyBlue', gridArea: '1 / 10 / 2 / 11', edge: 'top' },
  { id: 38, name: 'Faerie Haven', price: 300, colorGroup: 'paleGreen', gridArea: '1 / 11 / 2 / 12', edge: 'top' },
  { id: 39, name: 'Topaz', kind: 'gem', gridArea: '1 / 12 / 2 / 13', edge: 'top' },
  { id: 40, name: 'Elven Court', price: 300, colorGroup: 'paleGreen', gridArea: '1 / 13 / 2 / 14', edge: 'top' },
  { id: 41, name: 'Hidden Vale', price: 310, colorGroup: 'paleGreen', gridArea: '1 / 14 / 2 / 15', edge: 'top' },

  { id: 42, name: 'Go To Time Out', kind: 'corner', corner: 'gotojail', isCorner: true, gridArea: '1 / 15 / 2 / 16', edge: 'right' },
  { id: 43, name: 'Dusk Gate', price: 330, colorGroup: 'deepIndigo', gridArea: '2 / 15 / 3 / 16', edge: 'right' },
  { id: 44, name: 'Shadow Reach', price: 330, colorGroup: 'deepIndigo', gridArea: '3 / 15 / 4 / 16', edge: 'right' },
  { id: 45, name: 'Arcane Nexus', kind: 'utility', gridArea: '4 / 15 / 5 / 16', edge: 'right' },
  { id: 46, name: 'Black Hollow', price: 340, colorGroup: 'deepIndigo', gridArea: '5 / 15 / 6 / 16', edge: 'right' },
  { id: 47, name: 'Charm Chest', kind: 'chest', gridArea: '6 / 15 / 7 / 16', edge: 'right' },
  { id: 48, name: 'Ashy Coast', price: 360, colorGroup: 'flameOrange', gridArea: '7 / 15 / 8 / 16', edge: 'right' },
  { id: 49, name: 'Earth Portal', kind: 'earth', gridArea: '8 / 15 / 9 / 16', edge: 'right' },
  { id: 50, name: 'Ember Isle', price: 360, colorGroup: 'flameOrange', gridArea: '9 / 15 / 10 / 16', edge: 'right' },
  { id: 51, name: 'Sunlit Bay', price: 370, colorGroup: 'flameOrange', gridArea: '10 / 15 / 11 / 16', edge: 'right' },
  { id: 52, name: 'Treasury Tax', kind: 'tax', gridArea: '11 / 15 / 12 / 16', edge: 'right' },
  { id: 53, name: 'Heavens Keep', price: 390, colorGroup: 'white', gridArea: '12 / 15 / 13 / 16', edge: 'right' },
  { id: 54, name: 'Chance', kind: 'chance', gridArea: '13 / 15 / 14 / 16', edge: 'right' },
  { id: 55, name: 'Sky Palace', price: 400, colorGroup: 'white', gridArea: '14 / 15 / 15 / 16', edge: 'right' },
];

export const BOARD_SPACE_COUNT = spaces.length;

const getPlayersByPosition = (players) => {
  return players.reduce((grouped, player) => {
    const position = Number(player.position || 0);
    const safePosition = ((position % BOARD_SPACE_COUNT) + BOARD_SPACE_COUNT) % BOARD_SPACE_COUNT;
    if (!grouped[safePosition]) grouped[safePosition] = [];
    grouped[safePosition].push(player);
    return grouped;
  }, {});
};

export const MonopolyBoard = ({
  players = [],
  diceRoll,
  movementRoll,
  canRoll = false,
  isRolling = false,
  onRoll,
}) => {
  const playersByPosition = getPlayersByPosition(players);
  const playerCount = Math.min(Math.max(players.length || 1, 1), 8);

  return (
    <section
      className={`monopoly-board monopoly-board-players-${playerCount}`}
      aria-label="Sugaropoly board"
    >
      <div className="monopoly-grid">
        {spaces.map((space) => {
          const spacePlayers = playersByPosition[space.id] || [];

          return (
            <div className="monopoly-space-holder" key={space.id} style={{ gridArea: space.gridArea }}>
              <BoardSpace {...space} />
              {spacePlayers.length ? (
                <div className="monopoly-token-cluster" aria-label={`Players on ${space.name}`}>
                  {spacePlayers.slice(0, 8).map((player) => {
                    const isMovingToken = movementRoll?.playerId === player.id && movementRoll?.to === space.id;

                    return (
                    <span
                      className={`monopoly-token ${isMovingToken ? 'is-moving' : ''}`}
                      key={`${player.id}${isMovingToken ? `-${movementRoll.id}` : ''}`}
                      title={`${player.name} on ${space.name}`}
                      style={{ '--player-color': player.color || '#f9a8d4' }}
                    >
                      {String(player.name || '?').charAt(0)}
                    </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="monopoly-center" style={{ gridArea: '2 / 2 / 15 / 15' }}>
          <img
            className="monopoly-center-image"
            src={monopolyBoardCenterImage}
            alt="Faerie Kingdom Quest board art"
          />
          <MonopolyDiceOverlay
            roll={diceRoll}
            canRoll={canRoll}
            isRolling={isRolling}
            onRoll={onRoll}
          />
        </div>
      </div>
    </section>
  );
};
