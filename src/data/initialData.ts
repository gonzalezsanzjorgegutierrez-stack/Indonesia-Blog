import type { Post, Story, IslandPin, TripStats, Tip } from '../types/blog';

export const initialStats: TripStats = {
  totalDays: 60,
  currentDay: 1,
  tripStartDate: '2026-09-18', // Día de llegada a Yakarta / Sanur, Bali
  islandsVisited: 1,
  photosShared: 0,
  kmTravelled: 0,
  startLocation: 'Bali',
  currentLocation: 'Sanur, Bali',
  nextStop: 'Nusa Penida',
  blogTitle: 'Nusa Odyssey',
  authorName: 'Cuaderno de Viaje',
};


export const initialIslandPins: IslandPin[] = [];

export const initialStories: Story[] = [];

export const initialPosts: Post[] = [];

export const initialTips: Tip[] = [
  // PREPARACIÓN GENERAL
  {
    id: 'tip-1',
    category: 'preparacion',
    title: 'Documentación Necesaria',
    description: 'Pasaporte válido por 6 meses mínimo, seguro de viaje, visados de entrada (algunos países requieren). Haz copias de documentos importantes.',
    icon: 'briefcase'
  },
  {
    id: 'tip-2',
    category: 'preparacion',
    title: 'Presupuesto Estimado',
    description: 'Indonesia es muy económica: alojamiento desde $5-20/noche, comida desde $2-5, transporte local muy barato. Presupuesta $30-50 diarios en viaje económico.',
    icon: 'money'
  },
  {
    id: 'tip-3',
    category: 'preparacion',
    title: 'Qué Empacar',
    description: 'Ropa ligera y transpirable, protector solar SPF50, repelente mosquitos (dengue), chanclas, traje baño. Lleva menos ropa: hay muchas lavanderías. Una mochila de 40L es suficiente.',
    icon: 'backpack'
  },
  {
    id: 'tip-4',
    category: 'preparacion',
    title: 'Mejor Época para Viajar',
    description: 'Estación seca: Abril-Octubre. Evita Noviembre-Marzo (lluvia, monzones, playas cerradas por olas). Los precios suben en Julio-Agosto. Septiembre-Octubre es ideal: menos turismo, buen clima.',
    icon: 'document'
  },

  // DURANTE EL VIAJE
  {
    id: 'tip-5',
    category: 'viaje',
    title: 'Dinero y Pagos',
    description: 'Moneda: Rupia Indonesa (IDR). Cambia en bancos o ATMs locales (mejor tasa). Lleva USD como respaldo. Tarjetas aceptadas en ciudades grandes, pero lleva efectivo para pueblos. Hay falsificaciones: verifica billetes.',
    icon: 'money'
  },
  {
    id: 'tip-6',
    category: 'viaje',
    title: 'Internet y Comunicación',
    description: 'Compra SIM local: Telkomsel o Indosat con datos ilimitados ($3-5). WiFi disponible en hostels/hoteles. WhatsApp es lo mejor para llamadas internacionales. Descarga mapas offline de Google Maps.',
    icon: 'phone'
  },
  {
    id: 'tip-7',
    category: 'viaje',
    title: 'Salud y Seguridad',
    description: 'Malaria rara en zonas de turismo. Dengue es más común: usa repelente. Agua: compra embotellada. Vacúnate contra Hepatitis A/B. Llevas un pequeño botiquín. Hospitales decentes en ciudades grandes.',
    icon: 'alert'
  },
  {
    id: 'tip-8',
    category: 'viaje',
    title: 'Transporte Seguro',
    description: 'Viaja en autobús nocturno de buena reputación (Perama, Bali Hyundai). Rent motos si tienes experiencia: carnet internacional. Taxis/Grab más seguro que taxis callejeros. Evita conducir por la noche.',
    icon: 'transport'
  },

  // POR ISLA: BALI
  {
    id: 'tip-9',
    category: 'isla',
    island: 'Bali',
    title: 'Dónde Hospedarse',
    description: 'Ubud: cultural y natural. Canggu: playa y nightlife. Seminyak: lujo. Sanur: tranquilo. South Kuta: mochileros. Elige según tus intereses.',
    icon: 'location'
  },
  {
    id: 'tip-10',
    category: 'isla',
    island: 'Bali',
    title: 'Comida Local',
    description: 'Nasi Goreng (arroz frito), Gado-Gado (ensalada con salsa maní), Satay Ayam. Prueba warung locales: son baratos y auténticos. El café de Luwak (civeta) es carísimo: posiblemente trucado.',
    icon: 'food'
  },
  {
    id: 'tip-11',
    category: 'isla',
    island: 'Bali',
    title: 'Tráfico y Movilidad',
    description: 'El tráfico de Ubud y Seminyak es caótico. Usa Grab (app) o negocia precios en taxis. Renta moto si confías en ti. Carreteras en buen estado pero locales conducen agresivamente.',
    icon: 'transport'
  },

  // POR ISLA: NUSA PENIDA
  {
    id: 'tip-12',
    category: 'isla',
    island: 'Nusa Penida',
    title: 'Cómo Llegar',
    description: 'Lancha desde Sanur (Bali): 1-1.5h, $8-12. Desde Padangbai: más económico. Las aguas pueden estar agitadas: si tienes mareos, toma medicamento preventivo.',
    icon: 'transport'
  },
  {
    id: 'tip-13',
    category: 'isla',
    island: 'Nusa Penida',
    title: 'Playas Imprescindibles',
    description: 'Kelingking Beach: acantilados espectaculares. Diamond Beach: escaleras en roca blanca. Angel\'s Billabong: piscina natural. Atard Beach: playas vírgenes. Kelingking es la más famosa.',
    icon: 'location'
  },

  // POR ISLA: LOMBOK
  {
    id: 'tip-14',
    category: 'isla',
    island: 'Lombok',
    title: 'Volcán Rinjani',
    description: 'Senderismo de 2-3 días. Base en Senaru. Es físicamente exigente pero impresionante. Mejor ir con agencia para manejo de seguridad. Lleva agua abundante, mapa offline y botiquín.',
    icon: 'navigation'
  },
  {
    id: 'tip-15',
    category: 'isla',
    island: 'Lombok',
    title: 'Playas Secretas',
    description: 'Kuta Beach: arena blanca, aguas turquesas, pocos turistas. Tanjung Aan: playas desiertas. Gillies Islands: snorkel increíble. Renta moto para explorar el sur.',
    icon: 'location'
  },

  // POR ISLA: FLORES (KOMODO)
  {
    id: 'tip-16',
    category: 'isla',
    island: 'Flores',
    title: 'Parque Nacional Komodo',
    description: 'Reserva tour con agencia: incluye barco, guía y almuerzo. Verás dragones de Komodo, playas y snorkel. Los dragones son lentos pero peligrosos: respeta distancia con guía.',
    icon: 'location'
  },
  {
    id: 'tip-17',
    category: 'isla',
    island: 'Flores',
    title: 'Labuan Bajo Base',
    description: 'Puerto de entrada. Tours de Komodo, buceo y snorkel se organizan aquí. Alojamiento básico pero suficiente. Come seafood fresco en el mercado nocturno.',
    icon: 'food'
  },

  // POR ISLA: JAVA
  {
    id: 'tip-18',
    category: 'isla',
    island: 'Java',
    title: 'Volcán Bromo',
    description: 'Subida al amanecer desde Cemoro Lawang. Alucinante ver salida del sol entre nubes sobre volcán activo. Tours incluyen 4x4 y visita Savana Pasir. Lleva abrigo: hace frío en altura.',
    icon: 'navigation'
  },
  {
    id: 'tip-19',
    category: 'isla',
    island: 'Java',
    title: 'Borobudur y Prambanan',
    description: 'Templos budistas e hindúes más grandes de Indonesia. En Yogyakarta. Visita al amanecer. Tours combinados: $30-50. Templos increíbles pero muy turísticos.',
    icon: 'location'
  }
];
