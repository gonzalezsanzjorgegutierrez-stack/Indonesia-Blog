import React, { useState } from 'react';
import type { Story } from '../types/blog';
import { X, Heart, MapPin, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StoryViewerModalProps {
  story: Story | null;
  stories: Story[];
  onClose: () => void;
  onSelectStory: (story: Story) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  story,
  stories,
  onClose,
  onSelectStory,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [likes, setLikes] = useState(story ? story.likes : 0);

  if (!story) return null;

  const currentIndex = stories.findIndex((s) => s.id === story.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < stories.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectStory(stories[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectStory(stories[currentIndex + 1]);
  };

  const handleLike = (e: React.MouseEvent) => {
    setLikes((prev) => prev + 1);
    const rect = e.currentTarget.getBoundingClientRect();
    confetti({
      particleCount: 30,
      spread: 50,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4">
      
      {/* Outer Close Click Area */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Story Container (Phone / Reel aspect ratio) */}
      <div className="relative w-full max-w-sm h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black flex flex-col justify-between">
        
        {/* Media (Video or Image) */}
        <div className="absolute inset-0 z-0">
          {story.type === 'video' ? (
            <video
              src={story.mediaUrl}
              autoPlay
              loop
              muted={!isPlaying}
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={story.mediaUrl}
              alt={story.title}
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        {/* Top Story Header */}
        <div className="relative z-10 p-4 space-y-2">
          {/* Progress Bar Indicators */}
          <div className="flex space-x-1">
            {stories.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1 flex-1 rounded-full ${
                  idx === currentIndex ? 'bg-[#E07A5F]' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-white pt-2">
            <div className="flex items-center space-x-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#E07A5F] to-[#2A9D8F] p-0.5">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div>
                <span className="font-bold text-xs block leading-tight">Diario de Viaje</span>
                <span className="text-[10px] text-emerald-200/80 flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5 text-[#E07A5F]" />
                  {story.location} • {story.timestamp}
                </span>
              </div>
            </div>

            {story.type === 'video' && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-full bg-black/40 text-white"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Touch Areas */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-20 flex items-center justify-start pl-2">
          {hasPrev && (
            <button onClick={handlePrev} className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="absolute inset-y-0 right-0 w-1/3 z-20 flex items-center justify-end pr-2">
          {hasNext && (
            <button onClick={handleNext} className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50">
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Story Footer */}
        <div className="relative z-10 p-4 space-y-3">
          <h3 className="text-white font-bold text-base leading-snug drop-shadow-md">
            {story.title}
          </h3>

          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#E07A5F] text-white font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Heart className="h-4 w-4 fill-white" />
              <span>{likes} Loves</span>
            </button>

            <span className="text-xs text-white/80 glass-pill px-3 py-1 rounded-full">
              {currentIndex + 1} de {stories.length}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
