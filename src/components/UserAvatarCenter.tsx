import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, RefreshCw } from 'lucide-react';

export const UserAvatarCenter = ({ userData, onUpdate }: { userData: any, onUpdate: (data: any) => void }) => {
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
      if (file.size > 800 * 1024) { // 800KB limit
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
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-xs">
          <Camera className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Switch Avatar Button */}
      <button
        onClick={toggleAvatar}
        className="mt-3 text-xs bg-white/10 hover:bg-white/20 text-white/90 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
        <span>
          {userData?.avatarType === 'cosmic' ? 'Switch to Cute Avatar' : 
           userData?.avatarType === 'cute' ? 'Upload Custom Avatar' : 'Reset to Cosmic Avatar'}
        </span>
      </button>

      {/* Status Messages */}
      {errorMessage && (
        <p className="mt-2 text-xs text-rose-400 font-medium bg-rose-950/60 border border-rose-800/50 px-2.5 py-1 rounded-md backdrop-blur-md animate-fade-in">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p className="mt-2 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-md backdrop-blur-md animate-fade-in">
          {successMessage}
        </p>
      )}
    </div>
  );
};
