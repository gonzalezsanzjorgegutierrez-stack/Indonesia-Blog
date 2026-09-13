import React from 'react';
import { Play, Sparkles, Plus, MapPin } from 'lucide-react';
import type { Story } from '../types/blog';

interface StoryBarProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onAddStoryClick: () => void;
}

export const StoryBar: React.FC<StoryBarProps> = ({ stories, onSelectStory, onAddStoryClick }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-200/90 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#E07A5F]" />
          Historias del Día (Momento Vivo)
        </h2>
        <span className="text-xs text-emerald-300/60">Haz clic para ver la reel completa</span>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-2 pt-1 scrollbar-none">
        
        {/* Add Story Button (For Couple) */}
        <button
          onClick={onAddStoryClick}
          className="flex-shrink-0 flex flex-col items-center group cursor-pointer"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-dashed border-[#E07A5F]/60 flex items-center justify-center bg-emerald-900/40 group-hover:bg-[#E07A5F]/20 group-hover:border-[#E07A5F] transition-all group-hover:scale-105">
            <Plus className="h-6 w-6 text-[#E07A5F] group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs text-emerald-200 mt-1.5 font-medium group-hover:text-white">
            + Subir
          </span>
        </button>

        {/* Stories List */}
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => onSelectStory(story)}
            className="flex-shrink-0 flex flex-col items-center group cursor-pointer text-left"
          >
            {/* Story Avatar Ring */}
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#E07A5F] via-[#E9C46A] to-[#2A9D8F] group-hover:scale-105 transition-transform shadow-lg shadow-emerald-950/50">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-[#0c1a16] bg-emerald-950 relative">
                {story.type === 'video' ? (
                  <video 
                    src={story.mediaUrl} 
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    muted 
                    playsInline 
                  />
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt={story.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                
                {story.type === 'video' && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-white opacity-90" />
                  </div>
                )}
              </div>
              
              {/* Live Badge */}
              <span className="absolute bottom-0 right-0 bg-[#E07A5F] text-[10px] text-white font-bold px-1.5 py-0.2 rounded-full border border-[#0c1a16] shadow">
                {story.type === 'video' ? 'VIDEO' : 'STORY'}
              </span>
            </div>

            {/* Title & Location */}
            <span className="text-xs text-emerald-100 mt-1.5 font-medium max-w-[80px] truncate group-hover:text-[#E07A5F]">
              {story.title}
            </span>
            <span className="text-[10px] text-emerald-300/60 flex items-center gap-0.5 max-w-[85px] truncate">
              <MapPin className="h-2.5 w-2.5 text-[#2A9D8F]" />
              {story.location}
            </span>
          </button>
        ))}

      </div>
    </div>
  );
};
