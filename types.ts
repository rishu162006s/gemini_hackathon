
export interface UserProfile {
  name: string;
  characterName: string;
  age: number;
  bloodPressure: string;
  bloodSugar: number;
  stressLevel: number; // 1-10
  hemoglobin: number;
  mediPoints: number;
  unlockedItems: string[];
  equippedBase: string;
  equippedFace: string;
  equippedShirt: string;
  equippedPants: string;
  equippedShoes: string;
  equippedPet: string;
  lastCheckIn: string | null;
  streak: number;
  maxStreak: number;
}

export interface HealthReport {
  id: string;
  date: string;
  filename: string;
  specialty: string;
  formalReportText?: string;
  analysis: {
    summary: string;
    recommendations: string[];
    medications: string[];
    specialty: string;
    fullSpeechText: string;
  };
  chatHistory: Array<{ role: 'user' | 'model'; text: string }>;
}

export interface Appointment {
  id: string;
  clinicName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface Consultation {
  id: string;
  date: string;
  mode: 'symptoms' | 'report';
  symptoms?: string;
  duration?: string;
  specialty: string;
  problem: string;
  instructions: string;
  medicines: string[];
  isCleanHealth: boolean;
}

export interface DailyLog {
  date: string;
  bloodPressure: string;
  bloodSugar: number;
  stressLevel: number;
  hemoglobin: number;
  notes: string;
}

export interface MonthlyPlan {
  title: string;
  dietStrategy: string;
  phases: {
    phase: string;
    days: string;
    focus: string;
    activities: string[];
  }[];
  doList: string[];
  dontList: string[];
  precautions: string[];
}

export type AvatarCategory = 'base' | 'face' | 'shirt' | 'pants' | 'shoes' | 'pet';

export interface AvatarItem {
  id: string;
  name: string;
  cost: number;
  type: AvatarCategory;
  svg: string;
}

export type AssessmentType = 'PHQ9' | 'GAD7' | 'PCPTSD5' | 'ULTIMATE_CHECK';

export interface AssessmentResult {
  id: string;
  type: AssessmentType;
  date: string;
  score: number;
  category: 'Normal' | 'Medium Risk' | 'Emergency';
  strategies: string[];
  aiAnalysis?: string;
  detailedScores?: {
    depression: number;
    anxiety: number;
    ptsd: number;
  };
}

export interface Medicine {
  id: string;
  name: string;
  type: string;
  uses: string[];
  dosage: string;
  price: number;
  description: string;
}
