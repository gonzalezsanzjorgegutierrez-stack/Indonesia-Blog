import type { Post, Story, IslandPin, TripStats } from '../types/blog';

export const initialStats: TripStats = {
  totalDays: 60,
  currentDay: 24,
  islandsVisited: 5,
  photosShared: 412,
  kmTravelled: 5900,
  currentLocation: 'Banda Neira, Mar de Banda',
  nextStop: 'Isla Hatta & Java',
  blogTitle: 'Nusa Odyssey',
  authorName: 'Cuaderno de Viaje',
};


export const initialIslandPins: IslandPin[] = [
  {
    id: 'bali-ubud',
    name: 'Bali (Ubud & Uluwatu)',
    island: 'Bali',
    lat: -8.5069,
    lng: 115.2625,
    visitsCount: 7,
    description: 'La isla de los dioses: arrozales verdes de Tegallalang, cascadas místicas y acantilados de surf.',
    dates: 'Días 1 - 8',
    status: 'visited',
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'nusa-penida',
    name: 'Nusa Penida',
    island: 'Nusa Penida',
    lat: -8.7278,
    lng: 115.5444,
    visitsCount: 4,
    description: 'Acantilados espectaculares en Kelingking Beach (T-Rex), Angel’s Billabong y Diamond Beach.',
    dates: 'Días 9 - 12',
    status: 'visited',
    coverImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'lombok-rinjani',
    name: 'Lombok (Kuta & Volcán Rinjani)',
    island: 'Lombok',
    lat: -8.6509,
    lng: 116.3249,
    visitsCount: 5,
    description: 'Playas vírgenes en el sur de Kuta y senderismo entre bosques y cascadas volcánicas.',
    dates: 'Días 13 - 17',
    status: 'visited',
    coverImage: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sumbawa-moyo',
    name: 'Isla de Sumbawa & Isla Moyo',
    island: 'Sumbawa',
    lat: -8.5444,
    lng: 117.4089,
    visitsCount: 3,
    description: 'Naturaleza salvaje fuera del mapa turístico: la cascada Mata Nthu y arrecifes untouched.',
    dates: 'Días 18 - 20',
    status: 'visited',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'komodo-flores',
    name: 'Parque Nacional de Komodo & Flores',
    island: 'Flores (Komodo)',
    lat: -8.65,
    lng: 119.6,
    visitsCount: 4,
    description: 'Vida a bordo en barco Phinisi: dragones prehistóricos, Padar Island y mantas gigantes.',
    dates: 'Días 21 - 25',
    status: 'visited',
    coverImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mar-de-banda',
    name: 'Banda Neira & Isla Hatta',
    island: 'Mar de Banda (Remoto)',
    lat: -4.5244,
    lng: 129.9044,
    visitsCount: 2,
    description: 'El archipiélago perdido del Mar de Banda: historia colonial del nuez moscada y paredones submarinos vírgenes.',
    dates: 'Días 26 - 45',
    status: 'current',
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'java-bromo',
    name: 'Java (Volcán Bromo & Ijen)',
    island: 'Java',
    lat: -7.9425,
    lng: 112.953,
    visitsCount: 0,
    description: 'Cráteres volcánicos humeantes, fuego azul en Ijen y regreso triunfal a España.',
    dates: 'Días 46 - 60',
    status: 'upcoming',
    coverImage: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80',
  }
];

export const initialStories: Story[] = [
  {
    id: 's1',
    title: 'Llegada a las islas de la Nuez Moscada 🌴',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    location: 'Banda Neira, Mar de Banda',
    timestamp: 'Hace 1 hora',
    likes: 98,
  },
  {
    id: 's2',
    title: 'Noche en el barco Phinisi en Komodo 🌙',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-top-aerial-view-of-a-beach-and-clear-ocean-43187-large.mp4',
    location: 'Isla Padar, Komodo',
    timestamp: 'Hace 1 día',
    likes: 124,
  },
  {
    id: 's3',
    title: 'Acantilado T-Rex en Nusa Penida 🦖',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80',
    location: 'Kelingking Beach',
    timestamp: 'Hace 4 días',
    likes: 156,
  },
  {
    id: 's4',
    title: 'Desayuno entre arrozales de Ubud 🥥',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80',
    location: 'Ubud, Bali',
    timestamp: 'Hace 1 semana',
    likes: 88,
  }
];

export const initialPosts: Post[] = [
  {
    id: 'post-banda-neira',
    title: 'Llegar al Fin del Mundo: Banda Neira e Isla Hatta en el Mar de Banda',
    slug: 'mar-de-banda-banda-neira-hatta',
    island: 'Mar de Banda (Remoto)',
    locationName: 'Banda Neira & Isla Hatta, Maluku',
    lat: -4.5244,
    lng: 129.9044,
    date: '13 de Septiembre, 2026',
    dayNumber: 26,
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-top-aerial-view-of-a-beach-and-clear-ocean-43187-large.mp4',
    excerpt: 'Tras horas de navegación hacia uno de los rincones más remotos y mágicos del planeta, pisamos las legendarias Islas de la Nuez Moscada. Arrecifes vírgenes en Isla Hatta e historia viva en Fort Belgica.',
    content: `El viaje al Mar de Banda no es sencillo, pero esa es precisamente su magia. Alejadas de las rutas comerciales turísticas, estas diminutas islas rodeadas por aguas abisales guardan uno de los secretos mejor custodiados de Indonesia.

Llegamos en barco al puerto colonial de **Banda Neira**, flanqueado por el majestuoso volcán Gunung Api. Caminar por sus estrechas calles entre casonas holandesas y la fortaleza de *Fort Belgica* te transporta al siglo XVII, cuando estas islas eran el único lugar de la Tierra donde crecía la codiciada nuez moscada.

Hoy pusimos rumbo en una pequeña barca de madera hacia **Isla Hatta** (llamada así en honor al primer vicepresidente de Indonesia). La visibilidad bajo el agua supera los 40 metros: un abismo coralino vertical repleto de tortugas, pez martillo y arrecifes que parecen sacados de un documental de National Geographic.`,
    tags: ['Mar de Banda', 'Banda Neira', 'Isla Hatta', 'Buceo Remoto', 'Historia'],
    tips: [
      'Para viajar a Banda Neira se necesita consultar bien la frecuencia de los barcos Pelni o vuelos locales desde Ambon.',
      'En Isla Hatta la corriente eléctrica funciona solo unas pocas horas al día; lleva baterías externas cargadas.',
      'El snorkel directo desde la playa en Isla Hatta cae a una pared vertical de más de 600 metros de profundidad increíble.'
    ],
    highlights: [
      'Atardecer desde las murallas del Fuerte Belgica con vistas al Gunung Api',
      'Inmersión con visibilidad de +40 metros en las paredes coralinas de Isla Hatta',
      'Degustar mermelada fresca de nuez moscada balinesa en un homestay tradicional'
    ],
    likes: 189,
    isFeatured: true,
    comments: [
      {
        id: 'cb1',
        authorName: 'Mamá & Papá',
        text: '¡Increíble lugar! Nos alegra muchísimo que hayáis podido llegar hasta esas islas tan remotas. Las fotos del mar turquesa son impresionantes ❤️',
        date: '13 Sept, 2026',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isApproved: true,
      }
    ]
  },
  {
    id: 'post-1-komodo',
    title: 'Navegando entre Gigantes: 3 días de vida a bordo en Komodo',
    slug: 'vida-a-bordo-komodo-padar',
    island: 'Flores (Komodo)',
    locationName: 'Parque Nacional de Komodo, Flores',
    lat: -8.65,
    lng: 119.6,
    date: '10 de Septiembre, 2026',
    dayNumber: 21,
    coverImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-top-aerial-view-of-a-beach-and-clear-ocean-43187-large.mp4',
    excerpt: 'Dejamos atrás la civilización para embarcarnos en un barco tradicional de madera. Cimas icónicas en Padar Island, playas de arena rosa y el encuentro inolvidable con los dragones prehistóricos.',
    content: `Habíamos soñado con este momento desde que empezamos a planificar este viaje de dos meses por Indonesia: subir a un tradicional barco *phinisi* de madera en Labuan Bajo y adentrarnos en las aguas turquesas del Parque Nacional de Komodo.

La primera sorpresa del trayecto fue la llegada a la famosa **Padar Island**. Tras una subida exigente de unos 800 escalones al amanecer, el sol empezó a teñir las tres bahías icónicas, cada una con un tono de arena distinto: blanca, negra volcánica y una impresionante playa rosa.

Al mediodía navegamos hacia la isla de Rinca para ver cara a cara a los míticos **dragones de Komodo**. Ver a estos reptiles prehistóricos de casi tres metros caminar en silencio por la sabana te deja sin aliento.`,
    tags: ['Naturaleza', 'Buceo', 'Vida a Bordo', 'Komodo', 'Senderismo'],
    tips: [
      'Reserva el barco en grupo o privado directamente en el puerto de Labuan Bajo.',
      'Lleva calzado con buena suela para subir a Padar Island.'
    ],
    highlights: [
      'Cima panorámica de Padar Island al amanecer',
      'Avistamiento de 4 Dragones de Komodo adultos',
      'Snorkel en Pink Beach'
    ],
    likes: 148,
    isFeatured: true,
    comments: []
  },
  {
    id: 'post-nusa-penida',
    title: 'Los Acantilados Indómitos de Nusa Penida: Kelingking & Diamond Beach',
    slug: 'nusa-penida-kelingking-diamond-beach',
    island: 'Nusa Penida',
    locationName: 'Nusa Penida, Bali',
    lat: -8.7278,
    lng: 115.5444,
    date: '3 de Septiembre, 2026',
    dayNumber: 10,
    coverImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ],
    excerpt: 'Nusa Penida destaca por sus abismos verticales sobre el océano. Descendimos los escalones de Kelingking Beach y nos bañamos en las aguas turquesas de Diamond Beach.',
    content: `Tomamos la lancha rápida desde Sanur (Bali) hacia la vertiginosa isla de Nusa Penida. La primera parada fue la mítica vista de **Kelingking Beach**, el acantilado con forma de T-Rex azotado por las olas gigantes del Índico.

Por la tarde cruzamos hacia el este para maravillarnos con **Diamond Beach**, una escalera excavada en la propia roca blanca que desciende hasta una bahía de arena desierta rodeada de agujas cársticas.`,
    tags: ['Nusa Penida', 'Acantilados', 'Playas', 'Aventura'],
    tips: [
      'Los caminos de Nusa Penida son bastante bacheados; si alquilas moto, conduce con mucha precaución.'
    ],
    highlights: [
      'Vistas panorámicas de Kelingking Beach (T-Rex)',
      'Bajada a Diamond Beach',
      'Piscina natural en Angel’s Billabong'
    ],
    likes: 135,
    isFeatured: true,
    comments: []
  },
  {
    id: 'post-ubud-bali',
    title: 'Ubud y la Magia Espiritual de Bali: Arrozales y Templos de Incienso',
    slug: 'ubud-bali-arrozales-templos',
    island: 'Bali',
    locationName: 'Ubud, Bali',
    lat: -8.5069,
    lng: 115.2625,
    date: '25 de Agosto, 2026',
    dayNumber: 3,
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [],
    excerpt: 'Bali nos dio la bienvenida con la serenidad de sus arrozales en terraza de Tegallalang, batidos de acai tropicales y rituales de purificación en Tirta Empul.',
    content: `Arrancamos nuestro viaje de dos meses por Indonesia aterrizando en la isla de Bali. Ubud fue el campamento base perfecto: despertar con el canto de las aves tropicales, pasear por el Campuhan Ridge Walk y perdernos entre los campos de arroz verdes.`,
    tags: ['Bali', 'Ubud', 'Cultura', 'Arrozales'],
    tips: ['Visita Tegallalang muy temprano al amanecer.'],
    highlights: ['Campuhan Ridge Walk', 'Arrozales de Tegallalang'],
    likes: 110,
    isFeatured: false,
    comments: []
  }
];
