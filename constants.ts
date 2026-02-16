import { District, Landmark } from './types';

export const MAP_WIDTH = 4000;
export const MAP_HEIGHT = 4000;

export const DISTRICTS: District[] = [
  {
    name: 'Connaught Place',
    x: 1800,
    y: 1800,
    width: 400,
    height: 400,
    color: '#eab308', // Yellow-500
    description: 'The heart of New Delhi. Financial and business center.'
  },
  {
    name: 'Old Delhi',
    x: 1800,
    y: 1000,
    width: 500,
    height: 600,
    color: '#ef4444', // Red-500
    description: 'Historic walled city. Crowded streets and Red Fort.'
  },
  {
    name: 'Gurgaon Cyber City',
    x: 500,
    y: 3000,
    width: 600,
    height: 600,
    color: '#3b82f6', // Blue-500
    description: 'Modern corporate hub. Skyscrapers and tech offices.'
  },
  {
    name: 'South Delhi',
    x: 2200,
    y: 2800,
    width: 800,
    height: 600,
    color: '#22c55e', // Green-500
    description: 'Affluent residential area with parks and malls.'
  }
];

export const LANDMARKS: Landmark[] = [
  { name: 'Red Fort', x: 2050, y: 1200, type: 'monument' },
  { name: 'India Gate', x: 2100, y: 2200, type: 'monument' },
  { name: 'Qutub Minar', x: 2000, y: 3500, type: 'monument' },
  { name: 'Cyber Hub', x: 700, y: 3200, type: 'office' },
  { name: 'Palika Bazaar', x: 2000, y: 2000, type: 'shop' },
];

export const CAR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];
