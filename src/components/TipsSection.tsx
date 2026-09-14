import React, { useState } from 'react';
import { Lightbulb, MapPin, Package, DollarSign, Smartphone, AlertCircle, Utensils, Navigation, Backpack } from 'lucide-react';
import type { Tip } from '../types/blog';

interface TipsSectionProps {
  tips: Tip[];
}

export const TipsSection: React.FC<TipsSectionProps> = ({ tips }) => {
  const [selectedCategory, setSelectedCategory] = useState<'preparacion' | 'isla' | 'viaje'>('preparacion');
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);

  const tipsPreparacion = tips.filter(t => t.category === 'preparacion');
  const tipsViaje = tips.filter(t => t.category === 'viaje');
  const tipsIslas = tips.filter(t => t.category === 'isla');

  const islas = Array.from(new Set(tipsIslas.map(t => t.island).filter((i): i is string => Boolean(i))));

  let displayedTips: Tip[] = [];

  if (selectedCategory === 'preparacion') {
    displayedTips = tipsPreparacion;
  } else if (selectedCategory === 'isla') {
    displayedTips = selectedIsland
      ? tipsIslas.filter(t => t.island === selectedIsland)
      : tipsIslas;
  } else {
    displayedTips = tipsViaje;
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'briefcase': <Backpack className="h-6 w-6" />,
      'document': <Package className="h-6 w-6" />,
      'money': <DollarSign className="h-6 w-6" />,
      'phone': <Smartphone className="h-6 w-6" />,
      'alert': <AlertCircle className="h-6 w-6" />,
      'food': <Utensils className="h-6 w-6" />,
      'location': <Navigation className="h-6 w-6" />,
      'transport': <MapPin className="h-6 w-6" />,
    };
    return icons[iconName] || <Lightbulb className="h-6 w-6" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071713] to-[#0a2420] pt-24 pb-12">

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#E07A5F] to-[#E9C46A]">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="font-serif-title text-4xl sm:text-5xl font-bold text-white">
            Consejos Prácticos
          </h1>
          <p className="text-lg text-emerald-200/70 max-w-2xl mx-auto">
            Todo lo que necesitas saber para preparar y disfrutar tu viaje a Indonesia
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => {
              setSelectedCategory('preparacion');
              setSelectedIsland(null);
            }}
            className={`px-6 py-3 rounded-2xl font-semibold text-sm sm:text-base transition-all ${
              selectedCategory === 'preparacion'
                ? 'bg-gradient-to-r from-[#E07A5F] to-[#E76F51] text-white shadow-lg scale-105'
                : 'bg-white/10 text-emerald-100 hover:bg-white/15'
            }`}
          >
            📋 Preparación
          </button>
          <button
            onClick={() => {
              setSelectedCategory('isla');
              setSelectedIsland(null);
            }}
            className={`px-6 py-3 rounded-2xl font-semibold text-sm sm:text-base transition-all ${
              selectedCategory === 'isla'
                ? 'bg-gradient-to-r from-[#2A9D8F] to-[#1F7A6F] text-white shadow-lg scale-105'
                : 'bg-white/10 text-emerald-100 hover:bg-white/15'
            }`}
          >
            🗺️ Por Isla
          </button>
          <button
            onClick={() => {
              setSelectedCategory('viaje');
              setSelectedIsland(null);
            }}
            className={`px-6 py-3 rounded-2xl font-semibold text-sm sm:text-base transition-all ${
              selectedCategory === 'viaje'
                ? 'bg-gradient-to-r from-[#E9C46A] to-[#F4A261] text-slate-950 shadow-lg scale-105'
                : 'bg-white/10 text-emerald-100 hover:bg-white/15'
            }`}
          >
            ✈️ Durante el Viaje
          </button>
        </div>
      </div>

      {/* Island Filter (for isla category) */}
      {selectedCategory === 'isla' && islas.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedIsland(null)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedIsland === null
                  ? 'bg-[#2A9D8F] text-white'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/15'
              }`}
            >
              Todas las Islas
            </button>
            {islas.map(island => (
              <button
                key={island}
                onClick={() => setSelectedIsland(island)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedIsland === island
                    ? 'bg-[#2A9D8F] text-white'
                    : 'bg-white/10 text-emerald-100 hover:bg-white/15'
                }`}
              >
                {island}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTips.length > 0 ? (
            displayedTips.map(tip => (
              <div
                key={tip.id}
                className="group glass-card p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 cursor-default space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-white/10 text-[#E07A5F] group-hover:bg-[#E07A5F]/20 transition-all">
                    {getIcon(tip.icon)}
                  </div>
                  {tip.island && (
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full">
                      {tip.island}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-serif-title text-lg font-bold text-white mb-2">
                    {tip.title}
                  </h3>
                  <p className="text-emerald-200/80 text-sm leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-emerald-300/60 text-lg">
                No hay consejos disponibles en esta categoría
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
