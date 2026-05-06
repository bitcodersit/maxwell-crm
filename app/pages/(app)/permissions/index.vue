<script setup lang="ts">
import type {
  TColumn,
  TFilter,
  TField,
  TGetActions,
  TBaseCrudModal,
} from '@/components/base/BaseCrud.vue'

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name',
  },
  {
    name: 'roles',
    type: 'autocomplete',
    label: 'Roles',
    props: {
      api: '/api/roles',
      query: {
        options: true,
      },
    },
  },
  {
    name: 'description',
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
    display: {
      type: 'array',
      slice: 3,
      class: 'flex flex-wrap -ml-1 -mt-1',
    },
    cell({ row, ...ctx }) {
      if (!row.original.rolePermissions) return '—'
      if (!row.original.rolePermissions.length) return '—'
      return row.original.rolePermissions
        .map((rp) => rp.role?.name as string)
        .filter(Boolean)
        .map((label) => {
          const modal = (ctx as any).modal
          return h(UBadge, {
            label,
            size: modal ? 'lg' : 'md',
            class: modal ? 'ml-1 mt-1' : 'mr-1',
            color: ColorsMap[label] || 'neutral',
            variant: 'subtle',
          })
        })
    },
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
    display: {
      type: 'text',
      class: 'w-64',
      length: 40,
    },
    cell({ row }) {
      return row.original.description || '—'
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    sortBy: 'createdAt',
    cell: ({ row }) => $dfc(row.original.createdAt),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    sortBy: 'updatedAt',
    cell: ({ row }) => $dfc(row.original.updatedAt),
  },
  {
    id: 'action',
    pinned: 'right',
  },
])

const filters: TFilter[] = [
  {
    name: 'id',
    type: 'input',
    props: {
      label: 'ID',
      placeholder: 'eg 1 or 1,2,3 or 1-10',
    },
  },
  {
    name: 'name',
    type: 'input',
    props: {
      label: 'Name',
      placeholder: 'Search by name',
      modeable: true,
    },
  },
  {
    name: 'description',
    type: 'input',
    props: {
      label: 'Description',
      placeholder: 'Search by description',
      modeable: true,
    },
  },
  {
    name: 'roleIds',
    type: 'checkbox-api',
    props: {
      label: 'Roles',
      api: '/api/roles',
      query: {
        options: true,
      },
    },
  },
  {
    name: 'createdAt',
    type: 'date',
    props: {
      label: 'Created',
    },
  },
  {
    name: 'updatedAt',
    type: 'date',
    props: {
      label: 'Updated',
    },
  },
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Permission' : 'Update Permission',
    description: mode === 'create' ? 'Add a new permission to the system' : 'Update the permission',
  }),
}

const getActions: TGetActions<TPermission> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        crudRef.value?.onView(item, {
          modal: {
            ui: {
              content: 'max-w-2xl',
            },
          },
        })
      },
    },
    {
      ...actions.update,
      onSelect() {
        crudRef.value?.onUpdate(item)
      },
    },
  ].filter((v: any) => !v.hidden),
  [
    {
      ...actions.delete,
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
  roles: v?.rolePermissions?.map((rp) => rp.role) ?? [],
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
    export-url="/api/permissions/export"
    persist-key="permissions"
    :fields="fields"
    :columns="columns"
    :filters="filters"
    :modal="modal"
    :date-fields="['createdAt', 'updatedAt']"
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
