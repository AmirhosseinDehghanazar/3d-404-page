import { type ComponentType } from 'react';
import { Fish, Flower2, Gamepad2, Glasses } from 'lucide-react';

export type CharacterKey = 'shark' | 'cactus' | 'racoon' | 'ducky';

export interface Character {
  id: CharacterKey;
  name: string;
  description: string;
  src: string;
  bgGradient: string;
  watermarkTextColor: string;
  icon: ComponentType<{ className?: string }>;
  iconColor: string;
}

export const CHARACTERS: Character[] = [
  {
    id: 'shark',
    name: 'Shark 3D',
    description: 'Digital nomad shark in a classic navy hoodie, denim sweatpants & blue sneakers.',
    src: '/shark.mp4',
    bgGradient: 'linear-gradient(135deg, #F8F4EE 0%, #EBE3D5 50%, #DDD1BF 100%)',
    watermarkTextColor: 'text-[#1E3A8A]/[0.07]',
    icon: Fish,
    iconColor: 'text-[#2563EB]',
  },
  {
    id: 'cactus',
    name: 'Cactus 3D',
    description: 'Cactus programmer with a sunflower crown, mustard hoodie & cargo shorts.',
    src: '/cactus.mp4',
    bgGradient: 'linear-gradient(135deg, #F9F6EE 0%, #ECE4D0 50%, #DBCBB2 100%)',
    watermarkTextColor: 'text-[#15803D]/[0.07]',
    icon: Flower2,
    iconColor: 'text-amber-500',
  },
  {
    id: 'racoon',
    name: 'Raccoon 3D',
    description: 'Pro gamer raccoon in a black snapback & hoodie with a glowing PS controller.',
    src: '/racoon.mp4',
    bgGradient: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 50%, #CBD5E1 100%)',
    watermarkTextColor: 'text-[#0F172A]/[0.07]',
    icon: Gamepad2,
    iconColor: 'text-indigo-500',
  },
  {
    id: 'ducky',
    name: 'Ducky 3D',
    description: 'Duckling in sunglasses, a blue daisy Hawaiian shirt & bright orange sneakers.',
    src: '/ducky.mp4',
    bgGradient: 'linear-gradient(135deg, #FEF9C3 0%, #FDE68A 50%, #FCD34D 100%)',
    watermarkTextColor: 'text-[#CA8A04]/[0.09]',
    icon: Glasses,
    iconColor: 'text-emerald-500',
  },
];
