import React, { useState } from 'react';
import { GameState, PhoneApp } from '../types';
import { MapsApp } from './apps/MapsApp';
import { BrowserApp } from './apps/BrowserApp';
import { CameraApp } from './apps/CameraApp';
import { MissionsApp } from './apps/MissionsApp';

interface PhoneUIProps {
  gameState: GameState;
  onClose: () => void;
  onLaunchApp: (app: PhoneApp) => void;
  onCloseApp: () => void;
  showNotification: (msg: string) => void;
}

export const PhoneUI: React.FC<PhoneUIProps> = ({ gameState, onClose, onLaunchApp, onCloseApp, showNotification }) => {
  const { activeApp } = gameState;

  // Home Screen
  const renderHome = () => (
    <div className="grid grid-cols-3 gap-4 p-6 pt-12">
      <AppIcon icon="map" label="Maps" color="bg-green-500" onClick={() => onLaunchApp('maps')} />
      <AppIcon icon="globe" label="Browser" color="bg-blue-500" onClick={() => onLaunchApp('browser')} />
      <AppIcon icon="camera" label="Camera" color="bg-yellow-500" onClick={() => onLaunchApp('camera')} />
      <AppIcon icon="lightning-bolt" label="Missions" color="bg-red-600" onClick={() => onLaunchApp('missions')} />
      <AppIcon icon="music-note" label="Music" color="bg-purple-500" onClick={() => showNotification("Playing: Panjabi MC - Mundian To Bach Ke")} />
      <AppIcon icon="cog" label="Settings" color="bg-gray-500" onClick={() => showNotification("Settings are locked.")} />
    </div>
  );

  return (
    <div className="relative w-[340px] h-[680px] bg-black rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-xl z-20"></div>

      {/* Status Bar */}
      <div className="w-full h-8 bg-black text-white text-xs flex justify-between items-center px-6 pt-2 z-10">
        <span>12:42 PM</span>
        <div className="flex space-x-1">
            <span>5G</span>
            <span>100%</span>
        </div>
      </div>

      {/* Screen Content */}
      <div className="flex-1 bg-gradient-to-br from-indigo-900 to-purple-900 overflow-hidden relative">
        {!activeApp ? renderHome() : (
           <div className="w-full h-full bg-white text-black flex flex-col">
               {/* App Header */}
               {activeApp !== 'camera' && (
                    <div className="bg-gray-100 p-2 flex items-center border-b shadow-sm">
                        <button onClick={onCloseApp} className="p-1 hover:bg-gray-200 rounded">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="ml-2 font-bold capitalize">{activeApp}</span>
                    </div>
               )}
               
               <div className="flex-1 overflow-auto relative">
                   {activeApp === 'maps' && <MapsApp gameState={gameState} />}
                   {activeApp === 'browser' && <BrowserApp />}
                   {activeApp === 'camera' && <CameraApp onClose={onCloseApp} showNotification={showNotification} />}
                   {activeApp === 'missions' && <MissionsApp district={gameState.currentDistrict} />}
               </div>
           </div>
        )}
      </div>

      {/* Home Bar */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full z-20 mb-2 cursor-pointer" onClick={activeApp ? onCloseApp : onClose}></div>
    </div>
  );
};

const AppIcon: React.FC<{ icon: string; label: string; color: string; onClick: () => void }> = ({ icon, label, color, onClick }) => {
    // Mapping icons to simple SVG paths for brevity
    const getPath = (name: string) => {
        switch(name) {
            case 'map': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" />;
            case 'globe': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />;
            case 'camera': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />;
            case 'lightning-bolt': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />;
            case 'music-note': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />;
            case 'cog': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
            default: return null;
        }
    }

    return (
        <div className="flex flex-col items-center gap-1 cursor-pointer transform hover:scale-105 transition-transform" onClick={onClick}>
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {getPath(icon)}
                 </svg>
            </div>
            <span className="text-white text-xs font-medium drop-shadow">{label}</span>
        </div>
    )
}
