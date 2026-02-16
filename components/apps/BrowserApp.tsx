import React, { useState } from 'react';
import { searchWeb } from '../../services/geminiService';
import { GroundingChunk } from '../../types';

export const BrowserApp: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ text: string, chunks: GroundingChunk[] } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!query.trim()) return;
        setLoading(true);
        try {
            const data = await searchWeb(query);
            setResults(data);
        } catch (err) {
            setResults({ text: "Connection Lost.", chunks: [] });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="border-b p-2 bg-gray-50">
                <form onSubmit={handleSearch} className="flex gap-2">
                     <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search Web..."
                        className="flex-1 bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <button type="submit" disabled={loading} className="text-blue-500 text-sm font-bold px-2">Go</button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                 {loading ? (
                     <div className="flex justify-center mt-10 text-gray-400">Loading...</div>
                 ) : results ? (
                     <div className="space-y-4">
                         <div className="text-sm text-gray-800 leading-relaxed font-serif">
                             {results.text}
                         </div>
                         {results.chunks.length > 0 && (
                            <div className="border-t pt-2 mt-4">
                                <h4 className="text-xs font-bold text-gray-500 mb-2">Sources</h4>
                                {results.chunks.map((chunk, i) => (
                                    chunk.web ? (
                                        <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 truncate hover:underline mb-1">
                                            {chunk.web.title}
                                        </a>
                                    ) : null
                                ))}
                            </div>
                         )}
                     </div>
                 ) : (
                     <div className="flex flex-col items-center justify-center h-full text-gray-300">
                         <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                         <p className="text-sm">Search the World Wide Web</p>
                     </div>
                 )}
            </div>
        </div>
    );
};
