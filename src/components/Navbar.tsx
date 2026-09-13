import React, { useState } from 'react';
import { Compass, MapPin, BookOpen, Film, Lock, Bell, Sparkles } from 'lucide-react';
import type { TripStats } from '../types/blog';

interface NavbarProps {
  stats: TripStats;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenAdmin: () => void;
  onOpenSubscribe: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  activeSection,
  setActiveSection,
  onOpenAdmin,
  onOpenSubscribe,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a1f19]/80 backdrop-blur-md shadow-lg transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveSection('inicio')}
          className="flex cursor-pointer items-center space-x-3 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#E07A5F] to-[#2A9D8F] shadow-md shadow-emerald-900/50 group-hover:scale-105 transition-transform">
            <Compass className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif-title text-xl font-bold tracking-tight text-white group-hover:text-[#E07A5F] transition-colors flex items-center gap-1.5">
              Nusa Odyssey
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E07A5F]/20 text-[#E07A5F] border border-[#E07A5F]/30 font-sans font-normal">
                Indonesia '26 🇮🇩
              </span>
            </h1>
            <p className="text-xs text-emerald-200/70">{stats.authorName || 'Diario de Viaje'} • Expedición</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 glass-pill px-3 py-1.5 rounded-full border border-white/10">
          <button
            onClick={() => setActiveSection('inicio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeSection === 'inicio'
                ? 'bg-[#E07A5F] text-white shadow-md'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => setActiveSection('mapa')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeSection === 'mapa'
                ? 'bg-[#2A9D8F] text-white shadow-md'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Mapa & Ruta</span>
          </button>

          <button
            onClick={() => setActiveSection('diario')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeSection === 'diario'
                ? 'bg-[#E07A5F] text-white shadow-md'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Diario de Posts</span>
          </button>

          <button
            onClick={() => setActiveSection('historias')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeSection === 'historias'
                ? 'bg-[#2A9D8F] text-white shadow-md'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Stories Reel</span>
          </button>
        </nav>

        {/* Quick Progress Badge & Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Current Day Badge */}
          <div className="hidden lg:flex items-center space-x-2 glass-pill px-3 py-1 rounded-full text-xs text-emerald-200 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2A9D8F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2A9D8F]"></span>
            </span>
            <span>Día <strong className="text-white">{stats.currentDay}</strong> de {stats.totalDays}</span>
          </div>

          {/* Subscribe Notifications Button */}
          <button
            onClick={onOpenSubscribe}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-100 border border-emerald-500/30 transition-all hover:scale-105"
            title="Recibir avisos de nuevos posts"
          >
            <Bell className="h-3.5 w-3.5 text-[#E07A5F]" />
            <span>Avisarme</span>
          </button>

          {/* Secret Admin Button for Couple */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#E07A5F] to-[#E76F51] text-white shadow-lg shadow-orange-950/40 hover:brightness-110 transition-all hover:scale-105 active:scale-95"
          >
            <Lock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zona Pareja</span>
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-emerald-200 hover:bg-white/10"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a1f19] px-4 py-3 space-y-2 animate-fadeIn">
          <button
            onClick={() => { setActiveSection('inicio'); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-white/10"
          >
            <Compass className="h-4 w-4 text-[#E07A5F]" />
            <span>Inicio & Resumen</span>
          </button>
          <button
            onClick={() => { setActiveSection('mapa'); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-white/10"
          >
            <MapPin className="h-4 w-4 text-[#2A9D8F]" />
            <span>Mapa Interactivo de Indonesia</span>
          </button>
          <button
            onClick={() => { setActiveSection('diario'); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-white/10"
          >
            <BookOpen className="h-4 w-4 text-[#E07A5F]" />
            <span>Diario Completo de Posts</span>
          </button>
          <button
            onClick={() => { setActiveSection('historias'); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-white/10"
          >
            <Film className="h-4 w-4 text-[#2A9D8F]" />
            <span>Reel de Historias del Día</span>
          </button>
          <button
            onClick={() => { onOpenSubscribe(); setMobileMenuOpen(false); }}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-white/10"
          >
            <Bell className="h-4 w-4 text-[#E07A5F]" />
            <span>Avisarme cuando haya nuevos posts</span>
          </button>
        </div>
      )}
    </header>
  );
};
