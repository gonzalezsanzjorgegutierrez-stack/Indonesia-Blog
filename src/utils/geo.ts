/**
 * Geometría pura para dibujar el recorrido en el mapa como una cadena de arcos fijos (estilo "puente"),
 * cada uno con su propia flecha señalando hacia la parada de llegada. Sin dependencias de Leaflet ni
 * del DOM, para poder probarla con Node antes de usarla en el mapa.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Distancia en línea recta entre dos puntos, en kilómetros (fórmula de Haversine). */
export const haversineKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
};

/** Rumbo de a hacia b, en grados desde el norte (0-360, sentido horario). 0° = hacia el norte. */
export const bearingDeg = (a: LatLng, b: LatLng): number => {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

// Cuánto se curva el arco: una fracción de la distancia entre los dos puntos, así el "bombeo" es
// proporcional en los tramos cortos y en los largos (siempre hacia el mismo lado del trayecto, como
// en los mapas de rutas de vuelo, nunca al azar).
const ARC_CURVATURE = 0.16;
const ARC_SEGMENTS = 28;

export interface Arc {
  /** Puntos de la curva, de a a b, listos para dibujar como polilínea. */
  points: LatLng[];
  /** Rumbo de llegada a b (para orientar la flecha al final del arco). */
  endBearing: number;
}

/**
 * Arco entre dos puntos como curva de Bézier cuadrática: el punto de control se desplaza en
 * perpendicular al tramo recto, una fracción (ARC_CURVATURE) de su longitud. Es la misma técnica que
 * usan los mapas de rutas de vuelo para dibujar un "puente" en vez de una línea recta.
 */
export const buildArc = (a: LatLng, b: LatLng): Arc => {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  // Perpendicular a (dx,dy), siempre hacia el mismo lado (no depende de la dirección del tramo)
  const control: LatLng = {
    lat: (a.lat + b.lat) / 2 + dx * ARC_CURVATURE,
    lng: (a.lng + b.lng) / 2 - dy * ARC_CURVATURE,
  };

  const points: LatLng[] = [];
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const t = i / ARC_SEGMENTS;
    const u = 1 - t;
    points.push({
      lat: u * u * a.lat + 2 * u * t * control.lat + t * t * b.lat,
      lng: u * u * a.lng + 2 * u * t * control.lng + t * t * b.lng,
    });
  }

  // Tangente de la curva en t=1: la dirección desde el punto de control hasta b
  return { points, endBearing: bearingDeg(control, b) };
};
