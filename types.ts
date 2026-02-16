import { FunctionDeclaration, Type } from "@google/genai";

export interface GameState {
  playerX: number;
  playerY: number;
  money: number;
  health: number;
  wantedLevel: number;
  currentDistrict: string;
  isPhoneOpen: boolean;
  activeApp: PhoneApp | null;
}

export type PhoneApp = 'maps' | 'camera' | 'veo' | 'browser' | 'missions';

export interface District {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  description: string;
}

export interface Landmark {
  name: string;
  x: number;
  y: number;
  type: 'office' | 'monument' | 'shop' | 'park';
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            content: string;
        }[];
    }[];
  };
}

// Function Declarations for Gemini Tools
export const setNavigationFunction: FunctionDeclaration = {
  name: 'setNavigation',
  parameters: {
    type: Type.OBJECT,
    description: 'Set the GPS navigation to a specific district or landmark in Delhi.',
    properties: {
      destination: {
        type: Type.STRING,
        description: 'The name of the district or landmark to navigate to (e.g., Connaught Place, Red Fort).',
      },
    },
    required: ['destination'],
  },
};
