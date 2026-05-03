<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

const title = 'Permissions'

useHead({ title })
useDashboardNavbar({ title })

const columns = computed<TableColumn<TPermission>[]>(() => [
  {
    id: 'select',
    size: 48,
  },
  {
    accessorKey: 'id',
    size: 48,
    header: ({ column }) => {
      if (!column.getIsPinned()) {
        column.pin('left')
      }
      return 'ID'
    },
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
    header: ({ column }) => {
      if (!column.getIsPinned()) {
        column.pin('right')
      }
      return ''
    },
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
