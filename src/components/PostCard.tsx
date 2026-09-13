import React from 'react';
import type { Post } from '../types/blog';
import { MapPin, Calendar, Heart, MessageSquare, Video, ArrowRight, Star } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onOpenDetail: (post: Post) => void;
  onLike: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onOpenDetail, onLike }) => {
  return (
    <article className="glass-card rounded-3xl overflow-hidden flex flex-col h-full border border-white/10 group transition-all duration-300">
      
      {/* Cover Image Container */}
      <div 
        onClick={() => onOpenDetail(post)}
        className="relative h-64 sm:h-72 w-full overflow-hidden cursor-pointer bg-emerald-950"
      >
        <img
          src={post.coverImage}
          alt={post.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a16] via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="glass-pill px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 shadow-md flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#E07A5F]" />
            Día {post.dayNumber}
          </span>

          <div className="flex gap-2">
            {post.isFeatured && (
              <span className="bg-[#E07A5F] text-white p-1.5 rounded-full shadow-lg" title="Destacado">
                <Star className="h-3.5 w-3.5 fill-white" />
              </span>
            )}
            {post.videoUrl && (
              <span className="bg-[#2A9D8F] text-white p-1.5 rounded-full shadow-lg" title="Incluye Vídeo">
                <Video className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>

        {/* Location Badge on Bottom of Image */}
        <div className="absolute bottom-3 left-4 z-10">
          <span className="glass-panel px-3 py-1 rounded-lg text-xs font-medium text-emerald-100 flex items-center gap-1 border border-white/15">
            <MapPin className="h-3.5 w-3.5 text-[#E07A5F]" />
            {post.locationName}
          </span>
        </div>
      </div>

      {/* Post Details Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          
          {/* Date & Island Pill */}
          <div className="flex items-center justify-between text-xs text-emerald-300/70">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#2A9D8F]" />
              {post.date}
            </span>
            <span className="font-semibold text-emerald-200 uppercase tracking-wider text-[10px] bg-emerald-900/50 px-2 py-0.5 rounded-md">
              {post.island}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onOpenDetail(post)}
            className="font-serif-title text-xl sm:text-2xl font-bold text-white group-hover:text-[#E07A5F] transition-colors cursor-pointer line-clamp-2 leading-snug"
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-emerald-100/80 font-light line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Tags Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-emerald-200 border border-white/5 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

        </div>

        {/* Card Footer: Interaction & Read Button */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-emerald-200">
            
            {/* Like Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike(post.id);
              }}
              className="flex items-center space-x-1.5 hover:text-[#E07A5F] transition-colors group/btn"
            >
              <Heart className="h-4 w-4 text-[#E07A5F] group-hover/btn:scale-125 transition-transform fill-[#E07A5F]/20" />
              <span className="font-semibold">{post.likes}</span>
            </button>

            {/* Comments Count */}
            <button 
              onClick={() => onOpenDetail(post)}
              className="flex items-center space-x-1.5 hover:text-[#2A9D8F] transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-[#2A9D8F]" />
              <span className="font-semibold">{post.comments.length}</span>
            </button>

          </div>

          {/* Read Story Link */}
          <button
            onClick={() => onOpenDetail(post)}
            className="flex items-center space-x-1 text-xs font-semibold text-[#E07A5F] group-hover:translate-x-1 transition-transform"
          >
            <span>Leer entrada</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

        </div>

      </div>

    </article>
  );
};
