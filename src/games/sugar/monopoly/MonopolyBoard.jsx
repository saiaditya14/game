import React from 'react';
import { BoardSpace } from './BoardSpace';
import monopolyBoardCenterImage from '../../../../images/monopoly_board.jpeg';

const spaces = [
  { id: 0, name: 'GO', kind: 'corner', corner: 'go', isCorner: true, gridArea: '13 / 17 / 14 / 18', edge: 'bottom' },
  { id: 1, name: 'Snarl Swamp', price: 60, colorGroup: 'darkOlive', gridArea: '13 / 16 / 14 / 17', edge: 'bottom' },
  { id: 2, name: 'Charm Chest', kind: 'chest', gridArea: '13 / 15 / 14 / 16', edge: 'bottom' },
  { id: 3, name: 'Rotroot Fen', price: 70, colorGroup: 'darkOlive', gridArea: '13 / 14 / 14 / 15', edge: 'bottom' },
  { id: 4, name: 'Cupcake Tax', kind: 'tax', price: 200, gridArea: '13 / 13 / 14 / 14', edge: 'bottom' },
  { id: 5, name: 'Ribbon Rail', kind: 'station', price: 200, gridArea: '13 / 12 / 14 / 13', edge: 'bottom' },
  { id: 6, name: 'Ember Peak', price: 90, colorGroup: 'crimson', gridArea: '13 / 11 / 14 / 12', edge: 'bottom' },
  { id: 7, name: 'Chance', kind: 'chance', gridArea: '13 / 10 / 14 / 11', edge: 'bottom' },
  { id: 8, name: 'Dragon Valley', price: 90, colorGroup: 'crimson', gridArea: '13 / 9 / 14 / 10', edge: 'bottom' },
  { id: 9, name: 'Lava Roost', price: 100, colorGroup: 'crimson', gridArea: '13 / 8 / 14 / 9', edge: 'bottom' },
  { id: 10, name: 'Scrapy Hollow', price: 120, colorGroup: 'darkGreen', gridArea: '13 / 7 / 14 / 8', edge: 'bottom' },
  { id: 11, name: 'Sprinkle Stop', kind: 'station', price: 150, gridArea: '13 / 6 / 14 / 7', edge: 'bottom' },
  { id: 12, name: 'Goblin Camp', price: 120, colorGroup: 'darkGreen', gridArea: '13 / 5 / 14 / 6', edge: 'bottom' },
  { id: 13, name: 'Grim Burrows', price: 130, colorGroup: 'darkGreen', gridArea: '13 / 4 / 14 / 5', edge: 'bottom' },

  { id: 15, name: 'Moon Shine', price: 150, colorGroup: 'darkBlue', gridArea: '13 / 3 / 14 / 4', edge: 'bottom' },
  { id: 16, name: 'Glitter Co.', kind: 'utility', price: 150, gridArea: '13 / 2 / 14 / 3', edge: 'bottom' },
  { id: 14, name: 'Visiting', kind: 'corner', corner: 'jail', isCorner: true, gridArea: '13 / 1 / 14 / 2', edge: 'left' },
  { id: 17, name: 'Starlit Bay', price: 150, colorGroup: 'darkBlue', gridArea: '12 / 1 / 13 / 2', edge: 'left' },
  { id: 18, name: 'Dew Hollow', price: 160, colorGroup: 'darkBlue', gridArea: '11 / 1 / 12 / 2', edge: 'left' },
  { id: 19, name: 'Pearl Rail', kind: 'station', price: 200, gridArea: '10 / 1 / 11 / 2', edge: 'left' },
  { id: 20, name: 'Iron Mine', price: 180, colorGroup: 'steelGray', gridArea: '9 / 1 / 10 / 2', edge: 'left' },
  { id: 21, name: 'Charm Chest', kind: 'chest', gridArea: '8 / 1 / 9 / 2', edge: 'left' },
  { id: 22, name: 'Stone Hold', price: 180, colorGroup: 'steelGray', gridArea: '7 / 1 / 8 / 2', edge: 'left' },
  { id: 23, name: 'Mithril Pass', price: 190, colorGroup: 'steelGray', gridArea: '6 / 1 / 7 / 2', edge: 'left' },
  { id: 24, name: 'Dark Forest', price: 210, colorGroup: 'deepViolet', gridArea: '5 / 1 / 6 / 2', edge: 'left' },
  { id: 25, name: 'Candy Cloud', kind: 'chance', gridArea: '4 / 1 / 5 / 2', edge: 'left' },
  { id: 26, name: 'Thorny Grove', price: 210, colorGroup: 'deepViolet', gridArea: '3 / 1 / 4 / 2', edge: 'left' },
  { id: 27, name: 'Petal Rail', kind: 'station', price: 220, gridArea: '2 / 1 / 3 / 2', edge: 'left' },

  { id: 28, name: 'Free Park', kind: 'corner', corner: 'parking', isCorner: true, gridArea: '1 / 1 / 2 / 2', edge: 'top' },
  { id: 29, name: 'Misty Woods', price: 220, colorGroup: 'deepViolet', gridArea: '1 / 2 / 2 / 3', edge: 'top' },
  { id: 30, name: 'Chance', kind: 'chance', gridArea: '1 / 3 / 2 / 4', edge: 'top' },
  { id: 31, name: 'Sandy Camp', price: 240, colorGroup: 'burntAmber', gridArea: '1 / 4 / 2 / 5', edge: 'top' },
  { id: 32, name: 'Sunfire Dunes', price: 240, colorGroup: 'burntAmber', gridArea: '1 / 5 / 2 / 6', edge: 'top' },
  { id: 33, name: 'Tulle Rail', kind: 'station', price: 200, gridArea: '1 / 6 / 2 / 7', edge: 'top' },
  { id: 34, name: 'White Mirage', price: 250, colorGroup: 'burntAmber', gridArea: '1 / 7 / 2 / 8', edge: 'top' },
  { id: 35, name: 'Winter Ridge', price: 270, colorGroup: 'babyBlue', gridArea: '1 / 8 / 2 / 9', edge: 'top' },
  { id: 36, name: 'Tea Works', kind: 'utility', price: 150, gridArea: '1 / 9 / 2 / 10', edge: 'top' },
  { id: 37, name: 'Glacier Castle', price: 270, colorGroup: 'babyBlue', gridArea: '1 / 10 / 2 / 11', edge: 'top' },
  { id: 38, name: 'Icevein Peak', price: 280, colorGroup: 'babyBlue', gridArea: '1 / 11 / 2 / 12', edge: 'top' },
  { id: 39, name: 'Sparkle Stop', kind: 'station', price: 300, gridArea: '1 / 12 / 2 / 13', edge: 'top' },
  { id: 40, name: 'Faerie Haven', price: 300, colorGroup: 'paleGreen', gridArea: '1 / 13 / 2 / 14', edge: 'top' },
  { id: 41, name: 'Elven Court', price: 300, colorGroup: 'paleGreen', gridArea: '1 / 14 / 2 / 15', edge: 'top' },
  { id: 43, name: 'Hidden Vale', price: 310, colorGroup: 'paleGreen', gridArea: '1 / 15 / 2 / 16', edge: 'top' },
  { id: 44, name: 'Dusk Gate', price: 330, colorGroup: 'deepIndigo', gridArea: '1 / 16 / 2 / 17', edge: 'top' },

  { id: 42, name: 'Go To Time Out', kind: 'corner', corner: 'gotojail', isCorner: true, gridArea: '1 / 17 / 2 / 18', edge: 'right' },
  { id: 45, name: 'Charm Chest', kind: 'chest', gridArea: '2 / 17 / 3 / 18', edge: 'right' },
  { id: 46, name: 'Shadow Reach', price: 330, colorGroup: 'deepIndigo', gridArea: '3 / 17 / 4 / 18', edge: 'right' },
  { id: 47, name: 'Velvet Rail', kind: 'station', price: 200, gridArea: '4 / 17 / 5 / 18', edge: 'right' },
  { id: 48, name: 'Chance', kind: 'chance', gridArea: '5 / 17 / 6 / 18', edge: 'right' },
  { id: 49, name: 'Black Hollow', price: 340, colorGroup: 'deepIndigo', gridArea: '6 / 17 / 7 / 18', edge: 'right' },
  { id: 50, name: 'Luxury Sprinkles', kind: 'tax', price: 100, gridArea: '7 / 17 / 8 / 18', edge: 'right' },
  { id: 51, name: 'Ashy Coast', price: 360, colorGroup: 'flameOrange', gridArea: '8 / 17 / 9 / 18', edge: 'right' },
  { id: 52, name: 'Ember Isle', price: 360, colorGroup: 'flameOrange', gridArea: '9 / 17 / 10 / 18', edge: 'right' },
  { id: 53, name: 'Sunlit Bay', price: 370, colorGroup: 'flameOrange', gridArea: '10 / 17 / 11 / 18', edge: 'right' },
  { id: 54, name: 'Heavens Keep', price: 390, colorGroup: 'white', gridArea: '11 / 17 / 12 / 18', edge: 'right' },
  { id: 55, name: 'Sky Palace', price: 400, colorGroup: 'white', gridArea: '12 / 17 / 13 / 18', edge: 'right' },
];

export const MonopolyBoard = () => {
  return (
    <section className="monopoly-board" aria-label="Sugaropoly board">
      <div className="monopoly-grid">
        {spaces.map((space) => (
          <div key={space.id} style={{ gridArea: space.gridArea }}>
            <BoardSpace {...space} />
          </div>
        ))}

        <div className="monopoly-center" style={{ gridArea: '2 / 2 / 13 / 17' }}>
          <img
            className="monopoly-center-image"
            src={monopolyBoardCenterImage}
            alt="Faerie Kingdom Quest board art"
          />
        </div>
      </div>
    </section>
  );
};
