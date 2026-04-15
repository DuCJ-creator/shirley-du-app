import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, Star, Sparkles, BookOpen, Mic2, PenTool, GraduationCap, 
  Home, User, Trophy, Heart, Coffee, ChevronLeft, ExternalLink,
  LogIn, LogOut, Clock, Zap, RefreshCw
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot,
  collection, query, where, arrayUnion
} from './firebase';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Types ---
type Strand = 'vocabulary' | 'pronunciation' | 'grammar' | 'tests' | 'home' | 'pet' | 'logs';

interface PointLog {
  id: string;
  type: string;
  points: number;
  description: string;
  timestamp: any;
}

interface UserData {
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
}

interface PetData {
  name: string;
  type: string;
  image: string;
  hunger: number;
  happiness: number;
  level: number;
}

// --- Constants ---
const PET_TYPES = [
  { name: "Luna", type: "Cosmic Cat", image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&h=400&q=80" },
  { name: "Astro", type: "Space Dog", image: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=400&h=400&q=80" },
  { name: "Nebula", type: "Galaxy Fox", image: "https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=400&h=400&q=80" },
  { name: "Orion", type: "Star Bear", image: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=400&h=400&q=80" },
  { name: "Nova", type: "Comet Bunny", image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=400&h=400&q=80" },
  { name: "Cosmo", type: "Solar Owl", image: "https://images.unsplash.com/photo-1543549710-1f02f909d828?auto=format&fit=crop&w=400&h=400&q=80" },
  { name: "Stellar", type: "Void Dragon", image: "https://images.unsplash.com/photo-1577493340887-b7bfff550145?auto=format&fit=crop&w=400&h=400&q=80" },
  { name: "Pulsar", type: "Moon Hamster", image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=400&h=400&q=80" },
];

const STRANDS = {
  vocabulary: { name: 'Vocabulary', nameZh: '單字', planet: 'Venus', color: '#ffd700', icon: BookOpen, class: 'planet-venus' },
  pronunciation: { name: 'Pronunciation', nameZh: '發音', planet: 'Mars', color: '#ff4500', icon: Mic2, class: 'planet-mars' },
  grammar: { name: 'Grammar', nameZh: '文法', planet: 'Mercury', color: '#a9a9a9', icon: PenTool, class: 'planet-mercury' },
  tests: { name: 'Tests', nameZh: '測驗', planet: 'Jupiter', color: '#deb887', icon: GraduationCap, class: 'planet-jupiter' },
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
    { name: 'TOEIC Core Vocab', nameZh: 'TOEIC 多益核心單字', url: 'https://ducj-creator.github.io/Shirley-Grammar/TOEIC%20vocab', type: 'ruby' },
    { name: 'Bilingual Subjects', nameZh: '雙語學科', url: 'subjects', type: 'diamond' },
  ],
  pronunciation: [
    { name: 'KK Phonics', nameZh: 'KK 音標', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/kk.html', type: 'sapphire' },
    { name: 'International Phonics', nameZh: '國際音標', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/ipa.html', type: 'ruby' },
    { name: 'Vowel Clusters', nameZh: '母音字群', url: 'https://hexagon-of-vowels.vercel.app/', type: 'emerald' },
    { name: 'Consonant Blends', nameZh: '子音字群', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/consonant.html', type: 'amethyst' },
  ],
  grammar: [
    { name: 'Grammar Lemon Tree', nameZh: '文法檸檬樹', url: 'https://ducj-creator.github.io/Shirley-Grammar/', type: 'emerald' },
    { name: 'CAP Grammar', nameZh: '會考文法', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/CAP%20grammar.html', type: 'topaz' },
  ],
  tests: [
    { name: 'CAP Vocab & Grammar', nameZh: '會考單字與文法', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/CAP%20pastpapers.html', type: 'ruby' },
    { name: 'CAP Listening', nameZh: '會考聽力', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/cap%20listening.html', type: 'sapphire' },
    { name: 'CAP Reading', nameZh: '會考閱讀', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/cap%20reading.html', type: 'emerald' },
    { name: 'GSAT Vocabulary', nameZh: '學測單字', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/GSAT%20Vocab.html', type: 'diamond' },
    { name: 'GSAT Comprehensive', nameZh: '學測綜合測驗', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/GSAT%20Comprehensive.html', type: 'amethyst' },
    { name: 'GSAT Cloze', nameZh: '學測克漏字', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/GSAT%20cloze.html', type: 'topaz' },
    { name: 'GSAT Reading', nameZh: '學測閱讀', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/gsat%20reading.html', type: 'opal' },
  ]
};

const SUBJECT_GEMS = [
  { name: 'Bilingual Periodic Table', nameZh: '雙語元素週期表', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/periodic.html', type: 'emerald' },
  { name: 'Bilingual Taxonomy', nameZh: '雙語生物分類', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/taxonomy.html', type: 'ruby' },
  { name: 'Bilingual Math', nameZh: '雙語數學', url: 'https://ducj-creator.github.io/Teacher-Shirley/subject/math.html', type: 'sapphire' },
];

// --- Helpers ---
const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Components ---

const MobiusRing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.35;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)';
      ctx.lineWidth = 1;

      // Draw Mobius Ring particles
      for (let u = 0; u < Math.PI * 2; u += 0.05) {
        for (let v = -0.5; v <= 0.5; v += 0.5) {
          const x = (1 + v * Math.cos(u / 2 + time)) * Math.cos(u + time * 0.5);
          const y = (1 + v * Math.cos(u / 2 + time)) * Math.sin(u + time * 0.5);
          const z = v * Math.sin(u / 2 + time);

          // Simple 3D to 2D projection
          const perspective = 1 / (2 - z);
          const px = centerX + x * scale * perspective;
          const py = centerY + y * scale * perspective;

          const size = (1 + z) * 1.5;
          const alpha = (1 + z) * 0.3;

          ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
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
    <div className="velvet-texture" />
    <div className="galaxy-bg-extra" />
    <MobiusRing />
    <div className="shooting-star" style={{ top: '10%', left: '80%', animationDelay: '0s' }} />
    <div className="shooting-star" style={{ top: '30%', left: '90%', animationDelay: '4s' }} />
    <div className="shooting-star" style={{ top: '50%', left: '70%', animationDelay: '7s' }} />
  </div>
));

const Planet = ({ strand, info, onClick, disabled }: { strand: Strand, info: any, onClick: () => void, disabled: boolean, key?: any }) => (
  <motion.div
    whileHover={!disabled ? { scale: 1.1, rotate: 5 } : {}}
    whileTap={!disabled ? { scale: 0.95 } : {}}
    className={cn(
      "relative flex flex-col items-center cursor-pointer group",
      disabled && "opacity-50 cursor-not-allowed"
    )}
    onClick={onClick}
  >
    <div className={cn(
      "w-24 h-24 md:w-32 md:h-32 rounded-full moon-glow transition-all duration-500",
      info.class,
      !disabled && "group-hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
    )}>
      <div className="absolute inset-0 flex items-center justify-center">
        <info.icon className="w-10 h-10 text-white/80" />
      </div>
    </div>
    <span className="mt-4 font-display text-lg font-medium tracking-wider uppercase text-white/90 group-hover:text-white transition-colors">
      {info.name}
    </span>
    <span className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">
      {info.nameZh}
    </span>
    <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">{info.planet}</span>
  </motion.div>
);

const Gem = ({ name, nameZh, url, color, type, onVisit, onClick }: { name: string, nameZh: string, url: string, color: string, type: string, onVisit: () => void, onClick?: () => void, key?: any }) => (
  <motion.a
    href={url === 'subjects' ? undefined : url}
    target={url === 'subjects' ? undefined : "_blank"}
    rel={url === 'subjects' ? undefined : "noopener noreferrer"}
    whileHover={{ scale: 1.05, y: -5 }}
    onClick={(e) => {
      if (url === 'subjects') {
        e.preventDefault();
        onClick?.();
      }
      onVisit();
    }}
    className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-4 group overflow-hidden cursor-pointer"
  >
    <div 
      className={cn("gem-shape", `gem-${type}`)}
      style={{ color: color }}
    />
    <div className="text-center flex flex-col gap-0.5">
      <span className="font-medium text-sm text-white/90 group-hover:text-white">{name}</span>
      <span className="text-xs text-white/40 group-hover:text-white/60">{nameZh}</span>
    </div>
    {url !== 'subjects' && <ExternalLink className="absolute top-2 right-2 w-3 h-3 text-white/20 group-hover:text-white/60" />}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.a>
);

const PetSection = ({ points, pet, onFeed, onPlay, onAdopt, isRolling }: { points: number, pet: PetData | null, onFeed: () => void, onPlay: () => void, onAdopt: () => void, isRolling: boolean }) => {
  if (!pet) return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
      <h3 className="text-xl font-display mb-4">Adopt a Space Pet</h3>
      <p className="text-white/60 mb-6">Use your hard-earned points to adopt a random celestial companion!</p>
      <button 
        onClick={onAdopt}
        disabled={points < 100}
        className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        Adopt for 100 Points
      </button>
    </div>
  );

  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <motion.div 
          drag
          dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
          animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
          transition={isRolling ? { duration: 0.5, ease: "linear", repeat: 2 } : { duration: 0.3 }}
          className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 moon-glow cursor-grab active:cursor-grabbing z-10"
        >
          <img 
            src={pet.image || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&h=400&q=80"} 
            alt={pet.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-2xl font-display">{pet.name}</h3>
          <p className="text-white/40 text-sm uppercase tracking-widest">Level {pet.level} {pet.type}</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs uppercase tracking-tighter">
              <span>Hunger</span>
              <span>{pet.hunger}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pet.hunger}%` }}
                className="h-full bg-orange-500"
              />
            </div>
            <div className="flex justify-between text-xs uppercase tracking-tighter mt-2">
              <span>Happiness</span>
              <span>{pet.happiness}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pet.happiness}%` }}
                className="h-full bg-pink-500"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 flex gap-4">
        <button 
          onClick={onFeed}
          disabled={points < 10}
          className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 group"
        >
          <Coffee className="w-4 h-4 group-hover:scale-110 transition-transform" /> Feed (10 pts)
        </button>
        <button 
          onClick={onPlay}
          className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 transition-colors group"
        >
          <Heart className="w-4 h-4 group-hover:scale-110 transition-transform text-pink-500" /> Play
        </button>
      </div>
      <p className="text-[10px] text-white/20 text-center mt-4">Tip: You can drag your pet around!</p>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [petData, setPetData] = useState<PetData | null>(null);
  const [currentStrand, setCurrentStrand] = useState<Strand>('home');
  const [logTab, setLogTab] = useState<'points' | 'cards'>('points');
  const [isRolling, setIsRolling] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [sessionCheckedIn, setSessionCheckedIn] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [sessionStudyTime, setSessionStudyTime] = useState(0);
  
  // Activity tracking
  const lastActivityRef = useRef(Date.now());
  const studyTimerRef = useRef<any>(null);
  const syncTimerRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        handleCheckIn(u);
        setupRealtimeListeners(u.uid);
        startStudyTimer(u.uid);
      } else {
        stopStudyTimer();
      }
    });

    // Activity listeners
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      unsubscribe();
      stopStudyTimer();
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, []);

  const setupRealtimeListeners = (uid: string) => {
    onSnapshot(doc(db, 'users', uid), (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data() as UserData);
      }
    });

    onSnapshot(collection(db, 'users', uid, 'pets'), (snapshot) => {
      if (!snapshot.empty) {
        setPetData(snapshot.docs[0].data() as PetData);
      }
    });

    onSnapshot(query(collection(db, 'users', uid, 'logs'), where('timestamp', '!=', null)), (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PointLog));
      setLogs(newLogs.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()));
    });
  };

  const addPointLog = async (uid: string, type: string, points: number, description: string) => {
    try {
      const logRef = collection(db, 'users', uid, 'logs');
      await setDoc(doc(logRef), {
        type,
        points,
        description,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to add point log. This usually means Firestore Security Rules need to be updated to allow access to the 'logs' subcollection.", e);
    }
  };

  const handleCheckIn = async (u: any) => {
    try {
      const userRef = doc(db, 'users', u.uid);
      const snap = await getDoc(userRef);
      
      const today = getLocalDateString();
      const data = snap.data() as UserData | undefined;
      const lastCheckIn = snap.exists() ? (data?.lastCheckIn ? getLocalDateString(data.lastCheckIn.toDate()) : null) : null;

      let newStreak = data?.streak || 0;
      let isNewDay = lastCheckIn !== today;

      if (isNewDay) {
        // Calculate streak
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = getLocalDateString(yesterdayDate);
        
        if (lastCheckIn === yesterday) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        await updateDoc(userRef, {
          points: increment(10),
          lastCheckIn: serverTimestamp(),
          streak: newStreak
        }).catch(async () => {
          await setDoc(userRef, {
            email: u.email,
            displayName: u.displayName,
            points: 10,
            lastCheckIn: serverTimestamp(),
            studyTimeTotal: 0,
            streak: 1
          }, { merge: true });
        });
        await addPointLog(u.uid, 'check-in', 10, 'Daily Check-in Reward');
      }

      // Fetch Daily Inspiration from CSVs or Gemini
      const needsUpdate = !data?.dailyWordData?.sentEn || !data?.dailyWordData?.sentCn || !data?.dailyQuoteData?.quote || !data?.dailyQuoteData?.trans || isNewDay;
      
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

            const dateStr = getLocalDateString();
            const normalizeDate = (d: string) => {
              if (!d) return '';
              const parts = d.replace(/\//g, '-').split('-');
              if (parts.length !== 3) return '';
              if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              if (parts[2].length === 4) {
                const p0 = parseInt(parts[0]);
                if (p0 > 12) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
              }
              return parts.map(p => p.padStart(2, '0')).join('-');
            };
            
            const rawWordData = words.find(w => {
              const wDate = w.date ? normalizeDate(w.date) : '';
              return wDate === dateStr || wDate.includes(dateStr) || dateStr.includes(wDate);
            }) || words[new Date().getDate() % words.length];

            const rawQuoteData = quotes.find(q => {
              const qDate = q.date ? normalizeDate(q.date) : '';
              return qDate === dateStr || qDate.includes(dateStr) || dateStr.includes(qDate);
            }) || quotes[new Date().getDate() % quotes.length];

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
                  model: "gemini-2.0-flash-exp",
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
              model: "gemini-2.0-flash-exp",
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
    // UI Timer: Updates every second
    studyTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current < 5 * 60 * 1000) { // Active in last 5 mins
        setSessionStudyTime(prev => prev + 1);
      }
    }, 1000);

    // Sync Timer: Updates Firebase every 10 minutes
    syncTimerRef.current = setInterval(async () => {
      const now = Date.now();
      if (now - lastActivityRef.current < 10 * 60 * 1000) {
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
    if (!user) {
      setCurrentStrand('home');
      // Scroll to moon or show login prompt
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentStrand(strand);
  };

  const handleAdoptPet = async () => {
    if (!user || !userData || userData.points < 100) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { points: increment(-100) });
    
    // Pick a random pet
    const randomPet = PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
    
    await addPointLog(user.uid, 'pet', -100, `Adopted ${randomPet.name} the ${randomPet.type}`);
    const petRef = doc(db, 'users', user.uid, 'pets', 'main_pet');
    await setDoc(petRef, {
      name: randomPet.name,
      type: randomPet.type,
      image: randomPet.image,
      hunger: 100,
      happiness: 100,
      level: 1,
      ownerId: user.uid,
      lastFed: serverTimestamp()
    });
  };

  const handleFeedPet = async () => {
    if (!user || !userData || userData.points < 10) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { points: increment(-10) });
    await addPointLog(user.uid, 'pet', -10, `Fed ${petData?.name || 'Pet'}`);
    
    const petRef = doc(db, 'users', user.uid, 'pets', 'main_pet');
    const petSnap = await getDoc(petRef);
    if (petSnap.exists()) {
      await updateDoc(petRef, {
        hunger: Math.min(100, (petSnap.data().hunger || 0) + 15),
        happiness: Math.min(100, (petSnap.data().happiness || 0) + 5)
      });
    }
  };

  const handlePlayWithPet = async () => {
    if (!user || !petData) return;
    
    setIsRolling(true);
    setTimeout(() => setIsRolling(false), 1000);

    // Playing is free but gives happiness
    const petRef = doc(db, 'users', user.uid, 'pets', 'main_pet');
    const petSnap = await getDoc(petRef);
    if (petSnap.exists()) {
      await updateDoc(petRef, {
        happiness: Math.min(100, (petSnap.data().happiness || 0) + 20),
        hunger: Math.max(0, (petSnap.data().hunger || 0) - 5) // Playing makes them a bit hungry
      });
    }
  };

  if (!isAuthReady) return <div className="h-screen flex items-center justify-center"><Star className="animate-spin" /></div>;

  const handleVisitGem = async (gemName: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      points: increment(5) // Correct answer / Activity reward
    });
    await addPointLog(user.uid, 'quiz', 5, `Completed Activity: ${gemName}`);
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

  return (
    <div className="min-h-screen relative">
      <GalaxyBackground />
      
      {/* Header / Stats */}
      <header className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex gap-4">
          {user && userData && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-2 pr-6 rounded-full"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 leading-none">Your Points</p>
                <p className="text-lg font-display font-bold">{userData.points}</p>
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
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 leading-none">Study Time</p>
                <p className="text-lg font-display font-bold">
                  {(userData?.studyTimeTotal || 0) + Math.floor(sessionStudyTime / 60)}m
                </p>
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

      <main className="container mx-auto px-6 pt-32 pb-20">
        <AnimatePresence mode="wait">
          {currentStrand === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative min-h-[80vh] w-full"
            >
              {/* Moon / Check-in - Positioned under stats on the left */}
              <div className="md:absolute md:top-0 md:left-0 z-20 flex flex-col items-center md:items-start gap-6">
                <motion.div
                  animate={{ 
                    boxShadow: ["0 0 40px 10px rgba(255, 255, 255, 0.05)", "0 0 60px 20px rgba(255, 255, 255, 0.15)", "0 0 40px 10px rgba(255, 255, 255, 0.05)"]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-40 h-40 md:w-52 md:h-52 rounded-full bg-white moon-glow flex flex-col items-center justify-center text-black p-4 text-center cursor-pointer overflow-hidden relative shadow-2xl"
                  onClick={!user ? handleLogin : () => setShowCheckIn(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/[0.02] to-black/[0.05] pointer-events-none" />
                  <h1 className="flex flex-col items-center w-full px-2 z-10">
                    <span className="text-xl md:text-2xl font-artistic tracking-[0.05em] leading-tight break-words max-w-full">Tr. Shirley Du</span>
                    <span className="text-sm md:text-base font-zh tracking-[0.1em] opacity-80 mt-1 leading-tight break-words max-w-full">英文Surely DO</span>
                  </h1>
                  {!user ? (
                    <div className="flex items-center gap-2 text-[10px] font-medium opacity-50 mt-2 z-10">
                      <LogIn className="w-3 h-3" /> Check-in
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-medium text-green-600 mt-2 z-10">
                      <Zap className="w-3 h-3" /> Active
                    </div>
                  )}
                </motion.div>
                
                {/* Daily Word/Quote Bubble */}
                {user && userData && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      y: [0, -5, 0]
                    }}
                    transition={{ 
                      scale: { duration: 0.5 },
                      opacity: { duration: 0.5 },
                      y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    onClick={() => setShowCheckIn(true)}
                    className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-4 rounded-[1.5rem] w-full max-w-[200px] cursor-pointer transition-all shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_50px_rgba(100,200,255,0.15)] group z-20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      <p className="text-[7px] uppercase tracking-[0.3em] text-blue-200/40 font-bold">Daily Inspiration</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-display font-bold text-white/90 group-hover:text-white transition-colors leading-tight">
                        {userData.dailyWord}
                      </p>
                      <p className="text-[9px] text-white/40 italic leading-relaxed line-clamp-2">
                        "{userData.dailyQuote}"
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[6px] uppercase tracking-[0.2em] text-blue-200/20 font-bold">Open Pass</span>
                      <Sparkles className="w-2 h-2 text-blue-200/20" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Planets Grid / Solar System Layout - Centered */}
              <div className="relative w-full min-h-[600px] flex items-center justify-center pt-20 md:pt-0">
                {/* Central Star Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                
                {/* Orbital Rings */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="absolute w-[200px] h-[200px] border border-white/5 rounded-full" />
                  <div className="absolute w-[320px] h-[320px] border border-white/5 rounded-full" />
                  <div className="absolute w-[440px] h-[440px] border border-white/5 rounded-full" />
                  <div className="absolute w-[560px] h-[560px] border border-white/5 rounded-full" />
                </div>

                {/* Planets */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {Object.entries(STRANDS).map(([key, info], index) => {
                    const angles = [45, 135, 225, 315];
                    const distances = [100, 160, 220, 280];
                    const angle = angles[index];
                    const distance = distances[index];
                    const x = Math.cos((angle * Math.PI) / 180) * distance;
                    const y = Math.sin((angle * Math.PI) / 180) * distance;

                    return (
                      <div 
                        key={key}
                        className="absolute"
                        style={{ 
                          transform: `translate(${x}px, ${y}px)`
                        }}
                      >
                        <Planet 
                          strand={key as Strand} 
                          info={info} 
                          onClick={() => handleStrandClick(key as Strand)}
                          disabled={!user}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
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
                onFeed={handleFeedPet} 
                onPlay={handlePlayWithPet}
                onAdopt={handleAdoptPet} 
                isRolling={isRolling}
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
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <span className="text-white/40 uppercase tracking-widest text-xs">Activity</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => user && handleCheckIn(user)}
                          className="text-[10px] text-white/20 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" /> Sync Data
                        </button>
                        <span className="text-white/40 uppercase tracking-widest text-xs">Points</span>
                      </div>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {logs.length === 0 ? (
                        <div className="p-12 text-center">
                          <p className="text-white/20 italic mb-4">No logs found yet. Start studying to earn points!</p>
                          <button 
                            onClick={() => user && handleCheckIn(user)}
                            className="text-xs text-white/40 hover:text-white underline"
                          >
                            Sync Points & Inspiration
                          </button>
                        </div>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className="p-6 border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
                            <div>
                              <p className="font-medium text-white/90">{log.description}</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">
                                {log.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                              </p>
                            </div>
                            <div className={cn(
                              "text-lg font-display font-bold",
                              log.points > 0 ? "text-green-400" : "text-red-400"
                            )}>
                              {log.points > 0 ? `+${log.points}` : log.points}
                            </div>
                          </div>
                        ))
                      )}
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
                      <div key={card.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl velvet-texture overflow-hidden relative group">
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
              className="max-w-6xl mx-auto"
            >
              <button 
                onClick={() => {
                  if (showSubjects) setShowSubjects(false);
                  else setCurrentStrand('home');
                }}
                className="mb-12 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm font-medium">{showSubjects ? "Back to Vocabulary" : "Back to Moon Base"}</span>
                  <span className="text-[10px] opacity-60">{showSubjects ? "回到單字區" : "回到首頁"}</span>
                </div>
              </button>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-20">
                <div className={cn("w-32 h-32 rounded-full shrink-0", STRANDS[currentStrand as keyof typeof STRANDS].class)} />
                <div>
                  <h2 className="text-5xl md:text-7xl font-display font-bold mb-2 tracking-tighter">
                    {STRANDS[currentStrand as keyof typeof STRANDS].name}
                  </h2>
                  <h3 className="text-3xl md:text-4xl font-display font-medium text-white/60 mb-4">
                    {STRANDS[currentStrand as keyof typeof STRANDS].nameZh}
                  </h3>
                  <p className="text-xl text-white/30 uppercase tracking-[0.3em]">
                    Strand of {STRANDS[currentStrand as keyof typeof STRANDS].planet}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {showSubjects ? (
                  SUBJECT_GEMS.map((gem, idx) => (
                    <Gem 
                      key={idx} 
                      name={gem.name} 
                      nameZh={gem.nameZh}
                      url={gem.url} 
                      type={gem.type}
                      color={STRANDS[currentStrand as keyof typeof STRANDS].color}
                      onVisit={() => handleVisitGem(gem.name)}
                    />
                  ))
                ) : (
                  GEMS[currentStrand as keyof typeof GEMS].map((gem, idx) => (
                    <Gem 
                      key={idx} 
                      name={gem.name} 
                      nameZh={gem.nameZh}
                      url={gem.url} 
                      type={gem.type || 'diamond'}
                      color={STRANDS[currentStrand as keyof typeof STRANDS].color}
                      onVisit={() => handleVisitGem(gem.name)}
                      onClick={() => gem.url === 'subjects' && setShowSubjects(true)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
              <div className="moon-card relative bg-gradient-to-br from-[#0f0c29] via-[#1a1a4e] to-[#090a0f] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl velvet-texture">
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
                        {selectedCard ? selectedCard.wordData?.pos : userData.dailyWordData?.pos}
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
    </div>
  );
}
