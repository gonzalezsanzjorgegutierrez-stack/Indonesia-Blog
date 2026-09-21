import { useState, useEffect, useMemo } from 'react';
import { normalizeStats, readLocalBlogData } from './utils/storage';
import {
  fetchRemoteData, login, checkSession, logoutSession, saveData, upsertItem, upsertItems, removeItem,
  likePost, addComment, deleteComment, listDives,
  type RemoteData, type LoginResult, type ApiResult,
} from './utils/api';
import type { Post, Story, IslandPin, TripStats, Tip, Comment, Dive } from './types/blog';
import { initialTips, initialPosts, initialStories, initialIslandPins, initialStats } from './data/initialData';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { StoryBar } from './components/StoryBar';
import { IndonesiaMap } from './components/IndonesiaMap';
import { PostCard } from './components/PostCard';
import { PostDetailModal } from './components/PostDetailModal';
import { StoryViewerModal } from './components/StoryViewerModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { TipsSection } from './components/TipsSection';
import { Compass, Search, BookOpen } from 'lucide-react';

const TOKEN_KEY = 'nusa_admin_session';
const readStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const storeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* navegación privada: la sesión dura solo mientras la pestaña esté abierta */
  }
};

export default function App() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [islandPins, setIslandPins] = useState<IslandPin[]>(initialIslandPins);
  const [stats, setStats] = useState<TripStats>(() => normalizeStats(initialStats));
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [tips] = useState<Tip[]>(initialTips);
  // Logbook de buceo: PRIVADO. Solo se pide al servidor con la sesión iniciada y nunca sale en la lectura pública.
  const [dives, setDives] = useState<Dive[]>([]);

  const [activeSection, setActiveSection] = useState<string>('inicio');
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Llave de sesión de la pareja (ver api/blog.ts). Se guarda en este dispositivo para no pedir la
  // contraseña cada vez; la contraseña en sí no se guarda en ningún sitio.
  const [adminToken, setAdminToken] = useState<string | null>(readStoredToken);

  // Los datos compartidos viven en el servidor: todos los dispositivos ven lo mismo
  // Lo que responde el servidor manda siempre; si algo nunca se ha guardado, se ve el estado inicial
  const applyRemote = (data: RemoteData) => {
    setPosts(data.posts ?? initialPosts);
    setStories(data.stories ?? initialStories);
    setIslandPins(data.islandPins ?? initialIslandPins);
    setStats(normalizeStats(data.stats ?? initialStats));
    setLikes(data.likes ?? {});
    setComments(data.comments ?? {});
  };

  const refreshData = async () => {
    const data = await fetchRemoteData();
    if (data) applyRemote(data);
    return data !== null;
  };

  useEffect(() => {
    let cancelled = false;
    fetchRemoteData().then((data) => {
      if (data && !cancelled) applyRemote(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Posts tal y como los ve el público: contador de likes y comentarios en vivo
  const postsView = useMemo(
    () =>
      posts.map((p) => ({
        ...p,
        likes: p.likes + (likes[p.id] ?? 0),
        comments: [...(comments[p.id] ?? []), ...(p.comments ?? [])],
      })),
    [posts, likes, comments]
  );
  const detailPost = postsView.find((p) => p.id === detailPostId) ?? null;

  const warnSaveFailed = (error: string) => alert(`No se pudo guardar en el servidor: ${error}`);

  // Guarda en el servidor y dice si ha salido bien. Si falla, avisa y vuelve a cargar lo que HAY
  // guardado de verdad, para que la pantalla nunca enseñe posts o cambios que no existen.
  const persist = async <T,>(
    job: Promise<ApiResult<T>>,
    onSaved?: (data: T) => void,
    onFailed?: () => void
  ): Promise<boolean> => {
    const result = await job;
    if (result.ok) {
      onSaved?.(result.data);
      return true;
    }
    if (result.status === 401) {
      // La sesión ha caducado (o se cerró en otro sitio): hay que volver a entrar
      clearSession();
      alert('La sesión ha caducado. Vuelve a entrar con la contraseña.');
    } else {
      warnSaveFailed(result.error);
    }
    await refreshData();
    onFailed?.();
    return false;
  };

  // Like Post (público)
  const handleLikePost = (postId: string) => {
    setLikes((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
    likePost(postId).then((result) => {
      if (!result.ok) {
        setLikes((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 0) - 1) }));
      }
    });
  };

  // Add Comment (público)
  const handleAddComment = async (postId: string, authorName: string, text: string) => {
    const result = await addComment(postId, authorName, text);
    if (!result.ok) {
      alert(`No se pudo enviar el comentario: ${result.error}`);
      return;
    }
    const { comment } = result.data;
    setComments((prev) => ({ ...prev, [postId]: [comment, ...(prev[postId] ?? [])] }));
  };

  // --- Acciones de la pareja (requieren PIN, se validan en el servidor) ---

  const clearSession = () => {
    setAdminToken(null);
    storeToken(null);
  };

  const handleAdminLogin = async (pin: string): Promise<LoginResult> => {
    const { result, token } = await login(pin);
    if (result === 'ok' && token) {
      setAdminToken(token);
      storeToken(token);
    }
    return result;
  };

  const handleAdminLogout = () => {
    if (adminToken) void logoutSession(adminToken);
    clearSession();
    setShowAdminModal(false);
  };

  // Al abrir la página: si hay una sesión guardada, comprueba que sigue valiendo (si no, pide la contraseña)
  useEffect(() => {
    const stored = readStoredToken();
    if (!stored) return;
    checkSession(stored).then((state) => {
      if (state === 'invalid') {
        setAdminToken(null);
        storeToken(null);
      }
    });
  }, []);

  // Logbook: se carga al iniciar sesión y se vacía al cerrarla
  const loadDives = async (token: string) => {
    const result = await listDives(token);
    if (result.ok) setDives(result.data.items);
    else if (result.status === 401) clearSession();
  };

  useEffect(() => {
    if (!adminToken) {
      setDives([]);
      return;
    }
    void loadDives(adminToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const handleSaveDive = (dive: Dive) => {
    setDives((prev) => (prev.some((d) => d.id === dive.id) ? prev.map((d) => (d.id === dive.id ? dive : d)) : [dive, ...prev]));
    return persist(
      upsertItem<Dive>('dives', dive, adminToken ?? ''),
      (d) => setDives(d.items),
      () => adminToken && void loadDives(adminToken)
    );
  };

  const handleDeleteDive = (diveId: string) => {
    setDives((prev) => prev.filter((d) => d.id !== diveId));
    return persist(
      removeItem<Dive>('dives', diveId, adminToken ?? ''),
      (d) => setDives(d.items),
      () => adminToken && void loadDives(adminToken)
    );
  };

  const handleSaveIslandPins = (pins: IslandPin[]) => {
    setIslandPins(pins);
    return persist(saveData('islandPins', pins, adminToken ?? ''));
  };

  const handleSaveStats = (newStats: TripStats) => {
    setStats(newStats);
    return persist(saveData('stats', newStats, adminToken ?? ''));
  };

  // Save / Edit Post
  const handleSavePost = (newPost: Post) => {
    setPosts((prev) =>
      prev.some((p) => p.id === newPost.id)
        ? prev.map((p) => (p.id === newPost.id ? newPost : p))
        : [newPost, ...prev]
    );
    return persist(upsertItem<Post>('posts', newPost, adminToken ?? ''), (d) => setPosts(d.items));
  };

  // Delete Post
  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    return persist(removeItem<Post>('posts', postId, adminToken ?? ''), (d) => setPosts(d.items));
  };

  // Save Stories: una historia por cada foto/vídeo, todas en una sola petición
  const handleSaveStories = (newStories: Story[]) => {
    setStories((prev) => [...newStories, ...prev]);
    return persist(upsertItems<Story>('stories', newStories, adminToken ?? ''), (d) => setStories(d.items));
  };

  // Delete Story
  const handleDeleteStory = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    return persist(removeItem<Story>('stories', storyId, adminToken ?? ''), (d) => setStories(d.items));
  };

  // Moderación: borrar un comentario de un visitante
  const handleDeleteComment = (postId: string, commentId: string) => {
    setComments((prev) => ({ ...prev, [postId]: (prev[postId] ?? []).filter((c) => c.id !== commentId) }));
    void persist(deleteComment(postId, commentId, adminToken ?? ''));
  };

  // Migración única: sube al servidor lo que se creó en este navegador con la versión antigua
  const handlePublishLocalData = async (): Promise<boolean> => {
    const local = readLocalBlogData();
    const jobs = [];
    if (local.posts) jobs.push(saveData('posts', local.posts, adminToken ?? ''));
    if (local.stories) jobs.push(saveData('stories', local.stories, adminToken ?? ''));
    if (local.islandPins) jobs.push(saveData('islandPins', local.islandPins, adminToken ?? ''));
    const results = await Promise.all(jobs);
    const failed = results.find((r) => !r.ok);
    if (failed && !failed.ok) {
      warnSaveFailed(failed.error);
      return false;
    }
    return refreshData();
  };

  // Filter posts based on search query, island, and category
  const filteredPosts = postsView.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.locationName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIsland = selectedIsland === null || post.island === selectedIsland;

    const matchesCategory =
      selectedCategory === 'Todas' ||
      (selectedCategory === 'Vídeos' && !!post.videoUrl) ||
      post.tags.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase()));

    return matchesSearch && matchesIsland && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0c1a16] text-emerald-100 flex flex-col font-sans selection:bg-[#E07A5F] selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        stats={stats}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenAdmin={() => setShowAdminModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-10">
        
        {/* Section: INICIO */}
        {(activeSection === 'inicio' || activeSection === 'diario') && (
          <HeroBanner
            stats={stats}
            onExploreClick={() => {
              const element = document.getElementById('diario-feed-section');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenMapClick={() => setActiveSection('mapa')}
          />
        )}

        {/* Stories Bar Reel */}
        <StoryBar
          stories={stories}
          onSelectStory={(story) => setActiveStory(story)}
          onAddStoryClick={() => setShowAdminModal(true)}
        />

        {/* Section: MAPA INTERACTIVO */}
        {(activeSection === 'inicio' || activeSection === 'mapa') && (
          <section id="mapa-section" className="pt-4">
            <IndonesiaMap
              islandPins={islandPins}
              selectedIsland={selectedIsland}
              onSelectIsland={(island) => setSelectedIsland(island)}
            />
          </section>
        )}

        {/* Section: DIARIO DE POSTS */}
        <section id="diario-feed-section" className="space-y-6 pt-4">
          
          {/* Section Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-[#E07A5F]" />
                Diario de a Bordo
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/70">
                {selectedIsland ? (
                  <span>Filtrando por la isla: <strong className="text-[#E07A5F] font-bold">{selectedIsland}</strong></span>
                ) : (
                  'Todas las vivencias, fotografías y consejos de nuestro recorrido'
                )}
              </p>
            </div>

            {/* Search Input & Category Pills */}
            <div className="flex flex-col sm:flex-row gap-3">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                <input
                  type="text"
                  placeholder="Buscar en el diario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-emerald-950/60 border border-white/15 text-white placeholder-emerald-300/40 text-xs focus:outline-none focus:border-[#E07A5F] w-full sm:w-56"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5">
                {['Todas', 'Naturaleza', 'Playas', 'Cultura', 'Volcanes', 'Vídeos'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#E07A5F] text-white shadow-md'
                        : 'glass-panel text-emerald-200 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center space-y-3 border border-white/10">
              <Compass className="h-12 w-12 text-[#E07A5F] mx-auto animate-spin" />
              <h3 className="font-serif-title text-xl font-bold text-white">No se encontraron publicaciones</h3>
              <p className="text-xs text-emerald-200/70 max-w-md mx-auto">
                No hay resultados para el filtro seleccionado. Prueba a borrar la búsqueda o seleccionar otra isla.
              </p>
              <button
                onClick={() => {
                  setSelectedIsland(null);
                  setSelectedCategory('Todas');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#2A9D8F] text-white font-semibold text-xs mt-2"
              >
                Ver todos los posts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenDetail={(p) => setDetailPostId(p.id)}
                  onLike={handleLikePost}
                />
              ))}
            </div>
          )}

        </section>

        {/* Section: CONSEJOS PRÁCTICOS */}
        {activeSection === 'consejos' && (
          <TipsSection tips={tips} />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-[#071713] mt-16 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-emerald-300/70 text-xs">
          
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#E07A5F] to-[#2A9D8F] flex items-center justify-center font-bold text-white">
              🇮🇩
            </div>
            <div>
              <p className="font-serif-title font-bold text-white text-sm">Nusa Odyssey • Indonesia '26</p>
              <p>Documentando 60 días inseparables de viaje en pareja.</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={() => setActiveSection('mapa')} className="hover:text-white transition-colors">
              Mapa de Ruta
            </button>
            <button onClick={() => setShowAdminModal(true)} className="hover:text-[#E07A5F] font-semibold transition-colors">
              Acceso Pareja (Admin)
            </button>
          </div>

          <div className="text-center md:text-right">
            <p>Diario de Viaje • {stats.authorName || 'Indonesia'}</p>
            <p className="text-[10px] opacity-60">Bali • Nusa Penida • Lombok • Sumbawa • Flores • Mar de Banda • Java</p>

          </div>

        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Post Detail Modal */}
      {detailPost && (
        <PostDetailModal
          post={detailPost}
          onClose={() => setDetailPostId(null)}
          onLike={handleLikePost}
          onAddComment={handleAddComment}
        />
      )}

      {/* 2. Story Viewer Modal */}
      {activeStory && (
        <StoryViewerModal
          story={activeStory}
          stories={stories}
          onClose={() => setActiveStory(null)}
          onSelectStory={(story) => setActiveStory(story)}
        />
      )}

      {/* 4. Admin Dashboard Modal */}
      {showAdminModal && (
        <AdminDashboardModal
          posts={posts}
          stories={stories}
          islandPins={islandPins}
          stats={stats}
          onClose={() => setShowAdminModal(false)}
          onSavePost={handleSavePost}
          onDeletePost={handleDeletePost}
          onSaveStories={handleSaveStories}
          onDeleteStory={handleDeleteStory}
          onSaveIslandPins={handleSaveIslandPins}
          onSaveStats={handleSaveStats}
          likesMap={likes}
          commentsMap={comments}
          onDeleteComment={handleDeleteComment}
          adminToken={adminToken}
          dives={dives}
          onSaveDive={handleSaveDive}
          onDeleteDive={handleDeleteDive}
          onLogin={handleAdminLogin}
          onLogout={handleAdminLogout}
          onPublishLocalData={handlePublishLocalData}
        />
      )}

    </div>
  );
}
