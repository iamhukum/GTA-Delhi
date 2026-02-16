import React, { useState } from 'react';
import { searchPlaces } from '../../services/geminiService';
import { GameState, GroundingChunk } from '../../types';

interface MapsAppProps {
    gameState: GameState;
}

export const MapsApp: React.FC<MapsAppProps> = ({ gameState }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ text: string, chunks: GroundingChunk[] } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!query.trim()) return;
        
        setLoading(true);
        try {
            // Using a mock lat/long for Delhi center approx if game logic complex
            // But we use gameState if we mapped it to real coords.
            // Let's assume game world 0,0 is 28.5, 77.1 approx
            const lat = 28.6139; 
            const lng = 77.2090;

            const data = await searchPlaces(query, lat, lng);
            setResults(data);
        } catch (err) {
            setResults({ text: "Could not connect to Maps satellites.", chunks: [] });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-3 bg-white shadow-sm z-10">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search places in Delhi..."
                        className="flex-1 bg-gray-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button type="submit" disabled={loading} className="p-2 bg-blue-600 text-white rounded-lg">
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    </button>
                </form>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!results && (
                    <div className="text-center text-gray-400 mt-10">
                        <p className="text-sm">Current District: <span className="font-bold text-gray-600">{gameState.currentDistrict}</span></p>
                        <p className="text-xs mt-2">Powered by Google Maps Grounding</p>
                    </div>
                )}
                
                {results && (
                    <div>
                        <div className="prose prose-sm text-gray-700 mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                             {results.text}
                        </div>
                        
                        {results.chunks.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nearby Locations</h3>
                                {results.chunks.map((chunk, i) => {
                                    if(chunk.maps) {
                                        return (
                                            <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1">
                                                <div className="font-bold text-blue-600 text-sm">{chunk.maps.title}</div>
                                                {chunk.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0]?.content && (
                                                    <p className="text-xs text-gray-500 italic">"{chunk.maps.placeAnswerSources[0].reviewSnippets[0].content}"</p>
                                                )}
                                                <a href={chunk.maps.uri} target="_blank" rel="noreferrer" className="text-xs text-blue-400 mt-1 hover:underline truncate">Open in Maps</a>
                                            </div>
                                        )
                                    }
                                    return null;
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
