export type RecipeListKey = 'my-recipes' | 'sample-recipes';

export const RECIPE_LIST_KEYS: RecipeListKey[] = ['my-recipes', 'sample-recipes'];

export function isRecipeListKey(value: unknown): value is RecipeListKey {
  return value === 'my-recipes' || value === 'sample-recipes';
}

function arrayMove<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const next = list.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Sort `items` by their slug's position in `orderedSlugs`. Slugs that are not yet
 * present in the stored order are treated as new and kept at the top, preserving
 * their incoming (default) order. This keeps freshly added recipes prominent in
 * My Recipes while honoring any manual arrangement for the rest.
 */
export function sortByManualOrder<T>(
  items: T[],
  getSlug: (item: T) => string,
  orderedSlugs: string[]
): T[] {
  if (orderedSlugs.length === 0) {
    return items;
  }

  const orderIndex = new Map<string, number>();
  orderedSlugs.forEach((slug, index) => {
    if (!orderIndex.has(slug)) {
      orderIndex.set(slug, index);
    }
  });

  const known: T[] = [];
  const unknown: T[] = [];

  items.forEach((item) => {
    if (orderIndex.has(getSlug(item))) {
      known.push(item);
    } else {
      unknown.push(item);
    }
  });

  known.sort((left, right) => orderIndex.get(getSlug(left))! - orderIndex.get(getSlug(right))!);

  return [...unknown, ...known];
}

/**
 * Translate a drag-and-drop reorder performed within a filtered (visible) subset
 * back into a new global order. The visible slugs are re-slotted into the
 * positions they already occupy inside `globalOrder`, so hidden items keep their
 * absolute spots while the visible items reflect the drop.
 *
 * `globalOrder` must contain every slug in `visibleSlugs`.
 */
export function reorderWithinFilteredView(
  globalOrder: string[],
  visibleSlugs: string[],
  fromVisibleIndex: number,
  toVisibleIndex: number
): string[] {
  if (
    fromVisibleIndex === toVisibleIndex ||
    fromVisibleIndex < 0 ||
    toVisibleIndex < 0 ||
    fromVisibleIndex >= visibleSlugs.length ||
    toVisibleIndex >= visibleSlugs.length
  ) {
    return globalOrder;
  }

  const newVisible = arrayMove(visibleSlugs, fromVisibleIndex, toVisibleIndex);
  const visibleSet = new Set(visibleSlugs);
  let visibleCursor = 0;

  return globalOrder.map((slug) => (visibleSet.has(slug) ? newVisible[visibleCursor++] : slug));
}
