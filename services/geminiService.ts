import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { setNavigationFunction, GroundingChunk } from '../types';

// Helper to ensure API key is available for regular calls
const getAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found in environment.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- General Intelligence & Missions ---

export const generateMissionBrief = async (district: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a mission giver in a GTA-style game set in Delhi. The player is currently in ${district}. Generate a short, gritty, 1-sentence mission objective involving local elements (rickshaws, metro, street food, or office politics).`,
    });
    return response.text || "Mission generation failed.";
  } catch (error) {
    console.error("Mission gen error:", error);
    return "Survive the traffic.";
  }
};

// --- Google Maps Grounding ---

export const searchPlaces = async (query: string, userLat: number, userLong: number) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            retrievalConfig: {
                latLng: {
                    latitude: userLat, // In a real app these would map to real coords
                    longitude: userLong
                }
            }
        }
      },
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    
    return { text, chunks };
  } catch (error) {
    console.error("Maps grounding error:", error);
    throw error;
  }
};

// --- Google Search Grounding ---

export const searchWeb = async (query: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

    return { text, chunks };
  } catch (error) {
    console.error("Web search error:", error);
    throw error;
  }
};

// --- Image Editing (Nano Banana) ---

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: 'image/png'
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        // Iterate to find image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return "";
    } catch (e) {
        console.error("Image edit error", e);
        throw e;
    }
}

// --- Veo Video Generation ---

export const generateVeoVideo = async (imageFile: File, prompt: string = "Animate this scene naturally"): Promise<string> => {
    // 1. Check/Request API Key
    const win = window as any;
    if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
    }

    // 2. Re-initialize AI with potentially new key environment
    // Note: The guide says `process.env.API_KEY` is injected automatically after selection.
    // We create a new instance to be safe.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Convert File to Base64
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type;

    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: base64Image,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9' // Defaulting to landscape for cinematic feel
            }
        });

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("No video URI returned");

        // Fetch the actual video bytes using the key
        const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error: any) {
        // Handle "Requested entity was not found" for key issues
        if (error.message && error.message.includes("Requested entity was not found")) {
             if (win.aistudio) {
                 await win.aistudio.openSelectKey();
                 throw new Error("API Key session expired. Please re-select key and try again.");
             }
        }
        console.error("Veo generation error:", error);
        throw error;
    }
};

// Utils
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g. "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};