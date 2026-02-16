import React, { useState, useEffect } from 'react';
import { generateMissionBrief } from '../../services/geminiService';

interface MissionsAppProps {
    district: string;
}

export const MissionsApp: React.FC<MissionsAppProps> = ({ district }) => {
    const [mission, setMission] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getNewMission = async () => {
        setLoading(true);
        const text = await generateMissionBrief(district);
        setMission(text);
        setLoading(false);
    };

    useEffect(() => {
        getNewMission();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [district]);

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white p-6">
            <h2 className="text-2xl font-pricedown text-yellow-500 mb-6 border-b border-gray-700 pb-2">Active Mission</h2>
            
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse text-yellow-500 font-mono">Deciphering...</div>
                </div>
            ) : (
                <div className="flex-1">
                    <p className="text-lg font-mono leading-relaxed text-gray-300">
                        {mission}
                    </p>
                    <div className="mt-8 p-4 bg-gray-800 rounded border border-gray-700">
                        <h4 className="text-xs text-gray-500 uppercase">Reward</h4>
                        <p className="text-green-400 font-bold text-xl">$500</p>
                    </div>
                </div>
            )}

            <button 
                onClick={getNewMission}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded uppercase tracking-wider mt-4"
            >
                Request New Job
            </button>
        </div>
    );
};
