import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  Moon, Star, Sparkles, BookOpen, Mic2, PenTool, GraduationCap, 
  Home, User, Trophy, Heart, Coffee, ChevronLeft, ExternalLink,
  LogIn, LogOut, Clock, Zap, RefreshCw, Search, TrendingUp, ChevronRight,
  ClipboardX, FileText, Trash2, Download, Palette, Plus, Save, X, Edit, Pencil, Check,
  Hammer, Gamepad2, Monitor, Tablet, Smartphone, ZoomIn, ZoomOut, RotateCcw, Compass, Globe,
  Camera, FileImage, UploadCloud, Settings, ShieldAlert, ChevronUp, ChevronDown
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot,
  collection, query, where, arrayUnion, deleteDoc
} from './firebase';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Types ---
type Strand = 'grammar' | 'vocabulary' | 'earth' | 'pronunciation' | 'tests' | 'saturn' | 'uranus' | 'neptune' | 'home' | 'pet' | 'logs';

interface PointLog {
  id: string;
  type: string;
  points: number;
  description: string;
  timestamp: any;
}

interface UserData {
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

interface StudyNote {
  id: string;
  content: string;
  drawingData?: string; // Data URL for canvas image
  date: string;
  color: string;
  type: 'text' | 'drawing';
}

interface PetData {
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

// --- Constants ---
// --- Constants ---
const PET_TIERS = [
  {
    id: 'common', label: 'Common', cost: 100, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',
    pets: [
      { id: 'luna', name: 'Luna', emoji: '🌙' },
      { id: 'astro', name: 'Astro', emoji: '🚀' },
      { id: 'cosmo', name: 'Cosmo', emoji: '🪐' },
      { id: 'nova', name: 'Nova', emoji: '🌟' },
      { id: 'nebula', name: 'Nebula', emoji: '🌌' },
      { id: 'stella', name: 'Stella', emoji: '⭐' },
      { id: 'orion', name: 'Orion', emoji: '☄️' },
      { id: 'solar', name: 'Solar', emoji: '☀️' },
      { id: 'hamster', name: 'Hamster', emoji: '🐹' },
      { id: 'rabbit', name: 'Rabbit', emoji: '🐰' },
      { id: 'chick', name: 'Baby Chick', emoji: '🐥' },
      { id: 'cat', name: 'Cat', emoji: '🐱' },
      { id: 'dog', name: 'Dog', emoji: '🐶' },
      { id: 'duck', name: 'Duck', emoji: '🦆' },
      { id: 'frog', name: 'Frog', emoji: '🐸' },
      { id: 'turtle', name: 'Turtle', emoji: '🐢' },
      { id: 'mouse', name: 'Mouse', emoji: '🐭' },
      { id: 'hedgehog', name: 'Hedgehog', emoji: '🦔' },
      { id: 'snail', name: 'Snail', emoji: '🐌' },
      { id: 'butterfly', name: 'Butterfly', emoji: '🦋' },
      { id: 'bee', name: 'Bee', emoji: '🐝' },
      { id: 'ladybug', name: 'Ladybug', emoji: '🐞' },
      { id: 'fish', name: 'Fish', emoji: '🐟' },
      { id: 'goldfish', name: 'Goldfish', emoji: '🐠' },
      { id: 'crab', name: 'Crab', emoji: '🦀' },
      { id: 'parrot', name: 'Parrot', emoji: '🦜' },
      { id: 'owl', name: 'Owl', emoji: '🦉' },
      { id: 'penguin', name: 'Penguin', emoji: '🐧' }
    ]
  },
  {
    id: 'rare', label: 'Rare', cost: 300, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20',
    pets: [
      { id: 'fox', name: 'Fox', emoji: '🦊' },
      { id: 'raccoon', name: 'Raccoon', emoji: '🦝' },
      { id: 'koala', name: 'Koala', emoji: '🐨' },
      { id: 'panda', name: 'Panda', emoji: '🐼' },
      { id: 'deer', name: 'Deer', emoji: '🦌' },
      { id: 'flamingo', name: 'Flamingo', emoji: '🦩' },
      { id: 'capybara', name: 'Capybara', emoji: '🦫' },
      { id: 'sloth', name: 'Sloth', emoji: '🦥' },
      { id: 'otter', name: 'Otter', emoji: '🦦' }
    ]
  },
  {
    id: 'precious', label: 'Precious', cost: 500, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20',
    pets: [
      { id: 'redpanda', name: 'Red Panda', emoji: '🦊' },
      { id: 'tiger', name: 'Tiger Cub', emoji: '🐯' },
      { id: 'lion', name: 'Lion Cub', emoji: '🦁' },
      { id: 'elephant', name: 'Elephant', emoji: '🐘' },
      { id: 'giraffe', name: 'Giraffe', emoji: '🦒' },
      { id: 'zebra', name: 'Zebra', emoji: '🦓' },
      { id: 'dolphin', name: 'Dolphin', emoji: '🐬' },
      { id: 'whale', name: 'Whale', emoji: '🐳' },
      { id: 'seal', name: 'Seal', emoji: '🦭' },
      { id: 'octopus', name: 'Octopus', emoji: '🐙' }
    ]
  },
  {
    id: 'unique', label: 'Unique', cost: 800, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20',
    pets: [
      { id: 'polarbear', name: 'Polar Bear', emoji: '🐻‍❄️' },
      { id: 'narwhal', name: 'Narwhal', emoji: '🐋' },
      { id: 'eagle', name: 'Eagle', emoji: '🦅' },
      { id: 'shark', name: 'Great Shark', emoji: '🦈' },
      { id: 'peacock', name: 'Peacock', emoji: '🦚' }
    ]
  },
  {
    id: 'legendary', label: 'Legendary', cost: 1000, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
    pets: [
      { id: 'dragon', name: 'Dragon', emoji: '🐉' },
      { id: 'red_phoenix', name: 'Red Phoenix', emoji: '🐦‍🔥' },
      { id: 'unicorn', name: 'Unicorn', emoji: '🦄' },
      { id: 'axolotl', name: 'Axolotl', emoji: '🦎' },
      { id: 'chimera', name: 'Chimera', emoji: '🦁' }
    ]
  }
];

const PET_TYPES = PET_TIERS.flatMap(tier => 
  tier.pets.map(p => ({
    name: p.name,
    type: `${tier.label} ${p.name}`,
    image: "", // emoji-driven rendering
    emoji: p.emoji,
    tierId: tier.id,
    cost: tier.cost
  }))
);

const FOOD_TIERS = [
  {
    id: 'common', label: 'Common Food', cost: 20, growthPts: 5, color: 'text-emerald-400',
    items: [
      { name: 'Cabbage', emoji: '🥬' },
      { name: 'Carrot', emoji: '🥕' },
      { name: 'Leaves', emoji: '🍃' },
      { name: 'Apple', emoji: '🍎' }
    ]
  },
  {
    id: 'rare', label: 'Rare Food', cost: 50, growthPts: 12, color: 'text-blue-400',
    items: [
      { name: 'Beans', emoji: '🫘' },
      { name: 'Cucumber', emoji: '🥒' },
      { name: 'Strawberry', emoji: '🍓' },
      { name: 'Insects', emoji: '🐛' }
    ]
  },
  {
    id: 'precious', label: 'Precious Food', cost: 100, growthPts: 25, color: 'text-purple-400',
    items: [
      { name: 'Blueberries', emoji: '🫐' },
      { name: 'Grapes', emoji: '🍇' },
      { name: 'Tomato', emoji: '🍅' },
      { name: 'Egg', emoji: '🥚' }
    ]
  },
  {
    id: 'hi-protein', label: 'Hi-Protein Food', cost: 200, growthPts: 45, color: 'text-pink-400',
    items: [
      { name: 'Fish', emoji: '🐟' },
      { name: 'Shrimp', emoji: '🍤' },
      { name: 'Chicken', emoji: '🍗' },
      { name: 'Beef', emoji: '🥩' },
      { name: 'Cranberry', emoji: '🍒' }
    ]
  },
  {
    id: 'superfood', label: 'Super Food', cost: 300, growthPts: 80, color: 'text-amber-400',
    items: [
      { name: 'Salmon', emoji: '🐠' },
      { name: 'Lobster', emoji: '🦞' },
      { name: 'Lamb', emoji: '🍖' },
      { name: 'Turkey', emoji: '🦃' },
      { name: 'Durian', emoji: '🍈' }
    ]
  }
];

const STRANDS = {
  grammar: { name: 'E Grammar', nameZh: '核心文法', planet: 'Mercury', color: '#a9a9a9', icon: PenTool, class: 'planet-mercury', size: 0.45, orbit: 1 },
  vocabulary: { name: 'E Vocabulary', nameZh: '核心字彙', planet: 'Venus', color: '#ffd700', icon: BookOpen, class: 'planet-venus', size: 0.75, orbit: 2 },
  earth: { name: 'School Courses', nameZh: '學校課程', planet: 'Earth', color: '#4ade80', icon: Globe, class: 'planet-earth', size: 0.7, orbit: 3 },
  pronunciation: { name: 'Pronunciation', nameZh: '發音練習', planet: 'Mars', color: '#ff4500', icon: Mic2, class: 'planet-mars', size: 0.6, orbit: 4 },
  tests: { name: 'ST.Tests', nameZh: '標準測驗', planet: 'Jupiter', color: '#deb887', icon: GraduationCap, class: 'planet-jupiter', size: 1.25, orbit: 5 },
  saturn: { name: 'Bi-lingual Subjects', nameZh: '雙語學科', planet: 'Saturn', color: '#f4a460', icon: GraduationCap, class: 'planet-saturn', size: 0.95, orbit: 6 },
  uranus: { name: 'Handy Tools', nameZh: '實用工具', planet: 'Uranus', color: '#40e0d0', icon: Hammer, class: 'planet-uranus', size: 0.8, orbit: 7 },
  neptune: { name: 'Fun Games', nameZh: '輕鬆遊戲', planet: 'Neptune', color: '#1e90ff', icon: Gamepad2, class: 'planet-neptune', size: 0.78, orbit: 8 },
};

const UserAvatarCenter = ({ userData, onUpdate }: { userData: any, onUpdate: (data: any) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const avatars = {
    cosmic: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=400&h=400&q=80",
    cute: "https://images.unsplash.com/photo-1543589923-a8e820e4751e?auto=format&fit=crop&w=400&h=400&q=80"
  };

  const currentAvatar = userData?.avatarUrl || (userData?.avatarType === 'cute' ? avatars.cute : avatars.cosmic);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMessage(null);
    setSuccessMessage(null);

    if (file) {
      if (file.size > 800 * 1024) { // 800KB limit for safety (Firestore b64 overhead)
        setErrorMessage("Image too large! Maximum allowed is 800KB.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ avatarUrl: reader.result as string, avatarType: 'custom' });
        setSuccessMessage("Avatar updated!");
        setTimeout(() => setSuccessMessage(null), 3000);
      };
      reader.onerror = () => {
        setErrorMessage("Failed to read file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAvatar = () => {
    setErrorMessage(null);
    if (userData?.avatarType === 'cosmic') {
      onUpdate({ avatarType: 'cute', avatarUrl: null });
    } else if (userData?.avatarType === 'cute') {
      fileInputRef.current?.click();
    } else {
      onUpdate({ avatarType: 'cosmic', avatarUrl: null });
    }
  };

  return (
    <div className="relative z-30 group flex flex-col items-center">
      <motion.div
        animate={{ 
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 overflow-hidden cursor-pointer relative shadow-[0_0_40px_rgba(255,255,255,0.15)]"
        onClick={toggleAvatar}
      >
        <img 
          src={currentAvatar} 
          alt="User Avatar" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[8px] text-white font-bold uppercase tracking-widest whitespace-nowrap">Switch Mode</p>
        </div>
      </motion.div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-medium">Click avatar to switch styles or upload</p>
        <p className="text-[7px] text-cyan-400/50 uppercase tracking-[0.1em] font-bold italic">Max size: 800KB for best speed</p>
        
        <AnimatePresence>
          {errorMessage && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[9px] text-red-400 font-bold mt-1"
            >
              {errorMessage}
            </motion.p>
          )}
          {successMessage && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[9px] text-green-400 font-bold mt-1"
            >
              {successMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
};

const UniverseDisplay = ({ user, userData, onStrandClick, onUpdateAvatar, onSpaceshipClick }: { user: any, userData: any, onStrandClick: (s: Strand) => void, onUpdateAvatar: (d: any) => void, onSpaceshipClick: () => void }) => {
  const [hoveredOrbit, setHoveredOrbit] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const orbitDistances = isMobile ? [85, 130, 175, 220, 265, 310, 355, 400] : [95, 135, 175, 215, 255, 295, 335, 375];
  
  // Adjusted angles for better visibility and avoiding overlap with side branding for 8 planets
  const desktopAngles = [25, 70, 115, 160, 205, 250, 295, 340];
  
  if (isMobile) {
    // S-Curve logic for mobile
    return (
      <div className="relative w-full min-h-[90vh] flex flex-col items-center justify-start overflow-visible pt-10">
        {/* Origin Corner Accent (Bottom Left) */}
        <div className="absolute bottom-[-100px] left-[-100px] w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
        
        <div className="mb-20">
          <SpaceshipCenter onClick={onSpaceshipClick} />
        </div>

        <div className="relative w-full h-[960px]">
          {Object.entries(STRANDS).map(([key, info], index) => {
            const orbitIdx = info.orbit - 1;
            const dist = orbitDistances[orbitIdx] || 330;
            
            // Generate S-curve offset
            // Alternating left and right logic
            const isLeft = index % 2 === 0;
            const xOffset = isLeft ? -70 : 70;
            const yOffset = orbitIdx * 110;

            return (
              <div 
                key={key}
                className="absolute left-1/2"
                style={{ 
                  transform: `translate(calc(-50% + ${xOffset}px), ${yOffset}px)`
                }}
              >
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20"
                  style={{ 
                    width: `${dist * 2.2}px`, 
                    height: `${dist * 2.2}px`,
                    borderTop: '1px dotted rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    transform: `translate(-50%, -50%) rotate(${isLeft ? -45 : 45}deg)`
                  }}
                />
                <Planet 
                  strand={key as Strand} 
                  info={info} 
                  onClick={() => onStrandClick(key as Strand)}
                  disabled={!(key === 'uranus' || key === 'neptune') && !user}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[85vh] flex items-center justify-center">
      {/* Central Star Glow - Enhanced for Depth & Vibrancy */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/15 blur-[120px] animate-pulse rounded-full pointer-events-none" />
      
      {/* Orbital Rings - Vibrant and clear */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {orbitDistances.map((dist, i) => (
            <motion.div 
              key={i}
              className="absolute border border-dotted rounded-full transition-colors duration-1000"
              style={{ 
                width: dist * 2, 
                height: dist * 2,
                borderColor: hoveredOrbit === i + 1 ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.08)',
                transform: hoveredOrbit === i + 1 ? 'scale(1.005)' : 'scale(1)'
              }}
            />
        ))}
      </div>

      <div className="scale-75 lg:scale-100">
        <SpaceshipCenter onClick={onSpaceshipClick} />
      </div>

      {/* Planets */}
      {Object.entries(STRANDS).map(([key, info], index) => {
        const orbitIdx = info.orbit - 1;
        const angle = desktopAngles[index] || 0;
        const distance = orbitDistances[orbitIdx] || 250;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;

        return (
          <div 
            key={key}
            className="absolute top-1/2 left-1/2"
            style={{ 
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
            }}
            onMouseEnter={() => setHoveredOrbit(info.orbit)}
            onMouseLeave={() => setHoveredOrbit(null)}
          >
            <Planet 
              strand={key as Strand} 
              info={info} 
              onClick={() => onStrandClick(key as Strand)}
              disabled={!(key === 'uranus' || key === 'neptune') && !user}
              isHovered={hoveredOrbit === info.orbit}
            />
          </div>
        );
      })}
    </div>
  );
};

const GEMS = {
  vocabulary: [
    { name: 'Irregular Noun Plural', nameZh: '不規則名詞複數', url: 'https://ducj-creator.github.io/Shirley-Grammar/irregular/nouns/', type: 'diamond' },
    { name: 'Irregular Verbs', nameZh: '不規則動詞', url: 'https://ducj-creator.github.io/Shirley-Grammar/irregular/verbs/', type: 'ruby' },
    { name: 'Common Polysemes', nameZh: '常用一詞多義', url: 'https://ducj-creator.github.io/Shirley-Grammar/polysemy', type: 'emerald' },
    { name: 'Common Phrases & Idioms', nameZh: '常用片語/習語', url: 'https://ducj-creator.github.io/Shirley-Grammar/phrases', type: 'sapphire' },
    { name: 'Common Collocations', nameZh: '常用搭配', url: 'https://ducj-creator.github.io/Shirley-Grammar/collocations', type: 'amethyst' },
    { name: 'Buzzwords', nameZh: '流行術語', url: 'https://ducj-creator.github.io/Shirley-Grammar/buzzwords', type: 'topaz' },
    { name: 'Roots & Affixes', nameZh: '詞根詞綴', url: 'https://ducj-creator.github.io/Shirley-Grammar/root%20and%20affix/', type: 'opal' },
    { name: 'Level 1-6 Vocab', nameZh: '六級單字', url: 'https://ducj-creator.github.io/iVocab-Self-Practice/levels1-6.html', type: 'sapphire' },
    { name: 'TOEIC Core Vocab', nameZh: 'TOEIC 多益核心單字', url: 'https://ducj-creator.github.io/Shirley-Grammar/TOEIC%20vocab', type: 'topaz' },
  ],
  pronunciation: [
    { name: 'KK Phonics', nameZh: 'KK 音標', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/kk.html', type: 'sapphire' },
    { name: 'International Phonics', nameZh: '國際音標', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/ipa.html', type: 'ruby' },
    { name: 'Vowel Clusters', nameZh: '母音字群', url: 'https://hexagon-of-vowels.vercel.app/', type: 'emerald' },
    { name: 'Consonant Blends', nameZh: '子音字群', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/consonant.html', type: 'amethyst' },
    { name: 'Sentence Practice', nameZh: '例句語音練習', url: 'https://ducj-creator.github.io/Shirley-AI-Sentence-Practice/bank.html', type: 'topaz' },
    { name: 'My Own Sentences', nameZh: '自主句子練習', url: 'https://ducj-creator.github.io/Shirley-AI-Sentence-Practice/entry.html', type: 'opal' },
  ],
  grammar: [
    { name: 'Grammar Lemon Tree', nameZh: '文法檸檬樹', url: 'https://ducj-creator.github.io/Shirley-Grammar/', type: 'emerald' },
    { name: 'CAP Grammar', nameZh: '會考文法', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/CAP%20grammar.html', type: 'topaz' },
    { name: 'Grammar Songs', nameZh: '聽歌學文法', url: 'https://ducj-creator.github.io/Shirley-AI-Music-Studio/learning/index.html', type: 'sapphire' },
  ],
  tests: [
    { name: 'CAP Vocab & Grammar', nameZh: '會考單字與文法', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/CAP%20pastpapers.html', type: 'ruby' },
    { name: 'CAP Listening', nameZh: '會考聽力', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/cap%20listening.html', type: 'sapphire' },
    { name: 'CAP Reading', nameZh: '會考閱讀', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/cap%20reading.html', type: 'emerald' },
    { name: 'GSAT Vocabulary', nameZh: '學測單字', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/GSAT%20Vocab.html', type: 'diamond' },
    { name: 'GSAT Comprehensive', nameZh: '學測綜合測驗', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/GSAT%20Comprehensive.html', type: 'amethyst' },
    { name: 'GSAT Cloze', nameZh: '學測克漏字', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/GSAT%20cloze.html', type: 'topaz' },
    { name: 'GSAT Reading', nameZh: '學測閱讀', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/gsat%20reading.html', type: 'opal' },
  ],
  earth: [
    { name: 'iVocab Reading', nameZh: '愛單字閱讀理解', url: 'https://ducj-creator.github.io/iVocab-Readers/', type: 'topaz' },
    { name: 'FRP ELA Vocab', nameZh: '人文專題單字王', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/FRP%20ELA.html', type: 'sapphire' },
    { name: 'TOEFL J Vocab1', nameZh: '初級托福單字王1', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/TOEFL%20Junior%20Vocab.html', type: 'ruby' },
    { name: 'TOEFL J Vocab 2', nameZh: '初級托福單字王2', url: 'https://ducj-creator.github.io/toefl-junior-vocab-master/', type: 'emerald' },
    { name: 'CHHS Monthly', nameZh: '忠信月刊', url: 'https://ducj-creator.github.io/events/chhsmonthly/', type: 'amethyst' },
    { name: 'TOEFL J Mock', nameZh: '初級托福模擬', url: 'https://ducj-creator.github.io/TFJ-Mock/', type: 'opal' },
  ],
  saturn: [
    { name: 'Language Art', nameZh: '語文', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/language%20art.html', type: 'diamond' },
    { name: 'Math', nameZh: '數學', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/math.html', type: 'ruby' },
    { name: 'Physics', nameZh: '物理', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/physics.html', type: 'emerald' },
    { name: 'Chemistry', nameZh: '化學', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/chemistry.html', type: 'sapphire' },
    { name: 'Biology', nameZh: '生物', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/biology.html', type: 'amethyst' },
    { name: 'Humanities', nameZh: '人文', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/humanities.html', type: 'topaz' },
    { name: 'Ast. & Geo', nameZh: '天文地理', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/geography.html', type: 'opal' },
    { name: 'Business', nameZh: '商業', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/business.html', type: 'emerald' },
  ],
  uranus: [
    { name: 'Clock', nameZh: '時鐘', url: 'https://ducj-creator.github.io/clock.html', type: 'diamond' },
    { name: 'Timer', nameZh: '計時器 ⏱️', url: 'https://ducj-creator.github.io/Shirley%20Timer.html', type: 'ruby' },
    { name: 'Countdown', nameZh: '倒計時', url: 'https://ducj-creator.github.io/countdown.html', type: 'emerald' },
    { name: 'Stopwatch', nameZh: '碼表⌚️', url: 'https://ducj-creator.github.io/Shirley%20Stop%20Watch.html', type: 'sapphire' },
    { name: 'Scoreboard', nameZh: '計分牌', url: 'https://ducj-creator.github.io/scoreboard.html', type: 'amethyst' },
    { name: 'Name/Group Picker', nameZh: '選名/分組🧑🎓', url: 'https://ducj-creator.github.io/namepicker.html', type: 'topaz' },
    { name: 'Quiz Maker', nameZh: '測驗製作', url: 'https://ducj-creator.github.io/Shirley%20Pop%20Quiz%20Maker.html', type: 'opal' },
    { name: 'Lucky Wheel', nameZh: '幸運輪', url: 'https://ducj-creator.github.io/Shirley%20Lucky%20Wheel.html', type: 'emerald' },
    { name: 'Signpost', nameZh: '指示牌', url: 'https://ducj-creator.github.io/sign.html', type: 'sapphire' },
    { name: 'My Own Words', nameZh: '自主單字練習', url: 'https://ducj-creator.github.io/iVocab-Self-Practice/entry.html', type: 'amethyst' },
    { name: 'Flip Card Maker', nameZh: '翻轉卡製作', url: 'https://ducj-creator.github.io/Shirley%20Flip%20Card.html', type: 'topaz' },
  ],
  neptune: [
    { name: 'Sudoku', nameZh: '數獨', url: 'https://ducj-creator.github.io/shirley%20sudoku.html', type: 'diamond' },
    { name: 'Gomoku', nameZh: '五子棋', url: 'https://ducj-creator.github.io/gomoku.html', type: 'ruby' },
    { name: 'Go', nameZh: '圍棋', url: 'https://ducj-creator.github.io/go.html', type: 'emerald' },
    { name: 'LOT', nameZh: '幸運上上簽', url: 'https://ducj-creator.github.io/bestlot.html', type: 'sapphire' },
    { name: 'EMO Shredder', nameZh: '負能量粉碎機', url: 'https://ducj-creator.github.io/emoshredder.html', type: 'amethyst' },
    { name: 'Gems', nameZh: '寶石連連看', url: 'https://ducj-creator.github.io/gem.html', type: 'topaz' },
    { name: 'iVocab Champion', nameZh: '愛單字挑戰', url: 'https://ducj-creator.github.io/ivchampion.html', type: 'opal' },
    { name: 'Lucky Dice', nameZh: '幸運骰🎲', url: 'https://ducj-creator.github.io/Shirley%20Dice2.html', type: 'emerald' },
    { name: 'Moonblock', nameZh: '擲筊', url: 'https://ducj-creator.github.io/moonblock.html', type: 'sapphire' },
    { name: 'Coinflip', nameZh: '扔硬幣', url: 'https://ducj-creator.github.io/coin.html', type: 'amethyst' },
  ],
};

const SUBJECT_GEMS = [
  { name: 'Language Art', nameZh: '語文', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/language%20art.html', type: 'diamond' },
  { name: 'Math', nameZh: '數學', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/math.html', type: 'ruby' },
  { name: 'Physics', nameZh: '物理', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/physics.html', type: 'emerald' },
  { name: 'Chemistry', nameZh: '化學', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/chemistry.html', type: 'sapphire' },
  { name: 'Biology', nameZh: '生物', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/biology.html', type: 'amethyst' },
  { name: 'Humanities', nameZh: '人文', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/humanities.html', type: 'topaz' },
  { name: 'Ast. & Geo', nameZh: '天文地理', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/geography.html', type: 'opal' },
  { name: 'Business', nameZh: '商業', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/business.html', type: 'emerald' },
];

const RenderMiniGem = ({ type = 'diamond', className = '' }: { type?: string, className?: string }) => {
  const t = (type || 'diamond').toLowerCase();
  
  // High-fidelity custom gradients & clip-paths for distinct gem types
  let clipPathStyle = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'; // diamond fallback
  let gradientClass = 'from-sky-300 via-cyan-200 to-white';
  let glowColor = 'rgba(34, 211, 238, 0.7)';
  
  if (t === 'diamond') {
    clipPathStyle = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    gradientClass = 'from-cyan-300 via-sky-100 to-white';
    glowColor = 'rgba(34, 211, 238, 0.7)';
  } else if (t === 'ruby') {
    clipPathStyle = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    gradientClass = 'from-red-400 via-rose-500 to-rose-700';
    glowColor = 'rgba(239, 68, 68, 0.7)';
  } else if (t === 'emerald') {
    clipPathStyle = 'polygon(0% 25%, 25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%)';
    gradientClass = 'from-emerald-350 via-emerald-450 to-emerald-600';
    glowColor = 'rgba(16, 185, 129, 0.7)';
  } else if (t === 'sapphire') {
    clipPathStyle = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
    gradientClass = 'from-blue-300 via-sky-400 to-blue-700';
    glowColor = 'rgba(59, 130, 246, 0.7)';
  } else if (t === 'amethyst') {
    clipPathStyle = 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)';
    gradientClass = 'from-fuchsia-300 via-purple-400 to-purple-700';
    glowColor = 'rgba(168, 85, 247, 0.7)';
  } else if (t === 'topaz') {
    clipPathStyle = 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)';
    gradientClass = 'from-amber-300 via-orange-400 to-amber-600';
    glowColor = 'rgba(245, 158, 11, 0.7)';
  } else if (t === 'opal') {
    clipPathStyle = 'none'; // round opal
    gradientClass = 'bg-radial from-white via-pink-300 via-purple-300 to-indigo-300';
    glowColor = 'rgba(236, 72, 153, 0.7)';
  }

  return (
    <div 
      className={cn(
        "relative w-3.5 h-3.5 flex-shrink-0 transition-transform duration-350 group-hover:scale-135 select-none", 
        t === 'opal' ? 'rounded-full' : '',
        className
      )}
      style={{
        clipPath: t === 'opal' ? 'none' : clipPathStyle,
        filter: `drop-shadow(0 0 5px ${glowColor})`
      }}
    >
      <div 
        className={cn(
          "w-full h-full bg-gradient-to-br", 
          t === 'opal' ? 'bg-radial from-white via-pink-200 via-sky-100 to-blue-300' : gradientClass
        )} 
      />
    </div>
  );
};

const RenderMiniPlanet = ({ planet, className = '' }: { planet: string, className?: string }) => {
  const p = planet.toLowerCase();
  
  // Custom styles for each authentic planet sphere in the Milky Way system
  let backgroundStyle = '';
  let shadowStyle = '';
  let borderRing = false;
  
  if (p === 'mercury') {
    // Mercury: Grey, rocky, with realistic cratered shadows
    backgroundStyle = 'radial-gradient(circle at 35% 35%, #cbd5e1 0%, #64748b 45%, #1e293b 90%)';
    shadowStyle = '0 0 15px rgba(148, 163, 184, 0.5), inset -2px -2px 6px rgba(0,0,0,0.6)';
  } else if (p === 'venus') {
    // Venus: Yellow-gold swirly dense vapor planet
    backgroundStyle = 'radial-gradient(circle at 35% 35%, #fef08a 0%, #ca8a04 40%, #854d0e 80%, #422006 100%)';
    shadowStyle = '0 0 18px rgba(234, 179, 8, 0.65), inset -2px -2px 6px rgba(0,0,0,0.6)';
  } else if (p === 'mars') {
    // Mars: Iron-oxide desert rust-red sphere with glowing crimson mantle
    backgroundStyle = 'radial-gradient(circle at 32% 32%, #fca5a5 0%, #f87171 25%, #dc2626 65%, #7f1d1d 95%, #450a0a 100%)';
    shadowStyle = '0 0 20px rgba(239, 68, 68, 0.75), inset -2px -2px 6px rgba(0,0,0,0.6)';
  } else if (p === 'jupiter') {
    // Jupiter: Iconic banded cloud bands and dynamic bronze coloring
    backgroundStyle = 'radial-gradient(circle at 35% 35%, #ffedd5 0%, #fed7aa 25%, #ea580c 60%, #9a3412 85%, #431407 100%)';
    shadowStyle = '0 0 22px rgba(249, 115, 22, 0.6), inset -2px -2px 6px rgba(0,0,0,0.6)';
  } else if (p === 'saturn') {
    // Saturn: Muted light yellowish cream with majestic planetary gas ring
    backgroundStyle = 'radial-gradient(circle at 35% 35%, #fffbeb 0%, #fef08a 30%, #ca8a04 70%, #713f12 100%)';
    shadowStyle = '0 0 16px rgba(234, 179, 8, 0.5), inset -2px -2px 6px rgba(0,0,0,0.5)';
    borderRing = true;
  } else if (p === 'uranus') {
    // Uranus: Pale cyan-blue icy atmospheric cloud sphere
    backgroundStyle = 'radial-gradient(circle at 35% 35%, #e0f2fe 0%, #38bdf8 35%, #0284c7 75%, #0c4a6e 100%)';
    shadowStyle = '0 0 18px rgba(56, 189, 248, 0.6), inset -2px -2px 6px rgba(0,0,0,0.5)';
  } else if (p === 'neptune') {
    // Neptune: Dynamic deep royal blue storm giant
    backgroundStyle = 'radial-gradient(circle at 35% 35%, #eff6ff 0%, #3b82f6 30%, #1d4ed8 70%, #1e1b4b 100%)';
    shadowStyle = '0 0 24px rgba(37, 99, 235, 0.8), inset -2px -2px 6px rgba(0,0,0,0.6)';
  } else if (p === 'earth') {
    // Earth: Vivid blue, with green/emerald landmass textures and a soft blue atmospheric glow
    backgroundStyle = 'radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 30%, #2563eb 70%, #1e3a8a 100%)';
    shadowStyle = '0 0 20px rgba(59, 130, 246, 0.7), inset -2px -2px 6px rgba(0,0,0,0.6)';
  } else {
    // Standard stellar nebula bubble
    backgroundStyle = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #94a3b8 60%, #0f172a 100%)';
    shadowStyle = '0 0 12px rgba(255, 255, 255, 0.3)';
  }
  
  return (
    <div className={cn("relative flex items-center justify-center select-none shrink-0", className)}>
      {/* 3D Sphere of the planet */}
      <div 
        className="w-10 h-10 rounded-full relative overflow-hidden"
        style={{ 
          background: backgroundStyle,
          boxShadow: shadowStyle,
          border: '1px solid rgba(255,255,255,0.12)'
        }}
      >
        {/* Shadow overlays for dramatic three dimensionality */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-white/10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12px_12px,rgba(255,255,255,0.15)_0%,transparent_50%)] pointer-events-none" />
        
        {/* Fine detail surface texture styling overlays to look authentic */}
        {p === 'jupiter' && (
          <div className="absolute inset-0 flex flex-col justify-between opacity-35 mix-blend-overlay pointer-events-none">
            <div className="h-[2px] bg-amber-950 mt-1" />
            <div className="h-[3px] bg-amber-900 mt-0.5" />
            <div className="h-[1.5px] bg-orange-950" />
            <div className="h-[2px] bg-amber-950 mb-1" />
            <div className="absolute bottom-2.5 right-2 w-2 h-1.5 rounded-full bg-red-800" />
          </div>
        )}
        {p === 'mars' && (
          <div className="absolute inset-0 opacity-20 mix-blend-color-burn pointer-events-none">
            <div className="absolute top-1 left-2 w-4 h-3 bg-red-950 rounded-full filter blur-[1px]" />
            <div className="absolute bottom-1 right-2 w-3 h-2 bg-red-950 rounded-full filter blur-[1px]" />
          </div>
        )}
        {p === 'mercury' && (
          <div className="absolute inset-0 opacity-30 mix-blend-color-burn pointer-events-none">
            <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-black rounded-full filter blur-[0.5px]" />
            <div className="absolute bottom-3 left-1 w-2.5 h-2 bg-black rounded-full filter blur-[0.5px]" />
          </div>
        )}
        {p === 'neptune' && (
          <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none">
            <div className="absolute top-2 left-1 inset-x-0 h-[2px] bg-blue-300" />
            <div className="absolute bottom-3 right-1 inset-x-0 h-[1.5px] bg-blue-900" />
          </div>
        )}
        {p === 'earth' && (
          <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
            <div className="absolute top-2 left-2 w-3.5 h-3 bg-emerald-500 rounded-full filter blur-[1px]" />
            <div className="absolute top-4 left-5 w-4 h-2 bg-emerald-600 rounded-full filter blur-[1.5px]" />
            <div className="absolute bottom-2 right-3 w-3.5 h-3 bg-emerald-500 rounded-full filter blur-[1px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12px_12px,rgba(255,255,255,0.2),transparent)]" />
          </div>
        )}
      </div>
      
      {/* Dynamic planetary rings where appropriate */}
      {borderRing && (
        <div 
          className="absolute w-14 h-4 rounded-full border-[3px] border-amber-200/40 pointer-events-none transform rotate-[15deg] z-10"
          style={{ 
            boxShadow: '0 0 6px rgba(251, 191, 36, 0.2)',
          }}
        />
      )}
      {p === 'uranus' && (
        <div className="absolute w-12 h-2 rounded-full border-[1.2px] border-sky-300/20 pointer-events-none transform -rotate-[10deg] z-10" />
      )}
    </div>
  );
};

const PreLoginExplorer = ({ onSelectGem, onSelectStrand }: {
  onSelectGem: (gem: any, requiresLogin: boolean) => void,
  onSelectStrand: (strand: Strand, requiresLogin: boolean) => void
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectsExpanded, setSubjectsExpanded] = useState(false);

  const allGemsList = useMemo(() => {
    const list: any[] = [];
    Object.entries(GEMS).forEach(([strandKey, gemsArray]) => {
      const info = STRANDS[strandKey as keyof typeof STRANDS];
      if (!info) return;
      const requiresLogin = !(strandKey === 'uranus' || strandKey === 'neptune');
      gemsArray.forEach((gem: any) => {
        if (gem.url === 'subjects') {
          // Add main subject index
          list.push({
            ...gem,
            strandKey,
            strandName: info.name,
            strandNameZh: info.nameZh,
            planet: info.planet,
            color: info.color,
            requiresLogin
          });
          // Also index all the nested ones so they're searchable and selectable directly
          SUBJECT_GEMS.forEach((sub) => {
            list.push({
              ...sub,
              strandKey,
              strandName: `${info.name} • ${gem.name}`,
              strandNameZh: `${info.nameZh} • ${gem.nameZh}`,
              planet: info.planet,
              color: info.color,
              requiresLogin
            });
          });
        } else {
          list.push({
            ...gem,
            strandKey,
            strandName: info.name,
            strandNameZh: info.nameZh,
            planet: info.planet,
            color: info.color,
            requiresLogin
          });
        }
      });
    });
    return list;
  }, []);

  const filteredGems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allGemsList.filter(gem => 
      gem.name.toLowerCase().includes(query) || 
      gem.nameZh.toLowerCase().includes(query) ||
      gem.strandName.toLowerCase().includes(query) ||
      gem.strandNameZh.toLowerCase().includes(query) ||
      gem.planet.toLowerCase().includes(query)
    );
  }, [searchQuery, allGemsList]);

  return (
    <div id="star-chart-index" className="w-full relative text-neutral-200">
      
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10 border-b-2 border-amber-600/20 pb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-amber-100 flex items-center gap-3">
            <span className="text-amber-400 animate-pulse">✨</span> Star Chart Index / 星系內容索引
          </h2>
          <p className="text-xs md:text-sm text-neutral-300/80 font-medium mt-2">Explore all interactive planets and educational gems across Tr. Shirley's cosmic academy.</p>
        </div>
        
        {/* Search Box */}
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search gems & planets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/95 border-2 border-zinc-800 hover:border-zinc-700 focus:border-cyan-400 rounded-2xl py-3.5 pl-12 pr-10 text-sm md:text-base text-white placeholder-neutral-500 focus:outline-none transition-all shadow-inner focus:ring-4 focus:ring-cyan-500/10"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs md:text-sm font-semibold hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {searchQuery.trim() ? (
        /* Search Results View */
        <div className="min-h-[250px]">
          <p className="text-sm text-cyan-400 mb-6 font-mono font-bold tracking-widest uppercase">🔭 DISCOVERED {filteredGems.length} MATCHING GEMS IN THIS quadrant</p>
          {filteredGems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGems.map((gem, idx) => (
                <div
                  key={`${gem.name}-${idx}`}
                  onClick={() => onSelectGem(gem, gem.requiresLogin)}
                  className="p-5 md:p-6 rounded-3xl bg-zinc-950/70 border-2 border-zinc-800/80 hover:border-cyan-500/50 hover:bg-zinc-900/60 transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-lg"
                >
                  <div className="flex items-center gap-4 min-w-0 mr-3">
                    <RenderMiniGem type={gem.type} />
                    <div className="overflow-hidden">
                      <h4 className="text-base md:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors truncate">{gem.name}</h4>
                      <p className="text-xs md:text-sm text-neutral-300 mt-1 truncate">{gem.nameZh}</p>
                      <span className="inline-block text-[10px] md:text-xs uppercase tracking-wider text-neutral-400 font-mono font-bold mt-2">
                        🪐 {gem.planet} • {gem.strandName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {gem.requiresLogin ? (
                      <span className="text-[11px] font-bold bg-amber-950/40 border border-amber-900/50 text-amber-500 px-3 py-1 rounded-full flex items-center gap-1 font-mono">
                        🔒 Gated
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold bg-green-950/40 border border-green-900/50 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1 font-mono">
                        🔓 Guest
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-4">🔭</span>
              <p className="text-base md:text-lg text-neutral-350 font-medium">No matching gems discovered in this academy quadrant.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-xs md:text-sm text-cyan-400 font-bold hover:underline"
              >
                Reset Search Index / 回到星系主目錄
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Regular Table of Contents Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {(['grammar', 'vocabulary', 'earth', 'pronunciation', 'tests', 'saturn', 'uranus', 'neptune'] as Strand[]).map((strandKey) => {
            const info = STRANDS[strandKey];
            if (!info) return null;
            
            const requiresLogin = !(strandKey === 'uranus' || strandKey === 'neptune');
            const gemsArray = GEMS[strandKey as keyof typeof GEMS] || [];
            
            return (
              <div 
                key={strandKey} 
                className="p-6 md:p-8 rounded-[2rem] bg-indigo-950/20 border-2 border-indigo-500/10 hover:border-cyan-500/30 hover:bg-[#110d29]/40 transition-all duration-350 shadow-2xl relative flex flex-col group backdrop-blur-[6px]"
              >
                <div className="flex items-center justify-between mb-5 pb-5 border-b-2 border-indigo-505/10">
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <RenderMiniPlanet planet={info.planet} className="w-12 h-12 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]" />
                    <div className="overflow-hidden">
                      <h3 className="text-base md:text-lg lg:text-xl font-bold text-white flex items-center gap-2 truncate cursor-pointer hover:text-cyan-450 transition-colors" onClick={() => onSelectStrand(strandKey, requiresLogin)}>
                        {info.name} <span className="text-zinc-400 font-semibold text-xs md:text-sm">({info.planet})</span>
                      </h3>
                      <p className="text-xs md:text-sm text-neutral-350 font-sans tracking-wide truncate mt-0.5">{info.nameZh}</p>
                    </div>
                  </div>
                  
                  {requiresLogin ? (
                    <span className="text-[10px] sm:text-[11px] font-bold bg-amber-950/40 border border-amber-900/50 text-amber-500 px-3 py-1 rounded-full font-mono flex items-center gap-0.5 flex-shrink-0" title="Login required to enter this planet">
                      🔒 Gated
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] font-bold bg-green-950/40 border border-green-900/50 text-emerald-400 px-3 py-1 rounded-full font-mono flex items-center gap-0.5 flex-shrink-0" title="Accessible directly without login">
                      🔓 Guest
                    </span>
                  )}
                </div>
                
                <div className="space-y-3.5 flex-1 select-none">
                  {gemsArray.map((gem: any, gemIdx: number) => {
                    if (gem.url === 'subjects') {
                      return (
                        <div key={`${gem.name}-${gemIdx}`} className="flex flex-col">
                          <div
                            onClick={() => onSelectGem(gem, requiresLogin)}
                            className="group flex items-center justify-between p-4 rounded-2.5xl hover:bg-slate-900/50 transition-all duration-300 cursor-pointer text-sm font-semibold border-2 border-transparent hover:border-cyan-500/20"
                          >
                            <div className="flex items-center gap-3.5 overflow-hidden mr-2">
                              <RenderMiniGem type={gem.type} />
                              <div className="truncate">
                                <span className="text-base md:text-lg font-bold text-neutral-200 group-hover:text-cyan-300 transition-colors block truncate">{gem.name}</span>
                                <span className="text-xs md:text-sm text-neutral-300/80 group-hover:text-neutral-200 transition-colors block truncate mt-1">{gem.nameZh}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] md:text-xs text-cyan-400 font-bold bg-cyan-950/40 px-2.5 py-1 rounded-full uppercase border border-cyan-800/30">
                                {subjectsExpanded ? 'Hide' : 'Expand'}
                              </span>
                              <ChevronRight className={`w-5 h-5 text-neutral-400 group-hover:text-cyan-350 transition-transform ${subjectsExpanded ? 'rotate-90 text-cyan-300' : ''}`} />
                            </div>
                          </div>
                          
                          {subjectsExpanded && (
                            <div className="mt-2 ml-4 pl-4 border-l-2 border-[#ff4500]/20 space-y-2">
                              {SUBJECT_GEMS.map((sub, sIdx) => (
                                <div
                                  key={`sub-${sub.name}-${sIdx}`}
                                  onClick={() => onSelectGem(sub, requiresLogin)}
                                  className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-900/40 transition-all duration-300 cursor-pointer text-sm font-semibold"
                                >
                                  <div className="flex items-center gap-3 overflow-hidden mr-2">
                                    <RenderMiniGem type={sub.type} />
                                    <div className="truncate">
                                      <span className="text-neutral-200 group-hover:text-cyan-300 transition-colors block truncate text-sm md:text-base">{sub.name}</span>
                                      <span className="text-xs text-neutral-350 group-hover:text-neutral-250 transition-colors block truncate mt-1">{sub.nameZh}</span>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-neutral-450 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${gem.name}-${gemIdx}`}
                        onClick={() => onSelectGem(gem, requiresLogin)}
                        className="group flex items-center justify-between p-3.5 rounded-2.5xl hover:bg-slate-900/50 transition-all duration-300 cursor-pointer text-sm font-semibold"
                      >
                        <div className="flex items-center gap-3.5 overflow-hidden mr-2">
                          <RenderMiniGem type={gem.type} />
                          <div className="truncate">
                            <span className="text-base md:text-lg font-bold text-neutral-100 group-hover:text-cyan-300 transition-colors block truncate">{gem.name}</span>
                            <span className="text-xs md:text-sm text-neutral-300/80 group-hover:text-neutral-200 transition-colors block truncate mt-1">{gem.nameZh}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-450 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Helpers ---
const hashString = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Components ---

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const NotePad = ({ notes, onSave, onDelete }: { notes: StudyNote[], onSave: (note: Partial<StudyNote>) => void, onDelete: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<StudyNote> | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'drawing'>('text');
  const [color, setColor] = useState('#fef08a');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();

  const colors = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe'];

  useEffect(() => {
    if (activeTab === 'drawing' && canvasRef.current && currentNote?.drawingData) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, 800, 600);
        ctx?.drawImage(img, 0, 0);
      };
      img.src = currentNote.drawingData;
    }
  }, [activeTab, currentNote?.id]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setLastPos(pos);
  };

  const getPos = (e: any) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvasRef.current!.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current!.height / rect.height)
    };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setCurrentNote(prev => ({ ...prev, drawingData: dataUrl }));
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    const notesToExport = notes.filter(n => selectedIds.has(n.id));
    if (notesToExport.length === 0) {
      alert("Please select at least one note to export.");
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(22);
      doc.text("My Selected Space Logs", 20, yPos);
      yPos += 15;

      // Off-screen container for rendering visual replicas
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.zIndex = '-1000';
      document.body.appendChild(container);

      for (const note of notesToExport) {
        // Create an element that replicates the note editor's visual state
        const noteEl = document.createElement('div');
        noteEl.style.width = '800px';
        noteEl.style.minHeight = '1000px';
        noteEl.style.backgroundColor = note.color;
        noteEl.style.padding = '60px';
        noteEl.style.position = 'relative';
        noteEl.style.fontFamily = 'Inter, sans-serif';
        noteEl.style.fontSize = '32px';
        noteEl.style.lineHeight = '1.6';
        noteEl.style.color = '#1a1a1a';
        noteEl.style.whiteSpace = 'pre-wrap';
        noteEl.style.borderRadius = '40px';
        noteEl.style.overflow = 'hidden';
        
        // Add content (text)
        const textContent = document.createElement('div');
        textContent.textContent = note.content || '';
        noteEl.appendChild(textContent);
        
        // Add drawing as absolute overlay
        if (note.drawingData) {
          const img = document.createElement('img');
          img.src = note.drawingData;
          img.style.position = 'absolute';
          img.style.top = '0';
          img.style.left = '0';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          noteEl.appendChild(img);
        }

        container.appendChild(noteEl);
        
        // Visual capture using html2canvas
        const canvas = await html2canvas(noteEl, { 
          scale: 2, 
          backgroundColor: null,
          logging: false,
          useCORS: true 
        });
        const imgData = canvas.toDataURL('image/png');
        
        // Scale to fit PDF width
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (yPos + imgHeight > 270) {
          doc.addPage();
          yPos = 20;
        }

        // Timestamp Label
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Recorded At: ${note.date}`, 20, yPos);
        yPos += 5;

        doc.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 20;
        
        container.removeChild(noteEl);
      }

      document.body.removeChild(container);
      doc.save(`space-logs-${getLocalDateString()}.pdf`);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-32 right-8 w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl z-[2100] group pointer-events-auto"
      >
        <FileText className="w-6 h-6 text-white group-hover:text-cyan-400 transition-colors" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full text-[8px] flex items-center justify-center font-bold">{notes.length}</div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-24 right-8 w-[420px] h-[600px] bg-[#fbf9f3] border border-[#d2cca1]/40 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(0,0,0,0.06)] z-[2500] flex flex-row pointer-events-auto overflow-hidden"
          >
            {/* Left spiral side spine with beautiful physical metal wire ring loops */}
            <div className="w-10 bg-[#ebe7d8]/60 border-r border-[#d4cfbd]/80 relative flex flex-col justify-around py-6 z-20 select-none">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="relative w-full h-4 flex items-center justify-end">
                  {/* Outer wire ring looping over */}
                  <div className="absolute -right-3.5 w-7 h-3 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 border border-slate-500/20 shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                  {/* Left ring hole on binder spine side */}
                  <div className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-slate-900/45 shadow-inner" />
                  {/* Right ring hole on paper side */}
                  <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-slate-900/30 shadow-inner" />
                </div>
              ))}
            </div>

            {/* Notebook Lined Pages container */}
            <div className="flex-1 flex flex-col h-full bg-[#fdfbf6] text-slate-800">
              {/* Draggable Header - Grab handle */}
              <div 
                onPointerDown={(e) => dragControls.start(e)}
                className="h-14 flex items-center justify-between px-5 border-b border-[#e5dfcf] cursor-grab active:cursor-grabbing select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] leading-none">Universal Log</span>
                    <span className="text-[7px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Sync: Active</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-200/50 rounded-xl text-slate-400 hover:text-slate-800 transition-all font-bold"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Note Controls */}
              {currentNote && (
                <div className="px-5 py-2.5 border-b border-[#e5dfcf] flex items-center justify-between gap-4 select-none bg-[#fbf9f3]">
                  <div className="flex bg-slate-200/50 rounded-xl p-1 border border-slate-300/25">
                    <button 
                      onClick={() => setActiveTab('text')}
                      className={cn("px-4 py-1 flex text-[9px] font-black rounded-lg transition-all tracking-wider uppercase", activeTab === 'text' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >TEXT</button>
                    <button 
                      onClick={() => setActiveTab('drawing')}
                      className={cn("px-4 py-1 flex text-[9px] font-black rounded-lg transition-all tracking-wider uppercase", activeTab === 'drawing' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >DRAW</button>
                  </div>
                  <div className="flex gap-1">
                    {colors.map(c => (
                      <button 
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn("w-4 h-4 rounded-full border border-slate-400/40 transition-all", color === c ? "ring-2 ring-slate-800 scale-110 shadow-sm" : "opacity-60 hover:opacity-100")}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Scrollable List or Editor */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {currentNote ? (
                  <div className="h-full flex flex-col gap-3">
                    <div 
                      className="flex-1 relative rounded-xl border border-[#e5dfcf] shadow-inner group/editor overflow-hidden"
                      style={{ backgroundColor: color || '#ffffff' }}
                    >
                      {/* Unified Canvas + Text Layer */}
                      <div className="absolute inset-0 z-0">
                        <canvas 
                          ref={canvasRef}
                          width={800}
                          height={1000}
                          className={cn(
                            "w-full h-full",
                            activeTab === 'drawing' ? "cursor-crosshair z-20 pointer-events-auto" : "pointer-events-none z-0"
                          )}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </div>
                      
                      <textarea 
                        autoFocus={activeTab === 'text'}
                        className={cn(
                          "absolute inset-0 w-full h-full bg-transparent border-none focus:ring-0 text-slate-800 font-medium font-sans resize-none p-5 leading-6 z-10 notebook-paper-lined",
                          activeTab === 'drawing' ? "pointer-events-none opacity-40 select-none" : "pointer-events-auto opacity-100"
                        )}
                        value={currentNote.content}
                        onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                        placeholder={activeTab === 'text' ? "Write your transmission log here..." : ""}
                      />

                      {/* Interaction Hint */}
                      <div className="absolute top-2 right-4 pointer-events-none">
                        <span className="text-[8px] font-black uppercase opacity-25 tracking-tighter text-slate-500">
                          {activeTab === 'drawing' ? "Drawing Mode Active" : "Text Mode Active"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1 pb-1">
                      <button onClick={() => setCurrentNote(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest leading-none">Discard</button>
                      <button 
                        onClick={() => {
                          onSave({ ...currentNote, color });
                          setCurrentNote(null);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest shadow-sm hover:shadow active:scale-95 transition-all"
                      >Save Entry</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <header className="flex justify-between items-center mb-1">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stored Logs</h4>
                        <div className="flex gap-2.5">
                          <button 
                            onClick={() => setSelectedIds(new Set(notes.map(n => n.id)))} 
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase"
                          >Select All</button>
                          <button 
                            onClick={() => setSelectedIds(new Set())} 
                            className="text-[9px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase"
                          >Clear</button>
                        </div>
                      </div>
                      <button 
                        onClick={handleExport} 
                        disabled={isExporting || selectedIds.size === 0} 
                        className="text-[10px] font-bold text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1.5 border border-[#e5dfcf] px-2.5 py-1 rounded-lg bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed group/btn shadow-xs active:scale-95"
                      >
                        <Download className="w-3 h-3 text-slate-500 group-hover/btn:text-indigo-600" /> 
                        {isExporting ? "GENERATING..." : `EXPORT PDF (${selectedIds.size})`}
                      </button>
                    </header>
                    
                    <button 
                      onClick={() => {
                        setCurrentNote({ content: '', id: Math.random().toString(36).substr(2, 9), color, type: 'text' });
                        setActiveTab('text');
                      }}
                      className="w-full h-14 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-3 hover:bg-[#faf6ea] hover:border-slate-400 transition-all text-slate-400 hover:text-slate-600 bg-white/60 shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">New Transmission</span>
                    </button>

                    <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {notes.map(note => (
                        <motion.div 
                          key={note.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => { setCurrentNote(note); setActiveTab(note.type as any || 'text'); }}
                          className={cn(
                            "rounded-xl p-4 group transition-all relative cursor-pointer border shadow-sm hover:shadow-md",
                            selectedIds.has(note.id) ? "border-indigo-500 ring-2 ring-indigo-500/10 scale-[1.01]" : "border-slate-200"
                          )}
                          style={{ backgroundColor: note.color || '#ffffff' }}
                        >
                          {/* Selector bit */}
                          <div 
                            onClick={(e) => toggleSelect(note.id, e)}
                            className={cn(
                              "absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10 shadow-md",
                              selectedIds.has(note.id) ? "bg-indigo-600 text-white border border-white scale-110" : "bg-white/70 text-slate-300 hover:bg-white hover:text-slate-500"
                            )}
                          >
                            <Check className={cn("w-3 h-3", !selectedIds.has(note.id) && "opacity-0")} />
                          </div>

                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[8px] font-black uppercase opacity-40 tracking-tighter text-slate-600">{note.date}</span>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1 hover:bg-black/5 rounded"><Edit className="w-3 h-3 text-slate-500" /></button>
                              <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="p-1 hover:bg-black/5 rounded text-red-600"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          {note.drawingData ? (
                            <div className="relative aspect-video bg-white/45 rounded-lg overflow-hidden mb-2 border border-slate-200">
                              <img src={note.drawingData} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Drawing preview" />
                            </div>
                          ) : null}
                          <p className="text-[11px] font-semibold text-slate-800 leading-normal line-clamp-2">{note.content}</p>
                        </motion.div>
                      ))}
                      {notes.length === 0 && (
                        <div className="py-16 text-center">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No logs found</p>
                          <p className="text-[9px] text-slate-400/80 mt-1 font-zh">建立新傳輸開始記錄</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
const MobiusRing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRenderRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      // Stop rendering if tab is hidden or a portal is open (safeguards iPad/mobile performance)
      if (document.hidden || document.getElementById('portal-overlay')) return;

      time += 0.002; // Slower time step
      
      // Throttle rendering to ~15 FPS for maximum energy efficiency
      const now = Date.now();
      if (lastRenderRef.current && now - lastRenderRef.current < 66) {
        return;
      }
      lastRenderRef.current = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.35;

      // Lower resolution loop - optimization for CPU/GPU heat
      ctx.fillStyle = "rgba(200, 220, 255, 0.2)";
      for (let u = 0; u < Math.PI * 2; u += 0.15) { // Significant reduction in points (0.08 -> 0.15)
        for (let v = -0.5; v <= 0.5; v += 0.5) {
          const uStep = u + time * 0.5;
          const uHalf = u / 2 + time;
          const cosUHalf = Math.cos(uHalf);
          
          const x = (1 + v * cosUHalf) * Math.cos(uStep);
          const y = (1 + v * cosUHalf) * Math.sin(uStep);
          const z = v * Math.sin(uHalf);

          const perspective = 1 / (2 - z);
          const px = centerX + x * scale * perspective;
          const py = centerY + y * scale * perspective;

          const size = (1 + z) * 1.2;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[-1]" />;
};

const GalaxyBackground = React.memo(() => (
    <div className="galaxy-bg">
      <div className="velvet-texture-fixed" />
      <div className="galaxy-bg-extra" />
      <MobiusRing />
      <div className="shooting-star" style={{ top: '10%', left: '80%', animationDelay: '0s' }} />
    </div>
));

const Planet = ({ strand, info, onClick, disabled, isHovered }: { strand: Strand, info: any, onClick: () => void, disabled: boolean, isHovered?: boolean }) => {
  const baseSize = 80;
  const scaledSize = baseSize * (info.size || 1);
  
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={{ 
        y: [0, -3, 0]
      }}
      transition={{ 
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn(
        "relative flex flex-col items-center cursor-pointer group",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
    >
      <div className="relative">
        {/* Mercury Halo */}
        {strand === 'grammar' && (
          <div className="absolute inset-[-20%] rounded-full mercury-halo pointer-events-none" />
        )}

        <div 
          className={cn(
            "rounded-full transition-all duration-700 relative",
            info.class
          )}
          style={{ 
            width: `${scaledSize}px`, 
            height: `${scaledSize}px`,
            boxShadow: disabled
              ? `0 0 15px 1px ${info.color}25, inset 0 0 8px rgba(255, 255, 255, 0.2)`
              : isHovered 
                ? `0 0 65px 12px ${info.color}b0, inset 0 0 25px rgba(255, 255, 255, 0.7)` 
                : `0 0 35px 4px ${info.color}65, inset 0 0 15px rgba(255, 255, 255, 0.45)`
          }}
        >
          {/* Internal Art Textures */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay planet-texture rounded-full overflow-hidden" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/20 rounded-full" />
          
          {/* Atmospheric Glow */}
          <div className="absolute inset-[-2px] rounded-full border border-white/10 opacity-50" />
          
          {/* Saturn Rings - Moved out of the clipped area if needed, but we removed overflow-hidden */}
          {strand === 'saturn' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center translate-y-[-5%] overflow-visible">
              <div className="saturn-ring-belt" style={{ width: '220%', height: '220%', position: 'absolute' }} />
              <div className="saturn-ring-belt" style={{ width: '260%', height: '260%', opacity: 0.5, position: 'absolute' }} />
              <div className="saturn-ring-belt" style={{ width: '300%', height: '300%', opacity: 0.2, position: 'absolute' }} />
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center z-10">
            <info.icon className="w-1/2 h-1/2 text-white/80 group-hover:text-white drop-shadow-xl" />
          </div>
        </div>

        {/* Hidden expanded touch target */}
        <div className="absolute inset-[-15px] rounded-full z-0 cursor-pointer" />
      </div>

      <div className="mt-4 flex flex-col items-center text-center px-4.5 py-2.5 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.7)] group-hover:bg-slate-900/95 group-hover:border-white/20 transition-all">
        <span className="font-display text-[13.5px] md:text-[15.5px] font-black tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
          {info.name}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] md:text-[12px] font-zh font-bold text-zinc-100 group-hover:text-white transition-colors">
            {info.nameZh}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-450/40" />
          <span className="text-[9px] md:text-[10px] text-cyan-300 group-hover:text-cyan-200 font-extrabold uppercase tracking-wider">{info.planet}</span>
        </div>
      </div>
    </motion.div>
  );
};

const Gem = ({ name, nameZh, url, color, type, onVisit, onClick, className }: { name: string, nameZh: string, url: string, color: string, type: string, onVisit: () => void, onClick?: () => void, className?: string, key?: any }) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -5 }}
    onClick={(e) => {
      e.preventDefault();
      if (onClick) {
        onClick();
      }
      onVisit();
    }}
    className={cn(
      "relative w-36 h-48 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-4 group overflow-hidden cursor-pointer shrink-0 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
      className
    )}
  >
    <div 
      className={cn("gem-shape scale-110", `gem-${type}`)}
      style={{ color: color }}
    />
    <div className="text-center flex flex-col gap-1 px-3">
      <span className="font-bold text-[14.5px] md:text-[15.5px] leading-tight text-white group-hover:text-cyan-200 transition-colors line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{name}</span>
      <span className="text-[12px] md:text-[13px] font-semibold text-neutral-300/90 group-hover:text-white transition-colors mt-0.5">{nameZh}</span>
    </div>
    {url !== 'subjects' && <Sparkles className="absolute top-2 right-2 w-3.5 h-3.5 text-white/35 group-hover:text-white/70" />}
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.button>
);

const SpaceshipCenter = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="relative z-30 flex flex-col items-center justify-center cursor-pointer group select-none" onClick={onClick}>
      {/* Futuristic Spaceship Vessel */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Energy Rings / Thruster Waves */}
        <div className="absolute w-28 h-28 border-2 border-dashed border-indigo-400/30 rounded-full animate-[spin_8s_linear_infinite]" />
        <div className="absolute w-32 h-32 border border-dotted border-pink-400/20 rounded-full animate-[spin_12s_linear_infinite_reverse]" />
        <div className="absolute w-24 h-24 bg-gradient-to-tr from-indigo-500/20 via-pink-500/25 to-cyan-500/15 rounded-full blur-xl animate-pulse" />

        {/* Glow behind engine */}
        <div className="absolute h-10 w-4 bg-orange-500/80 rounded-full blur-md bottom-2 animate-[pulse_1s_infinite] shadow-[0_0_25px_rgba(249,115,22,0.8)]" />

        {/* Custom Spaceship SVG */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-24 h-24"
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
            {/* Engine Thruster Flame */}
            <path d="M50 82 L42 96 L50 90 L58 96 Z" fill="url(#engineFlame)" />
            {/* Left Helper Wing */}
            <path d="M22 66 L30 52 L36 68 Z" fill="#6366f1" stroke="#312e81" strokeWidth="1.5" />
            <path d="M10 66 L22 66 L30 74 Z" fill="#4338ca" />
            {/* Right Helper Wing */}
            <path d="M78 66 L70 52 L64 68 Z" fill="#6366f1" stroke="#312e81" strokeWidth="1.5" />
            <path d="M90 66 L78 66 L70 74 Z" fill="#4338ca" />
            
            {/* Upper Tail fins */}
            <path d="M50 20 L44 38 L50 34 L56 38 Z" fill="#ec4899" stroke="#50072b" strokeWidth="1" />

            {/* Ship Core Body / Hull */}
            <path d="M50 14 L30 68 L50 80 L70 68 Z" fill="url(#hullGradient)" stroke="#1e1b4b" strokeWidth="2.5" />

            {/* Glowing Panel stripes */}
            <path d="M50 30 L40 64 L50 72 L60 64 Z" fill="url(#panelGradient)" />

            {/* Cockpit / Windshield Glass */}
            <path d="M50 28 C45 28 42 38 42 45 C42 55 50 58 50 58 C50 58 58 55 58 45 C58 38 55 28 50 28 Z" fill="url(#cockpitGradient)" stroke="#06b6d4" strokeWidth="2" />
            {/* Glass glint / reflection highlight */}
            <ellipse cx="48" cy="40" rx="3" ry="6" fill="#ffffff" transform="rotate(-15, 48, 40)" opacity="0.8" />

            {/* High-tech antenna / tip tip glow */}
            <circle cx="50" cy="14" r="2.5" fill="#22d3ee" className="animate-ping" />
            <circle cx="50" cy="14" r="1.5" fill="#ffffff" />

            {/* Navigation Lights */}
            <circle cx="16" cy="66" r="2" fill="#ef4444" className="animate-pulse" />
            <circle cx="84" cy="66" r="2" fill="#10b981" className="animate-pulse" />

            <defs>
              <linearGradient id="hullGradient" x1="50" y1="14" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f8fafc" />
                <stop offset="0.4" stopColor="#e2e8f0" />
                <stop offset="0.8" stopColor="#94a3b8" />
                <stop offset="1" stopColor="#475569" />
              </linearGradient>
              <linearGradient id="engineFlame" x1="50" y1="82" x2="50" y2="96" gradientUnits="userSpaceOnUse">
                <stop stopColor="#facc15" />
                <stop offset="0.5" stopColor="#f97316" />
                <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="cockpitGradient" x1="50" y1="28" x2="50" y2="58" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22d3ee" />
                <stop offset="0.7" stopColor="#0891b2" />
                <stop offset="1" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="panelGradient" x1="50" y1="30" x2="50" y2="72" gradientUnits="userSpaceOnUse">
                <stop stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="1" stopColor="#c084fc" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Dynamic Thruster Sparkles */}
        <div className="absolute bottom-[-10px] flex gap-1 justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <div className="w-1 h-1 rounded-full bg-orange-400 animate-pulse delay-75" />
        </div>
      </div>

      <span className="text-[10px] font-mono tracking-widest text-indigo-300 group-hover:text-cyan-300 transition-colors uppercase font-bold mt-2">
      </span>
    </div>
  );
};

const EmbeddedPortal = ({ 
  url, 
  onClose, 
  user, 
  onLogPoints 
}: { 
  url: string; 
  onClose: () => void; 
  user: any; 
  onLogPoints: (category: string, rawVal: number, points: number, description: string, proofImg?: string) => Promise<void>; 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Active study state tracking
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);
  const [isTrackerExpanded, setIsTrackerExpanded] = useState(false);

  // Viewport Responsive Device Simulation States
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'desktop' | 'tablet' | 'mobile'>('responsive');
  const [manualScale, setManualScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(1024);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  const currentGemMetadata = useMemo(() => {
    // Check in GEMS
    for (const [strandKey, strandGems] of Object.entries(GEMS)) {
      const found = strandGems.find(g => g.url === url);
      if (found) {
        let displayCategory = strandKey.toUpperCase();
        if (strandKey === 'vocabulary') displayCategory = 'Vocabulary • 核心單字';
        if (strandKey === 'pronunciation') displayCategory = 'Pronunciation • 語音發音';
        if (strandKey === 'grammar') displayCategory = 'Grammar • 文句與文法';
        if (strandKey === 'tests') displayCategory = 'Tests • 隨堂測驗';
        if (strandKey === 'earth') displayCategory = 'Vocab Competency • 單字王';
        if (strandKey === 'saturn') displayCategory = 'Bi-lingual Subjects • 雙語學科';
        if (strandKey === 'uranus') displayCategory = 'Uranus Tools • 天王星工具';
        if (strandKey === 'neptune') displayCategory = 'Neptune Training • 海王星培訓';
        return {
          name: found.name,
          nameZh: found.nameZh,
          category: displayCategory,
          type: found.type
        };
      }
    }
    // Check in SUBJECT_GEMS
    const foundSubject = SUBJECT_GEMS.find(g => g.url === url);
    if (foundSubject) {
      return {
        name: foundSubject.name,
        nameZh: foundSubject.nameZh,
        category: 'Subject Courses • 雙語學科',
        type: foundSubject.type
      };
    }
    // Universal Challenge
    if (url === 'https://ducj-creator.github.io/etgame.html') {
      return {
        name: 'Universe Challenge',
        nameZh: '星際愛單字(中)',
        category: 'Vocabulary Game • 星際單字競賽',
        type: 'opal'
      };
    }
    return {
      name: 'Interactive Cosmic Gem',
      nameZh: '星際學習寶石',
      category: 'Cosmic Study • 星際學習',
      type: 'diamond'
    };
  }, [url]);

  // Window visibility & focus checking to prevent idle/background tab cheating
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // Check document visibility api to trigger pause when user minimizes the browser
    const handleVisibility = () => {
      setIsWindowFocused(document.visibilityState === 'visible' && document.hasFocus());
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Timer run loop
  useEffect(() => {
    const timer = setInterval(() => {
      // Direct focus check adds an extra layer of visibility insurance
      if (document.hasFocus() && document.visibilityState === 'visible') {
        setIsWindowFocused(true);
        setActiveSeconds(prev => prev + 1);
      } else {
        setIsWindowFocused(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentMinute = Math.floor(activeSeconds / 60);
  const lastLoggedMinuteRef = useRef(0);

  // Automatically award +10 points for every 1 minute of active play and study
  useEffect(() => {
    if (user && currentMinute > lastLoggedMinuteRef.current) {
      lastLoggedMinuteRef.current = currentMinute;
      onLogPoints(
        'quiz', 
        1, 
        10, 
        `Completed 1 Minute of Active study on ${currentGemMetadata.nameZh || currentGemMetadata.name}`
      ).then(() => {
        setClaimSuccessMsg(`Earned +10 pts! Keep studying! ☄️`);
        setTimeout(() => setClaimSuccessMsg(null), 3500);
      }).catch(err => {
        console.error("Failed to automatically reward study points:", err);
      });
    }
  }, [currentMinute, currentGemMetadata, user, onLogPoints]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(Math.max(280, entry.contentRect.width || 1024));
        setContainerHeight(Math.max(200, entry.contentRect.height || 600));
      }
    });
    observer.observe(containerRef.current);
    
    setContainerWidth(Math.max(280, containerRef.current.clientWidth || 1024));
    setContainerHeight(Math.max(200, containerRef.current.clientHeight || 600));

    return () => observer.disconnect();
  }, []);

  // Determine target simulation widths
  const targetWidth = useMemo(() => {
    if (deviceMode === 'desktop') return 1280;
    if (deviceMode === 'tablet') return 768;
    if (deviceMode === 'mobile') return 375;
    return containerWidth;
  }, [deviceMode, containerWidth]);

  // Determine target simulation heights
  const targetHeight = useMemo(() => {
    if (deviceMode === 'desktop') return 800;
    if (deviceMode === 'tablet') return 1024;
    if (deviceMode === 'mobile') return 667;
    return containerHeight;
  }, [deviceMode, containerHeight]);

  // Base scale is calculated so that simulated designs fit within the actual physics boundaries with padding
  const baseScale = useMemo(() => {
    if (deviceMode === 'responsive') return 1.0;
    const padding = 24; // boundary clearance layout padding
    const scaleX = (containerWidth - padding) / targetWidth;
    const scaleY = (containerHeight - padding) / targetHeight;
    return Math.min(1.0, scaleX, scaleY);
  }, [deviceMode, targetWidth, targetHeight, containerWidth, containerHeight]);

  // Overall scale including user manual zoom
  const finalScale = useMemo(() => {
    return baseScale * manualScale;
  }, [baseScale, manualScale]);

  const handleZoomIn = () => setManualScale(prev => Math.min(2.0, Math.round((prev + 0.1) * 10) / 10));
  const handleZoomOut = () => setManualScale(prev => Math.max(0.2, Math.round((prev - 0.1) * 10) / 10));
  const handleReset = () => {
    setManualScale(1.0);
    setDeviceMode('responsive');
  };

  return (
    <motion.div 
      id="portal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex flex-col bg-black/98 backdrop-blur-2xl"
    >
      <div className="flex flex-col w-full h-full p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Advanced Interactive Control Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0 bg-zinc-900/50 p-3 rounded-2xl border border-white/5 shadow-inner">
          {/* Back Action */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-white hover:bg-white/10 transition-all group px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-zinc-300" />
              <div className="flex flex-col items-start leading-none text-left">
                <span className="font-bold text-[10px] tracking-wider uppercase text-white">Close</span>
                <span className="text-[8px] opacity-60 text-zinc-400">關閉</span>
              </div>
            </button>
          </div>

          {/* Device Selection Presets */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => { setDeviceMode('responsive'); setManualScale(1.0); }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none",
                deviceMode === 'responsive' ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md" : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              )}
              title="Responsive Mode / 自動適應"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-wider font-bold">Auto</span>
            </button>
            
            <button
              onClick={() => { setDeviceMode('desktop'); setManualScale(1.0); }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none",
                deviceMode === 'desktop' ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md" : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              )}
              title="Desktop Presentation Mode"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-wider font-bold">PC</span>
            </button>

            <button
              onClick={() => { setDeviceMode('tablet'); setManualScale(1.0); }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none",
                deviceMode === 'tablet' ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md" : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              )}
              title="Tablet Viewport Simulation"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-wider font-bold">Tablet</span>
            </button>

            <button
              onClick={() => { setDeviceMode('mobile'); setManualScale(1.0); }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all select-none",
                deviceMode === 'mobile' ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md" : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              )}
              title="Mobile Phone Simulation"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-wider font-bold">Phone</span>
            </button>
          </div>

          {/* Manual Zoom Multipliers & External Redirect Link */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/5">
              <button 
                onClick={handleZoomOut}
                disabled={finalScale <= 0.25}
                className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded transition-colors disabled:opacity-35" 
                title="Decrease Scale"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-zinc-300 px-1 w-10 text-center select-none">
                {Math.round(finalScale * 100)}%
              </span>
              <button 
                onClick={handleZoomIn}
                disabled={finalScale >= 2.0}
                className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded transition-colors disabled:opacity-35" 
                title="Increase Scale"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleReset}
                className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded transition-colors border-l border-white/5 pl-1.5 ml-0.5" 
                title="Reset Simulation View"
              >
                <RotateCcw className="w-3 h-3 text-zinc-400 hover:text-zinc-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Scalable Sandbox Workspace Viewport Container with Scoring panel side-by-side */}
        <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-950/45 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] flex flex-col md:flex-row min-h-0">
          <div 
            ref={containerRef} 
            className="flex-1 relative flex items-center justify-center p-3 sm:p-4 overflow-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent min-h-0"
          >
            {/* The adjustable Simulated Device Chassis */}
            <motion.div 
              layout
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              style={{
                width: deviceMode === 'responsive' ? '100%' : `${targetWidth}px`,
                height: deviceMode === 'responsive' ? '100%' : `${targetHeight}px`,
                transform: `scale(${finalScale})`,
                transformOrigin: 'center center',
                flexShrink: 0,
              }}
              className={cn(
                "bg-zinc-900 overflow-hidden relative shadow-2xl transition-all duration-300",
                deviceMode !== 'responsive' 
                  ? "rounded-[2rem] border-[10px] border-zinc-800 ring-4 ring-black/70 shadow-[0_20px_60px_rgba(0,0,0,0.8)]" 
                  : "w-full h-full rounded-2xl"
              )}
            >
              {deviceMode !== 'responsive' && (
                <div className="absolute top-0 inset-x-0 h-4 bg-zinc-800 flex items-center justify-center pointer-events-none z-30 shrink-0">
                  <div className="w-16 h-2 rounded-full bg-zinc-950 opacity-40" />
                </div>
              )}
              
              <div className="w-full h-full pt-0">
                <iframe 
                  src={url} 
                  className="w-full h-full border-none bg-zinc-900"
                  title="Embedded Subject Content"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; geolocation"
                  allowFullScreen
                  scrolling="yes"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                />
              </div>
            </motion.div>
          </div>

          {/* Active Study Timer Sidebar */}
          <div className={cn(
            "w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-white/10 bg-zinc-950/60 backdrop-blur-xl flex flex-col justify-between transition-all duration-300",
            isTrackerExpanded 
              ? "p-5 overflow-y-auto max-h-[400px] md:max-h-none h-[400px] md:h-auto scrollbar-thin" 
              : "p-3 md:p-5 h-16 md:h-auto overflow-hidden md:overflow-y-auto md:max-h-none scrollbar-thin shrink-0"
          )}>
            {/* Desktop View OR Expanded Mobile View */}
            <div className={cn("space-y-4 flex-1 flex flex-col justify-between min-h-0", !isTrackerExpanded && "hidden md:flex")}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>Active Study Tracker • 學習監測計</span>
                  </div>
                  {/* Collapse Button for Mobile */}
                  <button 
                    onClick={() => setIsTrackerExpanded(false)}
                    className="md:hidden p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/80 animate-ping shrink-0" />
                    <span className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold font-mono">
                      {currentGemMetadata.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-0.5">{currentGemMetadata.nameZh}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono mb-2">{currentGemMetadata.name}</p>
                  
                  <div className="text-[11px] text-amber-300 bg-amber-950/25 border border-amber-900/30 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 mt-2 leading-relaxed">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400 animate-bounce" />
                    <span>Earn +10 pts for every 1 minute of active play & study! • 每學習與操作滿 1 分鐘，自動獲得 10 積分。</span>
                  </div>
                </div>

                {!user ? (
                  <div className="p-4 bg-amber-950/25 border border-amber-900/40 rounded-2xl text-center">
                    <p className="text-xs text-amber-200">
                      You are in guest mode. Please sign in via Google from the Moon Base to track study time and claim cosmic points permanently to your space account!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Timer Display */}
                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mb-1.5 font-sans">Accumulated Session Time</span>
                      <p className="text-3xl font-mono font-bold text-white tracking-widest">
                        {String(Math.floor(activeSeconds / 60)).padStart(2, '0')}
                        <span className="text-cyan-500 animate-pulse">:</span>
                        {String(activeSeconds % 60).padStart(2, '0')}
                      </p>
                      <div className="flex items-center gap-2 mt-3.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        {isWindowFocused ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider font-sans">Active Practice</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider font-sans">Time Paused</span>
                          </>
                        )}
                      </div>
                      {!isWindowFocused && (
                        <p className="text-[9.5px] text-orange-300 bg-orange-950/15 border border-orange-900/10 px-2 py-1.5 rounded-lg mt-2.5 text-center leading-relaxed font-sans">
                          ⚠️ Keep this tab/window focused & active to resume!
                          <br />請點擊本網頁並保持觀看，即可繼續累積積分。
                        </p>
                      )}
                    </div>

                    {/* Accrued Points visual */}
                    <div className="p-3 bg-zinc-900/30 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-zinc-300">Session Earnings:</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 font-mono">+{currentMinute * 10} pts</span>
                    </div>

                    {/* Anti cheat message indicator */}
                    <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-xl text-center flex items-center gap-2 justify-center">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <p className="text-[9.5px] text-emerald-400 font-medium leading-tight">
                        Manual logging has been disabled. Only active study generates points!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2 shrink-0">
                {claimSuccessMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-center font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-950/40 p-2 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                    <span>{claimSuccessMsg}</span>
                  </motion.div>
                )}
                
                <button 
                  onClick={onClose}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 active:scale-[0.98] rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer text-center"
                >
                  Save & Return to Base
                </button>
              </div>
            </div>

            {/* Collapsed Mobile Bottom Bar */}
            <div className={cn("md:hidden flex items-center justify-between w-full h-full", isTrackerExpanded && "hidden")}>
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xs font-mono font-bold text-white tracking-wider">
                      {String(Math.floor(activeSeconds / 60)).padStart(2, '0')}:{String(activeSeconds % 60).padStart(2, '0')}
                    </span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full inline-block",
                      isWindowFocused ? "bg-emerald-500 animate-pulse" : "bg-orange-500"
                    )} />
                    <span className="text-[10px] text-emerald-400 font-bold tracking-wider font-mono">
                      +{currentMinute * 10} pts
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-medium truncate max-w-[130px] sm:max-w-xs leading-none mt-1">
                    Live: {currentGemMetadata.nameZh}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsTrackerExpanded(true)}
                  className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/30 rounded-lg text-[9px] font-bold tracking-widest uppercase flex items-center gap-1 select-none transition-all active:scale-95"
                >
                  <span>Tracker</span>
                  <ChevronUp className="w-3.5 h-3.5 animate-bounce" style={{ animationDuration: '2s' }} />
                </button>
                <button 
                  onClick={onClose}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all border border-white/5 active:scale-95"
                >
                  Save & Exit
                </button>
              </div>
            </div>
          </div>
          
          {/* Subtle glowing decorations under constraints */}
          <div className="hidden sm:block absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/10 rounded-tl-[2.5rem] pointer-events-none" />
          <div className="hidden sm:block absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/10 rounded-tr-[2.5rem] pointer-events-none" />
          <div className="hidden sm:block absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/10 rounded-bl-[2.5rem] pointer-events-none" />
          <div className="hidden sm:block absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/10 rounded-br-[2.5rem] pointer-events-none" />
        </div>
        
        {/* Footer info bar */}
        <div className="mt-3 text-center shrink-0">
          <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.4em] text-white/20 font-medium">Teacher Shirley • Universal Education Cluster</p>
        </div>
      </div>
    </motion.div>
  );
};

const PetAvatar = ({ type, emoji, isPlaying, isRolling }: { type: string, emoji?: string, isPlaying?: boolean, isRolling?: boolean }) => {
  const color = type.includes('Cat') ? '#ff9ff3' : 
                type.includes('Dog') ? '#feca57' : 
                type.includes('Fox') ? '#ff9f43' : 
                type.includes('Bear') ? '#54a0ff' : 
                type.includes('Bunny') ? '#ee5253' : 
                type.includes('Owl') ? '#0abde3' : 
                type.includes('Dragon') ? '#1dd1a1' : '#c8d6e5';

  return (
    <motion.div
      animate={isPlaying ? {
        y: [0, -10, 0],
        scale: [1, 1.05, 1],
      } : isRolling ? {
        rotate: 360,
        scale: [1, 1.2, 1],
      } : {
        y: [0, -4, 0],
      }}
      transition={{
        duration: isPlaying ? 2 : 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="relative w-full h-full flex items-center justify-center font-sans select-none"
    >
      {emoji ? (
        <div className="text-[3.2rem] flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
          {emoji}
        </div>
      ) : (
        /* Cartoon Body fallback */
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg transform-gpu">
          <motion.circle 
            cx="50" cy="50" r="40" 
            fill={color} 
            animate={isPlaying ? { r: [40, 41, 40] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Eyes */}
          <motion.g
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 10, repeat: Infinity, times: [0, 0.8, 0.85, 0.9, 1] }}
          >
            <circle cx="35" cy="45" r="5" fill="white" />
            <circle cx="65" cy="45" r="5" fill="white" />
            <circle cx="35" cy="45" r="2" fill="black" />
            <circle cx="65" cy="45" r="2" fill="black" />
          </motion.g>

          {/* Mouth */}
          <motion.path
            d={isPlaying ? "M 40 65 Q 50 75 60 65" : "M 40 65 Q 50 70 60 65"}
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={isPlaying ? { d: ["M 40 65 Q 50 75 60 65", "M 40 62 Q 50 78 60 62", "M 40 65 Q 50 75 60 65"] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Ears/Features based on type */}
          {type.includes('Cat') && (
            <g fill={color}>
              <path d="M 20 25 L 40 20 L 25 5 Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 80 25 L 60 20 L 75 5 Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              <g stroke="white" strokeWidth="1.5" opacity="0.6">
                <path d="M 30 55 L 10 50" />
                <path d="M 30 60 L 10 60" />
                <path d="M 70 55 L 90 50" />
                <path d="M 70 60 L 90 60" />
              </g>
              <path d="M 47 53 L 53 53 L 50 57 Z" fill="#ff4d4d" />
            </g>
          )}
          {type.includes('Dog') && (
            <g fill={color}>
              <path d="M 15 25 Q 10 10 25 20" stroke={color} fill="none" strokeWidth="8" strokeLinecap="round" />
              <path d="M 85 25 Q 90 10 75 20" stroke={color} fill="none" strokeWidth="8" strokeLinecap="round" />
              <circle cx="50" cy="55" r="5" fill="#1a1a1a" />
              <path d="M 45 60 Q 50 65 55 60" stroke="#1a1a1a" fill="none" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
          {type.includes('Fox') && (
            <g fill={color}>
              <path d="M 10 25 L 35 15 L 15 5 Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 90 25 L 65 15 L 85 5 Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              <path d="M 35 50 L 50 65 L 65 50 Z" fill="white" opacity="0.3" />
              <circle cx="50" cy="55" r="4" fill="#3d3d3d" />
            </g>
          )}
          {type.includes('Bear') && (
            <g fill={color}>
              <circle cx="20" cy="20" r="10" />
              <circle cx="80" cy="20" r="10" />
              <ellipse cx="50" cy="60" rx="15" ry="10" fill="white" opacity="0.2" />
              <circle cx="50" cy="55" r="5" fill="#1a1a1a" />
            </g>
          )}
          {type.includes('Bunny') && (
            <g fill={color}>
              <motion.ellipse 
                cx="35" cy="15" rx="8" ry="25" 
                animate={{ rotate: [-5, 5, -5] }} 
                transition={{ duration: 2, repeat: Infinity }} 
              />
              <motion.ellipse 
                cx="65" cy="15" rx="8" ry="25"
                animate={{ rotate: [5, -5, 5] }} 
                transition={{ duration: 2, repeat: Infinity }} 
              />
              <circle cx="50" cy="55" r="3" fill="#ff9ff3" />
            </g>
          )}
          {type.includes('Owl') && (
            <g fill={color}>
              <path d="M 15 20 L 40 30 L 30 15 Z" />
              <path d="M 85 20 L 60 30 L 70 15 Z" />
              <circle cx="35" cy="45" r="8" fill="white" opacity="0.2" />
              <circle cx="65" cy="45" r="8" fill="white" opacity="0.2" />
              <path d="M 48 55 L 52 55 L 50 62 Z" fill="#f1c40f" />
            </g>
          )}
          {type.includes('Dragon') && (
            <g fill={color}>
              <path d="M 20 15 L 45 35 L 30 5 Z" />
              <path d="M 80 15 L 55 35 L 70 5 Z" />
              <path d="M 50 10 L 45 0 L 55 0 Z" opacity="0.5" />
              <path d="M 30 65 Q 50 85 70 65" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="45" cy="55" r="2" fill="#ff4d4d" />
              <circle cx="55" cy="55" r="2" fill="#ff4d4d" />
            </g>
          )}
          {type.includes('Hamster') && (
            <g fill={color}>
              <circle cx="25" cy="20" r="8" />
              <circle cx="75" cy="20" r="8" />
              <ellipse cx="50" cy="65" rx="12" ry="8" fill="#ffcccc" opacity="0.5" />
              <circle cx="50" cy="58" r="3" fill="#3d3d3d" />
            </g>
          )}
        </svg>
      )}
      
      {/* Sparkles when playing */}
      {isPlaying && (
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="absolute top-0 left-0"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </motion.div>
          <motion.div
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-0 right-0"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

const FloatingPet = ({ pet, onReturn, index = 0 }: { key?: string | number, pet: PetData, onReturn: () => void | Promise<void>, index?: number }) => {
  const [pos, setPos] = useState({ 
    x: Math.max(50, window.innerWidth - 120 - (index * 90)), 
    y: Math.max(50, window.innerHeight - 120 - (index * 50)) 
  });
  const [thought, setThought] = useState<string | null>(null);
  const isDragging = useRef(false);

  const currentLevelPetTypes = PET_TYPES.find(p => 
    p.type === pet.type || 
    p.name === pet.type || 
    (pet.type && p.name && pet.type.toLowerCase().includes(p.name.toLowerCase()))
  );
  const resolvedEmoji = pet.emoji || currentLevelPetTypes?.emoji;

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDragging.current) return;
      
      // Random wandering logic
      setPos(prev => {
        const dx = (Math.random() - 0.5) * 300;
        const dy = (Math.random() - 0.5) * 300;
        
        let newX = prev.x + dx;
        let newY = prev.y + dy;
        
        // Keep within bounds
        newX = Math.max(50, Math.min(window.innerWidth - 100, newX));
        newY = Math.max(50, Math.min(window.innerHeight - 100, newY));
        
        return { x: newX, y: newY };
      });

      // Random thoughts
      if (Math.random() > 0.6) {
        const thoughts = ['✨', '🌟', '🛸', '🪐', '❤️', '🐾', '🌈', '🚀', '💎', '🌙'];
        setThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
        setTimeout(() => setThought(null), 3000);
      }
    }, 12000); // Slower wandering

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => isDragging.current = true}
      onDragEnd={(_, info) => {
        isDragging.current = false;
        // Clamp position on drop
        const newX = Math.max(20, Math.min(window.innerWidth - 100, info.point.x));
        const newY = Math.max(20, Math.min(window.innerHeight - 100, info.point.y));
        setPos({ x: newX, y: newY });
      }}
      onDoubleClick={onReturn}
      animate={{ 
        x: pos.x, 
        y: pos.y,
        rotate: thought ? [0, 10, -10, 0] : 0
      }}
      transition={{ 
        x: { type: 'spring', stiffness: 40, damping: 15 },
        y: { type: 'spring', stiffness: 40, damping: 15 },
        rotate: { duration: 0.5 }
      }}
      className="fixed z-[200] w-20 h-20 cursor-grab active:cursor-grabbing group"
      style={{ touchAction: 'none', left: 0, top: 0 }}
    >
      <AnimatePresence>
        {thought && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -45 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <span className="text-lg">{thought}</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/10 rotate-45 border-r border-b border-white/20" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
        <p className="text-[9px] text-white font-bold uppercase tracking-widest">{pet.name} is wandering...</p>
        <p className="text-[7px] text-white/60 text-center">Double-tap to dock</p>
      </div>
      <PetAvatar type={pet.type} emoji={resolvedEmoji} isPlaying={true} />
    </motion.div>
  );
};

const PetSection = ({ 
  points, 
  pet, 
  petsList = [], 
  activePetId, 
  setActivePetId, 
  onFeed, 
  onPlay, 
  onAdopt, 
  onRelease, 
  isRolling,
  isAdopting,
  petError
}: { 
  points: number, 
  pet: PetData | null, 
  petsList?: PetData[], 
  activePetId?: string | null, 
  setActivePetId?: (id: string | null) => void, 
  onFeed: (foodName: string, foodEmoji: string, cost: number, growthPts: number) => void, 
  onPlay: () => void, 
  onAdopt: (selectedPet: typeof PET_TYPES[0]) => void, 
  onRelease: (targetPet?: PetData) => void, 
  isRolling: boolean,
  isAdopting?: boolean,
  petError?: string | null
}) => {
  const [isShelterActive, setIsShelterActive] = useState(false);
  const [selectedShelterPet, setSelectedShelterPet] = useState<typeof PET_TYPES[0] | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('common');
  const [showFoodShop, setShowFoodShop] = useState(false);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('common');

  // Set default shelter pet when tier changes
  useEffect(() => {
    const firstOfTier = PET_TYPES.find(p => p.tierId === selectedTier);
    if (firstOfTier) {
      setSelectedShelterPet(firstOfTier);
    }
  }, [selectedTier]);

  // If there are no pets, we force the shelter active view
  const showShelterLayout = petsList.length === 0 || isShelterActive;

  if (showShelterLayout) {
    return (
      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {petsList.length > 0 ? (
              <button 
                onClick={() => setIsShelterActive(false)} 
                className="text-white/40 hover:text-white flex items-center gap-1 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Squad ({petsList.length}/3)
              </button>
            ) : (
              <div className="text-white/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                🛸 No Companions Yet
              </div>
            )}
            <h3 className="text-xl font-display">Select Companion</h3>
          </div>

          {/* Tier Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
            {PET_TIERS.map(tier => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={cn(
                  "flex-1 min-w-[70px] px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize",
                  selectedTier === tier.id 
                    ? "bg-white text-black shadow-sm" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {tier.label}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {PET_TYPES.filter(p => p.tierId === selectedTier).map((p, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedShelterPet(p)}
                className={cn(
                  "p-3 rounded-2xl border transition-all flex flex-col items-center gap-2",
                  selectedShelterPet?.name === p.name 
                    ? "bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                  <PetAvatar type={p.type} emoji={p.emoji} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white leading-tight">{p.name}</p>
                  <p className="text-[8px] text-white/40">{p.type}</p>
                </div>
              </motion.button>
            ))}
          </div>
 
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Zap className="w-4 h-4" /> {selectedShelterPet ? `${selectedShelterPet.cost} Points Required` : "100 Points Required"}
              </div>
              <div className="text-white/40 text-xs">Available: {points} pts • Squad: {petsList.length}/3</div>
            </div>

            {petsList.length >= 3 ? (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center space-y-3">
                <p className="text-red-400 font-bold text-xs uppercase tracking-wider">🚫 Maximum 3 Companions Kept</p>
                <p className="text-white/60 text-xs">You already keep 3 space companions. To adopt this new one, select which companion to release below:</p>
                <div className="flex flex-col gap-2">
                  {petsList.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={async () => {
                        await onRelease(p);
                      }}
                      className="w-full py-2 px-4 bg-white/5 border border-white/10 hover:border-red-500/35 hover:bg-red-500/5 transition-all text-xs font-bold rounded-xl flex items-center justify-between group"
                    >
                      <span>{p.emoji} {p.name} (Lvl {p.level})</span>
                      <span className="text-red-400 uppercase text-[9px] tracking-widest font-black">Release & Free Space</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button 
                disabled={!selectedShelterPet || points < (selectedShelterPet.cost || 100) || isAdopting}
                onClick={async () => {
                  if (selectedShelterPet) {
                    await onAdopt(selectedShelterPet);
                    setIsShelterActive(false);
                  }
                }}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold disabled:opacity-30 disabled:grayscale transition-all hover:bg-blue-50 flex items-center justify-center gap-2"
              >
                {isAdopting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Adopting...
                  </>
                ) : (
                  selectedShelterPet ? `Adopt ${selectedShelterPet.name} (${selectedShelterPet.cost} pts)` : "Confirm Selection"
                )}
              </button>
            )}
            
            {petError && (
              <p className="mt-2 text-center text-[10px] text-red-400 font-bold uppercase tracking-wider">{petError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Under hub layout (petsList.length > 0 and not in shelter active view)
  const currentLevelPetTypes = pet ? PET_TYPES.find(p => 
    p.type === pet.type || 
    p.name === pet.type || 
    (pet.type && p.name && pet.type.toLowerCase().includes(p.name.toLowerCase()))
  ) : null;
  const resolvedEmoji = pet ? (pet.emoji || currentLevelPetTypes?.emoji) : "";

  if (!pet) return null;

  return (
    <div className="space-y-6">
      {/* Squad Bar */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider font-extrabold text-blue-400">Companions:</span>
          <div className="flex gap-2.5">
            {petsList.map(p => {
              const isActive = p.id === activePetId;
              return (
                <button
                  key={p.id}
                  onClick={() => p.id && setActivePetId && setActivePetId(p.id)}
                  className={cn(
                    "relative py-1.5 px-3 rounded-full flex items-center gap-2 transition-all border",
                    isActive 
                      ? "bg-white text-black border-white font-bold scale-105 shadow-[0_0_15px_rgba(255,255,255,0.25)]" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70"
                  )}
                >
                  <span className="text-sm">{p.emoji}</span>
                  <span className="text-[10px]">{p.name} <span className="opacity-60">Lvl {p.level}</span></span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => setIsShelterActive(true)}
          className="py-1.5 px-4 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 hover:border-blue-500 text-blue-400 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1"
        >
          ➕ Visit Shelter
        </button>
      </div>

      <div className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md group/shelter">
        <button 
          onClick={() => onRelease(pet)}
          className="absolute top-4 right-4 text-[10px] uppercase font-black tracking-[0.2em] text-white/40 hover:text-red-400 transition-all flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 hover:border-red-400/30 group/release"
        >
          <TrendingUp className="w-3 h-3 rotate-45 group-hover/release:rotate-0 transition-transform" /> 
          Release to Wild
        </button>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full border-2 border-white/20 moon-glow relative shrink-0">
            <PetAvatar type={pet.type} emoji={resolvedEmoji} isRolling={isRolling} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-display truncate">{pet.name}</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">Lvl {pet.level} {pet.type}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Standard</p>
                <p className="text-[10px] text-blue-400 font-bold">Goal: {pet.maxXp} XP</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              {/* XP Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-blue-400">
                  <span>XP Progress</span>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-2 h-2" />
                    <span>{pet.xp} / {pet.maxXp}</span>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(pet.xp / pet.maxXp) * 100}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </div>
   
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/30 font-bold">
                    <span>Hunger</span>
                    <span>{Math.round(pet.hunger)}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pet.hunger}%` }}
                      className={cn("h-full transition-colors", pet.hunger < 20 ? "bg-red-500" : "bg-orange-500")}
                    />
                  </div>
                </div>
   
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/30 font-bold">
                    <span>Happiness</span>
                    <span>{Math.round(pet.happiness)}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pet.happiness}%` }}
                      className="h-full bg-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex gap-4">
            <button 
              onClick={() => setShowFoodShop(!showFoodShop)}
              className={cn(
                "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group border border-white/5",
                showFoodShop ? "bg-amber-500/20 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/10 hover:bg-white/20"
              )}
            >
              <Coffee className="w-4 h-4 group-hover:scale-110 transition-transform text-orange-400" /> 
              <div className="flex flex-col items-start leading-none">
                <span className="text-xs font-bold uppercase tracking-wider">Feed Menu</span>
                <span className="text-[7px] text-white/40">Select food items</span>
              </div>
            </button>
            <button 
              onClick={onPlay}
              className={cn(
                "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group border border-white/5",
                pet.isPlaying ? "bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)]" : "bg-white/10 hover:bg-white/20"
              )}
            >
              <Heart className={cn("w-4 h-4 group-hover:scale-110 transition-transform", pet.isPlaying ? "text-white" : "text-pink-500")} /> 
              <div className="flex flex-col items-start leading-none">
                <span className="text-xs font-bold uppercase tracking-wider">{pet.isPlaying ? "Playing..." : "Play"}</span>
                <span className={cn("text-[7px]", pet.isPlaying ? "text-white/70" : "text-white/40")}>+10 XP</span>
              </div>
            </button>
          </div>

          {/* Expandable Food Shop */}
          <AnimatePresence>
            {showFoodShop && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border border-white/10 rounded-2xl bg-black/40 backdrop-blur-md p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-display tracking-wide text-amber-300 flex items-center gap-1.5">
                    🍲 Celestial Food Pantry
                  </h4>
                  <div className="text-[10px] text-white/40">Available: {points} pts</div>
                </div>

                {/* Food Category Selection Tabs */}
                <div className="flex flex-wrap gap-1 p-0.5 bg-white/5 rounded-lg border border-white/5">
                  {FOOD_TIERS.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedFoodCategory(tier.id)}
                      className={cn(
                        "flex-1 min-w-[60px] py-1 text-[9px] font-bold rounded-md transition-all text-center",
                        selectedFoodCategory === tier.id
                          ? "bg-amber-500 text-black shadow-sm"
                          : "text-white/55 hover:text-white"
                      )}
                    >
                      {tier.label.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Items display for the chosen category */}
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                  {FOOD_TIERS.find(t => t.id === selectedFoodCategory)?.items.map((item, idx) => {
                    const tier = FOOD_TIERS.find(t => t.id === selectedFoodCategory)!;
                    const itemCost = tier.cost;
                    const itemGrowth = tier.growthPts;
                    const isAffordable = points >= itemCost;

                    return (
                      <button
                        key={idx}
                        disabled={!isAffordable}
                        onClick={() => onFeed(item.name, item.emoji, itemCost, itemGrowth)}
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all outline-none",
                          isAffordable 
                            ? "bg-white/5 border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 active:scale-[0.98]" 
                            : "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl select-none filter drop-shadow-md">{item.emoji}</span>
                          <div className="text-left leading-tight">
                            <p className="text-[10px] font-bold text-white">{item.name}</p>
                            <p className="text-[8px] text-green-400">+{itemGrowth} XP</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-amber-400 font-mono">{itemCost}p</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="text-[8px] text-white/20 text-center uppercase tracking-[0.3em] font-bold">
            Level up requires {pet.maxXp} XP • Visit the 
            <button onClick={() => setIsShelterActive(true)} className="mx-1 text-blue-400/50 hover:text-blue-400 transition-colors">Shelter</button> 
            to hand-pick a new companion
          </p>
        </div>
        <p className="text-[10px] text-white/20 text-center mt-4 font-mono">
          {pet.isPlaying ? "Your pet is accompanying you! Double-tap it to return." : "Tip: Click Play to have your pet accompany you!"}
        </p>
      </div>
    </div>
  );
};

const BilingualSubjectsView = ({ 
  onBack, 
  onVisit,
  onGemClick,
  currentStrand
}: { 
  onBack: () => void, 
  onVisit: (name: string) => void,
  onGemClick: (url: string) => void,
  currentStrand: string
}) => {
  const localSubjectGems = useMemo(() => SUBJECT_GEMS, []);

  return (
    <div className="relative w-full max-w-6xl mx-auto py-8 px-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-start mb-12 relative z-[100]">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col items-start leading-none text-left">
            <span className="font-medium text-sm">Back to Moon Base</span>
            <span className="text-[10px] opacity-60">回到首頁</span>
          </div>
        </motion.button>
      </div>
      
      <div className="relative w-full aspect-square max-w-[660px] flex items-center justify-center overflow-visible mb-12 scale-[0.55] sm:scale-[0.85] lg:scale-100 origin-center">
        {/* Decorative Background Elements - Optimized for Performance */}
        <div className="absolute inset-0 pointer-events-none overflow-visible will-change-transform">
          <div className="absolute inset-0 border-[0.5px] border-white/[0.03] rounded-full animate-[spin_120s_linear_infinite] transform-gpu" />
          <div className="absolute inset-12 border-[0.5px] border-white/[0.03] rounded-full animate-[spin_80s_linear_infinite_reverse] transform-gpu" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
        </div>

        {/* Centerpiece: The Knowledge Core */}
        <div className="relative z-10 w-[200px] h-[200px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-5 bg-black/60 backdrop-blur-xl rounded-full border border-white/20 w-full h-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.05)] relative overflow-hidden group transform-gpu"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
              <motion.div 
                animate={{ 
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute inset-[15%] border border-white/5 rounded-full" 
              />
              <h3 className="font-artistic text-xl text-white mb-2 leading-tight relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] text-center">Knowledge is Power.</h3>
              <div className="w-10 h-[0.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent mb-2 relative z-10" />
            <p className="font-display text-[9px] tracking-[0.4em] text-white/50 uppercase relative z-10 font-bold">Francis Bacon</p>
          </motion.div>
        </div>

        {/* Corrected Multi-Gem Orbital Propagation */}
        {localSubjectGems.map((subject, i) => {
          const angle = (i * 360) / 8;
          const radius = 245; // Stabilized radius
          // Explicit radian calculation
          const radian = (angle - 90) * (Math.PI / 180);
          
          return (
            <motion.div
              key={`subject-gem-${i}-${subject.name}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { delay: i * 0.05 + 0.2, duration: 0.4 }
              }}
              className="absolute z-20 flex items-center justify-center p-0 m-0 w-max h-max"
              style={{
                left: `calc(50% + ${Math.cos(radian) * radius}px)`,
                top: `calc(50% + ${Math.sin(radian) * radius}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Gem 
                name={subject.name}
                nameZh={subject.nameZh}
                url={subject.url}
                type={subject.type}
                color={
                  subject.type === 'diamond' ? '#fff' :
                  subject.type === 'ruby' ? '#ff4d4d' :
                  subject.type === 'emerald' ? '#2ecc71' :
                  subject.type === 'sapphire' ? '#3498db' :
                  subject.type === 'amethyst' ? '#9b59b6' :
                  subject.type === 'topaz' ? '#f39c12' : '#fff'
                }
                onVisit={() => onVisit(subject.name)}
                onClick={() => onGemClick(subject.url)}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [petData, setPetData] = useState<PetData | null>(null);
  const [petsList, setPetsList] = useState<PetData[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [currentStrand, setCurrentStrand] = useState<Strand>('home');
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [activePortalUrl, setActivePortalUrl] = useState<string | null>(null);
  const [logTab, setLogTab] = useState<'points' | 'cards'>('points');
  const [isRolling, setIsRolling] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [sessionCheckedIn, setSessionCheckedIn] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTeacherOverride, setShowTeacherOverride] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [overrideBypassCode, setOverrideBypassCode] = useState("");
  const [overridePointsDelta, setOverridePointsDelta] = useState<number>(100);
  const [overrideReason, setOverrideReason] = useState("");
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [sessionStudyTime, setSessionStudyTime] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [allWordData, setAllWordData] = useState<any[]>([]);
  const [vocabSearchTerm, setVocabSearchTerm] = useState("");
  const [isFetchingVocab, setIsFetchingVocab] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [petError, setPetError] = useState<string | null>(null);
  const [showScrollMap, setShowScrollMap] = useState(false);
  const [notes, setNotes] = useState<StudyNote[]>(() => {
    try {
      const saved = localStorage.getItem('space_notes_cache');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  // Update localStorage when notes change
  useEffect(() => {
    localStorage.setItem('space_notes_cache', JSON.stringify(notes));
  }, [notes]);
  
  // Activity tracking
  const lastActivityRef = useRef(Date.now());
  const studyTimerRef = useRef<any>(null);
  const syncTimerRef = useRef<any>(null);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      
      // Cleanup previous listeners
      unsubs.forEach(unsub => unsub());
      unsubs = [];

      if (u) {
        handleCheckIn(u);
        
        // Start new listeners
        const u1 = onSnapshot(doc(db, 'users', u.uid), {
          next: (snapshot) => snapshot.exists() && setUserData(snapshot.data() as UserData),
          error: (err) => console.error(`Firestore [users/${u.uid}] listener error:`, err)
        });
        unsubs.push(u1);

        const u2 = onSnapshot(collection(db, 'users', u.uid, 'pets'), {
          next: (snapshot) => {
            const list = snapshot.docs.map(docSnap => {
              const data = docSnap.data() as any;
              let updated = false;
              let emoji = data.emoji;
              let type = data.type;
              let name = data.name;

              // Migrate hedgehog emoji from corrupted '𦔔' to real '🦔'
              if (emoji === '𦔔' || (data.type?.includes('Hedgehog') && emoji !== '🦔')) {
                emoji = '🦔';
                updated = true;
              }

              // Migrate Unique Phoenix to Unique Peacock
              if (data.type?.includes('Phoenix') && !data.type?.includes('Red Phoenix')) {
                type = data.type.replace('Phoenix', 'Peacock');
                if (name === 'Phoenix') name = 'Peacock';
                emoji = '🦚';
                updated = true;
              }

              if (updated) {
                updateDoc(doc(db, 'users', u.uid, 'pets', docSnap.id), {
                  emoji,
                  type,
                  name
                }).catch(err => console.error("Silently migrating pet document failed:", err));
              }

              return {
                id: docSnap.id,
                ...data,
                emoji,
                type,
                name
              } as PetData;
            });
            setPetsList(list);
          },
          error: (err) => console.error(`Firestore [users/${u.uid}/pets] listener error:`, err)
        });
        unsubs.push(u2);

        const u3 = onSnapshot(collection(db, 'users', u.uid, 'logs'), {
          next: (snapshot) => {
            const newLogs = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as PointLog))
              .filter(l => l.timestamp != null);
            setLogs(newLogs.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)));
          },
          error: (err) => console.error(`Firestore [users/${u.uid}/logs] listener error:`, err)
        });
        unsubs.push(u3);

        const u4 = onSnapshot(collection(db, 'users', u.uid, 'notes'), {
          next: (snapshot) => {
            const newNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyNote));
            setNotes(newNotes.sort((a, b) => {
              const timeA = new Date(a.date).getTime() || 0;
              const timeB = new Date(b.date).getTime() || 0;
              return timeB - timeA;
            }));
          },
          error: (err) => console.error(`Firestore [users/${u.uid}/notes] listener error:`, err)
        });
        unsubs.push(u4);

        startStudyTimer(u.uid);
      } else {
        stopStudyTimer();
      }
    });

    // ... Activity listeners ...
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    window.addEventListener('scroll', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      unsubscribeAuth();
      unsubs.forEach(unsub => unsub());
      stopStudyTimer();
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const fetchVocab = async () => {
      setIsFetchingVocab(true);
      try {
        const wordRes = await fetch("https://ducj-creator.github.io/Teacher-Shirley/assets/word%20of%20the%20day.csv");
        if (wordRes.ok) {
          const wordCsv = await wordRes.text();
          const parseCsv = (csv: string) => {
            const lines = csv.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) return [];
            
            const firstLine = lines[0];
            const commaCount = (firstLine.match(/,/g) || []).length;
            const semiCount = (firstLine.match(/;/g) || []).length;
            const tabCount = (firstLine.match(/\t/g) || []).length;
            const delimiter = semiCount > commaCount ? (semiCount > tabCount ? ';' : '\t') : (commaCount > tabCount ? ',' : '\t');

            const splitCsvLine = (line: string) => {
              const result = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') inQuotes = !inQuotes;
                else if (line[i] === delimiter && !inQuotes) {
                  result.push(current.trim());
                  current = '';
                } else current += line[i];
              }
              result.push(current.trim());
              return result;
            };

            const headers = splitCsvLine(lines[0].replace(/^\uFEFF/, '')).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
            return lines.slice(1).map(line => {
              const values = splitCsvLine(line);
              return headers.reduce((obj: any, header, i) => {
                let val = values[i] || '';
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                obj[header] = val;
                return obj;
              }, {});
            });
          };
          const words = parseCsv(wordCsv);
          setAllWordData(words);
        }
      } catch (e) {
        console.error("Failed to fetch vocab for search:", e);
      } finally {
        setIsFetchingVocab(false);
      }
    };
    fetchVocab();
  }, []);

  const addPointLog = async (uid: string, type: string, points: number, description: string, proofImg?: string) => {
    try {
      const logRef = collection(db, 'users', uid, 'logs');
      await setDoc(doc(logRef), {
        type,
        points,
        description,
        timestamp: serverTimestamp(),
        ...(proofImg ? { proofImg } : {})
      });
    } catch (e) {
      console.error("Failed to add point log. This usually means Firestore Security Rules need to be updated to allow access to the 'logs' subcollection.", e);
    }
  };

  const handleCheckIn = async (u: any, isManual: boolean = false) => {
    try {
      const userRef = doc(db, 'users', u.uid);
      const snap = await getDoc(userRef);
      
      const today = getLocalDateString();
      const data = snap.data() as UserData | undefined;
      
      let lastCheckInStr: string | null = null;
      if (data?.lastCheckIn) {
        if (typeof data.lastCheckIn.toDate === 'function') {
          lastCheckInStr = getLocalDateString(data.lastCheckIn.toDate());
        } else if (data.lastCheckIn instanceof Date) {
          lastCheckInStr = getLocalDateString(data.lastCheckIn);
        } else if (typeof data.lastCheckIn === 'string') {
          lastCheckInStr = data.lastCheckIn.slice(0, 10);
        }
      }
      
      let newStreak = data?.streak || 0;
      let isNewDay = lastCheckInStr !== today;

      if (isNewDay || isManual) {
        // Calculate streak
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = getLocalDateString(yesterdayDate);
        
        if (lastCheckInStr === yesterday) {
          newStreak += 1;
        } else if (isNewDay) {
          newStreak = 1;
        }

        // Daily Pet Drain (5 points per pet)
        const petsCol = collection(db, 'users', u.uid, 'pets');
        const { getDocs } = await import('firebase/firestore');
        const petsSnap = await getDocs(petsCol);
        let petDrain = 0;
        if (!petsSnap.empty) {
          petDrain = 5 * petsSnap.size;
          await addPointLog(u.uid, 'pet-drain', -petDrain, `Daily Pet Care Cost (${petsSnap.size} companions)`);
        }

        const updateData: any = {
          points: increment(10 - petDrain),
          lastCheckIn: serverTimestamp(),
          streak: newStreak
        };
        
        // Back-fill missing fields for older user docs
        if (!data?.uid) updateData.uid = u.uid;
        if (!data?.email) updateData.email = u.email;

        await updateDoc(userRef, updateData).catch(async () => {
          await setDoc(userRef, {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          points: 10 - petDrain,
            lastCheckIn: serverTimestamp(),
            studyTimeTotal: 0,
            streak: 1
          }, { merge: true });
        });
        await addPointLog(u.uid, 'check-in', 10, 'Daily Check-in Reward');
      }

      // Fetch Daily Inspiration from CSVs or Gemini
      const needsUpdate = !data?.dailyWordData?.sentEn || !data?.dailyWordData?.sentCn || !data?.dailyQuoteData?.quote || !data?.dailyQuoteData?.trans || isNewDay || isManual;
      
      if (needsUpdate) {
        try {
          // Try fetching CSVs first
          const wordRes = await fetch("https://ducj-creator.github.io/Teacher-Shirley/assets/word%20of%20the%20day.csv");
          const quoteRes = await fetch("https://ducj-creator.github.io/Teacher-Shirley/assets/quote%20of%20the%20day.csv");
          
          let wordData: any = null;
          let quoteData: any = null;

          if (wordRes.ok && quoteRes.ok) {
            const wordCsv = await wordRes.text();
            const quoteCsv = await quoteRes.text();
            
            const parseCsv = (csv: string) => {
              const lines = csv.split(/\r?\n/).filter(l => l.trim());
              if (lines.length < 2) return [];
              
              // Detect delimiter
              const firstLine = lines[0];
              const commaCount = (firstLine.match(/,/g) || []).length;
              const semiCount = (firstLine.match(/;/g) || []).length;
              const tabCount = (firstLine.match(/\t/g) || []).length;
              const delimiter = semiCount > commaCount ? (semiCount > tabCount ? ';' : '\t') : (commaCount > tabCount ? ',' : '\t');

              const splitCsvLine = (line: string) => {
                const result = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                  const char = line[i];
                  if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                      current += '"';
                      i++;
                    } else {
                      inQuotes = !inQuotes;
                    }
                  } else if (char === delimiter && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                  } else {
                    current += char;
                  }
                }
                result.push(current.trim());
                return result;
              };

              const headers = splitCsvLine(lines[0].replace(/^\uFEFF/, '')).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
              return lines.slice(1).map(line => {
                const values = splitCsvLine(line);
                return headers.reduce((obj: any, header, i) => {
                  let val = values[i] || '';
                  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                  obj[header] = val;
                  return obj;
                }, {});
              });
            };

            const words = parseCsv(wordCsv);
            const quotes = parseCsv(quoteCsv);
            
            // Store all words for search
            setAllWordData(words);

            const dateStr = getLocalDateString();
            const currentMMDD = dateStr.slice(5); // "MM-DD"

            const normalizeDate = (d: string) => {
              if (!d) return '';
              // Remove quotes if present
              const cleanD = d.replace(/^"|"$/g, '').trim();
              const parts = cleanD.replace(/\//g, '-').split('-');
              
              if (parts.length === 2) {
                // Handle MM-DD format from CSV
                return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
              }
              
              if (parts.length !== 3) return cleanD; // Return as-is if we can't normalize
              
              if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              if (parts[2].length === 4) {
                const p0 = parseInt(parts[0]);
                if (p0 > 12) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
              }
              return parts.map(p => p.padStart(2, '0')).join('-');
            };
            
            const rawWordData = words.find(w => {
              const rowDateRaw = w.date || "";
              const wDate = normalizeDate(rowDateRaw);
              // Fallback to MM-DD if year doesn't match
              return wDate === today || wDate === currentMMDD;
            }) || (words.length > 0 ? words[hashString(today) % words.length] : null);

            const rawQuoteData = quotes.find(q => {
              const rowDateRaw = q.date || "";
              const qDate = normalizeDate(rowDateRaw);
              return qDate === today || qDate === currentMMDD;
            }) || (quotes.length > 0 ? quotes[hashString(today) % (quotes.length || 1)] : null);

            if (rawWordData) {
              wordData = {
                Word: rawWordData.word || rawWordData.vocabulary || rawWordData.term || '',
                POS: rawWordData.pos || rawWordData.partofspeech || rawWordData.type || '',
                Definition: rawWordData.meaning || rawWordData.definition || rawWordData.def || rawWordData.meaningen || rawWordData.explanation || '',
                Sentence_EN: rawWordData.sentencee || rawWordData.sentenceen || rawWordData.sentence_en || rawWordData.example || rawWordData.exampleen || rawWordData.sentence || rawWordData.examplesentence || '',
                Sentence_CN: rawWordData.sentencec || rawWordData.sentencecn || rawWordData.sentence_cn || rawWordData.chinese || rawWordData.meaningcn || rawWordData.translation || rawWordData.examplecn || rawWordData.translationcn || rawWordData.chinesemeaning || ''
              };
            }

            if (rawQuoteData) {
              quoteData = {
                Quote: rawQuoteData.quotee || rawQuoteData.quote || rawQuoteData.text || rawQuoteData.content || rawQuoteData.sentence || '',
                Translation: rawQuoteData.quotec || rawQuoteData.translation || rawQuoteData.trans || rawQuoteData.chinese || rawQuoteData.meaning || rawQuoteData.translationcn || rawQuoteData.quotecn || '',
                Author: rawQuoteData.author || rawQuoteData.by || rawQuoteData.writer || 'Unknown'
              };
            }
          }

          // Ensure we have at least empty objects to avoid crashes
          wordData = wordData || { Word: '', POS: '', Definition: '', Sentence_EN: '', Sentence_CN: '' };
          quoteData = quoteData || { Quote: '', Translation: '', Author: '' };

          if (wordData.Word || quoteData.Quote) {
            // If CSV data is missing critical fields, try to fill them with Gemini
            const isMissingFields = !wordData.Definition || !wordData.Sentence_EN || !wordData.Sentence_CN || !quoteData.Quote || !quoteData.Translation;
            
            if (isMissingFields) {
              try {
                const fillResult = await ai.models.generateContent({
              model: "gemini-1.5-flash",
                  contents: [{ parts: [{ text: `You are an expert English teacher. Complete the following language learning data for a "Daily English" feature.
                  
                  Current Data (some fields may be empty or missing):
                  Word: ${wordData.Word || ''}
                  POS: ${wordData.POS || ''}
                  Definition: ${wordData.Definition || ''}
                  Example Sentence (EN): ${wordData.Sentence_EN || ''}
                  Example Sentence (CN): ${wordData.Sentence_CN || ''}
                  Inspirational Quote (EN): ${quoteData.Quote || ''}
                  Quote Translation (CN): ${quoteData.Translation || ''}
                  Quote Author: ${quoteData.Author || ''}
                  
                  Instructions:
                  1. If a field is provided and accurate, KEEP IT EXACTLY AS IS.
                  2. If a field is empty, "Unknown", or missing, GENERATE a high-quality, educational value for it.
                  3. Ensure the Chinese translation is in Traditional Chinese (Taiwan style).
                  4. The example sentence should be clear, natural, and use the word correctly.
                  5. The quote should be inspirational and relevant to learning or growth.
                  6. IMPORTANT: Do not return empty strings for any field.
                  
                  Return ONLY a JSON object:
                  {
                    "word": "string",
                    "pos": "string",
                    "def": "string",
                    "sentenceEn": "string",
                    "sentenceCn": "string",
                    "quote": "string",
                    "quoteTrans": "string",
                    "author": "string"
                  }` }]}],
                  config: { responseMimeType: "application/json" }
                });
                const filled = JSON.parse(fillResult.text || '{}');
                
                if (!wordData.Word) wordData.Word = filled.word || wordData.Word;
                if (!wordData.POS) wordData.POS = filled.pos || "n.";
                if (!wordData.Definition) wordData.Definition = filled.def || "No definition available.";
                if (!wordData.Sentence_EN) wordData.Sentence_EN = filled.sentenceEn || "No example sentence available.";
                if (!wordData.Sentence_CN) wordData.Sentence_CN = filled.sentenceCn || "無翻譯資料";
                if (!quoteData.Quote) quoteData.Quote = filled.quote || "Keep moving forward.";
                if (!quoteData.Translation) quoteData.Translation = filled.quoteTrans || "持續前進。";
                if (!quoteData.Author || quoteData.Author === 'Unknown') quoteData.Author = filled.author || "Anonymous";
              } catch (e) {
                console.error("Gemini data filling failed", e);
              }
            }

            await setDoc(userRef, {
              dailyWord: wordData.Word,
              dailyQuote: quoteData.Quote,
              dailyWordData: {
                word: wordData.Word,
                pos: wordData.POS || '',
                def: wordData.Definition || '',
                sentEn: wordData.Sentence_EN || '',
                sentCn: wordData.Sentence_CN || ''
              },
              dailyQuoteData: {
                quote: quoteData.Quote,
                trans: quoteData.Translation || '',
                author: quoteData.Author || 'Unknown'
              }
            }, { merge: true });
          } else {
            // Fallback to Gemini
            const result = await ai.models.generateContent({
              model: "gemini-1.5-flash",
              contents: [{ parts: [{ text: `Generate a unique 'Daily English Word' and an 'Inspirational Quote' for an English learning app. 
              Return as JSON: { 
                word: string, 
                pos: string, 
                definition: string, 
                sentenceEn: string, 
                sentenceCn: string,
                quote: string, 
                quoteTrans: string, 
                author: string 
              }` }]}],
              config: {
                responseMimeType: "application/json"
              }
            });
            const geminiData = JSON.parse(result.text || '{}');
            
            await setDoc(userRef, {
              dailyWord: geminiData.word || "Ethereal",
              dailyQuote: geminiData.quote || "The stars are not reachable, but they are visible.",
              dailyWordData: {
                word: geminiData.word || "Ethereal",
                pos: geminiData.pos || "adj.",
                def: geminiData.definition || "Extremely delicate and light in a way that seems too perfect for this world.",
                sentEn: geminiData.sentenceEn || "The ethereal beauty of the aurora borealis left us speechless.",
                sentCn: geminiData.sentenceCn || "極光那空靈的美麗讓我們說不出話來。"
              },
              dailyQuoteData: {
                quote: geminiData.quote || "The stars are not reachable, but they are visible.",
                trans: geminiData.quoteTrans || "星星雖然觸不可及，但清晰可見。",
                author: geminiData.author || "Unknown"
              }
            }, { merge: true });
          }
        } catch (e) {
          console.error("Inspiration fetch failed", e);
        }
      }
      
      if (isNewDay) {
        setShowCheckIn(true);
      }
      setSessionCheckedIn(true);
    } catch (e) {
      console.error("Check-in failed", e);
    }
  };

  const startStudyTimer = (uid: string) => {
    // UI Timer: Updates session time every second
    studyTimerRef.current = setInterval(() => {
      const now = Date.now();
      // Only count if active in last 5 mins AND tab is focused/visible
      if (isActive && (now - lastActivityRef.current < 5 * 60 * 1000)) {
        setSessionStudyTime(prev => prev + 1);
      }
    }, 1000);

    // Sync Timer: Updates Firebase every 10 minutes
    syncTimerRef.current = setInterval(async () => {
      const now = Date.now();
      if (isActive && (now - lastActivityRef.current < 10 * 60 * 1000)) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          points: increment(5),
          studyTimeTotal: increment(10)
        });
        await addPointLog(uid, 'study', 5, '10 Minutes of Active Study');
      }
    }, 10 * 60 * 1000);
  };

  const stopStudyTimer = () => {
    if (studyTimerRef.current) clearInterval(studyTimerRef.current);
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/unauthorized-domain') {
        setAuthError("Domain not authorized. Please add this URL to Firebase 'Authorized Domains'.");
      } else {
        setAuthError(error.message || "Login failed. Please try again.");
      }
    }
  };

  const handleStrandClick = (strand: Strand) => {
    const requiresLogin = !(strand === 'uranus' || strand === 'neptune');
    if (requiresLogin && !user) {
      setShowLoginModal(true);
      return;
    }
    setCurrentStrand(strand);
    if (strand === 'saturn') {
      setShowSubjects(true);
    } else {
      setShowSubjects(false);
    }
  };

  const handleUpdateAvatar = async (data: any) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, data);
    } catch (e) {
      console.error("Avatar update failed", e);
    }
  };

  const handleAdoptPet = async (selectedPet: typeof PET_TYPES[0]) => {
    const adoptionCost = selectedPet.cost || 100;
    if (!user || !userData || userData.points < adoptionCost) {
      setPetError(`Insufficient points or not logged in. Adoption requires ${adoptionCost} points.`);
      return;
    }
    if (petsList.length >= 3) {
      setPetError("Maximum 3 companions already kept. Release one to make space!");
      return;
    }
    setIsAdopting(true);
    setPetError(null);
    try {
      const { writeBatch, serverTimestamp } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      const userRef = doc(db, 'users', user.uid);
      const petCollection = collection(db, 'users', user.uid, 'pets');
      const petRef = doc(petCollection);
      const logRef = doc(collection(db, 'users', user.uid, 'logs'));
      
      batch.set(userRef, { points: increment(-adoptionCost) }, { merge: true });
      batch.set(logRef, {
        type: 'pet',
        points: -adoptionCost,
        description: `Adopted ${selectedPet.name} the ${selectedPet.type}`,
        timestamp: serverTimestamp()
      });
      batch.set(petRef, {
        id: petRef.id,
        ownerId: user.uid,
        name: selectedPet.name,
        type: selectedPet.type,
        image: selectedPet.image,
        emoji: selectedPet.emoji || "",
        tierId: selectedPet.tierId || "",
        hunger: 100,
        happiness: 100,
        level: 1,
        xp: 0,
        maxXp: 100,
        lastFed: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      await batch.commit();
      setActivePetId(petRef.id);
    } catch (e: any) {
      console.error("Adoption failed", e);
      let errorMsg = e.message || "Adoption failed.";
      if (e.code) errorMsg = `[${e.code}] ${errorMsg}`;
      if (e.stack && e.stack.includes('permission-denied')) errorMsg = "[permission-denied] Check Firestore rules or database ID.";
      
      setPetError(errorMsg);
    } finally {
      setIsAdopting(false);
    }
  };

  const handleReleasePet = async (targetPet?: PetData) => {
    const activePetToRelease = targetPet || petData;
    if (!user || !activePetToRelease || !activePetToRelease.id) return;
    
    const petLevel = activePetToRelease.level || 1;
    const refundPoints = petLevel * 100;

    const confirm = window.confirm(`Are you sure you want to release ${activePetToRelease.name} back into the wild universe? This will reset all progress for this companion. (You will receive ${refundPoints} points back!)`);
    if (!confirm) return;

    const petRef = doc(db, 'users', user.uid, 'pets', activePetToRelease.id);
    await deleteDoc(petRef);
    
    // Add refund points back to player
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { points: increment(refundPoints) });
    await addPointLog(user.uid, 'pet-release-refund', refundPoints, `Released ${activePetToRelease.name} (Lvl ${petLevel}) - Refunded ${refundPoints} pts`);

    const nextPet = petsList.find(p => p.id !== activePetToRelease.id);
    if (nextPet) {
      setActivePetId(nextPet.id || null);
      setPetData(nextPet);
    } else {
      setActivePetId(null);
      setPetData(null);
    }
  };

  const handleFeedPet = async (foodName: string = 'Pet Food', foodEmoji: string = '😋', cost: number = 20, growthPts: number = 20) => {
    if (!user || !userData || userData.points < cost || !petData) return;
    const petId = petData.id || 'main_pet';
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { points: increment(-cost) });
    await addPointLog(user.uid, 'pet', -cost, `Fed ${petData.name} ${foodEmoji} ${foodName}`);
    
    const petRef = doc(db, 'users', user.uid, 'pets', petId);
    const petSnap = await getDoc(petRef);
    if (petSnap.exists()) {
      const data = petSnap.data();
      let newLevel = data.level || 1;
      let newXp = (data.xp || 0) + growthPts;
      let newMaxXp = data.maxXp || 100;

      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = newLevel * 100;
      }

      await updateDoc(petRef, {
        hunger: Math.min(100, (data.hunger || 0) + 20),
        happiness: Math.min(100, (data.happiness || 0) + 10),
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        lastFed: serverTimestamp()
      });
    }
  };

  const handlePlayWithPet = async () => {
    if (!user || !petData) return;
    const petId = petData.id || 'main_pet';
    
    const petRef = doc(db, 'users', user.uid, 'pets', petId);
    const newIsPlaying = !petData.isPlaying;

    if (newIsPlaying) {
      setIsRolling(true);
      setTimeout(() => setIsRolling(false), 1000);
    }

    let newLevel = petData.level || 1;
    let newXp = (petData.xp || 0) + 10;
    let newMaxXp = petData.maxXp || 100;

    if (newXp >= newMaxXp) {
      newXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = newLevel * 100;
    }

    await updateDoc(petRef, {
      isPlaying: newIsPlaying,
      happiness: Math.min(100, (petData.happiness || 0) + 10),
      xp: newXp,
      level: newLevel,
      maxXp: newMaxXp
    });
  };

  const handleReturnPet = async () => {
    if (!user || !petData) return;
    const petRef = doc(db, 'users', user.uid, 'pets', petData.id || 'main_pet');
    await updateDoc(petRef, { isPlaying: false });
  };

  const handleReturnTargetPet = async (targetPet: PetData) => {
    if (!user || !targetPet || !targetPet.id) return;
    const petRef = doc(db, 'users', user.uid, 'pets', targetPet.id);
    await updateDoc(petRef, { isPlaying: false });
  };

  // Sync selected petData when petsList or activePetId changes
  useEffect(() => {
    if (petsList.length === 0) {
      setPetData(null);
      setActivePetId(null);
    } else {
      const found = petsList.find(p => p.id === activePetId);
      if (found) {
        setPetData(found);
      } else {
        setPetData(petsList[0]);
        setActivePetId(petsList[0].id || null);
      }
    }
  }, [petsList, activePetId]);

  // Hunger drain effect for all kept companions
  const latestPetsListRef = useRef(petsList);
  useEffect(() => {
    latestPetsListRef.current = petsList;
  }, [petsList]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      const currentList = latestPetsListRef.current;
      for (const p of currentList) {
        if (!p.id) continue;
        const petRef = doc(db, 'users', user.uid, 'pets', p.id);
        const drainAmount = p.isPlaying ? 2 : 0.5;
        const happinessDrain = p.isPlaying ? 0 : 0.2; // Playing keeps them happy

        await updateDoc(petRef, {
          hunger: Math.max(0, (p.hunger || 0) - drainAmount),
          happiness: Math.max(0, (p.happiness || 0) - happinessDrain)
        });
      }
    }, 300000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [user?.uid]);

  if (!isAuthReady) return <div className="h-screen flex items-center justify-center"><Star className="animate-spin" /></div>;

  const handleVisitGem = async (gemName: string) => {
    if (!user) return;
    // Just document the opening log without adding standard 5 points directly to deter quick click cheat patterns
    await addPointLog(user.uid, 'quiz', 0, `Opened portal: ${gemName}`);
  };

  const handleLogPointsFromPortal = async (category: string, rawVal: number, points: number, description: string, proofImg?: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      points: increment(points)
    });
    await addPointLog(user.uid, category, points, description, proofImg);
  };

  const handleCollectCard = async () => {
    if (!user || !userData) return;
    const userRef = doc(db, 'users', user.uid);
    const cardId = getLocalDateString().replace(/-/g, '');
    
    // Check if already collected
    if (userData.collectedCards?.some(c => c.id === cardId)) {
      setShowCheckIn(false);
      return;
    }

    const newCard = {
      id: cardId,
      date: new Date().toLocaleDateString(),
      word: userData.dailyWord,
      quote: userData.dailyQuote,
      wordData: userData.dailyWordData || null,
      quoteData: userData.dailyQuoteData || null
    };

    await updateDoc(userRef, {
      collectedCards: arrayUnion(newCard)
    });
    
    setShowCheckIn(false);
  };

  const handleSaveNote = async (note: Partial<StudyNote>) => {
    const noteId = note.id || Math.random().toString(36).substr(2, 9);
    const newNote: StudyNote = {
      ...note,
      id: noteId,
      content: note.content || '',
      drawingData: note.drawingData || null,
      date: note.date || new Date().toLocaleString(),
      type: (note.type || 'text') as 'text' | 'drawing',
      color: note.color || '#fef08a'
    };

    // Optimistic local update
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === noteId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newNote;
        return updated;
      }
      return [newNote, ...prev];
    });

    if (user) {
      try {
        const noteRef = doc(db, 'users', user.uid, 'notes', noteId);
        await setDoc(noteRef, newNote, { merge: true });
      } catch (e) {
        console.error("Firestore save failed, using local storage only", e);
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    // Optimistic local update
    setNotes(prev => prev.filter(n => n.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
      } catch (e) {
        console.error("Firestore delete failed", e);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {!activePortalUrl && <GalaxyBackground />}

      {!activePortalUrl && (
        <>
          <div className="fixed top-0 left-0 h-screen flex flex-col items-center justify-start py-24 px-4 z-[40] pointer-events-none w-16 lg:w-48">
        <div className="pointer-events-auto flex flex-col items-center gap-6">
          <motion.div
            animate={{ 
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 lg:w-40 lg:h-40 rounded-full bg-white moon-glow flex flex-col items-center justify-center text-black p-1 lg:p-4 text-center cursor-pointer overflow-hidden relative shadow-[0_0_50px_rgba(255,255,255,0.3)] border-2 border-white/20"
            onClick={!user ? handleLogin : () => setShowCheckIn(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/[0.05] to-black/[0.1] pointer-events-none" />
            <div className="flex flex-col items-center w-full px-1 lg:px-2 z-10">
              <span className="text-[7px] lg:text-xl font-artistic tracking-[0.05em] leading-tight break-words max-w-full font-bold">Tr. Shirley Du</span>
              <span className="text-[5px] lg:text-xs font-zh tracking-[0.1em] opacity-80 mt-0.5 lg:mt-1 leading-tight break-words max-w-full font-bold uppercase underline">英文Surely DO</span>
            </div>
            
            {!user ? (
              <div className="hidden lg:flex items-center gap-1 text-[8px] font-bold opacity-30 mt-2 z-10">
                <LogIn className="w-2.5 h-2.5" /> LOGIN
              </div>
            ) : (
              <div className="flex items-center gap-0.5 lg:gap-2 text-[6px] lg:text-[10px] font-bold text-green-600 mt-1 lg:mt-2 z-10">
                <Zap className="w-2 h-2 lg:w-3 lg:h-3" /> ACTIVE
              </div>
            )}
          </motion.div>

          {user && userData && currentStrand === 'home' && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ x: 5 }}
              onClick={() => setShowCheckIn(true)}
              className="hidden lg:flex flex-col bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-4 rounded-[1.5rem] w-full max-w-[180px] cursor-pointer transition-all shadow-[0_0_40px_rgba(255,255,255,0.05)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <p className="text-[7px] uppercase tracking-[0.3em] text-blue-200/40 font-bold">Daily Stream</p>
              </div>
              <p className="text-xs font-display font-bold text-white/90 line-clamp-1">{userData.dailyWord}</p>
              <p className="text-[8px] text-white/40 italic line-clamp-2 mt-1">"{userData.dailyQuote}"</p>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Header / Stats */}
      <header className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex gap-4">
          {user && userData && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setOverrideBypassCode("");
                setOverrideReason("");
                setOverridePointsDelta(100);
                setShowTeacherOverride(true);
              }}
              className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 p-2 pr-6 rounded-full cursor-pointer select-none transition-colors duration-200"
              title="Teacher Override Area / 導師授權覆核調分區"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 leading-none flex items-center gap-1">
                  <span>Your Points</span>
                  <Settings className="w-2.5 h-2.5 text-white/20 animate-spin-slow" />
                </p>
                <p className="text-lg font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100">{userData.points}</p>
              </div>
            </motion.div>
          )}
          
          {user && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-2 pr-6 rounded-full"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold">Total</span>
                  <p className="text-lg font-display font-bold leading-none">
                    {Number(((userData?.studyTimeTotal || 0) / 60).toFixed(1))}h
                  </p>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-[8px] uppercase tracking-widest text-blue-400/60 font-bold">Session</span>
                  <p className="text-sm font-display font-medium text-blue-200/80 leading-none">
                    {Math.floor(sessionStudyTime / 60)}m
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="pointer-events-auto flex gap-4 items-center">
          {authError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-full text-xs text-red-200 backdrop-blur-md max-w-xs"
            >
              {authError}
            </motion.div>
          )}
          {user ? (
            <button onClick={() => signOut(auth)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleLogin} className="px-6 py-2 bg-white text-black rounded-full font-medium flex items-center gap-2 hover:bg-white/90 transition-colors">
              <LogIn className="w-4 h-4" /> Login
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 pt-24 pb-20">
        <AnimatePresence mode="wait">
          {currentStrand === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full min-h-[85vh] flex flex-col items-center justify-center"
            >
              {/* Central Planet Map Universe displays the spaceship at its center */}

              {/* Check-in Pop-out Modal */}
              <AnimatePresence>
                {showCheckIn && userData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center px-6"
                  >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCheckIn(false)} />
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="relative w-full max-w-md robotic-panel p-8 rounded-[2.5rem] border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(0,242,255,0.2)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => setShowCheckIn(false)}
                        className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>

                      <div className="flex flex-col items-center text-center">
                        <div className="flex w-full justify-end mb-2">
                          <button 
                            onClick={() => user && handleCheckIn(user, true)}
                            className="text-[9px] text-white/20 hover:text-cyan-400 flex items-center gap-1 transition-all uppercase tracking-widest font-bold"
                          >
                            <RefreshCw className="w-3 h-3" /> Force Refresh
                          </button>
                        </div>
                        <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                          <Sparkles className="w-10 h-10 text-cyan-400" />
                        </div>
                        
                        <h3 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-[0.4em] mb-4">Transmission Received</h3>
                        <div className="space-y-4 mb-8">
                          <h2 className="text-4xl font-display font-bold text-white leading-tight underline decoration-cyan-500/30">
                            {userData.dailyWord}
                          </h2>
                          <p className="text-lg text-white/60 italic leading-relaxed font-serif">
                            "{userData.dailyQuote}"
                          </p>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                            <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1 font-bold">Today's Streak</p>
                            <p className="text-xl font-bold flex items-center justify-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-400" /> ACTIVE
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                            <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1 font-bold">XP Bonus</p>
                            <p className="text-xl font-bold text-cyan-400">+50 XP</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => setShowCheckIn(false)}
                          className="mt-8 w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] uppercase tracking-widest text-sm"
                        >
                          Engage Mission
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <UniverseDisplay 
                user={user} 
                userData={userData} 
                onStrandClick={handleStrandClick} 
                onUpdateAvatar={handleUpdateAvatar} 
                onSpaceshipClick={() => setActivePortalUrl("https://ducj-creator.github.io/etgame.html")}
              />

              {/* Centered clean parchment scroll button (keeps front page clean, concise, catchy) */}
              <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-2 pb-16 px-4">
                <motion.div
                  animate={{ 
                    y: [-4, 4, -4],
                    rotate: [-0.3, 0.3, -0.3]
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  whileHover={{ scale: 1.04, y: 0 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowScrollMap(true)}
                  className="cursor-pointer group select-none relative p-8 md:p-10 rounded-2xl bg-gradient-to-b from-[#f2e2be] via-[#fbf1da] to-[#ebd9af] border-y-8 border-[#52331a] transition-all shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(139,94,60,0.45)] w-full text-center overflow-hidden flex flex-col items-center border-x-2 border-[#8c603a]/40"
                >
                  {/* Physical Wooden roller end cylinder caps at the top/bottom to look completely realistic */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#2a1709] via-[#8c5a2c] to-[#2a1709] shadow-inner pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-r from-[#2a1709] via-[#8c5a2c] to-[#2a1709] shadow-inner pointer-events-none" />
                  
                  {/* Antique scroll roller spindle nodes inside left & right margins */}
                  <div className="absolute -left-2 top-6 bottom-6 w-2 rounded-l bg-gradient-to-b from-[#5c3a1e] to-[#2a1709] border-r border-[#150a04]/40" />
                  <div className="absolute -right-2 top-6 bottom-6 w-2 rounded-r bg-gradient-to-b from-[#5c3a1e] to-[#2a1709] border-l border-[#150a04]/40" />
                  
                  {/* Deckled paper margin guides */}
                  <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#8c603a]/60 rounded-tl-sm pointer-events-none" />
                  <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#8c603a]/60 rounded-tr-sm pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#8c603a]/60 rounded-bl-sm pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#8c603a]/60 rounded-br-sm pointer-events-none" />
                  
                  {/* Antique ink sketched visual mapping lines */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] border border-[#a8825c]/15 rounded-full pointer-events-none border-dashed animate-[spin_50s_linear_infinite]" />
                  <div className="absolute inset-0 bg-[radial-gradient(#8c603a_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none" />

                  {/* Classical Sketch Floating Scroll Emblem */}
                  <div className="w-16 h-16 rounded-full bg-[#8c603a]/12 border-2 border-[#8c603a]/30 flex items-center justify-center mb-4 group-hover:bg-[#8c603a]/20 transition-all text-[#5c3a1e] group-hover:scale-105 duration-300 relative shadow-inner">
                    <svg className="w-9 h-9 text-[#5c3a1e] filter drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5a1 1 0 001 1h5" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-serif font-black tracking-[0.12em] text-[#3d210a] group-hover:text-[#522907] transition-colors uppercase leading-none">
                    📜 Star Chart Index
                  </h3>
                  <p className="text-xs font-zh font-bold text-[#6e4421] mt-1.5 leading-none">星系內容索引</p>
                  
                  <p className="text-xs md:text-sm text-[#4d321c]/90 mt-4 max-w-sm leading-relaxed font-sans font-medium px-2">
                    Click to roll out the antique celestial parchment scroll; discover all educational gems, game quadrants, and curriculum tools.
                  </p>
                  
                  <div className="flex items-center gap-2 mt-5 text-[10px] font-bold text-[#ebd9af] bg-[#5c3a1e] hover:bg-[#432912] border border-[#3d210a] px-5 py-2 rounded-full shadow transition-all uppercase tracking-[0.16em]">
                    <span>✨ ROLL OUT MAP / 展開地圖</span>
                  </div>
                </motion.div>
              </div>

              {/* Infinite, real animated parchment rollout scroll map modal overlay */}
              <AnimatePresence>
                {showScrollMap && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(15,7,38,0.96)_0%,rgba(4,2,11,0.99)_70%,rgba(0,0,0,1)_100%)] backdrop-blur-md"
                  >
                    {/* Event blocker backdrop */}
                    <div className="absolute inset-0 cursor-default" onClick={() => setShowScrollMap(false)} />
                    
                    {/* Swirling Milky Way / Cosmic Nebula backing (galaxy color theme requested) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-[-25%] left-[-15%] w-[130%] h-[130%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.22)_0%,rgba(219,39,119,0.15)_40%,rgba(6,3,27,0)_70%)] animate-[spin_160s_linear_infinite] filter blur-3xl opacity-90" />
                      <div className="absolute top-[20%] right-[-10%] w-[80vw] h-[80vh] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.1)_0%,rgba(168,85,247,0.1)_50%,transparent_80%)] filter blur-3xl opacity-80" />
                      {/* Magical high-density star dust fields */}
                      <div className="absolute inset-0 opacity-[0.45] bg-[radial-gradient(#ffffff_1px,transparent_1.2px)] [background-size:20px_20px]" />
                      <div className="absolute inset-0 opacity-[0.25] bg-[radial-gradient(#ffffff_1.8px,transparent_1.8px)] [background-size:40px_40px] animate-[pulse_6s_ease-in-out_infinite]" />
                      <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(#ffffff_2.5px,transparent_2.5px)] [background-size:80px_80px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
                    </div>
                    
                    {/* Real Roll Out Parchment Scroll Frame */}
                    <motion.div 
                      initial={{ scaleX: 0.1, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ scaleX: 0.1, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 150, damping: 22 }}
                      className="relative w-full max-w-5xl rounded-3xl bg-gradient-to-br from-[#120a1c] via-[#09050d] to-[#030105] border-2 border-indigo-500/20 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_60px_rgba(99,102,241,0.2),inset_0_0_30px_rgba(99,102,241,0.1)] p-4 sm:p-6 md:p-8 text-neutral-200 h-[92vh] sm:h-[88vh] flex flex-col my-auto origin-center z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Subtle space-radar constellations guide */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/5 rounded-full pointer-events-none border-dashed animate-[spin_100s_linear_infinite]" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-fuchsia-500/5 rounded-full pointer-events-none border-dotted animate-[spin_50s_linear_infinite_reverse]" />

                      {/* Header containing Title & close seal */}
                      <div className="relative z-10 flex items-center justify-between mb-5 border-b border-indigo-500/20 pb-4 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
                            <Compass className="w-5.5 h-5.5 animate-[spin_45s_linear_infinite] filter drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                          </div>
                          <div>
                            <h2 className="text-xl md:text-2xl font-display font-black tracking-widest text-[#e0f2fe] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none uppercase flex items-center gap-2">
                              🌌 Celestial Star Map • 星圖索引
                            </h2>
                            <p className="text-[10px] md:text-xs text-slate-300 font-medium tracking-wide mt-1.5 leading-none">
                              A comprehensive, pristine galactic index of Tr. Shirley's educational planets.
                            </p>
                          </div>
                        </div>
                        
                        {/* Red Wax Seal Close Button */}
                        <button 
                          onClick={() => setShowScrollMap(false)}
                          className="w-10 h-10 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500 flex items-center justify-center text-red-250 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 group relative overflow-hidden shrink-0"
                          title="Roll map closed"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-950/20" />
                          <X className="w-4.5 h-4.5 group-hover:rotate-90 transition-transform" />
                        </button>
                      </div>

                      {/* Scrollable Parchment Workspace containing PreLoginExplorer list */}
                      <div className="relative z-10 flex-1 overflow-y-auto pr-1 md:pr-2 scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-transparent">
                        <PreLoginExplorer 
                          onSelectGem={(gem, requiresLogin) => {
                            setShowScrollMap(false);
                            if (requiresLogin && !user) {
                              setShowLoginModal(true);
                            } else {
                              if (gem.url === 'subjects') {
                                setCurrentStrand('vocabulary');
                                setVocabSearchTerm("");
                                setShowSubjects(true);
                                setActivePortalUrl(null);
                              } else {
                                setActivePortalUrl(gem.url);
                              }
                            }
                          }}
                          onSelectStrand={(strand, requiresLogin) => {
                            setShowScrollMap(false);
                            if (requiresLogin && !user) {
                              setShowLoginModal(true);
                            } else {
                              setCurrentStrand(strand);
                              if (strand === 'saturn') {
                                setShowSubjects(true);
                              } else {
                                setShowSubjects(false);
                              }
                            }
                          }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : currentStrand === 'pet' ? (
            <motion.div
              key="pet"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto pt-12"
            >
              <h2 className="text-4xl font-display font-bold mb-8 text-center">Your Space Companion</h2>
              <PetSection 
                points={userData?.points || 0} 
                pet={petData} 
                petsList={petsList}
                activePetId={activePetId}
                setActivePetId={setActivePetId}
                onFeed={handleFeedPet} 
                onPlay={handlePlayWithPet}
                onAdopt={handleAdoptPet} 
                onRelease={handleReleasePet}
                isRolling={isRolling}
                isAdopting={isAdopting}
                petError={petError}
              />
            </motion.div>
          ) : currentStrand === 'logs' ? (
            <motion.div
              key="logs"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto pt-12"
            >
              <h2 className="text-4xl font-display font-bold mb-8 text-center">Points & Collection</h2>
              
              <div className="flex gap-4 mb-8 justify-center">
                <button 
                  onClick={() => setLogTab('points')}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium transition-all",
                    logTab === 'points' ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  Points History
                </button>
                <button 
                  onClick={() => setLogTab('cards')}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium transition-all",
                    logTab === 'cards' ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  Card Collection ({userData?.collectedCards?.length || 0})
                </button>
              </div>

              {logTab === 'points' ? (
                <>
                  <div className="relative bg-[#fbf9f4] border-2 border-[#e6e2da] rounded-3xl overflow-hidden shadow-2xl text-zinc-900">
                    {/* Ring binder spiral binding look on the left edge */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around py-4 bg-[#f3efe6] border-r-2 border-[#e6e2da] z-25 pointer-events-none">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="flex items-center relative">
                          {/* Left binder hole inside the margin */}
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-950/85 shadow-inner ml-2.5 border border-zinc-700/20" />
                          {/* Binder ring wire */}
                          <div className="absolute left-[-2px] w-6 h-2 rounded-full border-[1.5px] border-neutral-400 bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 opacity-90 shadow-md" />
                        </div>
                      ))}
                    </div>

                    {/* Notebook Pages */}
                    <div className="pl-12 pr-6 py-6 font-sans relative select-text">
                      {/* Notebook red vertical margin line */}
                      <div className="absolute left-[54px] top-0 bottom-0 w-[1.5px] bg-red-400/60 z-10 pointer-events-none" />

                      {/* Header row in notebook */}
                      <div className="p-4 border-b-2 border-dashed border-zinc-300/80 flex justify-between items-center mb-4 pl-8">
                        <span className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase font-bold flex items-center gap-1">
                          🗒️ Captain's Logs / 星際學術日誌
                        </span>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => user && handleCheckIn(user)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors font-semibold"
                          >
                            <RefreshCw className="w-3 h-3 animate-pulse" /> Sync logs
                          </button>
                        </div>
                      </div>

                      {/* Log items inside the notebook with horizontal rule line styling */}
                      <div className="max-h-[500px] overflow-y-auto pl-8">
                        {logs.length === 0 ? (
                          <div className="py-20 text-center">
                            <p className="text-zinc-400 italic mb-4 font-serif">No logs found in this captain's record yet.</p>
                            <p className="text-xs text-indigo-500 hover:underline cursor-pointer" onClick={() => user && handleCheckIn(user)}>
                              Tap to sync cosmic data log
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0 text-zinc-800">
                            {logs.map((log) => (
                              <div
                                key={log.id} 
                                className="py-5 border-b border-indigo-100/40 flex justify-between items-center hover:bg-neutral-100/50 transition-colors pl-2 pr-4 relative min-h-[5rem]"
                              >
                                <div className="flex-1 pr-4">
                                  <p className="font-semibold text-zinc-900 text-sm font-sans flex items-center gap-1.5 flex-wrap">
                                    <span className="text-neutral-400 text-xs" title="Record point">📌</span>
                                    {log.description}
                                  </p>

                                  {log.proofImg && (
                                    <div className="mt-2 flex items-center gap-2">
                                      {log.proofImg.includes('data:image/') ? (
                                        <button 
                                          onClick={() => setSelectedProofImg(log.proofImg)}
                                          className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl transition-colors active:scale-95"
                                        >
                                          <Camera className="w-3.5 h-3.5 text-indigo-500" />
                                          <span>View Screenshot Proof • 檢視截圖</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                                          {log.proofImg}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <p className="text-[10px] text-zinc-400 font-mono tracking-wider mt-1.5 font-bold">
                                    🕒 {log.timestamp?.toDate?.()?.toLocaleString() || 'Record Registered'}
                                  </p>
                                </div>
                                <div className={cn(
                                  "text-xs font-mono font-black py-1 px-3 rounded-full shadow-sm text-center leading-none whitespace-nowrap",
                                  log.points > 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-red-100 text-red-800 border border-red-200"
                                )}>
                                  {log.points > 0 ? `+${log.points}` : log.points} pts
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-3" />
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Check-in</p>
                      <p className="text-xl font-bold">+10 pts</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <Clock className="w-6 h-6 text-blue-400 mx-auto mb-3" />
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">10m Study</p>
                      <p className="text-xl font-bold">+5 pts</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <Zap className="w-6 h-6 text-green-400 mx-auto mb-3" />
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Correct Answer</p>
                      <p className="text-xl font-bold">+5 pts</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {userData?.collectedCards && userData.collectedCards.length > 0 ? (
                    userData.collectedCards.map((card) => (
                      <div key={card.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl overflow-hidden relative group">
                        <div className="velvet-texture" />
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] uppercase tracking-widest text-white/40">NO. {card.id}</span>
                          <span className="text-[10px] uppercase tracking-widest text-white/40">{card.date}</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-1">{card.word}</h4>
                        <p className="text-xs text-white/60 italic mb-4 line-clamp-2">"{card.quote}"</p>
                        <button 
                          onClick={() => {
                            setSelectedCard(card);
                          }}
                          className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                        >
                          View Full Card
                        </button>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-20 text-center bg-white/5 border border-white/10 rounded-[2rem]">
                      <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 italic">Your card pouch is empty. Check in daily to collect cards!</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="strand"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <button 
                onClick={() => {
                  if (currentStrand === 'saturn') {
                    setShowSubjects(false);
                    setCurrentStrand('home');
                  } else if (showSubjects) {
                    setShowSubjects(false);
                  } else {
                    setCurrentStrand('home');
                  }
                }}
                className="mb-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs font-medium">{currentStrand === 'saturn' ? "Back to Moon Base" : (showSubjects ? "Back to Vocabulary" : "Back to Moon Base")}</span>
                  <span className="text-[9px] opacity-65">{currentStrand === 'saturn' ? "回到首頁" : (showSubjects ? "回到單字區" : "回到首頁")}</span>
                </div>
              </button>

              <div className="flex flex-row items-center gap-4 mb-5 border-b border-white/5 pb-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentStrand('home')}
                  className={cn(
                    "w-12 h-12 md:w-16 md:h-16 rounded-full shrink-0 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] relative group transform-gpu",
                    STRANDS[currentStrand as keyof typeof STRANDS].class
                  )} 
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                    <span className="text-[8px] text-white font-bold tracking-widest uppercase">Home</span>
                  </div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-1">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-2xl md:text-3.5xl font-display font-bold tracking-tight text-white leading-none">
                          {STRANDS[currentStrand as keyof typeof STRANDS].name}
                        </h2>
                        <h3 className="text-lg md:text-2xl font-display font-medium text-white/50 leading-none">
                          {STRANDS[currentStrand as keyof typeof STRANDS].nameZh}
                        </h3>
                      </div>
                      <p className="text-[10px] md:text-xs text-white/20 uppercase tracking-[0.2em] mt-1">
                        Strand of {STRANDS[currentStrand as keyof typeof STRANDS].planet}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[280px] sm:min-h-[340px] md:min-h-[380px] w-full flex items-center justify-center overflow-visible">
                {showSubjects ? (
                  <div className="w-full">
                    <BilingualSubjectsView 
                      onBack={() => {
                        setShowSubjects(false);
                        setCurrentStrand('home');
                      }} 
                      onVisit={(name) => handleVisitGem(name)} 
                      onGemClick={(url) => setActivePortalUrl(url)}
                      currentStrand={currentStrand}
                    />
                  </div>
                ) : (
                  <div className={cn(
                    "relative w-full transition-all duration-500 flex items-center justify-center overflow-visible",
                    (GEMS[currentStrand as keyof typeof GEMS] || []).length > 6
                      ? (isMobileScreen ? "aspect-[1/1.85] max-w-[280px]" : "aspect-[1.9/1] max-w-[620px] md:max-w-[680px]")
                      : "aspect-square max-w-[340px] md:max-w-[380px] min-h-[260px] sm:min-h-[300px] md:min-h-[340px]"
                  )}>
                    {/* Atmospheric backing orbits for geometric beauty */}
                    {(() => {
                      const totalCount = (GEMS[currentStrand as keyof typeof GEMS] || []).length;
                      if (totalCount <= 6) {
                        return (
                          <>
                            <div className="absolute inset-0 border border-white/[0.03] rounded-full pointer-events-none scale-90" />
                            <div className="absolute inset-0 border border-dashed border-white/[0.015] rounded-full pointer-events-none scale-75 animate-[spin_180s_linear_infinite]" />
                          </>
                        );
                      } else {
                        const cx1 = isMobileScreen ? 50 : 27;
                        const cy1 = isMobileScreen ? 27 : 50;
                        const cx2 = isMobileScreen ? 50 : 73;
                        const cy2 = isMobileScreen ? 73 : 50;

                        const rxPerc = isMobileScreen ? 42 : 22;
                        const ryPerc = isMobileScreen ? 23 : 42;

                        return (
                          <>
                            {/* Orbit A */}
                            <div 
                              className="absolute border border-white/[0.04] rounded-full pointer-events-none" 
                              style={{
                                left: `${cx1}%`,
                                top: `${cy1}%`,
                                transform: 'translate(-50%, -50%)',
                                width: `${rxPerc}%`,
                                height: `${ryPerc}%`,
                              }}
                            />
                            <div 
                              className="absolute border border-dashed border-white/[0.02] rounded-full pointer-events-none animate-[spin_120s_linear_infinite]"
                              style={{
                                left: `${cx1}%`,
                                top: `${cy1}%`,
                                transform: 'translate(-50%, -50%)',
                                width: `${rxPerc * 0.75}%`,
                                height: `${ryPerc * 0.75}%`,
                              }}
                            />

                            {/* Orbit B */}
                            <div 
                              className="absolute border border-white/[0.04] rounded-full pointer-events-none" 
                              style={{
                                left: `${cx2}%`,
                                top: `${cy2}%`,
                                transform: 'translate(-50%, -50%)',
                                width: `${rxPerc}%`,
                                height: `${ryPerc}%`,
                              }}
                            />
                            <div 
                              className="absolute border border-dashed border-white/[0.02] rounded-full pointer-events-none animate-[spin_120s_linear_infinite]" 
                              style={{
                                left: `${cx2}%`,
                                top: `${cy2}%`,
                                transform: 'translate(-50%, -50%)',
                                width: `${rxPerc * 0.75}%`,
                                height: `${ryPerc * 0.75}%`,
                              }}
                            />
                          </>
                        );
                      }
                    })()}
                    
                    {GEMS[currentStrand as keyof typeof GEMS].map((gem, idx) => {
                      const totalGems = GEMS[currentStrand as keyof typeof GEMS].length;
                      let angleInDegrees = 0;
                      let x = 50;
                      let y = 50;

                      const getShapeAngles = (count: number) => {
                        if (count === 3) return [-90, 30, 150];
                        if (count === 4) return [-90, 0, 90, 180];
                        if (count === 5) return [-90, -18, 54, 126, 198];
                        if (count === 6) return [-90, -30, 30, 90, 150, 210];
                        const angles = [];
                        for (let i = 0; i < count; i++) {
                          angles.push(-90 + i * (360 / count));
                        }
                        return angles;
                      };

                      if (totalGems <= 6) {
                        // Single ring layout
                        const rx = totalGems === 3 ? 31 : totalGems === 4 ? 32 : totalGems === 5 ? 33 : 34;
                        const ry = rx;
                        const angles = getShapeAngles(totalGems);
                        angleInDegrees = angles[idx % totalGems] || 0;
                        const angleRad = (angleInDegrees * Math.PI) / 180;
                        x = 50 + Math.cos(angleRad) * rx;
                        y = 50 + Math.sin(angleRad) * ry;
                      } else {
                        // Separately layered layouts of two regular polygons
                        let groupASize = 0;
                        let groupBSize = 0;

                        if (totalGems === 7) { groupASize = 3; groupBSize = 4; }
                        else if (totalGems === 8) { groupASize = 4; groupBSize = 4; }
                        else if (totalGems === 9) { groupASize = 4; groupBSize = 5; }
                        else if (totalGems === 10) { groupASize = 5; groupBSize = 5; }
                        else if (totalGems === 11) { groupASize = 5; groupBSize = 6; }
                        else if (totalGems === 12) { groupASize = 6; groupBSize = 6; }
                        else {
                          groupASize = Math.floor(totalGems / 2);
                          groupBSize = totalGems - groupASize;
                        }

                        const isGroupA = idx < groupASize;
                        const cx = isMobileScreen ? 50 : (isGroupA ? 27 : 73);
                        const cy = isMobileScreen ? (isGroupA ? 27 : 73) : 50;

                        // To look perfectly round/symmetric on screen
                        const radiusX = isMobileScreen ? 21 : 11;
                        const radiusY = isMobileScreen ? 11.5 : 21;

                        const localIdx = isGroupA ? idx : idx - groupASize;
                        const activeGroupSize = isGroupA ? groupASize : groupBSize;
                        const angles = getShapeAngles(activeGroupSize);
                        angleInDegrees = angles[localIdx % activeGroupSize] || 0;

                        const angleRad = (angleInDegrees * Math.PI) / 180;
                        x = cx + Math.cos(angleRad) * radiusX;
                        y = cy + Math.sin(angleRad) * radiusY;
                      }

                      // Mathematically non-overlapping scale based on responsiveness and total count
                      let itemScale = 0.88;
                      if (isMobileScreen) {
                        if (totalGems > 6) {
                          itemScale = 0.44;
                        } else if (totalGems >= 5) {
                          itemScale = 0.53;
                        } else {
                          itemScale = 0.62;
                        }
                      } else {
                        if (totalGems > 6) {
                          itemScale = 0.58;
                        } else if (totalGems >= 5) {
                          itemScale = 0.72;
                        } else {
                          itemScale = 0.88;
                        }
                      }

                      const customStyle = {
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: `translate(-50%, -50%) scale(${itemScale})`,
                      };

                      const customWrapperClass = "absolute transition-all duration-300 hover:z-20";
                      const customClass = "gem-geometric backdrop-blur-2xl";

                      return (
                        <div key={idx} className={customWrapperClass} style={customStyle}>
                          <Gem 
                            name={gem.name} 
                            nameZh={gem.nameZh}
                            url={gem.url} 
                            type={gem.type || 'diamond'}
                            color={STRANDS[currentStrand as keyof typeof STRANDS].color}
                            onVisit={() => handleVisitGem(gem.name)}
                            className={customClass}
                            onClick={() => {
                              if (gem.url === 'subjects') {
                                setVocabSearchTerm("");
                                { /* Transition back to subjects view smoothly */ }
                                setShowSubjects(true);
                              } else {
                                setActivePortalUrl(gem.url);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Pet when playing */}
      <AnimatePresence>
        {petsList.filter(p => p.isPlaying).map((p, idx) => (
          <FloatingPet 
            key={p.id || `pet-${idx}`} 
            pet={p} 
            onReturn={() => { handleReturnTargetPet(p); }} 
            index={idx}
          />
        ))}
      </AnimatePresence>

      {/* Moon Base Card Modal */}
      <AnimatePresence>
        {(showCheckIn || selectedCard) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => {
                setShowCheckIn(false);
                setSelectedCard(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-[320px] mx-auto"
            >
              <div className="moon-card relative bg-gradient-to-br from-[#0f0c29] via-[#1a1a4e] to-[#090a0f] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="velvet-texture" />
                {/* Nebula Overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(100,40,255,0.15),transparent_50%)]" />
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(0,200,255,0.15),transparent_50%)]" />
                </div>

                <div className="p-5 md:p-6 relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                      <h4 className="text-[7px] tracking-[0.3em] text-blue-200/30 uppercase font-bold">Clearance Authorized</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      {(!selectedCard && (!userData?.dailyWordData?.sentEn || !userData?.dailyQuoteData?.quote)) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            user && handleCheckIn(user);
                          }}
                          className="text-[8px] text-blue-200/40 hover:text-white flex items-center gap-1 transition-colors"
                          title="Refresh Data"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <p className="text-[8px] text-blue-100/20 font-mono">#{selectedCard?.id || getLocalDateString().replace(/-/g, '')}</p>
                    </div>
                  </div>

                  <div className="mb-4 text-center">
                    <h3 className="text-base font-display font-light text-white/80 mb-0.5">
                      Welcome, <span className="font-bold text-white">{user?.displayName?.split(' ')[0] || 'Traveler'}</span>
                    </h3>
                    <p className="text-[8px] tracking-widest text-blue-200/30 uppercase">
                      {selectedCard?.date || new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Word Section */}
                  <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/5 mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[7px] uppercase tracking-[0.2em] text-blue-200/30 font-bold">Daily Word</p>
                      <span className="text-[9px] italic text-blue-200/20">
                        {selectedCard ? selectedCard.wordData?.pos : userData?.dailyWordData?.pos}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-display font-bold text-white mb-1 tracking-tight">
                      {selectedCard ? selectedCard.word : (userData?.dailyWordData?.word || userData?.dailyWord || 'Inspiration')}
                    </h2>
                    
                    <p className="text-[11px] text-white/60 mb-3 leading-relaxed font-medium">
                      {selectedCard ? selectedCard.wordData?.def : userData?.dailyWordData?.def}
                    </p>
                    
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <p className="text-[10px] text-blue-100/40 italic leading-relaxed">
                        "{selectedCard ? selectedCard.wordData?.sentEn : (userData?.dailyWordData?.sentEn || 'The journey of a thousand miles begins with a single step.')}"
                      </p>
                      <div className="bg-white/[0.03] p-2 rounded-lg">
                        <p className="text-[11px] text-white/80 font-zh font-medium leading-relaxed">
                          {selectedCard ? (selectedCard.wordData?.sentCn || "") : (userData?.dailyWordData?.sentCn || "")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quote Section */}
                  <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/5 mb-5">
                    <p className="text-[11px] text-white/70 font-medium italic mb-2 leading-relaxed">
                      "{selectedCard ? selectedCard.quote : (userData?.dailyQuoteData?.quote || 'The stars are not reachable, but they are visible.')}"
                    </p>
                    <div className="bg-white/[0.03] p-2 rounded-lg mb-2">
                      <p className="text-[11px] text-white/80 font-zh font-medium leading-relaxed">
                        {selectedCard ? (selectedCard.quoteData?.trans || "") : (userData?.dailyQuoteData?.trans || "")}
                      </p>
                    </div>
                    <p className="text-right text-[7px] uppercase tracking-widest text-blue-200/30 font-bold">— {selectedCard ? selectedCard.quoteData?.author : (userData?.dailyQuoteData?.author || 'Unknown')}</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="text-center">
                      <p className="font-artistic text-xs text-blue-100/40">Teacher Shirley</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    alert("Image download feature coming soon! You can take a screenshot for now.");
                  }}
                  className="flex-1 py-3 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
                >
                  📥 Download
                </button>
                {selectedCard ? (
                  <button 
                    onClick={() => setSelectedCard(null)}
                    className="flex-1 py-3 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
                  >
                    ✕ Close
                  </button>
                ) : (
                  <button 
                    onClick={handleCollectCard}
                    className="flex-1 py-3 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
                  >
                    {userData?.collectedCards?.some(c => c.id === getLocalDateString().replace(/-/g, '')) 
                      ? "✓ Collected" 
                      : "✕ Collect (放入卡袋)"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/20 px-8 py-4 rounded-full flex gap-12 z-50 shadow-2xl">
        <button onClick={() => setCurrentStrand('home')} className={cn("p-2 transition-all duration-300", currentStrand === 'home' ? "text-white scale-125" : "text-white/40 hover:text-white/60 hover:scale-110")}>
          <Home className="w-6 h-6" />
        </button>
        <button onClick={() => setCurrentStrand('pet')} className={cn("p-2 transition-all duration-300", currentStrand === 'pet' ? "text-white scale-125" : "text-white/40 hover:text-white/60 hover:scale-110")}>
          <User className="w-6 h-6" />
        </button>
        <button onClick={() => setCurrentStrand('logs')} className={cn("p-2 transition-all duration-300", currentStrand === 'logs' ? "text-white scale-125" : "text-white/40 hover:text-white/60 hover:scale-110")}>
          <Star className="w-6 h-6" />
        </button>
      </nav>
        </>
      )}

      {/* Custom Login Prompt Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center px-6"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLoginModal(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.05)] text-center text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Moon className="w-8 h-8 text-amber-500" />
              </div>
              
              <h3 className="text-lg font-medium text-white mb-2">星際通道受限 / Portal Gated</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-6 font-sans">
                This planet requires an active cosmic educational frequency. Please sign in via Google to proceed with personalized records, streak bonuses and companions!
                <br /><br />
                此星球受限於學術網路頻率。請先登入，以便記錄每日任務、星際寵物成長並解鎖高等密鑰！
              </p>

              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => {
                    setShowLoginModal(false);
                    handleLogin();
                  }}
                  className="w-full py-3 px-4 bg-white hover:bg-neutral-100 text-black font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <LogIn className="w-4 h-4" /> Connect with Google / 帳號登入
                </button>
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-850 text-neutral-400 font-medium rounded-2xl transition-all border border-zinc-800 text-xs text-center"
                >
                  Continue as Guest / 星際漫遊
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Study NotePad */}
      <NotePad 
        notes={notes} 
        onSave={handleSaveNote} 
        onDelete={handleDeleteNote} 
      />

      {/* Active Portal Overlay */}
      <AnimatePresence>
        {activePortalUrl && (
          <EmbeddedPortal 
            url={activePortalUrl} 
            onClose={() => setActivePortalUrl(null)} 
            user={user}
            onLogPoints={handleLogPointsFromPortal}
          />
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Score Screenshot Proof */}
      <AnimatePresence>
        {selectedProofImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setSelectedProofImg(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative max-w-lg w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 overflow-hidden shadow-2xl flex flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  Screenshot Proof • 截圖審查
                </span>
                <button
                  onClick={() => setSelectedProofImg(null)}
                  className="p-1 hover:bg-white/10 text-zinc-400 hover:text-white rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/5 bg-black flex items-center justify-center max-h-[70vh]">
                <img 
                  src={selectedProofImg} 
                  alt="Verified score proof" 
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              <div className="text-center text-[10px] text-zinc-500 font-mono">
                Click background or close button to exit review
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teacher Override Modal */}
      <AnimatePresence>
        {showTeacherOverride && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowTeacherOverride(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(234,179,8,0.15)] text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowTeacherOverride(false)}
                className="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5 border-b border-white/5 pb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Settings className="w-5 h-5 text-amber-400 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Teacher Direct Override</h3>
                  <p className="text-[10px] text-zinc-400">專屬導師覆核調分授權專區</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Authorization Bypass code input */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                    1. Input Teacher Bypass Key / 導師驗證密鑰
                  </label>
                  <input
                    type="password"
                    value={overrideBypassCode}
                    onChange={(e) => setOverrideBypassCode(e.target.value)}
                    placeholder="Enter bypass key"
                    className={`w-full bg-black/60 border rounded-xl px-3 py-2.5 text-xs font-mono tracking-widest uppercase focus:outline-none transition-all ${
                      overrideBypassCode.trim().toUpperCase() === 'SHIRLEY55' 
                        ? 'border-emerald-500 text-emerald-300 bg-emerald-950/10' 
                        : overrideBypassCode ? 'border-red-500/50 text-red-300 bg-red-950/10' : 'border-white/10'
                    }`}
                  />
                </div>

                {overrideBypassCode.trim().toUpperCase() === 'SHIRLEY55' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 border-t border-white/5 pt-4"
                  >
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/25 rounded-2xl flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="leading-none text-left">
                        <p className="text-xs text-emerald-400 font-bold">Tr. Shirley Authorized ✓</p>
                        <p className="text-[9.5px] text-zinc-400 mt-1">Adjusting points for: {userData?.name || user?.displayName || 'Space Student'}</p>
                      </div>
                    </div>

                    {/* Mode selection block */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                        2. Select Operation / 運算模式
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-white/5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setOverrideAction('add')}
                          className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                            overrideAction === 'add' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Add (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverrideAction('subtract')}
                          className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                            overrideAction === 'subtract' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Sub (-)
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverrideAction('set')}
                          className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                            overrideAction === 'set' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Set (=)
                        </button>
                      </div>
                    </div>

                    {/* Value inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                          Amount / 分值
                        </label>
                        <input
                          type="number"
                          value={overridePointsDelta}
                          onChange={(e) => setOverridePointsDelta(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                          Current Score
                        </label>
                        <div className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold leading-tight flex items-center justify-center">
                          {userData?.points || 0} pts
                        </div>
                      </div>
                    </div>

                    {/* Reason input */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                        3. Reason / 調整原因、評核備註
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g., Active CAP Test correction praise"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-sans text-white placeholder-zinc-700 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Submit Compensation Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (overrideBypassCode.trim().toUpperCase() !== 'SHIRLEY55') return;
                        if (!user) return;
                        const deltaVal = parseInt(String(overridePointsDelta), 10);
                        if (isNaN(deltaVal)) {
                          alert("Invalid points value.");
                          return;
                        }

                        // We can run Firebase update directly here!
                        const userRef = doc(db, 'users', user.uid);
                        let finalReasonDescription = overrideReason.trim() || "Approved direct compensation by Teacher Shirley";
                        let actualPointsAdded = deltaVal;

                        if (overrideAction === 'add') {
                          await updateDoc(userRef, { points: increment(deltaVal) });
                          actualPointsAdded = deltaVal;
                        } else if (overrideAction === 'subtract') {
                          await updateDoc(userRef, { points: increment(-deltaVal) });
                          actualPointsAdded = -deltaVal;
                        } else if (overrideAction === 'set') {
                          const currentPoints = userData?.points || 0;
                          await updateDoc(userRef, { points: deltaVal });
                          actualPointsAdded = deltaVal - currentPoints;
                        }

                        await addPointLog(
                          user.uid,
                          'teacher-override',
                          actualPointsAdded,
                          `[Tr. Shirley Override] ${finalReasonDescription}`
                        );

                        // Success notification
                        setShowTeacherOverride(false);
                      }}
                      className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 active:scale-[0.98] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] select-none text-center"
                    >
                      Apply Point Override
                    </button>
                  </motion.div>
                ) : (
                  <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl text-center">
                    <ShieldAlert className="w-6 h-6 text-zinc-500 mx-auto mb-2 animate-bounce" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      Please invite your teacher, Tr. Shirley, to review your work and enter her authorization bypass signature to adjust your points balance.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
