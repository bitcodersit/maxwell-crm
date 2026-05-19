import type { SortableEvent } from 'sortablejs'

export const parseSortableEvent = (e: SortableEvent, type: 'column' | 'item') => {
  console.log(e.target, e.newIndex)
  return {
    id: Number(e.target.children[e.newIndex!]?.getAttribute(`data-${type}-id`)),
    sortOrder: [
      e.target.children[e.newIndex! - 1]?.getAttribute(`data-${type}-sort-order`) ?? null,
      e.target.children[e.newIndex! + 1]?.getAttribute(`data-${type}-sort-order`) ?? null
    ]
  }
}
