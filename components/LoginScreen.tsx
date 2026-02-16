import React from 'react';

interface LoginScreenProps {
  onLogin: (response: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {

  const handleSimulatedGoogleLogin = () => {
    // Simulate the exact delay and behavior of a Google login for the demo
    setTimeout(() => {
        onLogin({ credential: "GOOGLE_SIMULATION_TOKEN" });
    }, 600);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-gray-900/80 p-10 rounded-3xl border border-gray-600 shadow-2xl flex flex-col items-center text-center max-w-md w-full relative overflow-hidden">
        {/* Decorative Background Glow */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-yellow-600/20 to-purple-900/20 rotate-45 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-6xl font-pricedown text-yellow-400 mb-0 drop-shadow-md">DELHI</h1>
            <h2 className="text-3xl font-pricedown text-white mb-6 drop-shadow-md tracking-wider">STORIES</h2>
            
            <p className="text-gray-300 mb-8 text-sm font-medium leading-relaxed">
                Welcome to the streets of the capital. <br/>
                Sign in to save your empire.
            </p>
            
            <div className="bg-white p-1 rounded-full mb-6 w-[280px]">
                {/* Custom Google-styled Button for Simulation */}
                <button 
                  onClick={handleSimulatedGoogleLogin}
                  className="flex items-center justify-center w-full bg-white text-gray-700 font-medium py-2 rounded-full hover:bg-gray-50 transition-colors gap-3 border border-gray-200 shadow-sm"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  <span>Sign in with Google</span>
                </button>
            </div>
            
            <div className="flex items-center gap-4 w-full justify-center">
                 <div className="h-px bg-gray-700 w-full"></div>
                 <span className="text-gray-500 text-xs uppercase">OR</span>
                 <div className="h-px bg-gray-700 w-full"></div>
            </div>

            <button 
            onClick={() => onLogin({ credential: "DEMO_TOKEN" })}
            className="text-sm text-yellow-500 hover:text-yellow-300 font-bold mt-6 tracking-wide uppercase transition-colors"
            >
            Play as Guest
            </button>
        </div>
      </div>
    </div>
  );
};