/**
 * Geometría pura para animar una flecha que recorre las paradas de la ruta, saltando de una a la
 * siguiente. Sin dependencias de Leaflet ni del DOM, para poder probarla con Node antes de usarla
 * en el mapa.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;
const toDeg = (rad: number): number => (rad * 180) / Math.PI;
const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** Distancia en línea recta entre dos puntos, en kilómetros (fórmula de Haversine). */
export const haversineKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
};

/** Rumbo inicial de a hacia b, en grados desde el norte (0-360, sentido horario). 0° = hacia el norte. */
export const bearingDeg = (a: LatLng, b: LatLng): number => {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/** Interpolación lineal entre dos puntos: coincide con la línea recta que dibuja Leaflet entre ellos. */
export const lerpLatLng = (a: LatLng, b: LatLng, t: number): LatLng => ({
  lat: a.lat + (b.lat - a.lat) * t,
  lng: a.lng + (b.lng - a.lng) * t,
});

// "Velocidad" puramente visual del recorrido (no real): cuánto dura cada salto y cada parada.
const MIN_TRAVEL_MS = 900;
const MAX_TRAVEL_MS = 3200;
const KM_PER_MS = 400 / 1000; // 400 km equivalen a 1 segundo de vuelo
const WAYPOINT_PAUSE_MS = 1100;
const FINAL_PAUSE_MS = 2600; // pausa en la última parada antes de reiniciar el ciclo

export interface RouteLeg {
  from: LatLng;
  to: LatLng;
  distanceKm: number;
  bearing: number;
  travelMs: number;
  pauseMs: number;
  startsAtMs: number; // instante (dentro del ciclo) en que empieza a moverse hacia `to`
  endsAtMs: number; // instante en que termina la pausa en `to` (y empieza el siguiente tramo)
}

export interface RouteSchedule {
  legs: RouteLeg[];
  totalMs: number; // duración completa de un ciclo
}

/**
 * Construye el guion de la animación a partir de las paradas en orden de visita.
 * Devuelve null si hay menos de dos puntos (no hay nada que recorrer).
 */
export const buildRouteSchedule = (points: LatLng[]): RouteSchedule | null => {
  if (points.length < 2) return null;

  const legs: RouteLeg[] = [];
  let cursor = WAYPOINT_PAUSE_MS; // pequeña pausa inicial en el primer punto antes de arrancar

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const distanceKm = haversineKm(from, to);
    const travelMs = clamp(distanceKm / KM_PER_MS, MIN_TRAVEL_MS, MAX_TRAVEL_MS);
    const isLast = i === points.length - 2;
    const pauseMs = isLast ? FINAL_PAUSE_MS : WAYPOINT_PAUSE_MS;
    const startsAtMs = cursor;
    cursor = startsAtMs + travelMs + pauseMs;
    legs.push({ from, to, distanceKm, bearing: bearingDeg(from, to), travelMs, pauseMs, startsAtMs, endsAtMs: cursor });
  }

  return { legs, totalMs: cursor };
};

export interface RouteFrame {
  position: LatLng;
  bearing: number;
  /** true si en este instante la flecha está detenida en una parada (no volando entre dos puntos) */
  paused: boolean;
}

/**
 * Envuelve un instante dentro de [0, period). Un solo `%` (no dos, como en el típico
 * `((t % p) + p) % p`): para un t ya positivo y menor que period, fmod lo devuelve exacto, sin
 * redondeo; ese redondeo de más es justo lo que podía desplazar un instante justo en el límite de
 * una parada (p. ej. la llegada exacta a una isla) al tramo equivocado.
 */
const wrapMs = (t: number, period: number): number => {
  const r = t % period;
  return r < 0 ? r + period : r;
};

/** Dado un instante cualquiera (se repite en bucle cada `totalMs`), calcula dónde está la flecha. */
export const frameAt = (schedule: RouteSchedule, tMs: number): RouteFrame => {
  const t = wrapMs(tMs, schedule.totalMs);
  const firstLeg = schedule.legs[0];

  if (t < firstLeg.startsAtMs) {
    return { position: firstLeg.from, bearing: firstLeg.bearing, paused: true };
  }
  for (const leg of schedule.legs) {
    const travelEndsAtMs = leg.startsAtMs + leg.travelMs;
    if (t < travelEndsAtMs) {
      const frac = leg.travelMs <= 0 ? 1 : (t - leg.startsAtMs) / leg.travelMs;
      return { position: lerpLatLng(leg.from, leg.to, frac), bearing: leg.bearing, paused: false };
    }
    if (t < leg.endsAtMs) {
      return { position: leg.to, bearing: leg.bearing, paused: true };
    }
  }
  const lastLeg = schedule.legs[schedule.legs.length - 1];
  return { position: lastLeg.to, bearing: lastLeg.bearing, paused: true };
};
