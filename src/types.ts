export type Strand = 'grammar' | 'vocabulary' | 'earth' | 'pronunciation' | 'tests' | 'saturn' | 'uranus' | 'neptune' | 'home' | 'pet' | 'logs';

export interface PointLog {
  id: string;
  type: string;
  points: number;
  description: string;
  timestamp: any;
}

export interface StudyNote {
  id: string;
  content: string;
  drawingData?: string;
  date: string;
  color: string;
  type: 'text' | 'drawing';
}

export interface UserData {
  uid?: string;
  email?: string;
  points: number;
  lastCheckIn: any;
  dailyWord: string;
  dailyQuote: string;
  studyTimeTotal: number;
  streak: number;
  dailyWordData?: {
    word: string;
    pos: string;
    def: string;
    sentEn: string;
    sentCn: string;
  };
  dailyQuoteData?: {
    quote: string;
    trans: string;
    author: string;
  };
  collectedCards?: Array<{
    id: string;
    date: string;
    word: string;
    quote: string;
    wordData: any;
    quoteData: any;
  }>;
  notes?: StudyNote[];
  avatarUrl?: string;
  avatarType?: 'cosmic' | 'cute' | 'custom';
}

export interface PetData {
  id?: string;
  name: string;
  type: string;
  image: string;
  emoji?: string;
  tierId?: string;
  hunger: number;
  happiness: number;
  level: number;
  xp: number;
  maxXp: number;
  isPlaying?: boolean;
}
