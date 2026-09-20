import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Post, Story, IslandPin, TripStats, Comment } from '../types/blog';
import type { LoginResult } from '../utils/api';
import { 
  X, Lock, KeyRound, Plus, Edit, Trash2, Save, Upload, MapPin, 
  Film, Settings, Download, RefreshCw, CheckCircle2
} from 'lucide-react';
import { exportAllBlogData, readLocalBlogData } from '../utils/storage';
import { uploadMedia, formatImageUrl, MAX_VIDEO_MB } from '../utils/media';
import { calculateCurrentDay } from '../utils/dateUtils';

interface AdminDashboardModalProps {
  posts: Post[];
  stories: Story[];
  islandPins: IslandPin[];
  stats: TripStats;
  onClose: () => void;
  // Todas devuelven `true` solo si el servidor ha guardado el cambio de verdad
  onSavePost: (post: Post) => Promise<boolean>;
  onDeletePost: (postId: string) => Promise<boolean>;
  onSaveStories: (stories: Story[]) => Promise<boolean>;
  onDeleteStory: (storyId: string) => Promise<boolean>;
  onSaveIslandPins: (pins: IslandPin[]) => Promise<boolean>;
  onSaveStats: (stats: TripStats) => Promise<boolean>;
  likesMap: Record<string, number>;
  commentsMap: Record<string, Comment[]>;
  onDeleteComment: (postId: string, commentId: string) => void;
  onLogin: (pin: string) => Promise<LoginResult>;
  onPublishLocalData: () => Promise<boolean>;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  posts,
  stories,
  islandPins,
  stats,
  onClose,
  onSavePost,
  onDeletePost,
  onSaveStories,
  onDeleteStory,
  onSaveIslandPins,
  onSaveStats,
  likesMap,
  commentsMap,
  onDeleteComment,
  onLogin,
  onPublishLocalData,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ index: 0, total: 0, percent: 0 });
  const uploadLabel =
    uploadProgress.total > 1
      ? `Subiendo ${uploadProgress.index}/${uploadProgress.total} · ${uploadProgress.percent}%`
      : `Subiendo ${uploadProgress.percent}%`;

  const [activeTab, setActiveTab] = useState<'posts' | 'stories' | 'manage_posts' | 'map' | 'stats'>('posts');

  // New/Editing Post Form State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postIsland, setPostIsland] = useState('Flores & Komodo');
  const [postLocation, setPostLocation] = useState('');
  const [postLat] = useState(-8.65);
  const [postLng] = useState(119.6);
  const [postDate, setPostDate] = useState(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [postDayNumber, setPostDayNumber] = useState(stats.currentDay);
  const [postCoverImage, setPostCoverImage] = useState('https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80');
  const [postGalleryImages, setPostGalleryImages] = useState<string[]>([]);
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('Indonesia, Aventura, Komodo');
  const [postTips, setPostTips] = useState('Lleva calzado adecuado y protector solar.');

  // Map Pin Form State
  const [editingMapPinId, setEditingMapPinId] = useState<string | null>(null);
  const [mapPinName, setMapPinName] = useState('');
  const [mapPinIsland, setMapPinIsland] = useState('');
  const [mapPinDates, setMapPinDates] = useState('');
  const [mapPinDescription, setMapPinDescription] = useState('');
  const [mapPinLat, setMapPinLat] = useState<number>(-5.0);
  const [mapPinLng, setMapPinLng] = useState<number>(118.0);
  const [mapPinStatus, setMapPinStatus] = useState<'upcoming' | 'current' | 'visited'>('upcoming');
  const [mapPinPlaced, setMapPinPlaced] = useState(false); // ¿ya se ha colocado el punto en el mapa?
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [placeMessage, setPlaceMessage] = useState('');
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);

  // Story Form State
  const [storyTitle, setStoryTitle] = useState('');
  // Cada foto/vídeo de la lista se publica como una historia del reel
  const [storyItems, setStoryItems] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [storyLink, setStoryLink] = useState('');
  const [storyLocation, setStoryLocation] = useState(stats.currentLocation);

  // Stats & Settings Form State
  const [editCurrentDay, setEditCurrentDay] = useState(stats.currentDay);
  const [editTripStartDate, setEditTripStartDate] = useState(stats.tripStartDate || '');
  const [editIslandsVisited, setEditIslandsVisited] = useState(stats.islandsVisited);
  const [editPhotosShared, setEditPhotosShared] = useState(stats.photosShared);
  const [editKmTravelled, setEditKmTravelled] = useState(stats.kmTravelled);
  const [kmToAdd, setKmToAdd] = useState('');
  const [editStartLocation, setEditStartLocation] = useState(stats.startLocation || '');
  const [editCurrentLocation, setEditCurrentLocation] = useState(stats.currentLocation);
  const [editNextStop, setEditNextStop] = useState(stats.nextStop);
  const [editBlogTitle, setEditBlogTitle] = useState(stats.blogTitle || 'Nusa Odyssey');
  const [editAuthorName, setEditAuthorName] = useState(stats.authorName || 'Cuaderno de Viaje');


  const [notification, setNotification] = useState<string | null>(null);

  // El PIN se comprueba en el servidor; nunca está escrito en el código
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setPinError(null);
    const result = await onLogin(pinInput);
    setIsLoggingIn(false);
    if (result === 'ok') {
      setIsAuthenticated(true);
      return;
    }
    setPinError({
      wrong: 'Contraseña incorrecta.',
      blocked: 'Demasiados intentos. Espera un rato antes de volver a probar.',
      error: 'No se pudo comprobar ahora mismo. Inténtalo de nuevo en un momento.',
    }[result]);
  };

  // Migración única desde la versión antigua que guardaba todo en el navegador
  const handlePublishLocal = async () => {
    const local = readLocalBlogData();
    if (!local.posts && !local.stories && !local.islandPins) {
      alert('Este navegador no tiene datos guardados de la versión anterior.');
      return;
    }
    const summary = `${local.posts?.length ?? 0} posts, ${local.stories?.length ?? 0} historias, ${local.islandPins?.length ?? 0} paradas de la ruta`;
    if (!confirm(`Se van a publicar en el servidor los datos guardados en este navegador (${summary}).\n\nEsto SUSTITUYE lo que haya publicado ahora en esas secciones. ¿Continuar?`)) return;
    const ok = await onPublishLocalData();
    showNotice(ok ? 'Datos subidos al servidor' : 'No se pudieron subir los datos');
  };


  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Ejecuta un guardado sin permitir dobles pulsaciones (que crearían el post dos veces).
  // Devuelve `true` solo si el servidor lo ha guardado de verdad.
  const withSaving = async (job: () => Promise<boolean>): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);
    try {
      return await job();
    } finally {
      setIsSaving(false);
    }
  };

  // Sube fotos y vídeos a Cloudinary (directo desde el navegador, con una firma del servidor)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'cover' | 'gallery' | 'story' | 'postVideo'
  ) => {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    // Portada y galería: solo fotos · vídeo del post: solo vídeo · historias: ambos
    const expected = target === 'postVideo' ? 'video' : target === 'story' ? null : 'image';

    setIsUploading(true);
    const failures: string[] = [];

    try {
      // Uno tras otro: si falla alguno, los demás siguen y se avisa al final
      for (const [i, file] of files.entries()) {
        setUploadProgress({ index: i + 1, total: files.length, percent: 0 });
        try {
          if (expected && !file.type.startsWith(`${expected}/`)) {
            throw new Error(
              expected === 'video'
                ? 'Aquí solo se pueden subir vídeos.'
                : 'Aquí solo se pueden subir fotos. Los vídeos van en el campo "Vídeo" o en las Historias.'
            );
          }
          const { url, kind } = await uploadMedia(file, pinInput, (fraction) =>
            setUploadProgress((p) => ({ ...p, percent: Math.round(fraction * 100) }))
          );
          if (target === 'cover') setPostCoverImage(url);
          if (target === 'postVideo') setPostVideoUrl(url);
          if (target === 'story') setStoryItems((prev) => [...prev, { url, type: kind }]);
          if (target === 'gallery') setPostGalleryImages((prev) => [...prev, url]);
        } catch (error) {
          failures.push(`${file.name}: ${error instanceof Error ? error.message : error}`);
        }
      }
    } finally {
      setIsUploading(false);
      input.value = ''; // permite volver a elegir el mismo archivo
    }

    const uploaded = files.length - failures.length;
    if (uploaded > 0) showNotice(uploaded === 1 ? '¡Subido con éxito!' : `¡${uploaded} archivos subidos!`);
    if (failures.length > 0) alert(`No se pudo subir:\n\n${failures.join('\n')}`);
  };

  const handleAddStoryLink = () => {
    const url = storyLink.trim();
    if (!url) return;
    const isVideo = /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url) || url.includes('/video/upload/');
    setStoryItems((prev) => [...prev, { url, type: isVideo ? 'video' : 'image' }]);
    setStoryLink('');
  };

  const handleSavePostForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    const newPost: Post = {
      id: editingPostId || `post-${Date.now()}`,
      title: postTitle,
      slug: postTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      island: postIsland,
      locationName: postLocation || postIsland,
      lat: Number(postLat),
      lng: Number(postLng),
      date: postDate,
      dayNumber: Number(postDayNumber),
      coverImage: formatImageUrl(postCoverImage),
      galleryImages: postGalleryImages.map(formatImageUrl),
      videoUrl: postVideoUrl,
      excerpt: postExcerpt || postContent.slice(0, 150) + '...',
      content: postContent,
      tags: postTags.split(',').map((t) => t.trim()).filter(Boolean),
      tips: postTips.split('\n').filter(Boolean),
      likes: editingPostId ? (posts.find((p) => p.id === editingPostId)?.likes || 10) : 1,
      comments: editingPostId ? (posts.find((p) => p.id === editingPostId)?.comments || []) : [],
      isFeatured: true,
    };

    // El formulario solo se vacía si el servidor lo ha guardado: si falla, lo escrito no se pierde
    if (!(await withSaving(() => onSavePost(newPost)))) return;
    showNotice(editingPostId ? 'Post actualizado con éxito' : '¡Nuevo post publicado!');
    resetPostForm();
  };

  const handleEditClick = (post: Post) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostIsland(post.island);
    setPostLocation(post.locationName);
    setPostDate(post.date);
    setPostDayNumber(post.dayNumber);
    setPostCoverImage(post.coverImage);
    setPostGalleryImages(post.galleryImages || []);
    setPostVideoUrl(post.videoUrl || '');
    setPostExcerpt(post.excerpt);
    setPostContent(post.content);
    setPostTags(post.tags.join(', '));
    setPostTips((post.tips || []).join('\n'));
    setActiveTab('posts');
  };

  const resetPostForm = () => {
    setEditingPostId(null);
    setPostTitle('');
    setPostLocation('');
    setPostExcerpt('');
    setPostContent('');
    setPostGalleryImages([]);
    setPostVideoUrl('');
  };

  const handleSaveStoryForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle.trim() || storyItems.length === 0) return;

    // Una historia por cada foto/vídeo, con el mismo título y lugar
    const now = Date.now();
    const newStories: Story[] = storyItems.map((item, i) => ({
      id: `story-${now}-${i}`,
      title: storyTitle.trim(),
      type: item.type,
      mediaUrl: formatImageUrl(item.url),
      location: storyLocation,
      timestamp: 'Justo ahora',
      likes: 1,
    }));

    if (!(await withSaving(() => onSaveStories(newStories)))) return;
    showNotice(newStories.length === 1 ? '¡Historia subida al reel!' : `¡${newStories.length} historias subidas al reel!`);
    setStoryTitle('');
    setStoryItems([]);
  };

  const handleSaveStatsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStats: TripStats = {
      ...stats,
      currentDay: editTripStartDate ? calculateCurrentDay(editTripStartDate) : Number(editCurrentDay),
      tripStartDate: editTripStartDate || undefined,
      islandsVisited: Number(editIslandsVisited),
      photosShared: Number(editPhotosShared),
      kmTravelled: Number(editKmTravelled),
      startLocation: editStartLocation,
      currentLocation: editCurrentLocation,
      nextStop: editNextStop,
      blogTitle: editBlogTitle,
      authorName: editAuthorName,
    };
    if (!(await withSaving(() => onSaveStats(updatedStats)))) return;
    showNotice('Ajustes y estadísticas actualizados');
  };

  const handleAddKm = async () => {
    const kmValue = Number(kmToAdd);
    if (!kmValue || kmValue <= 0) return;

    const newTotal = Number(editKmTravelled) + kmValue;
    if (!(await withSaving(() => onSaveStats({ ...stats, kmTravelled: newTotal })))) return;
    setEditKmTravelled(newTotal);
    showNotice(`+${kmValue} km añadidos. Total: ${newTotal} km`);
    setKmToAdd('');
  };

  // --- MAP PIN CRUD HANDLERS ---
  const handleSaveMapPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapPinName.trim() || !mapPinIsland.trim()) return;
    // Sin este aviso, un punto sin colocar se guardaba en una posición cualquiera (en el mar)
    if (!mapPinPlaced) {
      alert('Antes de guardar, coloca la parada en el mapa: busca el lugar o toca el mapa.');
      return;
    }

    const newPin: IslandPin = {
      id: editingMapPinId || `pin-${Date.now()}`,
      name: mapPinName,
      island: mapPinIsland,
      dates: mapPinDates,
      description: mapPinDescription,
      lat: mapPinLat,
      lng: mapPinLng,
      status: mapPinStatus,
      visitsCount: 0,
    };

    let newPins;
    if (editingMapPinId) {
      newPins = islandPins.map(p => p.id === editingMapPinId ? newPin : p);
    } else {
      newPins = [...islandPins, newPin];
    }
    
    if (!(await withSaving(() => onSaveIslandPins(newPins)))) return;
    showNotice(editingMapPinId ? 'Parada actualizada' : 'Nueva parada añadida a la ruta');
    resetMapPinForm();
  };

  const handleEditMapPin = (pin: IslandPin) => {
    setEditingMapPinId(pin.id);
    setMapPinName(pin.name);
    setMapPinIsland(pin.island);
    setMapPinDates(pin.dates);
    setMapPinDescription(pin.description);
    setMapPinLat(pin.lat);
    setMapPinLng(pin.lng);
    setMapPinStatus(pin.status);
    setMapPinPlaced(true);
    setActiveTab('map');
  };

  const handleDeleteMapPin = async (pinId: string) => {
    if (confirm('¿Eliminar esta parada de la ruta?')) {
      const newPins = islandPins.filter(p => p.id !== pinId);
      if (await withSaving(() => onSaveIslandPins(newPins))) showNotice('Parada eliminada');
    }
  };

  const resetMapPinForm = () => {
    setEditingMapPinId(null);
    setMapPinName('');
    setMapPinIsland('');
    setMapPinDates('');
    setMapPinDescription('');
    setMapPinLat(-5.0);
    setMapPinLng(118.0);
    setMapPinStatus('upcoming');
    setMapPinPlaced(false);
    setPlaceQuery('');
    setPlaceResults([]);
    setPlaceMessage('');
    markerRef.current?.remove();
    markerRef.current = null;
  };

  // Leaflet Map Picker Initialization
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Coloca (o mueve) el punto de la parada y guarda sus coordenadas.
  // El punto no existe hasta que se coloca: antes se guardaba uno "por defecto" en el mar.
  const placePoint = (lat: number, lng: number, zoom?: number) => {
    setMapPinLat(Number(lat.toFixed(4)));
    setMapPinLng(Number(lng.toFixed(4)));
    setMapPinPlaced(true);

    const map = mapInstanceRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        setMapPinLat(Number(p.lat.toFixed(4)));
        setMapPinLng(Number(p.lng.toFixed(4)));
        setMapPinPlaced(true);
      });
      markerRef.current = marker;
    }
    if (zoom) map.setView([lat, lng], zoom);
  };

  useEffect(() => {
    if (activeTab !== 'map') return;

    // Wait for the DOM to render the container
    const timer = setTimeout(() => {
      const container = document.getElementById('admin-map-picker');
      if (!container) return;

      // Properly destroy any previous map instance before creating a new one
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }

      // Parada nueva: vista de Java y Bali · parada existente: centrada en su punto
      const start: L.LatLngTuple = editingMapPinId ? [mapPinLat, mapPinLng] : [-7.5, 112];
      const map = L.map('admin-map-picker').setView(start, editingMapPinId ? 8 : 5);
      mapInstanceRef.current = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Al tocar el mapa se coloca (o se mueve) el punto
      map.on('click', (e) => placePoint(e.latlng.lat, e.latlng.lng));
      if (editingMapPinId) placePoint(mapPinLat, mapPinLng);

      // Fix missing map tiles due to modal display change
      map.invalidateSize();

    }, 100);

    // Cleanup: destroy the map instance when leaving the tab or unmounting
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, [activeTab, editingMapPinId]);

  // Busca un lugar por su nombre (OpenStreetMap Nominatim, gratuito y sin clave)
  const handleSearchPlace = async () => {
    const query = placeQuery.trim();
    if (!query) return;
    setIsSearchingPlace(true);
    setPlaceMessage('');
    setPlaceResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=es&q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      if (data.length === 0) setPlaceMessage('No se encontró ese sitio. Prueba con otro nombre, o toca el mapa.');
      setPlaceResults(data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) })));
    } catch {
      setPlaceMessage('No se pudo buscar ahora mismo. Toca el mapa para colocar el punto.');
    } finally {
      setIsSearchingPlace(false);
    }
  };

  const handleChoosePlace = (place: { label: string; lat: number; lng: number }) => {
    placePoint(place.lat, place.lng, 11);
    setPlaceResults([]);
    setPlaceMessage(`Punto colocado en: ${place.label}`);
  };
  // ------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg overflow-y-auto animate-fadeIn">
      
      {/* Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] glass-panel rounded-3xl overflow-y-auto border border-white/20 bg-[#071713] text-emerald-100 shadow-2xl my-auto">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 sm:p-5 bg-[#071713]/95 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#E07A5F] to-[#2A9D8F] text-white">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Zona Pareja • Gestión del Diario
              </h2>
              <p className="text-xs text-emerald-300/60">Panel de control privado para Héctor & María</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth Check Lock Screen */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto text-center space-y-6 my-12">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#E07A5F]/20 text-[#E07A5F] flex items-center justify-center border border-[#E07A5F]/40">
              <KeyRound className="h-8 w-8" />
            </div>

            <div>
              <h3 className="font-serif-title text-2xl font-bold text-white">Acceso Privado</h3>
              <p className="text-xs text-emerald-200/70 mt-1">
                Introduce la contraseña de la pareja para redactar posts o actualizar el diario.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                maxLength={64}
                autoComplete="current-password"
                placeholder="Contraseña"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-lg px-4 py-3 rounded-2xl bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#E07A5F]"
                required
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-medium">{pinError}</p>
              )}


              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E07A5F] to-[#E76F51] text-white font-bold text-sm shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
              >
                {isLoggingIn ? 'Comprobando...' : 'Entrar al Gestor'}
              </button>
            </form>
          </div>
        ) : (
          
          /* Authenticated Dashboard Body */
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Notification Banner */}
            {notification && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>{notification}</span>
              </div>
            )}

            {/* Dashboard Tabs Navigation */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'posts' ? 'bg-[#E07A5F] text-white shadow-lg' : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <Edit className="h-4 w-4" />
                <span>{editingPostId ? 'Editar Post' : 'Redactar Post'}</span>
              </button>

              <button
                onClick={() => setActiveTab('stories')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'stories' ? 'bg-[#2A9D8F] text-white shadow-lg' : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <Film className="h-4 w-4" />
                <span>Historias del Día</span>
              </button>

              <button
                onClick={() => setActiveTab('manage_posts')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'manage_posts' ? 'bg-[#2A9D8F] text-white shadow-lg' : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>Gestionar Posts ({posts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'map' ? 'bg-[#E07A5F] text-white shadow-lg' : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>Gestionar Ruta</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'stats' ? 'bg-[#E9C46A] text-slate-950 shadow-lg' : 'text-emerald-200/70 hover:text-white'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Estadísticas & Backup</span>
              </button>
            </div>

            {/* Tab 1: POST EDITOR FORM */}
            {activeTab === 'posts' && (
              <form onSubmit={handleSavePostForm} className="space-y-6 glass-card p-6 rounded-3xl border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-serif-title text-xl font-bold text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-[#E07A5F]" />
                    {editingPostId ? 'Editando Publicación Existente' : 'Nueva Publicación de la Expedición'}
                  </h3>
                  {editingPostId && (
                    <button
                      type="button"
                      onClick={resetPostForm}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Título de la entrada *</label>
                    <input
                      type="text"
                      placeholder="Ej: Amanecer místico en el volcán Bromo"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder-emerald-300/40 text-sm focus:outline-none focus:border-[#E07A5F]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Isla / Región *</label>
                    <select
                      value={postIsland}
                      onChange={(e) => setPostIsland(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                    >
                      <option value="Bali">Bali</option>
                      <option value="Nusa Penida">Nusa Penida</option>
                      <option value="Lombok">Lombok</option>
                      <option value="Sumbawa">Sumbawa</option>
                      <option value="Flores (Komodo)">Flores (Komodo)</option>
                      <option value="Mar de Banda (Remoto)">Mar de Banda (Banda Neira & Hatta)</option>
                      <option value="Java">Java</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Lugar exacto</label>
                    <input
                      type="text"
                      placeholder="Ej: Padar Island"
                      value={postLocation}
                      onChange={(e) => setPostLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Fecha de publicación</label>
                    <input
                      type="text"
                      value={postDate}
                      onChange={(e) => setPostDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Número de Día (1-60)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={postDayNumber}
                      onChange={(e) => setPostDayNumber(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Vídeo (opcional)</label>
                    <input
                      type="url"
                      placeholder="https://... o sube un vídeo"
                      value={postVideoUrl}
                      onChange={(e) => setPostVideoUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                    />
                    <label className={`mt-2 w-full px-3 py-2 rounded-xl text-white font-medium text-xs cursor-pointer flex items-center justify-center gap-2 border ${
                      isUploading ? 'bg-emerald-800/30 border-emerald-500/10 cursor-wait' : 'bg-emerald-800/60 hover:bg-emerald-700 border-emerald-500/30'
                    }`}>
                      <Upload className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} />
                      <span>{isUploading ? uploadLabel : `Subir vídeo (máx. ${MAX_VIDEO_MB} MB)`}</span>
                      <input type="file" accept="video/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(e, 'postVideo')} />
                    </label>
                  </div>
                </div>

                {/* Image Cover Selector / File Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-emerald-200">
                    Imagen de Portada Principal (Sube archivo local o introduce URL)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={postCoverImage}
                      onChange={(e) => setPostCoverImage(e.target.value)}
                      className="flex-1 w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                    />
                    <label className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-medium text-xs cursor-pointer flex items-center justify-center gap-2 border ${
                      isUploading ? 'bg-emerald-800/30 border-emerald-500/10 cursor-wait' : 'bg-emerald-800/60 hover:bg-emerald-700 border-emerald-500/30'
                    }`}>
                      <Upload className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} />
                      <span>{isUploading ? uploadLabel : 'Subir foto local'}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(e, 'cover')} />
                    </label>
                  </div>

                  {postCoverImage && (
                    <div className="relative h-32 w-full sm:w-64 rounded-xl overflow-hidden border border-white/20">
                      <img src={postCoverImage} alt="Cover Preview" className="h-full w-full object-cover" />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white px-2 py-0.5 rounded">Vista previa</span>
                    </div>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-xs font-medium text-emerald-200 mb-1">Resumen corto (1-2 frases destacadas)</label>
                  <input
                    type="text"
                    placeholder="Breve introducción atrapante para la tarjeta del diario..."
                    value={postExcerpt}
                    onChange={(e) => setPostExcerpt(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                  />
                </div>

                {/* Full Markdown/Content Editor */}
                <div>
                  <label className="block text-xs font-medium text-emerald-200 mb-1">Relato Completo del Día *</label>
                  <textarea
                    rows={8}
                    placeholder="Escribe aquí la historia del día: anécdotas, emociones, personas conocidas..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-white placeholder-emerald-300/30 text-sm focus:outline-none focus:border-[#E07A5F] leading-relaxed"
                    required
                  />
                </div>

                {/* Tags & Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Etiquetas (separadas por comas)</label>
                    <input
                      type="text"
                      placeholder="Buceo, Naturaleza, Arrozales"
                      value={postTags}
                      onChange={(e) => setPostTags(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Consejos Prácticos (uno por línea)</label>
                    <textarea
                      rows={2}
                      placeholder="Lleva linterna frontal&#10;Reserva el transporte directamente en el puerto"
                      value={postTips}
                      onChange={(e) => setPostTips(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E07A5F] to-[#E76F51] text-white font-bold text-base shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  <span>{isSaving ? 'Guardando…' : editingPostId ? 'Guardar Cambios del Post' : 'Publicar Nuevo Día en el Diario'}</span>
                </button>
              </form>
            )}

            {/* Tab 2: STORY UPLOADER */}
            {activeTab === 'stories' && (
              <form onSubmit={handleSaveStoryForm} className="space-y-6 glass-card p-6 rounded-3xl border border-white/10">
                <h3 className="font-serif-title text-xl font-bold text-white flex items-center gap-2">
                  <Film className="h-5 w-5 text-[#2A9D8F]" />
                  Subir Historia Rápida (Reel del Día)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Título corto de la Historia</label>
                    <input
                      type="text"
                      placeholder="Ej: Nadando con mantarrayas hoy 🌊"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Lugar</label>
                    <input
                      type="text"
                      placeholder="Ej: Manta Point, Komodo"
                      value={storyLocation}
                      onChange={(e) => setStoryLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium text-emerald-200">Fotos y vídeos de la historia</label>

                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <label className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-medium text-xs cursor-pointer flex items-center justify-center gap-2 ${
                      isUploading ? 'bg-emerald-800/50 cursor-wait' : 'bg-emerald-800 hover:bg-emerald-700'
                    }`}>
                      <Upload className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} />
                      <span>{isUploading ? uploadLabel : 'Subir fotos o vídeos (puedes elegir varios)'}</span>
                      <input type="file" multiple accept="image/*,video/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(e, 'story')} />
                    </label>

                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        placeholder="…o pega un enlace"
                        value={storyLink}
                        onChange={(e) => setStoryLink(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddStoryLink();
                          }
                        }}
                        className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddStoryLink}
                        className="px-4 py-2.5 rounded-xl bg-white/10 text-emerald-100 text-xs font-semibold hover:bg-white/15"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>

                  {storyItems.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {storyItems.map((item, i) => (
                        <div key={`${item.url}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/15 bg-black/40">
                          {item.type === 'video' ? (
                            <video src={item.url} muted preload="metadata" className="h-full w-full object-cover" />
                          ) : (
                            <img src={item.url} alt="" className="h-full w-full object-cover" />
                          )}
                          {item.type === 'video' && (
                            <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded">VÍDEO</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setStoryItems((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600"
                            title="Quitar"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-emerald-300/60">
                    Cada foto o vídeo se publica como una historia del reel, con el mismo título y lugar. Vídeos: máximo {MAX_VIDEO_MB} MB (unos 30-40 s); para uno más largo, pega un enlace.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || isUploading || storyItems.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-[#2A9D8F] text-white font-bold text-sm shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando…' : storyItems.length > 1 ? `Añadir ${storyItems.length} historias al Reel` : 'Añadir al Reel de Historias'}
                </button>
              </form>
            )}

            {/* Story List Manager - shown alongside the story uploader */}
            {activeTab === 'stories' && (
              <div className="space-y-4 glass-card p-6 rounded-3xl border border-white/10">
                <h3 className="font-serif-title text-xl font-bold text-white">Historias Actuales ({stories.length})</h3>

                {stories.length === 0 ? (
                  <p className="text-sm text-emerald-300/60">No hay historias todavía. Sube la primera arriba.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {stories.map((story) => (
                      <div key={story.id} className="glass-panel p-3 rounded-2xl border border-white/10 space-y-2">
                        <div className="relative h-24 w-full rounded-xl overflow-hidden">
                          <img src={story.mediaUrl} alt={story.title} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white truncate">{story.title}</h4>
                          <p className="text-[10px] text-emerald-300/60">{story.location}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm(`¿Eliminar la historia "${story.title}"?`)) {
                              if (await withSaving(() => onDeleteStory(story.id))) showNotice('Historia eliminada');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-600/30 text-rose-200 hover:bg-rose-600/50 text-xs font-semibold transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: POSTS LIST MANAGER */}
            {activeTab === 'manage_posts' && (
              <div className="space-y-4 glass-card p-6 rounded-3xl border border-white/10">
                <h3 className="font-serif-title text-xl font-bold text-white">Gestionar Entradas Publicadas ({posts.length})</h3>

                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <img src={post.coverImage} alt={post.title} className="h-12 w-12 rounded-xl object-cover" />
                        <div>
                          <h4 className="font-bold text-sm text-white">{post.title}</h4>
                          <p className="text-xs text-emerald-300/60">Día {post.dayNumber} • {post.island} • {post.likes + (likesMap[post.id] ?? 0)} me gusta</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditClick(post)}
                          className="p-2 rounded-xl bg-blue-600/30 text-blue-200 hover:bg-blue-600/50"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Eliminar el post "${post.title}"? No se puede deshacer.`)) return;
                            if (await withSaving(() => onDeletePost(post.id))) showNotice('Post eliminado');
                          }}
                          className="p-2 rounded-xl bg-rose-600/30 text-rose-200 hover:bg-rose-600/50"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      </div>

                      {(commentsMap[post.id] ?? []).length > 0 && (
                        <div className="space-y-2 border-t border-white/10 pt-3">
                          <p className="text-[11px] font-semibold text-emerald-300/70 uppercase tracking-wider">Comentarios de visitantes</p>
                          {(commentsMap[post.id] ?? []).map((comment) => (
                            <div key={comment.id} className="flex items-start justify-between gap-3 text-xs">
                              <p className="text-emerald-100/90">
                                <strong className="text-white">{comment.authorName}:</strong> {comment.text}
                              </p>
                              <button
                                onClick={() => {
                                  if (confirm('¿Eliminar este comentario?')) {
                                    onDeleteComment(post.id, comment.id);
                                    showNotice('Comentario eliminado');
                                  }
                                }}
                                className="shrink-0 p-1.5 rounded-lg bg-rose-600/30 text-rose-200 hover:bg-rose-600/50"
                                title="Eliminar comentario"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Tab 4: ROUTE / MAP MANAGER */}
            {/* Tab 4: ROUTE / MAP MANAGER */}
            {activeTab === 'map' && (
              <div className="space-y-6">
                
                {/* Map Pin Form */}
                <form onSubmit={handleSaveMapPin} className="glass-card p-6 rounded-3xl border border-white/10 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="font-serif-title text-xl font-bold text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#E07A5F]" />
                      {editingMapPinId ? 'Editar Parada' : 'Añadir Nueva Parada a la Ruta'}
                    </h3>
                    {editingMapPinId && (
                      <button
                        type="button"
                        onClick={resetMapPinForm}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Nombre del Lugar *</label>
                      <input
                        type="text"
                        placeholder="Ej: Volcán Bromo & Yogyakarta"
                        value={mapPinName}
                        onChange={(e) => setMapPinName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Isla o Región *</label>
                      <input
                        type="text"
                        placeholder="Ej: Java"
                        value={mapPinIsland}
                        onChange={(e) => setMapPinIsland(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Fechas Estimadas</label>
                      <input
                        type="text"
                        placeholder="Ej: 12-16 Sept"
                        value={mapPinDates}
                        onChange={(e) => setMapPinDates(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Descripción Breve</label>
                      <input
                        type="text"
                        placeholder="Ej: Exploración de templos y volcanes"
                        value={mapPinDescription}
                        onChange={(e) => setMapPinDescription(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                      />
                    </div>
                  </div>

                  {/* Buscador de lugar + mapa */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-emerald-200">
                      Ubicación exacta: busca el lugar o toca el mapa
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: Yakarta, Sanur, Nusa Penida..."
                        value={placeQuery}
                        onChange={(e) => setPlaceQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchPlace();
                          }
                        }}
                        className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                      />
                      <button
                        type="button"
                        onClick={handleSearchPlace}
                        disabled={isSearchingPlace}
                        className="px-4 py-2.5 rounded-xl bg-[#2A9D8F] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-60"
                      >
                        {isSearchingPlace ? 'Buscando…' : 'Buscar'}
                      </button>
                    </div>

                    {placeMessage && <p className="text-xs text-emerald-300/80">{placeMessage}</p>}

                    {placeResults.length > 0 && (
                      <ul className="rounded-xl border border-white/15 divide-y divide-white/10 overflow-hidden bg-black/40">
                        {placeResults.map((r, i) => (
                          <li key={`${r.lat}-${r.lng}-${i}`}>
                            <button
                              type="button"
                              onClick={() => handleChoosePlace(r)}
                              className="w-full text-left px-4 py-2.5 text-xs text-emerald-100 hover:bg-white/10"
                            >
                              {r.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="relative h-72 w-full rounded-2xl overflow-hidden border border-white/20">
                      <div id="admin-map-picker" className="h-full w-full z-10" />
                    </div>
                    <div className="flex gap-4 text-xs text-emerald-300/60">
                      {mapPinPlaced ? (
                        <>
                          <span>Lat: {mapPinLat}</span>
                          <span>Lng: {mapPinLng}</span>
                        </>
                      ) : (
                        <span className="text-[#E9C46A]">Todavía no has colocado el punto</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-emerald-200 mb-2">Estado de la Parada</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMapPinStatus('visited')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          mapPinStatus === 'visited'
                            ? 'bg-[#2A9D8F]/30 text-[#2A9D8F] border-[#2A9D8F]/60'
                            : 'bg-black/30 text-emerald-100/50 border-white/10'
                        }`}
                      >
                        Visitada
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapPinStatus('current')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          mapPinStatus === 'current'
                            ? 'bg-[#E07A5F]/30 text-[#E07A5F] border-[#E07A5F]/60'
                            : 'bg-black/30 text-emerald-100/50 border-white/10'
                        }`}
                      >
                        Actual
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapPinStatus('upcoming')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          mapPinStatus === 'upcoming'
                            ? 'bg-slate-700/50 text-slate-300 border-slate-500/60'
                            : 'bg-black/30 text-emerald-100/50 border-white/10'
                        }`}
                      >
                        Próxima
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2A9D8F] to-[#1F7A6F] text-white font-bold text-sm shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <Save className="h-5 w-5" />
                    <span>{editingMapPinId ? 'Guardar Parada' : 'Añadir a la Ruta'}</span>
                  </button>
                </form>

                {/* List of Pins */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="font-serif-title text-xl font-bold text-white mb-2">Paradas Existentes ({islandPins.length})</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {islandPins.map((pin) => (
                      <div key={pin.id} className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-white">{pin.name}</h4>
                            <p className="text-[10px] text-emerald-300/60 uppercase tracking-wider">{pin.island}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            pin.status === 'visited' ? 'bg-[#2A9D8F]/20 text-[#2A9D8F]' :
                            pin.status === 'current' ? 'bg-[#E07A5F]/20 text-[#E07A5F]' :
                            'bg-slate-700/40 text-slate-300'
                          }`}>
                            {pin.status === 'visited' ? 'Visitada' : pin.status === 'current' ? 'Actual' : 'Próxima'}
                          </span>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleEditMapPin(pin)}
                            className="p-1.5 rounded-lg bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 transition-colors"
                            title="Editar Parada"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMapPin(pin.id)}
                            className="p-1.5 rounded-lg bg-rose-600/30 text-rose-200 hover:bg-rose-600/50 transition-colors"
                            title="Eliminar Parada"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 5: STATS & BACKUP */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                
                {/* Stats Form */}
                <form onSubmit={handleSaveStatsForm} className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="font-serif-title text-xl font-bold text-white">Actualizar Marcadores del Viaje</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Nombre o Firma pública del autor</label>
                      <input
                        type="text"
                        placeholder="Ej: Cuaderno de Viaje, Dos Viajeros, H & M..."
                        value={editAuthorName}
                        onChange={(e) => setEditAuthorName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                      <p className="text-[10px] text-emerald-300/60 mt-1">Puedes usar un seudónimo o iniciales para mantener tu privacidad.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Nombre del Blog</label>
                      <input
                        type="text"
                        placeholder="Ej: Nusa Odyssey"
                        value={editBlogTitle}
                        onChange={(e) => setEditBlogTitle(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Auto-updating day counter based on trip start date */}
                  <div className="p-4 rounded-2xl bg-[#E9C46A]/10 border border-[#E9C46A]/30 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#E9C46A]">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Fecha de Inicio del Viaje (el día se actualiza solo cada día)
                    </label>
                    <input
                      type="date"
                      value={editTripStartDate}
                      onChange={(e) => setEditTripStartDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                    />
                    {editTripStartDate && (
                      <p className="text-xs text-emerald-200/70">
                        Hoy es el <strong className="text-white">Día {calculateCurrentDay(editTripStartDate)}</strong> de {stats.totalDays}. Este número se recalculará automáticamente cada día, no hace falta tocarlo más.
                      </p>
                    )}
                  </div>

                  {/* Km accumulator: add today's/leg's km instead of recalculating the total by hand */}
                  <div className="p-4 rounded-2xl bg-[#2A9D8F]/10 border border-[#2A9D8F]/30 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#2A9D8F]">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Sumar Km de esta Etapa (se añaden al total automáticamente)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Ej: 45"
                        value={kmToAdd}
                        onChange={(e) => setKmToAdd(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddKm}
                        className="px-5 py-2 rounded-xl bg-[#2A9D8F] text-white font-bold text-sm hover:brightness-110 transition-all whitespace-nowrap"
                      >
                        + Sumar
                      </button>
                    </div>
                    <p className="text-xs text-emerald-200/70">
                      Total actual: <strong className="text-white">{editKmTravelled} km</strong>. Escribe los km de hoy y pulsa "Sumar" — se guarda al instante, sin necesidad de rellenar el resto del formulario.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">
                        Día Actual {editTripStartDate && <span className="text-[#E9C46A]">(automático)</span>}
                      </label>
                      <input
                        type="number"
                        value={editTripStartDate ? calculateCurrentDay(editTripStartDate) : editCurrentDay}
                        onChange={(e) => setEditCurrentDay(Number(e.target.value))}
                        disabled={!!editTripStartDate}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Islas Visitadas</label>
                      <input
                        type="number"
                        value={editIslandsVisited}
                        onChange={(e) => setEditIslandsVisited(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Fotos Subidas</label>
                      <input
                        type="number"
                        value={editPhotosShared}
                        onChange={(e) => setEditPhotosShared(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Km Recorridos (total)</label>
                      <input
                        type="number"
                        value={editKmTravelled}
                        onChange={(e) => setEditKmTravelled(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Lugar de Inicio del Viaje</label>
                      <input
                        type="text"
                        placeholder="Ej: Bali"
                        value={editStartLocation}
                        onChange={(e) => setEditStartLocation(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Ubicación Actual</label>
                      <input
                        type="text"
                        value={editCurrentLocation}
                        onChange={(e) => setEditCurrentLocation(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Próximo Destino</label>
                      <input
                        type="text"
                        value={editNextStop}
                        onChange={(e) => setEditNextStop(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                      />
                    </div>
                  </div>


                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 rounded-2xl bg-[#E9C46A] text-slate-950 font-bold text-sm hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Guardando…' : 'Guardar Estadísticas Actualizadas'}
                  </button>
                </form>

                {/* Backup & Import Tools */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="font-serif-title text-xl font-bold text-white">Copia de Seguridad y Restauración</h3>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => exportAllBlogData({ posts, stories, islandPins, stats })}
                      className="px-5 py-3 rounded-2xl bg-[#2A9D8F] text-white font-semibold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      <span>Descargar Copia de Seguridad (.json)</span>
                    </button>

                    <button
                      onClick={handlePublishLocal}
                      className="px-5 py-3 rounded-2xl bg-[#E9C46A]/20 text-[#E9C46A] border border-[#E9C46A]/40 font-semibold text-xs flex items-center gap-2 hover:bg-[#E9C46A]/30"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Subir al servidor lo guardado en este navegador</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-300/60">
                    Solo hace falta una vez, desde el navegador donde creaste posts, historias o rutas con la versión anterior. Las estadísticas del viaje no se suben: ajústalas en el formulario de arriba.
                  </p>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
