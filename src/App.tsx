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

// --- Types ---
type Strand = 'vocabulary' | 'pronunciation' | 'grammar' | 'tests' | 'home';

interface UserData {
  points: number;
  lastCheckIn: any;
  dailyWord: string;
  dailyQuote: string;
  studyTimeTotal: number;
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
  vocabulary: { name: 'Vocabulary', planet: 'Venus', color: '#ffd700', icon: BookOpen, class: 'planet-venus' },
  pronunciation: { name: 'Pronunciation', planet: 'Mars', color: '#ff4500', icon: Mic2, class: 'planet-mars' },
  grammar: { name: 'Grammar', planet: 'Mercury', color: '#a9a9a9', icon: PenTool, class: 'planet-mercury' },
  tests: { name: 'Tests', planet: 'Jupiter', color: '#deb887', icon: GraduationCap, class: 'planet-jupiter' },
};

const GEMS = {
  vocabulary: [
    { name: 'Wonderland 1', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/vocab-wonderland.html' },
    { name: 'Wonderland 2', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/vocab-wonderland.html' },
    { name: 'Wonderland 3', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/vocab-wonderland.html' },
    { name: 'Wonderland 4', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/vocab-wonderland.html' },
    { name: 'Wonderland 5', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/vocab-wonderland.html' },
    { name: 'Wonderland 6', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/vocab-wonderland.html' },
    { name: 'Wonderland 7', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/vocab-wonderland.html' },
    { name: 'Bilingual Subjects', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/vocab-wonderland.html' },
  ],
  pronunciation: [
    { name: 'KK Phonics', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/kk.html' },
    { name: 'International Phonics', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/ipa.html' },
  ],
  grammar: [
    { name: 'Lemon Tree', url: 'https://ducj-creator.github.io/Shirley-Grammar/' },
    { name: 'Music Garden', url: 'https://ducj-creator.github.io/Shirley-AI-Music-Studio/learning/index.html' },
    { name: 'CAP Grammar', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/CAP%20grammar.html' },
  ],
  tests: [
    { name: 'CAP Vocab & Grammar', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/CAP%20pastpapers.html' },
    { name: 'CAP Listening', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/cap%20listening.html' },
    { name: 'CAP Reading', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/cap%20reading.html' },
    { name: 'GSAT Vocabulary', url: 'https://ducj-creator.github.io/Teacher-Shirley/study-tools/GSAT%20Vocab.html' },
    { name: 'GSAT Comprehensive', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/GSAT%20Comprehensive.html' },
    { name: 'GSAT Cloze', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/GSAT%20cloze.html' },
    { name: 'GSAT Reading', url: 'https://ducj-creator.github.io/Teacher-Shirley/tests/gsat%20reading.html' },
  ]
};

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
    <span className="text-xs text-white/40 uppercase tracking-widest">{info.planet}</span>
  </motion.div>
);

const Gem = ({ name, url, color, onVisit }: { name: string, url: string, color: string, onVisit: () => void, key?: any }) => (
  <motion.a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.05, y: -5 }}
    onClick={onVisit}
    className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-3 group overflow-hidden"
  >
    <div 
      className="w-12 h-12 rotate-45 border-2 flex items-center justify-center transition-all duration-300 group-hover:rotate-90"
      style={{ borderColor: color, color: color, boxShadow: `0 0 15px ${color}44` }}
    >
      <Sparkles className="w-6 h-6 -rotate-45 group-hover:-rotate-90 transition-all duration-300" />
    </div>
    <span className="text-center font-medium text-sm text-white/80 group-hover:text-white">{name}</span>
    <ExternalLink className="absolute top-2 right-2 w-3 h-3 text-white/20 group-hover:text-white/60" />
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
  </motion.a>
);

const PetSection = ({ points, pet, onFeed }: { points: number, pet: PetData | null, onFeed: () => void }) => {
  if (!pet) return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
      <h3 className="text-xl font-display mb-4">Adopt a Space Pet</h3>
      <p className="text-white/60 mb-6">Use your hard-earned points to adopt a celestial companion!</p>
      <button className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors">
        Adopt for 500 Points
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
  
  // Activity tracking
  const lastActivityRef = useRef(Date.now());
  const studyTimerRef = useRef<any>(null);

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
  };

  const handleCheckIn = async (u: any) => {
    const userRef = doc(db, 'users', u.uid);
    const snap = await getDoc(userRef);
    
    const today = new Date().toDateString();
    const lastCheckIn = snap.exists() ? snap.data().lastCheckIn?.toDate?.()?.toDateString() : null;

    if (lastCheckIn !== today) {
      // New check-in
      const dailyWord = "Ethereal"; // Mock - could use Gemini here
      const dailyQuote = "The stars are not reachable, but they are visible.";
      
      await setDoc(userRef, {
        email: u.email,
        displayName: u.displayName,
        points: increment(10),
        lastCheckIn: serverTimestamp(),
        dailyWord,
        dailyQuote,
      }, { merge: true });
      
      setShowCheckIn(true);
    }
  };

  const startStudyTimer = (uid: string) => {
    studyTimerRef.current = setInterval(async () => {
      const now = Date.now();
      // Only award points if active in last 10 minutes
      if (now - lastActivityRef.current < 10 * 60 * 1000) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          points: increment(5),
          studyTimeTotal: increment(10)
        });
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  };

  const stopStudyTimer = () => {
    if (studyTimerRef.current) clearInterval(studyTimerRef.current);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
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

  const handleFeedPet = async () => {
    if (!user || !userData || userData.points < 10) return;
    const userRef = doc(db, 'users', user.uid);
    // Update points and pet hunger
    await updateDoc(userRef, { points: increment(-10) });
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

  const handleVisitGem = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      points: increment(2) // Small reward for visiting
    });
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
                <p className="text-lg font-display font-bold">{userData?.studyTimeTotal || 0}m</p>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="pointer-events-auto flex gap-4">
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
                  <h1 className="text-xl md:text-2xl font-display font-bold leading-tight mb-2">
                    Teacher Shirley Du<br/>英文 Surely Do
                  </h1>
                  {!user ? (
                    <div className="flex items-center gap-2 text-sm font-medium opacity-60">
                      <LogIn className="w-4 h-4" /> Click to Check-in
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
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

              {/* Pet Section */}
              {user && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-32 w-full max-w-2xl"
                >
                  <PetSection points={userData?.points || 0} pet={petData} onFeed={handleFeedPet} />
                </motion.div>
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
                onClick={() => setCurrentStrand('home')}
                className="mb-12 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                Back to Moon Base
              </button>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-20">
                <div className={cn("w-32 h-32 rounded-full shrink-0", STRANDS[currentStrand as keyof typeof STRANDS].class)} />
                <div>
                  <h2 className="text-5xl md:text-7xl font-display font-bold mb-4 tracking-tighter">
                    {STRANDS[currentStrand as keyof typeof STRANDS].name}
                  </h2>
                  <p className="text-xl text-white/40 uppercase tracking-[0.3em]">
                    Strand of {STRANDS[currentStrand as keyof typeof STRANDS].planet}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {GEMS[currentStrand as keyof typeof GEMS].map((gem, idx) => (
                  <Gem 
                    key={idx} 
                    name={gem.name} 
                    url={gem.url} 
                    color={STRANDS[currentStrand as keyof typeof STRANDS].color}
                    onVisit={handleVisitGem}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Check-in Modal */}
      <AnimatePresence>
        {showCheckIn && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowCheckIn(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-white/10 p-12 rounded-[3rem] max-w-md w-full text-center"
            >
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-yellow-500" />
              </div>
              <h3 className="text-3xl font-display font-bold mb-2">Daily Check-in!</h3>
              <p className="text-white/60 mb-8">You've received <span className="text-white font-bold">10 Points</span> for visiting the Moon Base today.</p>
              <button 
                onClick={() => setShowCheckIn(false)}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-white/90 transition-colors"
              >
                Continue Journey
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-full flex gap-8 z-50">
        <button onClick={() => setCurrentStrand('home')} className={cn("p-2 transition-colors", currentStrand === 'home' ? "text-white" : "text-white/40 hover:text-white/60")}>
          <Home className="w-6 h-6" />
        </button>
        <button className="p-2 text-white/40 hover:text-white/60">
          <User className="w-6 h-6" />
        </button>
        <button className="p-2 text-white/40 hover:text-white/60">
          <Star className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
}
