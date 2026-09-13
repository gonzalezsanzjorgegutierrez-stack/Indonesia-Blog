import React from 'react';
import { MapPin, Calendar, Camera, Navigation, ArrowDown, Compass } from 'lucide-react';
import type { TripStats } from '../types/blog';

interface HeroBannerProps {
  stats: TripStats;
  onExploreClick: () => void;
  onOpenMapClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ stats, onExploreClick, onOpenMapClick }) => {
  const progressPercent = Math.min(100, Math.round((stats.currentDay / stats.totalDays) * 100));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-emerald-950/60 shadow-2xl transition-all">
      {/* Background Image with Ambient Glow */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 opacity-40 transition-transform duration-1000 hover:scale-100"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2000&q=80')`,
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a16] via-[#0c1a16]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c1a16]/90 via-[#0c1a16]/40 to-transparent" />

      {/* Hero Content Grid */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8">
        <div className="max-w-3xl space-y-6">
          
          {/* Live Status Pill */}
          <div className="inline-flex items-center space-x-2 rounded-full glass-pill px-4 py-1.5 text-xs sm:text-sm text-emerald-100 border border-emerald-400/30 shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E07A5F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E07A5F]"></span>
            </span>
            <span className="font-medium text-emerald-200">En ruta ahora:</span>
            <span className="font-semibold text-white flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#E07A5F]" />
              {stats.currentLocation}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif-title text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Nuestra Aventura de <span className="text-gradient-gold">60 Días</span> por Indonesia
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-light max-w-2xl">
            Acompáñanos día a día recorriendo desde los volcanes místicos de Java y los arrozales balineses hasta el buceo salvaje en Komodo y los paraísos lejanos de Raja Ampat.
          </p>

          {/* Progress Bar Component */}
          <div className="glass-panel p-4 rounded-2xl max-w-xl space-y-2 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
              <span className="text-emerald-200 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#2A9D8F]" />
                Progreso de la expedición
              </span>
              <span className="text-[#E07A5F] font-bold">
                Día {stats.currentDay} de {stats.totalDays} ({progressPercent}%)
              </span>
            </div>
            
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-[#2A9D8F] via-[#E9C46A] to-[#E07A5F] rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-emerald-300/70 pt-0.5">
              <span>Inicio: Java</span>
              <span>Siguiente: {stats.nextStop}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onExploreClick}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-[#E07A5F] to-[#E76F51] text-white shadow-xl shadow-orange-950/50 hover:scale-105 active:scale-95 transition-all group"
            >
              <span>Explorar Diario de a Bordo</span>
              <ArrowDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
            </button>

            <button
              onClick={onOpenMapClick}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold glass-panel hover:bg-white/10 text-white border border-white/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Navigation className="h-4 w-4 text-[#2A9D8F]" />
              <span>Ver Mapa Interactivo</span>
            </button>
          </div>

        </div>

        {/* Live Trip Stats Grid (Right or Bottom) */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6 pt-6 border-t border-white/10">
          
          <div className="glass-card p-4 rounded-2xl text-center border border-white/5">
            <div className="text-emerald-400 mb-1 flex justify-center">
              <Calendar className="h-5 w-5 text-[#E07A5F]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.currentDay}</div>
            <div className="text-xs text-emerald-200/70 uppercase tracking-wider font-medium">Días en Indonesia</div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-center border border-white/5">
            <div className="text-emerald-400 mb-1 flex justify-center">
              <Compass className="h-5 w-5 text-[#2A9D8F]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.islandsVisited}</div>
            <div className="text-xs text-emerald-200/70 uppercase tracking-wider font-medium">Islas Exploradas</div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-center border border-white/5">
            <div className="text-emerald-400 mb-1 flex justify-center">
              <Camera className="h-5 w-5 text-[#E9C46A]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.photosShared}</div>
            <div className="text-xs text-emerald-200/70 uppercase tracking-wider font-medium">Fotos Publicadas</div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-center border border-white/5">
            <div className="text-emerald-400 mb-1 flex justify-center">
              <Navigation className="h-5 w-5 text-[#E07A5F]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.kmTravelled.toLocaleString()} km</div>
            <div className="text-xs text-emerald-200/70 uppercase tracking-wider font-medium">Recorridos</div>
          </div>

        </div>

      </div>
    </div>
  );
};
