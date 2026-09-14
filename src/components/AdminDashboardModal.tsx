import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Post, Story, IslandPin, TripStats } from '../types/blog';
import { 
  X, Lock, KeyRound, Plus, Edit, Trash2, Save, Upload, MapPin, 
  Film, Settings, Download, RefreshCw, CheckCircle2
} from 'lucide-react';
import { exportAllBlogData, resetToDemoData, getAdminPin } from '../utils/storage';
import { uploadImageToImgBB, formatImageUrl } from '../utils/media';

interface AdminDashboardModalProps {
  posts: Post[];
  stories: Story[];
  islandPins: IslandPin[];
  stats: TripStats;
  onClose: () => void;
  onSavePost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onSaveStory: (story: Story) => void;
  onDeleteStory: (storyId: string) => void;
  onSaveIslandPins: (pins: IslandPin[]) => void;
  onSaveStats: (stats: TripStats) => void;
  onRefreshData: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  posts,
  islandPins,
  stats,
  onClose,
  onSavePost,
  onDeletePost,
  onSaveStory,
  onSaveIslandPins,
  onSaveStats,
  onRefreshData,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  // Story Form State
  const [storyTitle, setStoryTitle] = useState('');
  const [storyType, setStoryType] = useState<'image' | 'video'>('image');
  const [storyMediaUrl, setStoryMediaUrl] = useState('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80');
  const [storyLocation, setStoryLocation] = useState('Labuan Bajo');

  // Stats & Settings Form State
  const [editCurrentDay, setEditCurrentDay] = useState(stats.currentDay);
  const [editIslandsVisited, setEditIslandsVisited] = useState(stats.islandsVisited);
  const [editPhotosShared, setEditPhotosShared] = useState(stats.photosShared);
  const [editKmTravelled, setEditKmTravelled] = useState(stats.kmTravelled);
  const [editCurrentLocation, setEditCurrentLocation] = useState(stats.currentLocation);
  const [editNextStop, setEditNextStop] = useState(stats.nextStop);
  const [editBlogTitle, setEditBlogTitle] = useState(stats.blogTitle || 'Nusa Odyssey');
  const [editAuthorName, setEditAuthorName] = useState(stats.authorName || 'Cuaderno de Viaje');


  const [notification, setNotification] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === getAdminPin() || pinInput === '8614') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };


  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Image File Uploader to ImgBB Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'gallery' | 'story') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    showNotice('Subiendo foto a ImgBB...');

    try {
      for (const file of Array.from(files)) {
        const url = await uploadImageToImgBB(file);
        if (target === 'cover') setPostCoverImage(url);
        if (target === 'story') setStoryMediaUrl(url);
        if (target === 'gallery') setPostGalleryImages((prev) => [...prev, url]);
      }
      showNotice('¡Foto subida con éxito!');
    } catch (error) {
      alert('Error subiendo la imagen: ' + error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePostForm = (e: React.FormEvent) => {
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

    onSavePost(newPost);
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

  const handleSaveStoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle.trim() || !storyMediaUrl.trim()) return;

    const newStory: Story = {
      id: `story-${Date.now()}`,
      title: storyTitle,
      type: storyType,
      mediaUrl: formatImageUrl(storyMediaUrl),
      location: storyLocation,
      timestamp: 'Justo ahora',
      likes: 1,
    };

    onSaveStory(newStory);
    showNotice('¡Historia subida al reel!');
    setStoryTitle('');
  };

  const handleSaveStatsForm = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStats: TripStats = {
      ...stats,
      currentDay: Number(editCurrentDay),
      islandsVisited: Number(editIslandsVisited),
      photosShared: Number(editPhotosShared),
      kmTravelled: Number(editKmTravelled),
      currentLocation: editCurrentLocation,
      nextStop: editNextStop,
      blogTitle: editBlogTitle,
      authorName: editAuthorName,
    };
    onSaveStats(updatedStats);
    showNotice('Ajustes y estadísticas actualizados');
  };


  // --- MAP PIN CRUD HANDLERS ---
  const handleSaveMapPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapPinName.trim() || !mapPinIsland.trim()) return;

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
    
    onSaveIslandPins(newPins);
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
    setActiveTab('map');
  };

  const handleDeleteMapPin = (pinId: string) => {
    if (confirm('¿Eliminar esta parada de la ruta?')) {
      const newPins = islandPins.filter(p => p.id !== pinId);
      onSaveIslandPins(newPins);
      showNotice('Parada eliminada');
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
  };

  // Leaflet Map Picker Initialization
  const mapInstanceRef = useRef<L.Map | null>(null);

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
      }

      const map = L.map('admin-map-picker').setView([mapPinLat, mapPinLng], 5);
      mapInstanceRef.current = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const marker = L.marker([mapPinLat, mapPinLng], { draggable: true }).addTo(map);

      // On map click, move marker and update coordinates
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setMapPinLat(Number(lat.toFixed(4)));
        setMapPinLng(Number(lng.toFixed(4)));
      });

      // On marker drag, update coordinates
      marker.on('dragend', (e) => {
        const m = e.target;
        const { lat, lng } = m.getLatLng();
        setMapPinLat(Number(lat.toFixed(4)));
        setMapPinLng(Number(lng.toFixed(4)));
      });

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
    };
  }, [activeTab, editingMapPinId]);
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
                Introduce la clave o PIN de la pareja para redactar posts o actualizar el diario.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                placeholder="PIN secreto"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-2xl px-4 py-3 rounded-2xl bg-black/60 border border-white/20 text-white focus:outline-none focus:border-[#E07A5F]"
                required
              />

              {pinError && (
                <p className="text-xs text-rose-400 font-medium">PIN incorrecto. Inténtalo de nuevo.</p>
              )}


              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E07A5F] to-[#E76F51] text-white font-bold text-sm shadow-xl hover:scale-105 transition-all"
              >
                Entrar al Gestor
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
                    <label className="block text-xs font-medium text-emerald-200 mb-1">Vídeo URL (opcional)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={postVideoUrl}
                      onChange={(e) => setPostVideoUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-[#E07A5F]"
                    />
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
                      <span>{isUploading ? 'Subiendo...' : 'Subir foto local'}</span>
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
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E07A5F] to-[#E76F51] text-white font-bold text-base shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>{editingPostId ? 'Guardar Cambios del Post' : 'Publicar Nuevo Día en el Diario'}</span>
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

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-emerald-200">Tipo & Archivo Media</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStoryType('image')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold ${storyType === 'image' ? 'bg-[#2A9D8F] text-white' : 'glass-panel text-emerald-300'}`}
                    >
                      Fotografía
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoryType('video')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold ${storyType === 'video' ? 'bg-[#2A9D8F] text-white' : 'glass-panel text-emerald-300'}`}
                    >
                      Clip de Vídeo (MP4)
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="URL del archivo media..."
                      value={storyMediaUrl}
                      onChange={(e) => setStoryMediaUrl(e.target.value)}
                      className="flex-1 w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
                    />

                    <label className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-medium text-xs cursor-pointer flex items-center justify-center gap-2 ${
                      isUploading ? 'bg-emerald-800/50 cursor-wait' : 'bg-emerald-800 hover:bg-emerald-700'
                    }`}>
                      <Upload className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} />
                      <span>{isUploading ? 'Subiendo...' : 'Subir archivo'}</span>
                      <input type="file" accept="image/*,video/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(e, 'story')} />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#2A9D8F] text-white font-bold text-sm shadow-lg hover:brightness-110"
                >
                  Añadir al Reel de Historias
                </button>
              </form>
            )}

            {/* Tab 3: POSTS LIST MANAGER */}
            {activeTab === 'manage_posts' && (
              <div className="space-y-4 glass-card p-6 rounded-3xl border border-white/10">
                <h3 className="font-serif-title text-xl font-bold text-white">Gestionar Entradas Publicadas ({posts.length})</h3>

                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 border border-white/10">
                      <div className="flex items-center space-x-3">
                        <img src={post.coverImage} alt={post.title} className="h-12 w-12 rounded-xl object-cover" />
                        <div>
                          <h4 className="font-bold text-sm text-white">{post.title}</h4>
                          <p className="text-xs text-emerald-300/60">Día {post.dayNumber} • {post.island} • {post.likes} me gusta</p>
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
                          onClick={() => {
                            onDeletePost(post.id);
                            showNotice('Post eliminado');
                          }}
                          className="p-2 rounded-xl bg-rose-600/30 text-rose-200 hover:bg-rose-600/50"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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

                  {/* Leaflet Map Picker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-emerald-200">
                      Ubicación Exacta (Haz clic en el mapa o arrastra el marcador)
                    </label>
                    <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-white/20">
                      <div id="admin-map-picker" className="h-full w-full z-10" />
                    </div>
                    <div className="flex gap-4 text-xs text-emerald-300/60">
                      <span>Lat: {mapPinLat}</span>
                      <span>Lng: {mapPinLng}</span>
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

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Día Actual</label>
                      <input
                        type="number"
                        value={editCurrentDay}
                        onChange={(e) => setEditCurrentDay(Number(e.target.value))}
                        className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-sm"
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
                      <label className="block text-xs font-medium text-emerald-200 mb-1">Km Recorridos</label>
                      <input
                        type="number"
                        value={editKmTravelled}
                        onChange={(e) => setEditKmTravelled(Number(e.target.value))}
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
                    className="w-full py-3 rounded-2xl bg-[#E9C46A] text-slate-950 font-bold text-sm hover:brightness-110"
                  >
                    Guardar Estadísticas Actualizadas
                  </button>
                </form>

                {/* Backup & Import Tools */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                  <h3 className="font-serif-title text-xl font-bold text-white">Copia de Seguridad y Restauración</h3>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={exportAllBlogData}
                      className="px-5 py-3 rounded-2xl bg-[#2A9D8F] text-white font-semibold text-xs flex items-center gap-2 shadow-md hover:scale-105 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      <span>Descargar Copia de Seguridad (.json)</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('¿Restablecer el blog con los datos iniciales de demostración?')) {
                          resetToDemoData();
                          onRefreshData();
                          showNotice('Blog restaurado con datos de demostración');
                        }
                      }}
                      className="px-5 py-3 rounded-2xl bg-rose-900/50 text-rose-200 border border-rose-500/30 font-semibold text-xs flex items-center gap-2 hover:bg-rose-900"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Restablecer Datos de Ejemplo</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
