
import { AvatarItem } from './types';

export const AVATAR_ITEMS: AvatarItem[] = [
  // Bases (Body Types)
  { id: 'base_1', name: 'Adventurer Body', cost: 0, type: 'base', svg: '🧍' },
  { id: 'base_2', name: 'Healer Body', cost: 200, type: 'base', svg: '🧘' },
  { id: 'base_3', name: 'Cyber Chassis', cost: 500, type: 'base', svg: '🦾' },
  { id: 'base_4', name: 'Noble Form', cost: 1000, type: 'base', svg: '🕴️' },

  // Faces (Head & Expressions)
  { id: 'face_1', name: 'Adventurer Alex', cost: 0, type: 'face', svg: '👦' },
  { id: 'face_2', name: 'Healer Hope', cost: 100, type: 'face', svg: '👩‍⚕️' },
  { id: 'face_3', name: 'Cyber Sam', cost: 300, type: 'face', svg: '🤖' },
  { id: 'face_4', name: 'Legendary Leo', cost: 600, type: 'face', svg: '🤴' },
  { id: 'face_cool', name: 'Cool Shades', cost: 150, type: 'face', svg: '😎' },
  { id: 'face_mask', name: 'Care Mask', cost: 50, type: 'face', svg: '😷' },

  // Shirts
  { id: 'shirt_1', name: 'Basic Tee', cost: 0, type: 'shirt', svg: '👕' },
  { id: 'shirt_2', name: 'Lab Coat', cost: 150, type: 'shirt', svg: '🥼' },
  { id: 'shirt_3', name: 'Track Suit', cost: 300, type: 'shirt', svg: '🧥' },
  { id: 'shirt_4', name: 'Formal Suit', cost: 600, type: 'shirt', svg: '🤵' },

  // Pants
  { id: 'pants_1', name: 'Blue Jeans', cost: 0, type: 'pants', svg: '👖' },
  { id: 'pants_2', name: 'Yoga Pants', cost: 100, type: 'pants', svg: '🩳' },
  { id: 'pants_3', name: 'Medical Scrubs', cost: 250, type: 'pants', svg: '👖' },
  { id: 'pants_4', name: 'Neon Slacks', cost: 450, type: 'pants', svg: '🔥' },

  // Shoes
  { id: 'shoes_1', name: 'Sneakers', cost: 0, type: 'shoes', svg: '👟' },
  { id: 'shoes_2', name: 'Doctor Clogs', cost: 50, type: 'shoes', svg: '👞' },
  { id: 'shoes_3', name: 'Hiking Boots', cost: 150, type: 'shoes', svg: '🥾' },
  { id: 'shoes_4', name: 'Golden Boots', cost: 500, type: 'shoes', svg: '✨' },

  // Pets
  { id: 'pet_cat', name: 'Grinning Cat', cost: 150, type: 'pet', svg: '😸' },
  { id: 'pet_dog', name: 'Loyal Pup', cost: 150, type: 'pet', svg: '🐕' },
  { id: 'pet_robot', name: 'Health Bot', cost: 400, type: 'pet', svg: '🤖' },
  { id: 'pet_dragon', name: 'Ancient Drake', cost: 1500, type: 'pet', svg: '🐲' },
];

export const INITIAL_USER: any = {
  name: 'New Explorer',
  characterName: 'MediBot',
  age: 25,
  bloodPressure: '120/80',
  bloodSugar: 90,
  stressLevel: 3,
  hemoglobin: 14.5,
  mediPoints: 200,
  unlockedItems: ['base_1', 'face_1', 'shirt_1', 'pants_1', 'shoes_1'],
  equippedBase: 'base_1',
  equippedFace: 'face_1',
  equippedShirt: 'shirt_1',
  equippedPants: 'pants_1',
  equippedShoes: 'shoes_1',
  equippedPet: '',
  lastCheckIn: null,
  streak: 0,
  maxStreak: 0
};
