import React from 'react';
import { GameState } from '../types';

interface HudProps {
  gameState: GameState;
  onPhoneClick: () => void;
}

export const Hud: React.FC<HudProps> = ({ gameState, onPhoneClick }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Left: Controls Guide */}
      <div className="absolute top-6 left-6 flex flex-col items-start space-y-1 opacity-70 hover:opacity-100 transition-opacity">
        <div className="bg-black/50 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-xs text-gray-300 font-mono">
           <h3 className="text-yellow-400 font-bold mb-1 uppercase">Controls</h3>
           <div className="grid grid-cols-2 gap-x-4 gap-y-1">
             <span>W / Up</span> <span className="text-white">Accelerate</span>
             <span>S / Down</span> <span className="text-white">Brake/Reverse</span>
             <span>A / D</span> <span className="text-white">Steer</span>
             <span>P / Tab</span> <span className="text-white">Phone</span>
           </div>
        </div>
      </div>

      {/* Top Right: Money & Weapon (GTA style) */}
      <div className="absolute top-6 right-6 flex flex-col items-end space-y-2">
        <div className="text-4xl font-pricedown text-green-400 font-bold drop-shadow-md tracking-wider">
          ${gameState.money}
        </div>
        <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
                 <div key={i} className={`w-6 h-6 rounded-full border-2 border-white ${i < gameState.wantedLevel ? 'bg-red-600 animate-pulse' : 'bg-transparent'}`} />
            ))}
        </div>
      </div>

      {/* Bottom Left: Mini-map / Location */}
      <div className="absolute bottom-6 left-6 flex flex-col space-y-2">
          <div className="bg-black/80 border-2 border-gray-600 rounded-lg p-3 w-64 backdrop-blur-md">
              <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-widest">{gameState.currentDistrict}</h2>
              <p className="text-gray-300 text-sm">Delhi City</p>
          </div>
      </div>

      {/* Bottom Right: Phone Trigger */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
          <button 
            onClick={onPhoneClick}
            className={`w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-2xl border-4 border-gray-800 transition-transform transform hover:scale-110 flex items-center justify-center ${gameState.isPhoneOpen ? 'ring-4 ring-yellow-400' : ''}`}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
          </button>
      </div>
    </div>
  );
};