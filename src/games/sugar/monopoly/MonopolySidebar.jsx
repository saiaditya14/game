import React from 'react';
import { Dice5, Heart, UserRound } from 'lucide-react';
import { PropertyCard } from './PropertyCard';

export const MonopolySidebar = () => {
  return (
    <aside className="w-full lg:w-80 h-full max-h-[800px] flex flex-col gap-5 font-sans">
      <div className="bg-white/90 border-4 border-rose-200 rounded-lg p-4 shadow-md">
        <h2 className="text-xl font-bold text-rose-400 mb-4 uppercase text-center">Players</h2>

        <div className="flex justify-between items-center bg-rose-50 p-3 rounded-lg border-2 border-rose-100 mb-3 hover:bg-rose-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-300 border-2 border-pink-400 shadow-sm flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-rose-900">Partner</span>
          </div>
          <div className="font-bold text-green-600 text-lg">$1500</div>
        </div>

        <div className="flex justify-between items-center bg-rose-50 p-3 rounded-lg border-2 border-rose-100 hover:bg-rose-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-blue-300 shadow-sm flex items-center justify-center">
              <UserRound className="h-4 w-4 text-sky-700" />
            </div>
            <span className="font-bold text-rose-900">You</span>
          </div>
          <div className="font-bold text-green-600 text-lg">$1500</div>
        </div>
      </div>

      <div className="bg-white/90 border-4 border-rose-200 rounded-lg p-4 flex flex-col items-center justify-center shadow-md flex-1">
        <h3 className="text-sm font-bold text-rose-300 uppercase mb-4">Inspection</h3>
        <PropertyCard
          name="Rose Parade"
          colorSection="pink"
          price={140}
          rent={10}
        />
        <div className="mt-6 flex gap-2">
          <button className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-5 rounded-full shadow-sm transition-transform active:scale-95">
            Buy Property
          </button>
          <button className="bg-rose-300 hover:bg-rose-400 text-white font-bold py-2 px-4 rounded-full shadow-sm transition-transform active:scale-95">
            Pass
          </button>
        </div>
      </div>

      <div className="bg-white/90 border-4 border-rose-200 rounded-lg p-4 shadow-md text-center">
        <button className="w-full bg-pink-400 hover:bg-pink-500 text-white font-extrabold text-xl py-4 rounded-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
          <Dice5 className="h-6 w-6" />
          <span>Roll Dice</span>
        </button>
        <p className="text-xs text-rose-300 mt-3 font-semibold uppercase">It is your turn!</p>
      </div>
    </aside>
  );
};
