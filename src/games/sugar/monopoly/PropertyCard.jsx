import React from 'react';

// Color map for distinct property sets using pastel aesthetics
const PASTE_COLORS = {
  brown: 'bg-[#eec1ad]', // pastel brown / peach
  lightBlue: 'bg-[#a3e4f5]', // pastel baby blue
  pink: 'bg-[#f4bbd3]', // pastel pink
  orange: 'bg-[#fcd3a1]', // pastel orange
  red: 'bg-[#fca5a5]', // pastel red
  yellow: 'bg-[#fef08a]', // pastel yellow
  green: 'bg-[#bbf7d0]', // pastel green
  darkBlue: 'bg-[#93c5fd]', // pastel strong blue
  gray: 'bg-[#e5e7eb]', // for stations/utilities
};

export const PropertyCard = ({ name, colorSection, price, rent, outlineOnly = false }) => {
  const bgColor = PASTE_COLORS[colorSection] || 'bg-rose-200';

  return (
    <div className={`w-64 flex flex-col rounded-xl border-4 ${outlineOnly ? 'border-pink-200 bg-white' : 'border-rose-300 bg-rose-50'} overflow-hidden shadow-lg font-sans text-rose-900`}>
      {/* Header Color Block */}
      <div className={`h-16 ${bgColor} border-b-4 border-rose-300 flex items-center justify-center p-2`}>
        <div className="text-center font-bold uppercase tracking-widest text-sm text-gray-800 drop-shadow-sm">
          Title Deed<br/>
          <span className="text-lg">{name}</span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 flex flex-col items-center text-sm gap-2">
        <p className="font-semibold">Rent ${rent}</p>
        <div className="w-full flex justify-between">
          <span>With 1 Pastry</span>
          <span>${rent * 5}</span>
        </div>
        <div className="w-full flex justify-between">
          <span>With 2 Pastries</span>
          <span>${rent * 15}</span>
        </div>
        <div className="w-full flex justify-between">
          <span>With 3 Pastries</span>
          <span>${rent * 40}</span>
        </div>
        <div className="w-full flex justify-between">
          <span>With 4 Pastries</span>
          <span>${rent * 70}</span>
        </div>
        <div className="w-full flex justify-between font-semibold mt-2 border-t-2 border-rose-100 pt-2">
          <span>With 1 Bakery SignIn</span>
          <span>${rent * 100}</span>
        </div>
      </div>

      {/* Footer Details */}
      <div className="p-2 bg-rose-100 border-t-2 border-rose-200 text-xs text-center">
        <p>Mortgage Value ${price / 2}</p>
        <p>Pastries cost ${price * 0.8} each</p>
      </div>
    </div>
  );
};
