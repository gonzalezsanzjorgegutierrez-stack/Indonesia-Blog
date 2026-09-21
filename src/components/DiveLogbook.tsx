import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Waves, Clock, Thermometer, Eye, ArrowDown, Fish, Star, Trash2, Edit, Download, Upload, X, Save, Lock, Gauge,
} from 'lucide-react';
import type { Dive } from '../types/blog';
import { uploadMedia } from '../utils/media';
import { localDateISO } from '../utils/dateUtils';
import {
  CURRENTS, COMMON_WILDLIFE, KNOWN_SITES, type DiveForm,
  buildDive, computeDiveStats, divesToCsv, emptyForm, formatDiveDate, formatMinutes, formFromDive, sortDives,
} from '../utils/logbook';

interface DiveLogbookProps {
  dives: Dive[];
  adminToken: string;
  defaultIsland: string;
  /** Islas del viaje (paradas de la ruta, posts...) para elegirlas con un toque */
  islandSuggestions: string[];
  onSave: (dive: Dive) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  notify: (message: string) => void;
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#2A9D8F]';
const labelClass = 'block text-xs font-medium text-emerald-200 mb-1';
const fmt = (n: number): string => String(n).replace('.', ',');
const unique = (values: (string | undefined)[]): string[] => [
  ...new Set(values.map((v) => v?.trim()).filter((v): v is string => !!v)),
];

export const DiveLogbook: React.FC<DiveLogbookProps> = ({
  dives, adminToken, defaultIsland, islandSuggestions, onSave, onDelete, notify,
}) => {
  const [form, setForm] = useState<DiveForm>(() => emptyForm(dives, defaultIsland));
  const [editingId, setEditingId] = useState<string | null>(null);
  // Mientras el formulario no se haya tocado, se recalcula si llegan las inmersiones del servidor
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [customSpecies, setCustomSpecies] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!dirty && !editingId) setForm(emptyForm(dives, defaultIsland));
  }, [dives, defaultIsland, dirty, editingId]);

  const sorted = useMemo(() => sortDives(dives), [dives]);
  const stats = useMemo(() => computeDiveStats(dives), [dives]);
  const centers = useMemo(() => unique(dives.map((d) => d.diveCenter)), [dives]);
  const siteOptions = useMemo(() => unique([...dives.map((d) => d.site), ...KNOWN_SITES]), [dives]);
  const editingDive = editingId ? dives.find((d) => d.id === editingId) : undefined;

  // Puntos de buceo de VUESTRAS inmersiones (los más recientes primero): los de la isla elegida, o todos si aún no hay ninguno
  const ownSites = useMemo(() => {
    const island = form.island.trim().toLowerCase();
    const inIsland = unique(sorted.filter((d) => d.island.trim().toLowerCase() === island).map((d) => d.site));
    return inIsland.length > 0 ? inIsland : unique(sorted.map((d) => d.site));
  }, [sorted, form.island]);
  const siteTyped = form.site.trim();
  const isNewSite = siteTyped !== "" && !siteOptions.some((s) => s.toLowerCase() === siteTyped.toLowerCase());

  const set = <K extends keyof DiveForm>(key: K, value: DiveForm[K]) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };
  const toggleSpecies = (name: string) =>
    set('wildlife', form.wildlife.some((w) => w.toLowerCase() === name.toLowerCase())
      ? form.wildlife.filter((w) => w.toLowerCase() !== name.toLowerCase())
      : [...form.wildlife, name]);
  const addCustomSpecies = () => {
    const name = customSpecies.trim();
    if (!name) return;
    if (!form.wildlife.some((w) => w.toLowerCase() === name.toLowerCase())) set('wildlife', [...form.wildlife, name]);
    setCustomSpecies('');
  };

  const resetForm = (list: Dive[]) => {
    setEditingId(null);
    setDirty(false);
    setError('');
    setCustomSpecies('');
    setForm(emptyForm(list, defaultIsland));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    // Si hay una especie escrita en "Otra especie" sin pulsar Añadir, se incluye (antes se perdía en silencio)
    const pendingSpecies = customSpecies.trim();
    const formToSave = pendingSpecies ? { ...form, wildlife: [...form.wildlife, pendingSpecies] } : form;
    const result = buildDive(formToSave, editingId ?? `dive-${Date.now()}`, editingDive?.createdAt);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError('');
    setIsSaving(true);
    const ok = await onSave(result.dive);
    setIsSaving(false);
    if (!ok) return; // el aviso de error ya lo ha dado la aplicación; el formulario se queda como estaba
    notify(editingId ? `Inmersión #${result.dive.number} actualizada` : `Inmersión #${result.dive.number} guardada`);
    resetForm([...dives.filter((d) => d.id !== result.dive.id), result.dive]);
  };

  const startEdit = (dive: Dive) => {
    setEditingId(dive.id);
    setDirty(true);
    setError('');
    setForm(formFromDive(dive));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (dive: Dive) => {
    if (!confirm(`¿Eliminar la inmersión #${dive.number} (${dive.site})? No se puede deshacer.`)) return;
    if (await onDelete(dive.id)) {
      notify(`Inmersión #${dive.number} eliminada`);
      if (editingId === dive.id) resetForm(dives.filter((d) => d.id !== dive.id));
    }
  };

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;
    setIsUploading(true);
    const failures: string[] = [];
    try {
      for (const [i, file] of files.entries()) {
        const prefix = files.length > 1 ? `Subiendo ${i + 1}/${files.length}` : 'Subiendo';
        setUploadLabel(`${prefix}…`);
        try {
          if (!file.type.startsWith('image/')) throw new Error('aquí solo se pueden subir fotos');
          const { url } = await uploadMedia(file, adminToken, (f) => setUploadLabel(`${prefix} · ${Math.round(f * 100)}%`));
          setDirty(true);
          setForm((prev) => ({ ...prev, photos: [...prev.photos, url] }));
        } catch (err) {
          failures.push(`${file.name}: ${err instanceof Error ? err.message : err}`);
        }
      }
    } finally {
      setIsUploading(false);
      input.value = '';
    }
    if (failures.length > 0) alert(`No se pudo subir:\n\n${failures.join('\n')}`);
  };

  const downloadCsv = () => {
    // El BOM (﻿) hace que Excel abra bien los acentos
    const blob = new Blob(['﻿' + divesToCsv(dives)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logbook-buceo-${localDateISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const customSelected = form.wildlife.filter(
    (w) => !COMMON_WILDLIFE.some((c) => c.toLowerCase() === w.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Datalists de sugerencias */}
      <datalist id="dive-site-options">{siteOptions.map((s) => <option key={s} value={s} />)}</datalist>
      <datalist id="dive-center-options">{centers.map((c) => <option key={c} value={c} />)}</datalist>

      {/* Resumen */}
      <section className="glass-card p-6 rounded-3xl border border-white/10 space-y-4" aria-label="Resumen del logbook">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif-title text-xl font-bold text-white flex items-center gap-2">
            <Waves className="h-5 w-5 text-[#2A9D8F]" />
            Logbook de buceo
          </h3>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/70 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            <Lock className="h-3 w-3" /> Privado: solo se ve aquí, dentro de Zona Pareja
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Inmersiones', value: String(stats.count) },
            { label: 'Tiempo bajo el agua', value: stats.totalMinutes > 0 ? formatMinutes(stats.totalMinutes) : '—' },
            { label: 'Profundidad máx.', value: stats.maxDepth !== null ? `${fmt(stats.maxDepth)} m` : '—' },
            { label: 'Especies vistas', value: String(stats.species.length) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-black/30 border border-white/10 p-3 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-white">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-300/70">{s.label}</div>
            </div>
          ))}
        </div>

        {stats.count > 0 && (
          <p className="text-xs text-emerald-200/70">
            {stats.sites} {stats.sites === 1 ? 'punto de buceo' : 'puntos de buceo'} en {stats.islands}{' '}
            {stats.islands === 1 ? 'isla o región' : 'islas o regiones'}
            {stats.deepest ? ` · la más profunda: ${stats.deepest.site} (${fmt(stats.deepest.maxDepth ?? 0)} m)` : ''}
          </p>
        )}

        {stats.species.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Vida marina vista">
            {stats.species.slice(0, 14).map((s) => (
              <span key={s.name} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#2A9D8F]/20 text-emerald-200 border border-[#2A9D8F]/30">
                {s.name} {s.count > 1 && <strong className="text-white">×{s.count}</strong>}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Formulario */}
      <form ref={formRef} onSubmit={handleSubmit} className="glass-card p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h3 className="font-serif-title text-xl font-bold text-white">
            {editingId ? `Editando la inmersión #${form.number}` : `Nueva inmersión #${form.number}`}
          </h3>
          {editingId && (
            <button type="button" onClick={() => resetForm(dives)} className="text-xs text-rose-400 hover:underline">
              Cancelar edición
            </button>
          )}
        </div>

        {/* Dónde y cuándo */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F] mb-1">Dónde y cuándo</legend>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass} htmlFor="dive-number">Nº</label>
              <input id="dive-number" type="text" inputMode="numeric" autoComplete="off" className={inputClass} value={form.number} onChange={(e) => set('number', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="dive-date">Fecha *</label>
              <input id="dive-date" type="date" className={inputClass} value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="dive-time">Hora de entrada</label>
              <input id="dive-time" type="time" className={inputClass} value={form.timeIn} onChange={(e) => set('timeIn', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="dive-island">Isla / región *</label>
              <input id="dive-island" type="text" list="island-options" placeholder="Ej: Nusa Penida" className={inputClass} value={form.island} onChange={(e) => set('island', e.target.value)} />
              {islandSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {islandSuggestions.slice(0, 8).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => set('island', name)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        form.island.trim().toLowerCase() === name.toLowerCase() ? 'bg-[#2A9D8F] text-white' : 'bg-white/10 text-emerald-100 hover:bg-white/15'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="dive-site">Punto de buceo *</label>
              <input id="dive-site" type="text" list="dive-site-options" placeholder="Elige uno o escribe el tuyo" autoComplete="off" className={inputClass} value={form.site} onChange={(e) => set('site', e.target.value)} />
              <p className="mt-1 text-[11px] text-emerald-300/60">No hace falta que esté en la lista: escribe el nombre que quieras.</p>
              {isNewSite && (
                <p role="status" className="mt-1 text-[11px] font-medium text-[#E9C46A]">
                  ✓ «{siteTyped}» es un punto nuevo: se guardará y os saldrá como sugerencia la próxima vez.
                </p>
              )}
              {ownSites.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-emerald-300/60">Vuestros puntos:</span>
                  {ownSites.slice(0, 8).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => set('site', name)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        siteTyped.toLowerCase() === name.toLowerCase() ? 'bg-[#2A9D8F] text-white' : 'bg-white/10 text-emerald-100 hover:bg-white/15'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="dive-center">Centro de buceo / barco</label>
              <input id="dive-center" type="text" list="dive-center-options" className={inputClass} value={form.diveCenter} onChange={(e) => set('diveCenter', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="dive-buddy">Guía / compañero</label>
              <input id="dive-buddy" type="text" className={inputClass} value={form.buddy} onChange={(e) => set('buddy', e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* La inmersión */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F] mb-1">La inmersión</legend>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {([
              ['maxDepth', 'Prof. máx. (m)', 'dive-maxdepth'],
              ['avgDepth', 'Prof. media (m)', 'dive-avgdepth'],
              ['bottomTime', 'Tiempo (min)', 'dive-time-min'],
              ['waterTemp', 'Agua (°C)', 'dive-temp'],
              ['visibility', 'Visibilidad (m)', 'dive-vis'],
            ] as const).map(([key, label, id]) => (
              <div key={key}>
                <label className={labelClass} htmlFor={id}>{label}</label>
                <input id={id} type="text" inputMode="decimal" autoComplete="off" className={inputClass} value={form[key]} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
          </div>
          <div>
            <span className={labelClass}>Corriente</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Corriente">
              {CURRENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={form.current === c}
                  onClick={() => set('current', form.current === c ? '' : c)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                    form.current === c ? 'bg-[#2A9D8F] text-white' : 'bg-white/10 text-emerald-100 hover:bg-white/15'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        {/* Equipo y gas */}
        <details className="rounded-2xl border border-white/10 bg-black/20 p-4" open={!!editingId}>
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[#2A9D8F]">
            Equipo y gas <span className="normal-case font-normal text-emerald-300/60">(opcional · se copia de la inmersión anterior)</span>
          </summary>
          <div className="mt-4 space-y-3">
            <div>
              <span className={labelClass}>Gas</span>
              <div className="flex gap-2" role="group" aria-label="Gas">
                {(['aire', 'nitrox'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={form.gas === g}
                    onClick={() => set('gas', g)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize ${form.gas === g ? 'bg-[#2A9D8F] text-white' : 'bg-white/10 text-emerald-100 hover:bg-white/15'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.gas === 'nitrox' && (
                <div>
                  <label className={labelClass} htmlFor="dive-nitrox">% nitrox</label>
                  <input id="dive-nitrox" type="text" inputMode="decimal" autoComplete="off" className={inputClass} value={form.nitroxPct} onChange={(e) => set('nitroxPct', e.target.value)} />
                </div>
              )}
              <div>
                <label className={labelClass} htmlFor="dive-p0">Presión inicial (bar)</label>
                <input id="dive-p0" type="text" inputMode="decimal" autoComplete="off" className={inputClass} value={form.pressureStart} onChange={(e) => set('pressureStart', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="dive-p1">Presión final (bar)</label>
                <input id="dive-p1" type="text" inputMode="decimal" autoComplete="off" className={inputClass} value={form.pressureEnd} onChange={(e) => set('pressureEnd', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="dive-weight">Lastre (kg)</label>
                <input id="dive-weight" type="text" inputMode="decimal" autoComplete="off" className={inputClass} value={form.weight} onChange={(e) => set('weight', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelClass} htmlFor="dive-suit">Traje</label>
                <input id="dive-suit" type="text" placeholder="Ej: 3 mm largo" className={inputClass} value={form.exposure} onChange={(e) => set('exposure', e.target.value)} />
              </div>
            </div>
          </div>
        </details>

        {/* Vida marina */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F] mb-1 flex items-center gap-1.5">
            <Fish className="h-3.5 w-3.5" /> Vida marina vista
          </legend>
          <div className="flex flex-wrap gap-2">
            {COMMON_WILDLIFE.map((name) => {
              const on = form.wildlife.some((w) => w.toLowerCase() === name.toLowerCase());
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSpecies(name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${on ? 'bg-[#2A9D8F] text-white' : 'bg-white/10 text-emerald-100 hover:bg-white/15'}`}
                >
                  {name}
                </button>
              );
            })}
            {customSelected.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed
                onClick={() => toggleSpecies(name)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#E9C46A] text-slate-950 inline-flex items-center gap-1"
                title="Quitar"
              >
                {name} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Otra especie… (se añade también al guardar)"
              aria-label="Otra especie"
              className={inputClass}
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSpecies();
                }
              }}
            />
            <button type="button" onClick={addCustomSpecies} className="px-4 rounded-xl bg-white/10 text-emerald-100 text-xs font-semibold hover:bg-white/15">
              Añadir
            </button>
          </div>
        </fieldset>

        {/* Recuerdos */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wider text-[#2A9D8F] mb-1">Recuerdos</legend>
          <div>
            <span className={labelClass}>Valoración</span>
            <div className="flex gap-1" role="group" aria-label="Valoración">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                  aria-pressed={form.rating >= n}
                  onClick={() => set('rating', form.rating === n ? 0 : n)}
                  className="p-1.5"
                >
                  <Star className={`h-7 w-7 ${form.rating >= n ? 'fill-[#E9C46A] text-[#E9C46A]' : 'text-emerald-300/40'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="dive-notes">Notas: qué vimos, cómo fue, qué sentimos…</label>
            <textarea id="dive-notes" rows={4} className={`${inputClass} leading-relaxed`} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-xs cursor-pointer border ${
              isUploading ? 'bg-emerald-800/30 border-emerald-500/10 cursor-wait' : 'bg-emerald-800/60 hover:bg-emerald-700 border-emerald-500/30'
            }`}>
              <Upload className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} />
              <span>{isUploading ? uploadLabel : 'Añadir fotos (puedes elegir varias)'}</span>
              <input type="file" multiple accept="image/*" className="hidden" disabled={isUploading} onChange={handlePhotos} />
            </label>
            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {form.photos.map((url, i) => (
                  <div key={`${url}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/15 bg-black/40">
                    <img src={url} alt={`Foto ${i + 1} de la inmersión`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set('photos', form.photos.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600"
                      title="Quitar foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {error && <p role="alert" className="text-sm font-medium text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2A9D8F] to-[#1F7A6F] text-white font-bold text-base shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          <span>{isSaving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar inmersión'}</span>
        </button>
      </form>

      {/* Lista */}
      <section className="glass-card p-6 rounded-3xl border border-white/10 space-y-4" aria-label="Inmersiones registradas">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif-title text-xl font-bold text-white">Mis inmersiones ({sorted.length})</h3>
          {sorted.length > 0 && (
            <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2A9D8F] text-white text-xs font-semibold hover:brightness-110">
              <Download className="h-4 w-4" /> Descargar logbook (Excel/CSV)
            </button>
          )}
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-emerald-300/60">
            Todavía no hay inmersiones. Rellena el formulario de arriba con la primera: solo hacen falta la fecha, la isla y el punto de buceo.
          </p>
        ) : (
          <div className="space-y-4">
            {sorted.map((d) => {
              const metrics: { icon: React.ReactNode; text: string }[] = [];
              if (d.maxDepth !== undefined) metrics.push({ icon: <ArrowDown className="h-3.5 w-3.5" />, text: `${fmt(d.maxDepth)} m${d.avgDepth !== undefined ? ` (media ${fmt(d.avgDepth)} m)` : ''}` });
              if (d.bottomTime !== undefined) metrics.push({ icon: <Clock className="h-3.5 w-3.5" />, text: `${d.bottomTime} min` });
              if (d.waterTemp !== undefined) metrics.push({ icon: <Thermometer className="h-3.5 w-3.5" />, text: `${fmt(d.waterTemp)} °C` });
              if (d.visibility !== undefined) metrics.push({ icon: <Eye className="h-3.5 w-3.5" />, text: `visibilidad ${fmt(d.visibility)} m` });
              if (d.current) metrics.push({ icon: <Waves className="h-3.5 w-3.5" />, text: `corriente ${d.current}` });
              if (d.pressureStart !== undefined && d.pressureEnd !== undefined) {
                metrics.push({ icon: <Gauge className="h-3.5 w-3.5" />, text: `${fmt(d.pressureStart)} → ${fmt(d.pressureEnd)} bar (${fmt(d.pressureStart - d.pressureEnd)} usados)` });
              }
              const extra = [
                d.gas === 'nitrox' ? `Nitrox${d.nitroxPct ? ` ${fmt(d.nitroxPct)} %` : ''}` : d.gas === 'aire' ? 'Aire' : '',
                d.weight !== undefined ? `${fmt(d.weight)} kg de lastre` : '',
                d.exposure ?? '',
              ].filter(Boolean).join(' · ');

              return (
                <article key={d.id} data-dive-id={d.id} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-emerald-300/60">
                        Inmersión #{d.number} · {formatDiveDate(d.date)}{d.timeIn ? ` · ${d.timeIn}` : ''}
                      </p>
                      <h4 className="font-serif-title text-lg font-bold text-white break-words">{d.site}</h4>
                      <p className="text-xs text-emerald-200/70 break-words">
                        {d.island}{d.diveCenter ? ` · ${d.diveCenter}` : ''}{d.buddy ? ` · con ${d.buddy}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => startEdit(d)} title="Editar inmersión" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 text-xs font-semibold">
                        <Edit className="h-4 w-4" /><span className="hidden sm:inline">Editar</span>
                      </button>
                      <button type="button" onClick={() => handleDelete(d)} title="Eliminar inmersión" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/30 text-rose-200 hover:bg-rose-600/50 text-xs font-semibold">
                        <Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  </div>

                  {d.rating !== undefined && (
                    <div className="flex gap-0.5" aria-label={`Valoración: ${d.rating} de 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${d.rating! >= n ? 'fill-[#E9C46A] text-[#E9C46A]' : 'text-emerald-300/30'}`} />
                      ))}
                    </div>
                  )}

                  {metrics.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-emerald-100">
                      {metrics.map((m, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5">
                          <span className="text-[#2A9D8F]">{m.icon}</span>{m.text}
                        </span>
                      ))}
                    </div>
                  )}
                  {extra && <p className="text-[11px] text-emerald-300/60">{extra}</p>}

                  {d.wildlife.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {d.wildlife.map((w) => (
                        <span key={w} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#2A9D8F]/20 text-emerald-200 border border-[#2A9D8F]/30">{w}</span>
                      ))}
                    </div>
                  )}

                  {d.notes && <p className="text-sm text-emerald-100/90 leading-relaxed whitespace-pre-wrap break-words">{d.notes}</p>}

                  {d.photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {d.photos.map((url, i) => (
                        <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-white/15">
                          <img src={url} alt={`Foto ${i + 1} de ${d.site}`} className="h-full w-full object-cover" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
