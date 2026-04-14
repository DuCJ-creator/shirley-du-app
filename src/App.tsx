import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, Star, Sparkles, BookOpen, Mic2, PenTool, GraduationCap, 
  Home, User, Trophy, Heart, Coffee, ChevronLeft, ExternalLink,
  LogIn, LogOut, Clock, Zap
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot,
  collection, query, where
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
}

interface PetData {
  name: string;
  type: string;
  hunger: number;
  happiness: number;
  level: number;
}

// --- Constants ---
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
    { name: 'Grammar Music Garden', nameZh: '文法音樂花園', url: 'https://ducj-creator.github.io/Shirley-AI-Music-Studio/learning/index.html', type: 'amethyst' },
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

// --- Components ---

const GalaxyBackground = () => <div className="galaxy-bg" />;

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

const PetSection = ({ points, pet, onFeed, onAdopt }: { points: number, pet: PetData | null, onFeed: () => void, onAdopt: () => void }) => {
  if (!pet) return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
      <h3 className="text-xl font-display mb-4">Adopt a Space Pet</h3>
      <p className="text-white/60 mb-6">Use your hard-earned points to adopt a celestial companion!</p>
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-4xl">
          🐱
        </div>
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
          className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Coffee className="w-4 h-4" /> Feed (10 pts)
        </button>
        <button className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Heart className="w-4 h-4" /> Play
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [petData, setPetData] = useState<PetData | null>(null);
  const [currentStrand, setCurrentStrand] = useState<Strand>('home');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [sessionCheckedIn, setSessionCheckedIn] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
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
      
      const todayDate = new Date();
      const today = todayDate.toDateString();
      const data = snap.data() as UserData | undefined;
      const lastCheckIn = snap.exists() ? data?.lastCheckIn?.toDate?.()?.toDateString() : null;

      let newStreak = data?.streak || 0;
      let isNewDay = lastCheckIn !== today;

      if (isNewDay) {
        // Calculate streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastCheckIn === yesterdayStr) {
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
      if (!data?.dailyWordData || isNewDay) {
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
              const lines = csv.split('\n').filter(l => l.trim());
              const headers = lines[0].split(',').map(h => h.trim());
              return lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                return headers.reduce((obj: any, header, i) => {
                  obj[header] = values[i];
                  return obj;
                }, {});
              });
            };

            const words = parseCsv(wordCsv);
            const quotes = parseCsv(quoteCsv);

            // Match by date (assuming YYYY-MM-DD or similar in first column)
            const dateStr = todayDate.toISOString().split('T')[0];
            wordData = words.find(w => w.Date === dateStr) || words[todayDate.getDate() % words.length];
            quoteData = quotes.find(q => q.Date === dateStr) || quotes[todayDate.getDate() % quotes.length];
          }

          if (wordData && quoteData) {
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
              model: "gemini-3-flash-preview",
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
    await addPointLog(user.uid, 'pet', -100, 'Adopted Luna the Cosmic Cat');
    const petRef = doc(db, 'users', user.uid, 'pets', 'main_pet');
    await setDoc(petRef, {
      name: "Luna",
      type: "Cosmic Cat",
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
    // Update points and pet hunger
    await updateDoc(userRef, { points: increment(-10) });
    await addPointLog(user.uid, 'pet', -10, 'Fed Luna');
    // Assuming one pet for now
    const petSnap = await getDoc(doc(db, 'users', user.uid, 'pets', 'main_pet'));
    if (petSnap.exists()) {
      await updateDoc(doc(db, 'users', user.uid, 'pets', 'main_pet'), {
        hunger: Math.min(100, (petSnap.data().hunger || 0) + 10),
        happiness: Math.min(100, (petSnap.data().happiness || 0) + 5)
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              {/* Moon / Check-in */}
              <div className="relative mb-24">
                <motion.div
                  animate={{ 
                    boxShadow: ["0 0 60px 20px rgba(255, 255, 255, 0.1)", "0 0 80px 30px rgba(255, 255, 255, 0.2)", "0 0 60px 20px rgba(255, 255, 255, 0.1)"]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-white moon-glow flex flex-col items-center justify-center text-black p-8 text-center cursor-pointer"
                  onClick={!user ? handleLogin : () => {}}
                >
                  <h1 className="flex flex-col items-center whitespace-nowrap">
                    <span className="text-3xl md:text-5xl font-artistic tracking-[0.1em] title-glow leading-tight">Tr. Shirley Du</span>
                    <span className="text-xl md:text-2xl font-zh tracking-[0.2em] opacity-90 mt-1 leading-tight">英文Surely DO</span>
                  </h1>
                  {!user ? (
                    <div className="flex items-center gap-2 text-sm font-medium opacity-60 mt-4">
                      <LogIn className="w-4 h-4" /> Click to Check-in
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 mt-4">
                      <Zap className="w-4 h-4" /> Checked In
                    </div>
                  )}
                </motion.div>
                
                {/* Daily Word/Quote Bubble */}
                {user && userData && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-12 -right-12 md:-right-24 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl max-w-[200px] md:max-w-[250px]"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Daily Inspiration</p>
                    <p className="text-lg font-display font-medium mb-1">"{userData.dailyWord}"</p>
                    <p className="text-xs text-white/60 italic leading-relaxed">{userData.dailyQuote}</p>
                  </motion.div>
                )}
              </div>

              {/* Planets Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
                {Object.entries(STRANDS).map(([key, info]) => (
                  <Planet 
                    key={key} 
                    strand={key as Strand} 
                    info={info} 
                    onClick={() => handleStrandClick(key as Strand)}
                    disabled={!user}
                  />
                ))}
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
              <PetSection points={userData?.points || 0} pet={petData} onFeed={handleFeedPet} onAdopt={handleAdoptPet} />
            </motion.div>
          ) : currentStrand === 'logs' ? (
            <motion.div
              key="logs"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto pt-12"
            >
              <h2 className="text-4xl font-display font-bold mb-8 text-center">Points History</h2>
              <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <span className="text-white/40 uppercase tracking-widest text-xs">Activity</span>
                  <span className="text-white/40 uppercase tracking-widest text-xs">Points</span>
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
        {showCheckIn && userData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowCheckIn(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-lg mx-auto"
            >
              <div className="moon-card relative bg-[#0a0a0c] border-2 border-white/20 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)] velvet-texture">
                <div className="card-decoration-top h-2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                
                <div className="p-8 md:p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h4 className="text-[10px] tracking-[0.4em] text-white/40 uppercase font-bold">Moon Base Clearance</h4>
                      <p className="text-xs text-white/60 font-mono">NO. {new Date().toISOString().split('T')[0].replace(/-/g, '')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] tracking-widest text-white/40 uppercase">Status</p>
                      <p className="text-xs text-green-400 font-bold uppercase">Authorized</p>
                    </div>
                  </div>

                  <div className="mb-10">
                    <h3 className="text-2xl font-display font-light text-white/90 mb-1">
                      Welcome, <span className="font-bold text-white">{user?.displayName?.split(' ')[0] || 'Traveler'}</span>
                    </h3>
                    <p className="text-sm text-white/40">
                      This is your Shirley's Moon Base Card for <span className="text-white/60">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-10 text-white/20">
                    <span>✦</span><span>✦</span><span>✦</span>
                  </div>

                  {/* Word of the Day Section */}
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4 font-bold">Word of the Day</p>
                    <div className="flex items-baseline gap-3 mb-2">
                      <h2 className="text-3xl font-display font-bold text-white">{userData.dailyWordData?.word || userData.dailyWord}</h2>
                      <span className="text-sm italic text-white/40">{userData.dailyWordData?.pos}</span>
                    </div>
                    <p className="text-sm text-white/80 mb-4 leading-relaxed">{userData.dailyWordData?.def}</p>
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <p className="text-sm text-white/60 italic leading-relaxed">{userData.dailyWordData?.sentEn}</p>
                      <p className="text-sm text-white/40 font-zh">{userData.dailyWordData?.sentCn}</p>
                    </div>
                  </div>

                  {/* Quote Section */}
                  <div className="bg-white/5 rounded-3xl p-6 border border-white/10 mb-8">
                    <p className="text-sm text-white/90 italic mb-2 leading-relaxed">"{userData.dailyQuoteData?.quote || userData.dailyQuote}"</p>
                    <p className="text-xs text-white/40 font-zh mb-3">{userData.dailyQuoteData?.trans}</p>
                    <p className="text-right text-[10px] uppercase tracking-widest text-white/40">— {userData.dailyQuoteData?.author}</p>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                      <span className="text-lg">🔥</span>
                      <span className="text-xs font-bold text-white/80">Streak: {userData.streak || 1}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-artistic text-lg text-white/60">Teacher Shirley</p>
                      <p className="text-[8px] uppercase tracking-[0.3em] text-white/20">Signature of Authority</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[40px] font-bold text-white/[0.02] pointer-events-none select-none tracking-[0.5em]">
                  MOON BASE
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 pointer-events-none" />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => {
                    // Placeholder for download logic
                    alert("Image download feature coming soon! You can take a screenshot for now.");
                  }}
                  className="flex-1 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  📥 Download Image (收藏)
                </button>
                <button 
                  onClick={() => setShowCheckIn(false)}
                  className="flex-1 py-4 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  ✕ Close (放入卡袋)
                </button>
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
