import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { PhoneUI } from './components/PhoneUI';
import { Hud } from './components/Hud';
import { GameState, PhoneApp } from './types';
import { LANDMARKS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerX: 2000,
    playerY: 2000,
    money: 500,
    health: 100,
    wantedLevel: 0,
    currentDistrict: 'Connaught Place',
    isPhoneOpen: false,
    activeApp: null,
    inVehicle: true,
    navigationTarget: null,
    teleportTarget: null
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Keyboard shortcut to toggle phone
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Tab') {
        e.preventDefault();
        setGameState(prev => ({ ...prev, isPhoneOpen: !prev.isPhoneOpen }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePhoneToggle = useCallback(() => {
    setGameState(prev => ({ ...prev, isPhoneOpen: !prev.isPhoneOpen }));
  }, []);

  const handleAppLaunch = useCallback((app: PhoneApp) => {
    setGameState(prev => ({ ...prev, activeApp: app }));
  }, []);

  const handleAppClose = useCallback(() => {
    setGameState(prev => ({ ...prev, activeApp: null }));
  }, []);

  const updateLocation = useCallback((x: number, y: number, district: string) => {
    setGameState(prev => {
        if (prev.currentDistrict !== district) {
            return { ...prev, playerX: x, playerY: y, currentDistrict: district };
        }
        return prev;
    });
  }, []);

  const handleGameUpdate = useCallback((stats: Partial<GameState>) => {
      setGameState(prev => {
          const hasChanged = Object.entries(stats).some(([key, val]) => prev[key as keyof GameState] !== val);
          if (hasChanged) {
              return { ...prev, ...stats };
          }
          return prev;
      });
  }, []);

  const showNotification = useCallback((msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleSetNavigation = useCallback((targetName: string) => {
      const landmark = LANDMARKS.find(l => l.name === targetName);
      if (landmark) {
          setGameState(prev => ({
              ...prev,
              navigationTarget: { x: landmark.x, y: landmark.y, name: landmark.name }
          }));
          showNotification(`GPS Set: ${landmark.name}`);
      } else {
          showNotification("Location not found.");
      }
  }, [showNotification]);

  const handleTeleport = useCallback((x: number, y: number, name: string) => {
      setGameState(prev => ({
          ...prev,
          teleportTarget: { x, y },
          isPhoneOpen: false // Close phone on teleport
      }));
      showNotification(`Fast Traveled to ${name}`);
  }, [showNotification]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 text-white font-sans select-none" role="application" aria-label="Delhi City Stories Game">
      {/* Game World Layer */}
      <GameCanvas 
        onLocationUpdate={updateLocation} 
        onGameUpdate={handleGameUpdate}
        isPhoneOpen={gameState.isPhoneOpen}
        navigationTarget={gameState.navigationTarget}
        teleportTarget={gameState.teleportTarget}
      />

      {/* HUD Layer */}
      <Hud gameState={gameState} onPhoneClick={handlePhoneToggle} />

      {/* Phone UI Layer */}
      {gameState.isPhoneOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Smartphone Interface">
          <PhoneUI 
            gameState={gameState} 
            onClose={handlePhoneToggle} 
            onLaunchApp={handleAppLaunch}
            onCloseApp={handleAppClose}
            showNotification={showNotification}
            onSetNavigation={handleSetNavigation}
            onTeleport={handleTeleport}
          />
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-6 py-2 rounded-full font-bold shadow-lg z-50 animate-bounce" role="alert">
              {notification}
          </div>
      )}
    </div>
  );
};

export default App;