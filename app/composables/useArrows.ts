import type { ComponentPublicInstance } from 'vue'

export const useArrows = <T>(
  data: MaybeRefOrGetter<T[]>,
  getKey: (item?: T) => any,
  onChange?: (item: T) => void
) => {
  const item = ref<T>()
  const refs = ref<Record<number, Element | null>>({})
  watch(item, () => {
    if (!item.value) return
    onChange?.(item.value)
    const ref = refs.value[getKey(item.value)]
    if (!ref) return
    ref.scrollIntoView({
      block: 'nearest',
      inline: 'nearest'
    })
  })
  defineShortcuts({
    arrowdown: () => {
      const items = toValue(data)
      const index = items.findIndex(v => {
        return getKey(v) === getKey(item.value)
      })
      if (index === -1) {
        item.value = items[0]
      } else if (index < items.length - 1) {
        item.value = items[index + 1]
      }
    },
    arrowup: () => {
      const items = toValue(data)
      const index = items.findIndex(v => {
        return getKey(v) === getKey(item.value)
      })
      if (index === -1) {
        item.value = items[items.length - 1]
      } else if (index > 0) {
        item.value = items[index - 1]
      }
    }
  })
  const onRef = (el: Element | ComponentPublicInstance | null, item: T) => {
    refs.value[getKey(item)] = el as Element | null
  }
  return {
    item,
    onRef
  }
}
