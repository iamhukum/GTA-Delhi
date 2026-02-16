import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { PhoneUI } from './components/PhoneUI';
import { Hud } from './components/Hud';
import { LoginScreen } from './components/LoginScreen';
import { GameState, PhoneApp, UserProfile } from './types';
import { LANDMARKS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
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
    teleportTarget: null,
    currentWeapon: 'fist'
  });

  const [notification, setNotification] = useState<string | null>(null);

  // Keyboard shortcut to toggle phone
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!user) return; // Disable keys if not logged in

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
  }, [user]);

  const handleLogin = useCallback((response: any) => {
    // 1. Handle Guest Mode
    if (response.credential === "DEMO_TOKEN") {
        setUser({ name: "Guest Player", email: "guest@delhi.city", picture: "" });
        return;
    }

    // 2. Handle Simulated Google Login (For development/demo without GCP setup)
    if (response.credential === "GOOGLE_SIMULATION_TOKEN") {
        setUser({ 
            name: "Hukum Yadav", 
            email: "hukum@delhi.stories", 
            picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hukum&backgroundColor=b6e3f4" 
        });
        return;
    }
    
    // 3. Handle Real Google JWT (If client ID was provided)
    try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        setUser({
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        });
    } catch (e) {
        console.error("Login Decode Error", e);
        setNotification("Login Failed. Using Guest Mode.");
        // Fallback to guest if real decode fails
        setUser({ name: "Guest Player", email: "guest@delhi.city", picture: "" });
    }
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
      
      {/* Game World Layer - Always rendered but might be inactive */}
      <GameCanvas 
        onLocationUpdate={updateLocation} 
        onGameUpdate={handleGameUpdate}
        isPhoneOpen={gameState.isPhoneOpen}
        navigationTarget={gameState.navigationTarget}
        teleportTarget={gameState.teleportTarget}
        inputEnabled={!!user && !gameState.isPhoneOpen}
      />

      {/* Login Overlay */}
      {!user && <LoginScreen onLogin={handleLogin} />}

      {/* HUD Layer - Only when logged in */}
      {user && <Hud gameState={gameState} onPhoneClick={handlePhoneToggle} user={user} />}

      {/* Phone UI Layer */}
      {user && gameState.isPhoneOpen && (
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