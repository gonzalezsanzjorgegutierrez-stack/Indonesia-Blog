import React, { useEffect } from 'react';
import type { IslandPin } from '../types/blog';
import { Navigation, Calendar, Eye, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';

interface IndonesiaMapProps {
  islandPins: IslandPin[];
  selectedIsland: string | null;
  onSelectIsland: (islandName: string | null) => void;
}

export const IndonesiaMap: React.FC<IndonesiaMapProps> = ({
  islandPins,
  selectedIsland,
  onSelectIsland,
}) => {
  useEffect(() => {
    // Check if Leaflet map container exists
    const container = document.getElementById('indonesia-leaflet-map');
    if (!container) return;

    // Remove existing map instance if re-rendering
    // @ts-ignore
    if (container._leaflet_id) {
      // @ts-ignore
      container._leaflet_id = null;
      container.innerHTML = '';
    }

    // Indonesia center coordinates [-2.5, 118.0]
    const map = L.map('indonesia-leaflet-map', {
      center: [-5.0, 118.0],
      zoom: 5,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    // Standard OpenStreetMap tiles (100% free, no API key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);


    // Custom Icon Generator
    islandPins.forEach((pin) => {
      let iconColor = '#2A9D8F'; // visited
      if (pin.status === 'current') iconColor = '#E07A5F'; // current
      if (pin.status === 'upcoming') iconColor = '#94a3b8'; // upcoming

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            background: ${iconColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            transform: translate(-50%, -50%);
            cursor: pointer;
          ">
            <span style="color: white; font-weight: bold; font-size: 11px;">
              ${pin.status === 'current' ? '📍' : pin.status === 'visited' ? '✓' : '⌛'}
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: sans-serif; text-align: left; max-width: 220px;">
          <h4 style="margin:0 0 4px 0; font-size: 14px; font-weight: bold; color: #f1f5f9;">${pin.name}</h4>
          <p style="margin:0 0 6px 0; font-size: 11px; color: #94a3b8;">${pin.dates} • ${pin.island}</p>
          <p style="margin:0; font-size: 12px; color: #e2e8f0; line-height: 1.3;">${pin.description}</p>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectIsland(pin.island);
      });
    });

    return () => {
      map.remove();
    };
  }, [islandPins, onSelectIsland]);

  return (
    <div className="w-full space-y-4">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Navigation className="h-6 w-6 text-[#E07A5F]" />
            Ruta Expedición Indonesia '26
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/70">
            Haz clic en los marcadores de las islas para filtrar las historias y recuerdos de cada parada.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSelectIsland(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedIsland === null
                ? 'bg-[#E07A5F] text-white shadow-md'
                : 'glass-panel text-emerald-200 hover:text-white'
            }`}
          >
            Todas las Islas
          </button>
          {islandPins.map((pin) => (
            <button
              key={pin.id}
              onClick={() => onSelectIsland(selectedIsland === pin.island ? null : pin.island)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                selectedIsland === pin.island
                  ? 'bg-[#2A9D8F] text-white shadow-md'
                  : 'glass-panel text-emerald-200 hover:text-white'
              }`}
            >
              <span>{pin.island}</span>
              {pin.status === 'visited' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
              {pin.status === 'current' && <span className="h-2 w-2 rounded-full bg-[#E07A5F] animate-pulse" />}
            </button>
          ))}
        </div>
      </div>

      {/* Map Interactive Container */}
      <div className="relative h-[380px] sm:h-[450px] w-full rounded-3xl overflow-hidden border border-white/15 glass-panel shadow-2xl">
        <div id="indonesia-leaflet-map" className="h-full w-full z-10" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-20 glass-panel p-3 rounded-xl border border-white/15 text-xs text-emerald-100 space-y-1.5">
          <div className="font-semibold text-white mb-1">Leyenda de la Ruta</div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#E07A5F] animate-pulse" />
            <span>Ubicación Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#2A9D8F]" />
            <span>Islas Visitadas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            <span>Próximas Paradas</span>
          </div>
        </div>
      </div>

      {/* Island Highlights Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {islandPins.map((pin) => (
          <div
            key={pin.id}
            onClick={() => onSelectIsland(selectedIsland === pin.island ? null : pin.island)}
            className={`glass-card p-4 rounded-2xl cursor-pointer transition-all border ${
              selectedIsland === pin.island
                ? 'border-[#E07A5F] bg-[#0f382c]'
                : 'border-white/10 hover:border-white/25'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/20">
                  {pin.island}
                </span>
                <h3 className="font-serif-title text-base font-bold text-white mt-1.5">
                  {pin.name}
                </h3>
              </div>
              
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                pin.status === 'visited' 
                  ? 'bg-[#2A9D8F]/20 text-[#2A9D8F] border border-[#2A9D8F]/30'
                  : pin.status === 'current'
                  ? 'bg-[#E07A5F]/20 text-[#E07A5F] border border-[#E07A5F]/30 animate-pulse'
                  : 'bg-slate-700/40 text-slate-300'
              }`}>
                {pin.status === 'visited' ? 'Visitada' : pin.status === 'current' ? 'Aquí Ahora' : 'Próxima'}
              </span>
            </div>

            <p className="text-xs text-emerald-100/80 mt-2 line-clamp-2 font-light">
              {pin.description}
            </p>

            <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-300/60 pt-2 border-t border-white/5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#E07A5F]" />
                {pin.dates}
              </span>
              <span className="text-[#2A9D8F] font-medium flex items-center gap-1">
                Ver posts <Eye className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
