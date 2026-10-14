/**
 * Orden explícito de las paradas de la ruta.
 *
 * Antes, el orden del mapa era simplemente el orden en que se habían ido GUARDANDO las paradas en
 * el panel. Si alguna se añadía fuera de sitio (p. ej. "Bima" antes que "Labuan Jambu", cuando en
 * realidad se visitó después), no había forma de corregirlo salvo borrar y recrear todo. Estas
 * funciones dan a cada parada un número de orden explícito y permiten subirla o bajarla en la lista.
 */

export interface Ordered {
  order?: number;
}

/** Orden efectivo de una parada: el explícito si existe, o su posición en la lista si no (paradas antiguas, antes de este cambio). */
const effectiveOrder = <T extends Ordered>(item: T, index: number): number => item.order ?? index;

/** Las paradas ordenadas por `order` (con el índice original como desempate estable). */
export const sortByOrder = <T extends Ordered>(items: T[]): T[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => effectiveOrder(a.item, a.index) - effectiveOrder(b.item, b.index) || a.index - b.index)
    .map((x) => x.item);

/** El siguiente número de orden para una parada nueva: se sigue añadiendo al final, como hasta ahora. */
export const nextOrder = <T extends Ordered>(items: T[]): number =>
  items.length === 0 ? 1 : Math.max(...items.map((item, i) => effectiveOrder(item, i))) + 1;

/** Mueve un elemento de una lista YA ORDENADA de una posición a otra. Fuera de rango: la misma lista. */
export const moveItem = <T>(sorted: T[], fromIndex: number, toIndex: number): T[] => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= sorted.length ||
    toIndex < 0 ||
    toIndex >= sorted.length
  ) {
    return sorted;
  }
  const copy = sorted.slice();
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
};

/** Renumera una lista ya ordenada como 1, 2, 3... (dejando el orden explícito, sin huecos). */
export const renumber = <T extends Ordered>(sorted: T[]): T[] => sorted.map((item, i) => ({ ...item, order: i + 1 }));
