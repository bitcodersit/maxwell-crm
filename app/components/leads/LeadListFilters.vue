<script setup lang="ts">
import type { TFilter } from '@/components/base/BaseCrud.vue'
import { leadListFilters } from '@/utils/leads-filters'

const props = withDefaults(
  defineProps<{
    filters?: TFilter[]
  }>(),
  {
    filters: () => leadListFilters
  }
)

const query = defineModel<Record<string, any>>({ required: true })

const isClearable = computed(() => {
  return Object.keys(query.value).some(key => {
    const value = query.value[key]
    if (value == null || value === '') return false
    if (Array.isArray(value) && !value.length) return false
    if (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length) {
      return false
    }
    return true
  })
})

function onClearFilters() {
  query.value = {}
}
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <template
      v-for="row in props.filters"
      :key="row.name"
    >
      <FilterInputInline
        v-if="row.type === 'inline-input'"
        v-bind="row.props"
        v-model="query[row.name]"
      />
      <FilterInput
        v-else-if="row.type === 'input'"
        v-bind="row.props"
        v-model="query[row.name]"
        v-model:mode="query[row.name + 'Mode']"
      />
      <FilterDate
        v-else-if="row.type === 'date'"
        v-bind="row.props"
        v-model="query[row.name]"
      />
      <FilterCheckbox
        v-else-if="row.type === 'checkbox-api'"
        v-bind="row.props"
        v-model="query[row.name]"
      />
      <FilterTabs
        v-else-if="row.type === 'tabs'"
        v-bind="row.props"
        v-model="query[row.name]"
      />
    </template>
    <UTooltip
      v-if="isClearable"
      text="Clear filters"
    >
      <UButton
        icon="i-lucide-filter"
        size="sm"
        color="error"
        variant="subtle"
        @click="onClearFilters"
      >
        Clear
      </UButton>
    </UTooltip>
  </div>
</template>
