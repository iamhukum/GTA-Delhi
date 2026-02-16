import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { PhoneUI } from './components/PhoneUI';
import { Hud } from './components/Hud';
import { GameState, PhoneApp } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerX: 2000,
    playerY: 2000,
    money: 500,
    health: 100,
    wantedLevel: 0,
    currentDistrict: 'Connaught Place',
    isPhoneOpen: false,
    activeApp: null
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Keyboard shortcut to toggle phone
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Tab') {
        e.preventDefault();
        setGameState(prev => ({ ...prev, isPhoneOpen: !prev.isPhoneOpen }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePhoneToggle = () => {
    setGameState(prev => ({ ...prev, isPhoneOpen: !prev.isPhoneOpen }));
  };

  const handleAppLaunch = (app: PhoneApp) => {
    setGameState(prev => ({ ...prev, activeApp: app }));
  };

  const handleAppClose = () => {
    setGameState(prev => ({ ...prev, activeApp: null }));
  };

  const updateLocation = (x: number, y: number, district: string) => {
    // Only update if significantly changed to avoid render thrashing, or use a ref in GameCanvas
    // For this demo, we sync roughly
    setGameState(prev => {
        if (prev.currentDistrict !== district) {
            return { ...prev, playerX: x, playerY: y, currentDistrict: district };
        }
        return prev;
    });
  };

  const showNotification = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3000);
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 text-white font-sans select-none">
      {/* Game World Layer */}
      <GameCanvas 
        onLocationUpdate={updateLocation} 
        isPhoneOpen={gameState.isPhoneOpen}
      />

      {/* HUD Layer */}
      <Hud gameState={gameState} onPhoneClick={handlePhoneToggle} />

      {/* Phone UI Layer */}
      {gameState.isPhoneOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <PhoneUI 
            gameState={gameState} 
            onClose={handlePhoneToggle} 
            onLaunchApp={handleAppLaunch}
            onCloseApp={handleAppClose}
            showNotification={showNotification}
          />
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-6 py-2 rounded-full font-bold shadow-lg z-50 animate-bounce">
              {notification}
          </div>
      )}
      
      {/* Loading Overlay for Veo Key Check if needed (handled in service but good to be aware) */}
    </div>
  );
};

export default App;