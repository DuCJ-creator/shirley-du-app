import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Clock, ExternalLink, Monitor, Tablet, Smartphone, 
  X, Zap, Sparkles 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GEMS } from '../constants/gems';
import { SUBJECT_GEMS } from '../constants/gems';

export const EmbeddedPortal = ({ 
  url, 
  user, 
  onClose, 
  onLogPoints 
}: { 
  url: string, 
  user: any, 
  onClose: () => void, 
  onLogPoints: (type: string, amount: number, points: number, desc: string) => Promise<void> 
}) => {
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [isTrackerVisible, setIsTrackerVisible] = useState(true);
  const [isTrackerExpanded, setIsTrackerExpanded] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);
  
  const [viewportMode, setViewportMode] = useState<'fit' | 'medium' | 'tall'>(() => {
    if (url.includes('hungry-snake') || url.includes('etgame.html')) {
      return 'tall';
    }
    return 'fit';
  });

  const currentGemMetadata = useMemo(() => {
    // Check in GEMS
    for (const [strandKey, strandGems] of Object.entries(GEMS)) {
      const found = (strandGems as any[]).find(g => g.url === url);
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
    if (url.includes('vocab-escape.vercel.app') || url.includes('vocab-escape-proxy')) {
      return {
        name: 'Vocab Escape Room',
        nameZh: '單字密室逃脫',
        category: 'Spaceship Portal • 密室逃脫',
        type: 'ruby'
      };
    }
    return {
      name: 'Interactive Cosmic Gem',
      nameZh: '星際學習寶石',
      category: 'Cosmic Study • 星際學習',
      type: 'diamond'
    };
  }, [url]);

  const iframeSrc = (url.includes('vocab-escape.vercel.app') || url.includes('vocab-escape-proxy')) ? '/vocab-escape-proxy/' : url;

  // Window visibility & focus checking
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
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

  return (
    <motion.div 
      id="portal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex flex-col bg-zinc-950 backdrop-blur-2xl"
    >
      <div className="flex flex-col w-full h-full p-1 sm:p-2.5 md:p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-2 shrink-0 bg-zinc-900/40 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-white/5 shadow-inner">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={onClose}
              className="flex items-center gap-1.5 text-white/95 hover:bg-white/10 transition-all group px-2.5 py-1.5 bg-white/5 rounded-xl border border-white/10 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-zinc-300" />
              <div className="flex flex-col items-start leading-none text-left">
                <span className="font-bold text-[10px] tracking-wider uppercase text-white">Close</span>
                <span className="text-[8px] opacity-60 text-zinc-400">關閉</span>
              </div>
            </button>

            <button 
              onClick={() => setIsTrackerVisible(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 transition-all px-2.5 py-1.5 rounded-xl border active:scale-95 select-none cursor-pointer",
                isTrackerVisible 
                  ? "text-zinc-300 hover:bg-white/10 bg-white/5 border-white/10"
                  : "text-cyan-300 hover:bg-cyan-500/10 bg-cyan-500/5 border-cyan-500/20"
              )}
              title={isTrackerVisible ? "Hide Study Tracker" : "Show Study Tracker"}
            >
              <Clock className="w-3.5 h-3.5 text-current animate-pulse" />
              <div className="flex flex-col items-start leading-none text-left">
                <span className="font-bold text-[10px] tracking-wider uppercase">
                  {isTrackerVisible ? "Hide Tracker" : "Show Tracker"}
                </span>
                <span className="text-[8px] opacity-60">
                  {isTrackerVisible ? "隱藏監測" : "顯示監測"}
                </span>
              </div>
            </button>

            <button 
              onClick={() => window.open(url.includes('vocab-escape-proxy') ? 'https://vocab-escape.vercel.app' : url, '_blank')}
              className="flex items-center gap-1.5 text-amber-300 hover:bg-amber-500/10 bg-amber-500/5 border border-amber-500/20 transition-all px-2.5 py-1.5 rounded-xl active:scale-95 select-none cursor-pointer"
              title="Open in a new tab for the best fullscreen experience"
            >
              <ExternalLink className="w-3.5 h-3.5 text-current" />
              <div className="flex flex-col items-start leading-none text-left">
                <span className="font-bold text-[10px] tracking-wider uppercase text-amber-300">New Tab</span>
                <span className="text-[8px] opacity-60 text-amber-400">新分頁開啟</span>
              </div>
            </button>

            <button 
              onClick={() => {
                setViewportMode(prev => {
                  if (prev === 'fit') return 'medium';
                  if (prev === 'medium') return 'tall';
                  return 'fit';
                });
              }}
              className="flex items-center gap-1.5 text-emerald-300 hover:bg-emerald-500/10 bg-emerald-500/5 border border-emerald-500/20 transition-all px-2.5 py-1.5 rounded-xl active:scale-95 select-none cursor-pointer"
              title="Change iframe sizing mode to fit games/pages perfectly"
            >
              {viewportMode === 'fit' && <Monitor className="w-3.5 h-3.5 text-emerald-400" />}
              {viewportMode === 'medium' && <Tablet className="w-3.5 h-3.5 text-emerald-400" />}
              {viewportMode === 'tall' && <Smartphone className="w-3.5 h-3.5 text-emerald-400" />}
              
              <div className="flex flex-col items-start leading-none text-left">
                <span className="font-bold text-[10px] tracking-wider uppercase text-emerald-300">
                  {viewportMode === 'fit' && "Fit Screen"}
                  {viewportMode === 'medium' && "Tall Mode"}
                  {viewportMode === 'tall' && "Extra Tall"}
                </span>
                <span className="text-[8px] opacity-60 text-emerald-400">
                  {viewportMode === 'fit' && "滿版適應"}
                  {viewportMode === 'medium' && "長版 800px"}
                  {viewportMode === 'tall' && "超長 1100px"}
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 truncate text-right">
            <span className="text-[9px] text-cyan-400 font-mono uppercase bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/10 truncate max-w-[100px] sm:max-w-none">
              {currentGemMetadata.category}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate font-sans">
              {currentGemMetadata.nameZh}
            </span>
            <span className="hidden sm:inline text-xs text-zinc-400 truncate font-mono">
              ({currentGemMetadata.name})
            </span>
          </div>
        </div>

        <div className="flex-1 relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] flex flex-col min-h-0">
          <div className="flex-1 w-full h-full relative bg-zinc-900 overflow-auto">
            <iframe 
              src={iframeSrc} 
              className={cn(
                "w-full border-none bg-zinc-900 transition-all duration-300",
                viewportMode === 'fit' && "h-full min-h-[600px] sm:min-h-0",
                viewportMode === 'medium' && "h-[800px]",
                viewportMode === 'tall' && "h-[1100px]"
              )}
              title="Embedded Subject Content"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; geolocation"
              allowFullScreen
              scrolling="yes"
              style={{ WebkitOverflowScrolling: 'touch' }}
            />

            {isTrackerVisible && (
              <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)]">
                <AnimatePresence mode="wait">
                  {isTrackerExpanded ? (
                    <motion.div
                      key="expanded-tracker"
                      initial={{ opacity: 0, scale: 0.9, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 15 }}
                      className="w-72 sm:w-80 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span>Study Tracker • 學習監測</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setIsTrackerExpanded(false)}
                            className="p-1 px-2 text-[9px] uppercase font-bold tracking-wider bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5 active:scale-95 flex items-center gap-1 cursor-pointer"
                            title="Collapse view"
                          >
                            <span>Roll Up</span>
                          </button>
                          <button 
                            onClick={() => setIsTrackerVisible(false)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg border border-transparent hover:border-white/5 transition-colors active:scale-95 cursor-pointer"
                            title="Remove/Hide tracker"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-cyan-400/80 animate-ping shrink-0" />
                          <span className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold font-mono">
                            {currentGemMetadata.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-0.5">{currentGemMetadata.nameZh}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono">{currentGemMetadata.name}</p>
                        
                        <div className="text-[10px] text-amber-300 bg-amber-950/25 border border-amber-900/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 mt-2 leading-relaxed">
                          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400 animate-bounce" />
                          <span>Earn +10 pts for every 1 minute of active play & study!</span>
                        </div>
                      </div>

                      {!user ? (
                        <div className="p-3 bg-amber-950/25 border border-amber-900/40 rounded-xl text-center">
                          <p className="text-[10px] text-amber-200">
                            Guest Mode. Sign in on Moon Base via Google to save cosmic points permanently!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col items-center justify-center text-center">
                            <span className="text-[9px] text-zinc-400 font-semibold tracking-widest uppercase mb-1 font-sans">Session Duration</span>
                            <p className="text-2xl font-mono font-bold text-white tracking-widest leading-none my-1">
                              {String(Math.floor(activeSeconds / 60)).padStart(2, '0')}
                              <span className="text-cyan-500 animate-pulse">:</span>
                              {String(activeSeconds % 60).padStart(2, '0')}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {isWindowFocused ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider font-sans">Active Practice</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                  <span className="text-[8px] text-orange-400 font-bold uppercase tracking-wider font-sans">Time Paused</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="p-2.5 bg-zinc-900/30 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Session Earnings:</span>
                            <span className="font-bold text-emerald-400 font-mono">+{currentMinute * 10} pts</span>
                          </div>
                        </div>
                      )}

                      {claimSuccessMsg && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] text-center font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-950/40 p-2 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>{claimSuccessMsg}</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="collapsed-tracker"
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-zinc-950/90 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] select-none"
                    >
                      <button
                        onClick={() => setIsTrackerExpanded(true)}
                        className="flex items-center gap-2 text-left cursor-pointer active:scale-95 select-none"
                      >
                        <div className="relative flex items-center justify-center">
                          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 leading-none">
                          <span className="text-xs font-mono font-bold text-white tracking-wider">
                            {String(Math.floor(activeSeconds / 60)).padStart(2, '0')}:{String(activeSeconds % 60).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-400 font-mono bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-500/10">
                            +{currentMinute * 10}
                          </span>
                        </div>

                        <span className="text-[9px] uppercase font-bold tracking-widest text-cyan-400 border-l border-white/10 pl-2 hover:text-white transition-colors">
                          Tracker
                        </span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTrackerVisible(false);
                        }}
                        className="ml-1.5 p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                        title="Remove/Hide Tracker"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          <div className="hidden sm:block absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/10 rounded-tl-[2.5rem] pointer-events-none" />
          <div className="hidden sm:block absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/10 rounded-tr-[2.5rem] pointer-events-none" />
          <div className="hidden sm:block absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/10 rounded-bl-[2.5rem] pointer-events-none" />
          <div className="hidden sm:block absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/10 rounded-br-[2.5rem] pointer-events-none" />
        </div>
        
        <div className="mt-2 text-center shrink-0">
          <p className="text-[8px] uppercase tracking-[0.4em] text-white/20 font-medium">Teacher Shirley • Universal Education Cluster</p>
        </div>
      </div>
    </motion.div>
  );
};
