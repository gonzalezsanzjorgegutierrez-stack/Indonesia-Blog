import { useState, useEffect } from 'react';
import {
  getStoredPosts, savePosts,
  getStoredStories, saveStories,
  getStoredIslandPins, saveIslandPins,
  getStoredStats, saveStats
} from './utils/storage';
import type { Post, Story, IslandPin, TripStats, Tip } from './types/blog';
import { initialTips } from './data/initialData';
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

export default function App() {
  const [posts, setPosts] = useState<Post[]>(getStoredPosts);
  const [stories, setStories] = useState<Story[]>(getStoredStories);
  const [islandPins, setIslandPins] = useState<IslandPin[]>(getStoredIslandPins);
  const [stats, setStats] = useState<TripStats>(getStoredStats);
  const [tips] = useState<Tip[]>(initialTips);

  const [activeSection, setActiveSection] = useState<string>('inicio');
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Sync state to localstorage
  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  useEffect(() => {
    saveStories(stories);
  }, [stories]);

  useEffect(() => {
    saveIslandPins(islandPins);
  }, [islandPins]);

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const refreshData = () => {
    setPosts(getStoredPosts());
    setStories(getStoredStories());
    setIslandPins(getStoredIslandPins());
    setStats(getStoredStats());
  };

  // Like Post
  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
    if (detailPost && detailPost.id === postId) {
      setDetailPost((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null));
    }
  };

  // Add Comment
  const handleAddComment = (postId: string, authorName: string, text: string) => {
    const newComment = {
      id: `c-${Date.now()}`,
      authorName,
      text,
      date: 'Hoy',
      isApproved: true,
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [newComment, ...p.comments] } : p
      )
    );

    if (detailPost && detailPost.id === postId) {
      setDetailPost((prev) =>
        prev ? { ...prev, comments: [newComment, ...prev.comments] } : null
      );
    }
  };

  // Save Island Pins (From Admin)
  const handleSaveIslandPins = (pins: IslandPin[]) => {
    setIslandPins(pins);
    saveIslandPins(pins);
  };

  // Save / Edit Post (From Admin)
  const handleSavePost = (newPost: Post) => {
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === newPost.id);
      if (exists) {
        return prev.map((p) => (p.id === newPost.id ? newPost : p));
      }
      return [newPost, ...prev];
    });
  };

  // Delete Post
  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Save Story
  const handleSaveStory = (newStory: Story) => {
    setStories((prev) => [newStory, ...prev]);
  };

  // Delete Story
  const handleDeleteStory = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  // Filter posts based on search query, island, and category
  const filteredPosts = posts.filter((post) => {
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
                  onOpenDetail={(p) => setDetailPost(p)}
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
          onClose={() => setDetailPost(null)}
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
          onSaveStory={handleSaveStory}
          onDeleteStory={handleDeleteStory}
          onSaveIslandPins={handleSaveIslandPins}
          onSaveStats={setStats}
          onRefreshData={refreshData}
        />
      )}

    </div>
  );
}
