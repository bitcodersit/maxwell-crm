<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { TColumn, TFilter } from '@/components/base/BaseCrud.vue'

const UBadge = resolveComponent('UBadge')

const columns = computed<TColumn<TPermission>[]>(() => [
  {
    id: 'select',
    size: 48,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    pinned: 'left',
    sortBy: 'id',
    size: 48,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    sortBy: 'name',
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    sortBy: 'slug',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    sortBy: 'description',
    cell: ({ row }) => row.original.description || '—',
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ row }) =>
      row.original.rolePermissions
        ?.map((rp) => rp.role?.name)
        .filter(Boolean)
        .map((name) =>
          h(UBadge, {
            class: 'mr-1',
            color: 'neutral',
            variant: 'subtle',
            label: name,
          })
        ) || '—',
  },
  {
    id: 'action',
    pinned: 'right',
  },
])

const actions = (item: TPermission): DropdownMenuItem[][] => [
  [
    {
      label: 'View',
      icon: 'i-lucide-eye',
      onSelect() {
        console.log('view', item)
      },
    },
    {
      label: 'Update',
      icon: 'i-lucide-pencil',
      onSelect() {
        console.log('update', item)
      },
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        console.log('delete', item)
      },
    },
  ],
]

const filters: TFilter[] = [
  {
    id: 'q',
    type: 'input',
    label: 'Search',
    placeholder: 'Search...',
  },
  {
    id: 'id',
    type: 'input',
    label: 'ID',
    placeholder: 'Search by id (eg 1 or 1,2,3)',
  },
  {
    id: 'name',
    type: 'input',
    label: 'Name',
    modeable: true,
    placeholder: 'Search by name',
  },
  {
    id: 'slug',
    type: 'input',
    label: 'Slug',
    modeable: true,
    placeholder: 'Search by slug',
  },
  {
    id: 'description',
    type: 'input',
    label: 'Description',
    modeable: true,
    placeholder: 'Search by description',
  },
]
</script>

<template>
  <BaseCrud get-url="/api/permissions" :columns="columns" :actions="actions" :filters="filters" />
</template>
