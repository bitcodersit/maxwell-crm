<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { TColumn, TFilter, TField } from '@/components/base/BaseCrud.vue'
import { format } from 'date-fns'

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')

const fields: TField[] = [
  {
    id: 'name',
    type: 'input',
    label: 'Name',
  },
  {
    id: 'roles',
    type: 'autocomplete',
    label: 'Roles',
    props: {
      api: '/api/roles',
    },
  },
  {
    id: 'description',
    type: 'textarea',
    label: 'Description',
  },
]

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
    cell: ({ row }) =>
      row.original.name.split('-').map((label) => {
        return h(UBadge, {
          label,
          class: 'mr-1 capitalize',
          variant: 'subtle',
          color: ColorsMap[label] || 'neutral',
        })
      }),
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
    accessorKey: 'name',
    header: 'Slug',
    sortBy: 'name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    sortBy: 'description',
    cell: ({ row }) => row.original.description || '—',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    sortBy: 'createdAt',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy h:mm a'),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    sortBy: 'updatedAt',
    cell: ({ row }) => format(new Date(row.original.updatedAt), 'MMM d, yyyy h:mm a'),
  },
  {
    id: 'action',
    pinned: 'right',
  },
])

const filters: TFilter[] = [
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
    id: 'description',
    type: 'input',
    label: 'Description',
    modeable: true,
    placeholder: 'Search by description',
  },
]

const formModal = {
  create: {
    title: 'Add New Permission',
    description: 'Add a new permission to the system',
  },
  update: {
    title: 'Update Permission',
    description: 'Update the permission',
  },
}

const getActions = (item: TPermission): DropdownMenuItem[][] => [
  [
    {
      label: 'View Details',
      icon: 'i-lucide-eye',
      onSelect() {
        console.log('view', item)
      },
    },
    {
      label: 'Update',
      icon: 'i-lucide-pencil',
      onSelect() {
        crudRef.value?.onUpdate(item)
      },
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        crudRef.value?.onDelete(`/api/permissions/${item.id}`)
      },
    },
  ],
]

const getFormState = (v?: TPermission) => ({
  id: v?.id,
  name: v?.name ?? '',
  description: v?.description ?? '',
  roles: v?.rolePermissions?.map((rp) => rp.roleId || rp.role) ?? [],
})

const getPostBody = (v: Record<string, any>) => ({
  id: v.id,
  name: v.name,
  description: v.description,
  roleIds: v.roles.map((r: any) => r.id),
})

const onDeleteSelected = () => {
  crudRef.value?.onDeleteSelected((v) => {
    return `/api/permissions/${v.map((x) => x.id).join(',')}`
  })
}
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/permissions"
    post-url="/api/permissions"
    :fields="fields"
    :columns="columns"
    :filters="filters"
    :form-modal="formModal"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  >
    <template #bulk-actions="{ count }">
      <UButton
        label="Delete"
        color="error"
        variant="subtle"
        icon="i-lucide-trash"
        :ui="{ leadingIcon: 'size-4' }"
        @click="onDeleteSelected"
      >
        <template #trailing>
          <UKbd>
            {{ count }}
          </UKbd>
        </template>
      </UButton>
    </template>
  </BaseCrud>
</template>
