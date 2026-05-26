import React from 'react';
import { BoardSpace } from './BoardSpace';

const spaces = [
  { id: 0, name: 'GO', kind: 'corner', corner: 'go', isCorner: true, gridArea: '15 / 15 / 16 / 16', edge: 'bottom' },
  { id: 1, name: 'Macaron Mews', price: 60, colorGroup: 'cocoa', gridArea: '15 / 14 / 16 / 15', edge: 'bottom' },
  { id: 2, name: 'Charm Chest', kind: 'chest', gridArea: '15 / 13 / 16 / 14', edge: 'bottom' },
  { id: 3, name: 'Cocoa Court', price: 60, colorGroup: 'cocoa', gridArea: '15 / 12 / 16 / 13', edge: 'bottom' },
  { id: 4, name: 'Cupcake Tax', kind: 'tax', price: 200, gridArea: '15 / 11 / 16 / 12', edge: 'bottom' },
  { id: 5, name: 'Ribbon Rail', kind: 'station', price: 200, gridArea: '15 / 10 / 16 / 11', edge: 'bottom' },
  { id: 6, name: 'Cloud Lane', price: 100, colorGroup: 'sky', gridArea: '15 / 9 / 16 / 10', edge: 'bottom' },
  { id: 7, name: 'Chance', kind: 'chance', gridArea: '15 / 8 / 16 / 9', edge: 'bottom' },
  { id: 8, name: 'Bonbon Bay', price: 100, colorGroup: 'sky', gridArea: '15 / 7 / 16 / 8', edge: 'bottom' },
  { id: 9, name: 'Sugar Sky', price: 120, colorGroup: 'sky', gridArea: '15 / 6 / 16 / 7', edge: 'bottom' },
  { id: 10, name: 'Pearl Pond', price: 130, colorGroup: 'sky', gridArea: '15 / 5 / 16 / 6', edge: 'bottom' },
  { id: 11, name: 'Sprinkle Stop', kind: 'station', price: 150, gridArea: '15 / 4 / 16 / 5', edge: 'bottom' },
  { id: 12, name: 'Cookie Cove', price: 130, colorGroup: 'sky', gridArea: '15 / 3 / 16 / 4', edge: 'bottom' },
  { id: 13, name: 'Confetti Co.', kind: 'utility', price: 150, gridArea: '15 / 2 / 16 / 3', edge: 'bottom' },

  { id: 14, name: 'Visiting', kind: 'corner', corner: 'jail', isCorner: true, gridArea: '15 / 1 / 16 / 2', edge: 'left' },
  { id: 15, name: 'Rose Parade', price: 140, colorGroup: 'blush', gridArea: '14 / 1 / 15 / 2', edge: 'left' },
  { id: 16, name: 'Glitter Co.', kind: 'utility', price: 150, gridArea: '13 / 1 / 14 / 2', edge: 'left' },
  { id: 17, name: 'Blush Boulevard', price: 140, colorGroup: 'blush', gridArea: '12 / 1 / 13 / 2', edge: 'left' },
  { id: 18, name: 'Heart Way', price: 160, colorGroup: 'blush', gridArea: '11 / 1 / 12 / 2', edge: 'left' },
  { id: 19, name: 'Pearl Rail', kind: 'station', price: 200, gridArea: '10 / 1 / 11 / 2', edge: 'left' },
  { id: 20, name: 'Peach Plaza', price: 180, colorGroup: 'peach', gridArea: '9 / 1 / 10 / 2', edge: 'left' },
  { id: 21, name: 'Charm Chest', kind: 'chest', gridArea: '8 / 1 / 9 / 2', edge: 'left' },
  { id: 22, name: 'Sorbet Street', price: 180, colorGroup: 'peach', gridArea: '7 / 1 / 8 / 2', edge: 'left' },
  { id: 23, name: 'Peony Pier', price: 200, colorGroup: 'peach', gridArea: '6 / 1 / 7 / 2', edge: 'left' },
  { id: 24, name: 'Apricot Alley', price: 210, colorGroup: 'peach', gridArea: '5 / 1 / 6 / 2', edge: 'left' },
  { id: 25, name: 'Candy Cloud', kind: 'chance', gridArea: '4 / 1 / 5 / 2', edge: 'left' },
  { id: 26, name: 'Poppy Prom', price: 210, colorGroup: 'peach', gridArea: '3 / 1 / 4 / 2', edge: 'left' },
  { id: 27, name: 'Petal Rail', kind: 'station', price: 220, gridArea: '2 / 1 / 3 / 2', edge: 'left' },

  { id: 28, name: 'Free Park', kind: 'corner', corner: 'parking', isCorner: true, gridArea: '1 / 1 / 2 / 2', edge: 'top' },
  { id: 29, name: 'Cherry Charm', price: 220, colorGroup: 'berry', gridArea: '1 / 2 / 2 / 3', edge: 'top' },
  { id: 30, name: 'Chance', kind: 'chance', gridArea: '1 / 3 / 2 / 4', edge: 'top' },
  { id: 31, name: 'Berry Bloom', price: 220, colorGroup: 'berry', gridArea: '1 / 4 / 2 / 5', edge: 'top' },
  { id: 32, name: 'Apple Kiss', price: 240, colorGroup: 'berry', gridArea: '1 / 5 / 2 / 6', edge: 'top' },
  { id: 33, name: 'Tulle Rail', kind: 'station', price: 200, gridArea: '1 / 6 / 2 / 7', edge: 'top' },
  { id: 34, name: 'Lemon Lace', price: 260, colorGroup: 'lemon', gridArea: '1 / 7 / 2 / 8', edge: 'top' },
  { id: 35, name: 'Honey House', price: 260, colorGroup: 'lemon', gridArea: '1 / 8 / 2 / 9', edge: 'top' },
  { id: 36, name: 'Tea Works', kind: 'utility', price: 150, gridArea: '1 / 9 / 2 / 10', edge: 'top' },
  { id: 37, name: 'Sunbeam Row', price: 280, colorGroup: 'lemon', gridArea: '1 / 10 / 2 / 11', edge: 'top' },
  { id: 38, name: 'Buttercup Bay', price: 290, colorGroup: 'lemon', gridArea: '1 / 11 / 2 / 12', edge: 'top' },
  { id: 39, name: 'Sparkle Stop', kind: 'station', price: 300, gridArea: '1 / 12 / 2 / 13', edge: 'top' },
  { id: 40, name: 'Daisy Drive', price: 290, colorGroup: 'lemon', gridArea: '1 / 13 / 2 / 14', edge: 'top' },
  { id: 41, name: 'Sunrise Sweets', price: 300, colorGroup: 'lemon', gridArea: '1 / 14 / 2 / 15', edge: 'top' },

  { id: 42, name: 'Go To Time Out', kind: 'corner', corner: 'gotojail', isCorner: true, gridArea: '1 / 15 / 2 / 16', edge: 'right' },
  { id: 43, name: 'Mint Manor', price: 300, colorGroup: 'mint', gridArea: '2 / 15 / 3 / 16', edge: 'right' },
  { id: 44, name: 'Pistachio Place', price: 300, colorGroup: 'mint', gridArea: '3 / 15 / 4 / 16', edge: 'right' },
  { id: 45, name: 'Charm Chest', kind: 'chest', gridArea: '4 / 15 / 5 / 16', edge: 'right' },
  { id: 46, name: 'Garden Gate', price: 320, colorGroup: 'mint', gridArea: '5 / 15 / 6 / 16', edge: 'right' },
  { id: 47, name: 'Velvet Rail', kind: 'station', price: 200, gridArea: '6 / 15 / 7 / 16', edge: 'right' },
  { id: 48, name: 'Chance', kind: 'chance', gridArea: '7 / 15 / 8 / 16', edge: 'right' },
  { id: 49, name: 'Lilac Lane', price: 350, colorGroup: 'lilac', gridArea: '8 / 15 / 9 / 16', edge: 'right' },
  { id: 50, name: 'Luxury Sprinkles', kind: 'tax', price: 100, gridArea: '9 / 15 / 10 / 16', edge: 'right' },
  { id: 51, name: 'Moonbow Walk', price: 400, colorGroup: 'lilac', gridArea: '10 / 15 / 11 / 16', edge: 'right' },
  { id: 52, name: 'Lavender Loft', price: 420, colorGroup: 'lilac', gridArea: '11 / 15 / 12 / 16', edge: 'right' },
  { id: 53, name: 'Crystal Co.', kind: 'utility', price: 150, gridArea: '12 / 15 / 13 / 16', edge: 'right' },
  { id: 54, name: 'Orchid Orbit', price: 430, colorGroup: 'lilac', gridArea: '13 / 15 / 14 / 16', edge: 'right' },
  { id: 55, name: 'Crown Candy', price: 450, colorGroup: 'lilac', gridArea: '14 / 15 / 15 / 16', edge: 'right' },
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

        <div className="monopoly-center" style={{ gridArea: '2 / 2 / 15 / 15' }}>
          <div className="center-script">sweet property day</div>
          <div className="center-ribbon">Collect rent, trade treats, keep it cute.</div>
        </div>
      </div>
    </section>
  );
};
