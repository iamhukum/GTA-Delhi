import React from 'react';
import { GameState, UserProfile } from '../types';

interface HudProps {
  gameState: GameState;
  onPhoneClick: () => void;
  user: UserProfile | null;
}

export const Hud: React.FC<HudProps> = ({ gameState, onPhoneClick, user }) => {
  const getWeaponIcon = (weapon: string) => {
      switch(weapon) {
          case 'fist': return '👊';
          case 'pistol': return '🔫';
          case 'uzi': return '🖊️'; // Stylized
          case 'ak47': return '☠️';
          default: return '';
      }
  };

  if (!user) return null; // Hide HUD if not logged in

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Left: User Profile & Controls Guide */}
      <div className="absolute top-6 left-6 flex flex-col space-y-4 items-start">
        {/* Profile Card */}
        <div className="bg-black/60 backdrop-blur-md p-2 pr-4 rounded-full border border-gray-600 flex items-center space-x-3 shadow-lg">
             <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-yellow-500">
                 {user.picture ? (
                     <img src={user.picture} alt="User" className="w-full h-full object-cover" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">{user.name[0]}</div>
                 )}
             </div>
             <div>
                 <div className="text-white text-xs font-bold uppercase tracking-wide">{user.name}</div>
                 <div className="text-yellow-400 text-[10px] font-mono">CRIMINAL RECORD: CLEAN</div>
             </div>
        </div>

        <div className="bg-black/50 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-xs text-gray-300 font-mono opacity-70 hover:opacity-100 transition-opacity">
           <h3 className="text-yellow-400 font-bold mb-1 uppercase">Controls</h3>
           <div className="grid grid-cols-2 gap-x-4 gap-y-1">
             <span>W/A/S/D</span> <span className="text-white">Move</span>
             <span>1-4</span> <span className="text-white">Weapons</span>
             <span>Space</span> <span className="text-red-400 font-bold">Attack/Shoot</span>
             <span>F</span> <span className="text-yellow-300 font-bold">Enter/Exit</span>
             <span>Scroll</span> <span className="text-white">Zoom</span>
             <span>Drag</span> <span className="text-white">Rotate</span>
             <span>P</span> <span className="text-white">Phone</span>
           </div>
        </div>
      </div>

      {/* Top Right: Money, Health, Wanted, Weapon */}
      <div className="absolute top-6 right-6 flex flex-col items-end space-y-2">
        <div className="text-4xl font-pricedown text-green-400 font-bold drop-shadow-md tracking-wider">
          ${gameState.money}
        </div>
        
        {/* Weapon Selector Visual */}
        <div className="flex items-center space-x-2 bg-black/60 rounded-full px-4 py-1 border border-gray-600">
             <span className="text-gray-400 text-xs uppercase font-bold mr-2">WEAPON</span>
             <span className="text-2xl" role="img" aria-label="Current Weapon">{getWeaponIcon(gameState.currentWeapon)}</span>
             <span className="text-yellow-500 font-bold uppercase text-sm">{gameState.currentWeapon}</span>
        </div>

        {/* Health Bar */}
        <div className="w-48 h-4 bg-gray-800 rounded-full border-2 border-gray-600 overflow-hidden relative">
             <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${gameState.health}%` }}></div>
             <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-black drop-shadow-md">HEALTH</span>
        </div>
        
        {/* Wanted Stars */}
        <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
                 <div key={i} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${i < gameState.wantedLevel ? 'bg-red-600 animate-pulse' : 'bg-black/40'}`}>
                     {i < gameState.wantedLevel && <span className="text-white text-xs">★</span>}
                 </div>
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
            aria-label={gameState.isPhoneOpen ? "Close Phone" : "Open Phone"}
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