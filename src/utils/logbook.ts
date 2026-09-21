import type { Dive, DiveCurrent } from '../types/blog';
import { localDateISO } from './dateUtils';

export const CURRENTS: DiveCurrent[] = ['ninguna', 'suave', 'moderada', 'fuerte'];

/** Vida marina habitual en Indonesia, para marcarla con un toque en vez de escribirla. */
export const COMMON_WILDLIFE = [
  'Mantas', 'Mola mola (pez luna)', 'Tortugas', 'Tiburón de arrecife', 'Tiburón ballena', 'Rayas águila',
  'Barracudas', 'Pez Napoleón', 'Morenas', 'Pez payaso', 'Pez escorpión', 'Pez sapo',
  'Caballito de mar pigmeo', 'Nudibranquios', 'Pulpo', 'Sepia', 'Bancos de jureles', 'Delfines',
];

/** Puntos de buceo muy conocidos: solo son sugerencias al escribir, se puede poner cualquiera. */
export const KNOWN_SITES = [
  'Manta Point (Nusa Penida)', 'Manta Bay (Nusa Penida)', 'Crystal Bay (Nusa Penida)', 'Toyapakeh (Nusa Penida)',
  'Mangrove (Nusa Lembongan)', 'Tulamben - USAT Liberty', 'Amed', 'Menjangan', 'Padang Bai - Blue Lagoon',
  'Shark Point (Gili Air)', 'Turtle Heaven (Gili Meno)', 'Batu Bolong (Komodo)', 'Castle Rock (Komodo)',
  'Crystal Rock (Komodo)', 'Manta Point (Komodo)', 'Cauldron (Komodo)',
];

/** Valores del formulario tal y como se escriben (texto), antes de validarlos. */
export interface DiveForm {
  number: string;
  date: string;
  timeIn: string;
  island: string;
  site: string;
  diveCenter: string;
  buddy: string;
  maxDepth: string;
  avgDepth: string;
  bottomTime: string;
  waterTemp: string;
  visibility: string;
  current: '' | DiveCurrent;
  gas: 'aire' | 'nitrox';
  nitroxPct: string;
  pressureStart: string;
  pressureEnd: string;
  weight: string;
  exposure: string;
  wildlife: string[];
  rating: number;
  notes: string;
  photos: string[];
}

/** Más reciente primero: por fecha, luego por número de inmersión. */
export const sortDives = (dives: Dive[]): Dive[] =>
  [...dives].sort(
    (a, b) => b.date.localeCompare(a.date) || b.number - a.number || b.createdAt.localeCompare(a.createdAt)
  );

export const nextDiveNumber = (dives: Dive[]): number => Math.max(0, ...dives.map((d) => d.number)) + 1;

/**
 * Formulario para una inmersión nueva. Centro, guía, gas, lastre y traje se copian de la anterior
 * (suelen repetirse en las inmersiones seguidas), así solo hay que rellenar lo que cambia.
 */
export const emptyForm = (dives: Dive[], defaultIsland: string): DiveForm => {
  const last = sortDives(dives)[0];
  return {
    number: String(nextDiveNumber(dives)),
    date: localDateISO(),
    timeIn: '',
    island: last?.island ?? defaultIsland,
    site: '',
    diveCenter: last?.diveCenter ?? '',
    buddy: last?.buddy ?? '',
    maxDepth: '',
    avgDepth: '',
    bottomTime: '',
    waterTemp: '',
    visibility: '',
    current: '',
    gas: last?.gas ?? 'aire',
    nitroxPct: last?.nitroxPct !== undefined ? String(last.nitroxPct) : '',
    pressureStart: '',
    pressureEnd: '',
    weight: last?.weight !== undefined ? String(last.weight) : '',
    exposure: last?.exposure ?? '',
    wildlife: [],
    rating: 0,
    notes: '',
    photos: [],
  };
};

const str = (n: number | undefined): string => (n === undefined ? '' : String(n));

export const formFromDive = (d: Dive): DiveForm => ({
  number: String(d.number),
  date: d.date,
  timeIn: d.timeIn ?? '',
  island: d.island,
  site: d.site,
  diveCenter: d.diveCenter ?? '',
  buddy: d.buddy ?? '',
  maxDepth: str(d.maxDepth),
  avgDepth: str(d.avgDepth),
  bottomTime: str(d.bottomTime),
  waterTemp: str(d.waterTemp),
  visibility: str(d.visibility),
  current: d.current ?? '',
  gas: d.gas ?? 'aire',
  nitroxPct: str(d.nitroxPct),
  pressureStart: str(d.pressureStart),
  pressureEnd: str(d.pressureEnd),
  weight: str(d.weight),
  exposure: d.exposure ?? '',
  wildlife: [...d.wildlife],
  rating: d.rating ?? 0,
  notes: d.notes ?? '',
  photos: [...d.photos],
});

export type BuildResult = { dive: Dive } | { error: string };

/** Valida el formulario y lo convierte en una inmersión, o devuelve un mensaje claro de lo que falta. */
export const buildDive = (f: DiveForm, id: string, createdAt?: string): BuildResult => {
  const fail = (error: string): BuildResult => ({ error });

  // Acepta la coma decimal del teclado español ("21,5")
  const parse = (value: string, label: string, min: number, max: number): { v?: number; err?: string } => {
    const t = value.trim().replace(',', '.');
    if (t === '') return {};
    const n = Number(t);
    if (!Number.isFinite(n) || n < min || n > max) return { err: `${label}: pon un número entre ${min} y ${max}` };
    return { v: n };
  };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || Number.isNaN(Date.parse(f.date))) return fail('Pon la fecha de la inmersión');
  if (!f.island.trim()) return fail('Indica la isla o región');
  if (!f.site.trim()) return fail('Indica el punto de buceo');

  const number = parse(f.number, 'Nº de inmersión', 1, 99999);
  if (number.err) return fail(number.err);
  if (number.v === undefined) return fail('Pon el número de inmersión');

  const fields = {
    maxDepth: parse(f.maxDepth, 'Profundidad máxima (m)', 0, 200),
    avgDepth: parse(f.avgDepth, 'Profundidad media (m)', 0, 200),
    bottomTime: parse(f.bottomTime, 'Tiempo (min)', 1, 1000),
    waterTemp: parse(f.waterTemp, 'Temperatura del agua (°C)', 0, 40),
    visibility: parse(f.visibility, 'Visibilidad (m)', 0, 100),
    pressureStart: parse(f.pressureStart, 'Presión inicial (bar)', 0, 400),
    pressureEnd: parse(f.pressureEnd, 'Presión final (bar)', 0, 400),
    weight: parse(f.weight, 'Lastre (kg)', 0, 40),
    nitroxPct: f.gas === 'nitrox' ? parse(f.nitroxPct, '% de nitrox', 21, 100) : {},
  };
  for (const { err } of Object.values(fields)) if (err) return fail(err);

  if (f.timeIn && !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.timeIn)) return fail('La hora de entrada no es válida');
  if (fields.maxDepth.v !== undefined && fields.avgDepth.v !== undefined && fields.avgDepth.v > fields.maxDepth.v) {
    return fail('La profundidad media no puede ser mayor que la máxima');
  }
  if (
    fields.pressureStart.v !== undefined &&
    fields.pressureEnd.v !== undefined &&
    fields.pressureEnd.v > fields.pressureStart.v
  ) {
    return fail('La presión final no puede ser mayor que la inicial');
  }

  const seen = new Set<string>();
  const wildlife = f.wildlife
    .map((w) => w.trim())
    .filter((w) => w && !seen.has(w.toLowerCase()) && seen.add(w.toLowerCase()));

  const dive: Dive = {
    id,
    number: number.v,
    date: f.date,
    site: f.site.trim(),
    island: f.island.trim(),
    wildlife,
    photos: f.photos,
    createdAt: createdAt ?? new Date().toISOString(),
  };
  const optional: Partial<Dive> = {
    timeIn: f.timeIn || undefined,
    diveCenter: f.diveCenter.trim() || undefined,
    buddy: f.buddy.trim() || undefined,
    exposure: f.exposure.trim() || undefined,
    notes: f.notes.trim() || undefined,
    current: f.current || undefined,
    gas: f.gas,
    rating: f.rating > 0 ? f.rating : undefined,
    maxDepth: fields.maxDepth.v,
    avgDepth: fields.avgDepth.v,
    bottomTime: fields.bottomTime.v,
    waterTemp: fields.waterTemp.v,
    visibility: fields.visibility.v,
    pressureStart: fields.pressureStart.v,
    pressureEnd: fields.pressureEnd.v,
    weight: fields.weight.v,
    nitroxPct: fields.nitroxPct.v,
  };
  for (const [k, v] of Object.entries(optional)) if (v !== undefined) (dive as unknown as Record<string, unknown>)[k] = v;
  return { dive };
};

export const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
};

export const formatDiveDate = (date: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

export interface DiveStats {
  count: number;
  totalMinutes: number;
  maxDepth: number | null;
  deepest: Dive | null;
  sites: number;
  islands: number;
  species: { name: string; count: number }[];
}

export const computeDiveStats = (dives: Dive[]): DiveStats => {
  let deepest: Dive | null = null;
  const sites = new Set<string>();
  const islands = new Set<string>();
  const species = new Map<string, { name: string; count: number }>();

  for (const d of dives) {
    if (d.maxDepth !== undefined && (deepest === null || d.maxDepth > (deepest.maxDepth ?? -1))) deepest = d;
    sites.add(`${d.island.toLowerCase()}|${d.site.toLowerCase()}`);
    islands.add(d.island.toLowerCase());
    for (const name of d.wildlife) {
      const key = name.toLowerCase();
      const entry = species.get(key);
      if (entry) entry.count += 1;
      else species.set(key, { name, count: 1 });
    }
  }

  return {
    count: dives.length,
    totalMinutes: dives.reduce((sum, d) => sum + (d.bottomTime ?? 0), 0),
    maxDepth: deepest?.maxDepth ?? null,
    deepest,
    sites: sites.size,
    islands: islands.size,
    species: [...species.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es')),
  };
};

/**
 * Logbook en CSV para abrirlo en Excel (separador ";" y coma decimal, como en España). Los textos que
 * empiezan por = + - @ llevan una comilla delante para que Excel no los ejecute como fórmula.
 */
export const divesToCsv = (dives: Dive[]): string => {
  const header = [
    'Nº', 'Fecha', 'Hora', 'Isla / región', 'Punto de buceo', 'Centro / barco', 'Guía / compañero',
    'Prof. máx (m)', 'Prof. media (m)', 'Tiempo (min)', 'Temp. agua (°C)', 'Visibilidad (m)', 'Corriente',
    'Gas', '% nitrox', 'Presión inicial (bar)', 'Presión final (bar)', 'Lastre (kg)', 'Traje',
    'Vida marina', 'Valoración (1-5)', 'Notas', 'Fotos',
  ];
  const text = (v: string | undefined): string => {
    const safe = v && /^[=+\-@]/.test(v) ? `'${v}` : (v ?? '');
    return `"${safe.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
  };
  const n = (v: number | undefined): string => (v === undefined ? '' : String(v).replace('.', ','));

  const rows = [...dives]
    .sort((a, b) => a.date.localeCompare(b.date) || a.number - b.number)
    .map((d) =>
      [
        String(d.number), d.date, d.timeIn ?? '', text(d.island), text(d.site), text(d.diveCenter),
        text(d.buddy), n(d.maxDepth), n(d.avgDepth), n(d.bottomTime), n(d.waterTemp), n(d.visibility),
        d.current ?? '', d.gas ?? '', n(d.nitroxPct), n(d.pressureStart), n(d.pressureEnd), n(d.weight),
        text(d.exposure), text(d.wildlife.join(', ')), n(d.rating), text(d.notes), text(d.photos.join(' ')),
      ].join(';')
    );
  return [header.join(';'), ...rows].join('\r\n');
};
