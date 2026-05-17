<script lang="ts">
//
</script>

<script setup lang="ts" generic="Item extends Record<string, any>">
const props = withDefaults(
  defineProps<{
    api: string
    getItem: (v: TBoardItem) => Item
  }>(),
  {
    //
  }
)

const queryKey = computed(() => {
  return [props.api]
})

const $fetch = useRequestFetch()
const { data, isFetching, refetch } = useQuerySSR({
  queryKey,
  queryFn: () => {
    return $fetch<TBoard>(props.api)
  }
})

const onRef = (el: any) => {
  console.log(el)
}
</script>

<template>
  <div class="relative">
    <UProgress
      v-if="isFetching"
      :ui="{ base: 'rounded-none' }"
      size="sm"
      class="absolute top-0 left-0 w-full"
    />

    <div
      :ref="onRef"
      class="flex-1 overflow-y-hidden overflow-x-auto scrollbar px-4 py-4 flex gap-4 relative"
    >
      <div
        v-for="column in data?.columns || []"
        :key="column.id"
        :data-kanban-column-id="column.id"
        class="flex-none w-96 flex flex-col overflow-hidden border border-default rounded-lg"
        :class="{
          'kanban-column--pinned': column.pinned
        }"
      >
        <div class="flex-none bg-elevated">
          <div class="flex items-center gap-2 px-3 py-2">
            <span class="text-sm font-semibold text-highlighted truncate">{{ column.name }}</span>
            <UBadge
              :label="String(data?.items?.length || 0)"
              color="neutral"
              variant="soft"
              size="xs"
            />
          </div>
          <div
            class="h-1"
            :style="{
              backgroundColor: column.color ? column.color : 'var(--color-border)'
            }"
          ></div>
        </div>

        <!-- Items -->
        <div>
          <div class="text-center py-4 text-xs text-muted italic">No items</div>
        </div>
      </div>
    </div>
  </div>
</template>
