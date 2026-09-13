import React, { useState } from 'react';
import type { Post } from '../types/blog';
import { X, Heart, MessageSquare, MapPin, Calendar, Compass, Lightbulb, CheckCircle2, Video, Send, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, authorName: string, text: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onLike,
  onAddComment,
}) => {
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const [submittedComment, setSubmittedComment] = useState(false);

  if (!post) return null;

  const handleLikeWithConfetti = (e: React.MouseEvent) => {
    onLike(post.id);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ['#E07A5F', '#2A9D8F', '#E9C46A'],
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) return;
    onAddComment(post.id, authorName, commentText);
    setCommentText('');
    setSubmittedComment(true);
    setTimeout(() => setSubmittedComment(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] glass-panel rounded-3xl overflow-y-auto border border-white/15 shadow-2xl bg-[#0a1f19] text-emerald-100 my-auto">
        
        {/* Sticky Top Bar / Close button */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-[#0a1f19]/90 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-[#E07A5F] text-white px-2.5 py-1 rounded-full font-bold">
              Día {post.dayNumber}
            </span>
            <span className="text-emerald-200 font-medium">{post.island}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLikeWithConfetti}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#E07A5F]/20 hover:bg-[#E07A5F] text-[#E07A5F] hover:text-white transition-all text-xs font-bold border border-[#E07A5F]/40"
            >
              <Heart className="h-4 w-4 fill-current" />
              <span>{post.likes} Me Gusta</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cover Header Banner */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-black">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f19] via-[#0a1f19]/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <div className="flex items-center space-x-2 text-xs text-emerald-200 font-medium">
              <span className="glass-panel px-3 py-1 rounded-lg flex items-center gap-1 border border-white/20">
                <MapPin className="h-3.5 w-3.5 text-[#E07A5F]" />
                {post.locationName}
              </span>
              <span className="glass-panel px-3 py-1 rounded-lg flex items-center gap-1 border border-white/20">
                <Calendar className="h-3.5 w-3.5 text-[#2A9D8F]" />
                {post.date}
              </span>
            </div>

            <h1 className="font-serif-title text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {post.title}
            </h1>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Excerpt Lead Paragraph */}
          <div className="p-5 rounded-2xl glass-card border-l-4 border-[#E07A5F] text-emerald-100 text-base sm:text-lg italic font-serif leading-relaxed">
            "{post.excerpt}"
          </div>

          {/* Embedded Video Section (If Video Exists) */}
          {post.videoUrl && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                <Video className="h-4 w-4 text-[#2A9D8F]" />
                Vídeo Destacado del Día
              </h3>
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black shadow-xl">
                <video
                  src={post.videoUrl}
                  controls
                  className="w-full max-h-[420px] object-cover"
                />
              </div>
            </div>
          )}

          {/* Main Story Narrative Text */}
          <div className="prose prose-invert max-w-none text-emerald-100/90 text-base sm:text-lg leading-relaxed space-y-4 whitespace-pre-line font-light">
            {post.content}
          </div>

          {/* Highlights Checklist */}
          {post.highlights && post.highlights.length > 0 && (
            <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#E9C46A]" />
                Puntos Clave del Día
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-emerald-200">
                {post.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-[#2A9D8F] flex-shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Photo Gallery Carousel Grid */}
          {post.galleryImages && post.galleryImages.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif-title text-xl font-bold text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#E07A5F]" />
                Galería Fotográfica
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {post.galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedGalleryImage(imgUrl)}
                    className="relative h-40 rounded-2xl overflow-hidden cursor-pointer group border border-white/10"
                  >
                    <img
                      src={imgUrl}
                      alt={`Galería ${idx + 1}`}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Travel Tips Box ("Consejos para Viajeros") */}
          {post.tips && post.tips.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-[#2A9D8F]/40 space-y-3 bg-[#0f382c]/80">
              <h3 className="font-semibold text-[#E9C46A] text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-[#E9C46A]" />
                Consejo Práctico para Viajeros
              </h3>
              <ul className="space-y-2 text-sm text-emerald-100">
                {post.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-[#E07A5F] font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="text-xs px-3 py-1 rounded-full bg-white/10 text-emerald-200">
                #{tag}
              </span>
            ))}
          </div>

          {/* Comments & Messages Section */}
          <div className="pt-8 border-t border-white/15 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-title text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-[#2A9D8F]" />
                Mensajes de Familia & Amigos ({post.comments.length})
              </h3>
            </div>

            {/* List of Existing Comments */}
            <div className="space-y-4">
              {post.comments.length === 0 ? (
                <p className="text-sm text-emerald-300/60 italic glass-card p-4 rounded-xl">
                  Sé el primero en dejar un mensaje de ánimo a la pareja para este día del viaje.
                </p>
              ) : (
                post.comments.map((comment) => (
                  <div key={comment.id} className="glass-card p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {comment.avatar ? (
                          <img src={comment.avatar} alt={comment.authorName} className="h-8 w-8 rounded-full object-cover border border-emerald-400" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#E07A5F] flex items-center justify-center font-bold text-xs text-white">
                            {comment.authorName.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-sm text-white">{comment.authorName}</span>
                      </div>
                      <span className="text-[11px] text-emerald-300/60">{comment.date}</span>
                    </div>
                    <p className="text-sm text-emerald-100/90 pl-10 font-light">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="glass-panel p-5 rounded-2xl space-y-4 border border-white/15">
              <h4 className="text-sm font-semibold text-white">Mandar mensaje a los viajeros:</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Tu nombre (ej: Tía Rosa, Carlos...)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-emerald-300/40 text-sm focus:outline-none focus:border-[#E07A5F]"
                  required
                />
              </div>

              <textarea
                rows={3}
                placeholder="¡Escribe un comentario o saludo afectuoso!"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-emerald-300/40 text-sm focus:outline-none focus:border-[#E07A5F]"
                required
              />

              <div className="flex items-center justify-between">
                {submittedComment && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ¡Mensaje enviado con éxito!
                  </span>
                )}
                
                <button
                  type="submit"
                  className="ml-auto flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[#2A9D8F] to-[#264653] text-white hover:brightness-110 transition-all text-sm"
                >
                  <Send className="h-4 w-4" />
                  <span>Enviar Mensaje</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* Lightbox for Gallery Image zoom */}
      {selectedGalleryImage && (
        <div 
          onClick={() => setSelectedGalleryImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={selectedGalleryImage} alt="Zoom" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
          <button className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/20">
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

    </div>
  );
};
