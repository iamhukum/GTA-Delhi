import React, { useState, useRef } from 'react';
import { editImage, generateVeoVideo } from '../../services/geminiService';

interface CameraAppProps {
    onClose: () => void;
    showNotification: (msg: string) => void;
}

export const CameraApp: React.FC<CameraAppProps> = ({ onClose, showNotification }) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [fileObj, setFileObj] = useState<File | null>(null);
    
    const [mode, setMode] = useState<'photo' | 'edit' | 'video'>('photo');
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileObj(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setCapturedImage(ev.target?.result as string);
                setMode('edit'); // Default to edit/view mode after upload
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = async () => {
        if (!capturedImage || !prompt.trim()) return;
        setLoading(true);
        try {
            // Need base64 string without header
            const base64 = capturedImage.split(',')[1];
            const newImage = await editImage(base64, prompt);
            setCapturedImage(newImage);
            showNotification("Image edited with Nano Banana!");
            setPrompt('');
        } catch (e) {
            showNotification("Edit failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleVeo = async () => {
        if (!fileObj) {
            showNotification("Please upload a source image first.");
            return;
        }
        setLoading(true);
        try {
            // Veo Generation
            // If prompt is empty, use default
            const vidUrl = await generateVeoVideo(fileObj, prompt.trim() || undefined);
            setGeneratedVideo(vidUrl);
            setMode('video');
            showNotification("Veo Video Generated!");
        } catch (e: any) {
            showNotification(e.message || "Video generation failed.");
        } finally {
            setLoading(false);
        }
    };

    const renderControls = () => {
        if (loading) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 text-white">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-xs uppercase tracking-widest">Processing with Gemini...</p>
                </div>
            );
        }

        if (mode === 'photo') {
            return (
                <div className="flex-1 flex flex-col items-center justify-center bg-black text-white relative">
                    <div className="w-full h-64 bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg m-4">
                        <p className="text-xs text-gray-400">Tap shutter to upload</p>
                    </div>
                    
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                    
                    <div className="absolute bottom-10 w-full flex justify-center">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-16 h-16 rounded-full border-4 border-white bg-transparent flex items-center justify-center"
                        >
                            <div className="w-12 h-12 bg-white rounded-full"></div>
                        </button>
                    </div>
                </div>
            )
        }

        if (mode === 'edit' && capturedImage) {
            return (
                <div className="flex-1 flex flex-col bg-black">
                     <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
                         <img src={capturedImage} alt="Captured" className="max-h-full max-w-full object-contain" />
                     </div>
                     <div className="p-4 bg-gray-900 border-t border-gray-700">
                         <input 
                            type="text" 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe edit or video..."
                            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm mb-3 outline-none focus:ring-1 focus:ring-yellow-500"
                         />
                         <div className="flex gap-2">
                             <button onClick={handleEdit} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg text-xs font-bold uppercase">
                                 Edit Image
                             </button>
                             <button onClick={handleVeo} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-xs font-bold uppercase">
                                 Veo Video
                             </button>
                         </div>
                         <button onClick={() => { setMode('photo'); setCapturedImage(null); setFileObj(null); }} className="w-full mt-2 py-2 text-xs text-gray-400">
                             Discard
                         </button>
                     </div>
                </div>
            )
        }

        if (mode === 'video' && generatedVideo) {
             return (
                 <div className="flex-1 flex flex-col bg-black">
                     <div className="flex-1 relative flex items-center justify-center">
                         <video src={generatedVideo} autoPlay loop controls className="max-h-full max-w-full" />
                     </div>
                     <div className="p-4">
                         <button onClick={() => setMode('edit')} className="w-full bg-gray-800 text-white py-2 rounded-lg">Back to Image</button>
                     </div>
                 </div>
             )
        }
        return null;
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Camera Header */}
            <div className="bg-black text-white p-2 flex justify-between items-center z-10">
                 <button onClick={onClose} className="p-1"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                 <span className="font-bold text-sm tracking-wider">CAMERA AI</span>
                 <div className="w-6"></div>
            </div>
            {renderControls()}
        </div>
    );
};
