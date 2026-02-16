import { District, Landmark } from './types';

export const MAP_WIDTH = 4000;
export const MAP_HEIGHT = 4000;

export const DISTRICTS: District[] = [
  {
    name: 'Connaught Place',
    x: 1800,
    y: 1800,
    width: 600,
    height: 600,
    color: '#eab308', // Yellow
    description: 'The heart of New Delhi. Financial and business center.'
  },
  {
    name: 'Old Delhi',
    x: 1800,
    y: 800,
    width: 800,
    height: 800,
    color: '#ef4444', // Red
    description: 'Historic walled city. Crowded streets and Red Fort.'
  },
  {
    name: 'Gurgaon Cyber City',
    x: 200,
    y: 2800,
    width: 1000,
    height: 1000,
    color: '#3b82f6', // Blue
    description: 'Modern corporate hub. Skyscrapers and tech offices.'
  },
  {
    name: 'South Delhi / Akshardham Area',
    x: 2400,
    y: 2400,
    width: 1200,
    height: 1000,
    color: '#22c55e', // Green
    description: 'Affluent residential area with parks and temples.'
  }
];

export const LANDMARKS: Landmark[] = [
  { name: 'Red Fort', x: 2200, y: 1000, type: 'monument' },
  { name: 'India Gate', x: 2100, y: 2200, type: 'monument' },
  { name: 'Qutub Minar', x: 2000, y: 3500, type: 'monument' },
  { name: 'Cyber Hub', x: 700, y: 3200, type: 'office' },
  { name: 'Akshardham Temple', x: 3200, y: 2600, type: 'temple' },
  { name: 'Lotus Temple', x: 2800, y: 3000, type: 'temple' },
  { name: 'Palika Bazaar', x: 2100, y: 2100, type: 'shop' },
];

export const CAR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];