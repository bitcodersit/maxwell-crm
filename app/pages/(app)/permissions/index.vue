<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { TColumn } from '@/components/base/BaseCrud.vue'

const columns = computed<TColumn<TPermission>[]>(() => [
  {
    id: 'select',
    size: 48,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    pinned: 'left',
    sortable: true,
    size: 48,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    sortable: true,
  },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'slug', header: 'Slug' },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description || '—',
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ row }) =>
      row.original.rolePermissions?.map((rp) => rp.role?.name ?? '—').join(', ') || '—',
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
</script>

<template>
  <BaseCrud get-url="/api/permissions" :columns="columns" :actions="actions" />
</template>
