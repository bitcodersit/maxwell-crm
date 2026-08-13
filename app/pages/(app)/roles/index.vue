<script setup lang="ts">
import type {
  TField,
  TFilter,
  TColumn,
  TGetActions,
  TBaseCrudModal
} from '@/components/base/BaseCrud.vue'

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')

const colorizeName = (name?: string) => {
  return name?.split('-').map(v => {
    return h(
      'span',
      {
        class: ['capitalize', 'text-' + ColorsMap[v] || 'neutral']
      },
      v
    )
  })
}

const labelProps = {
  labelClass: 'capitalize',
  getLabel(v: { name?: string }) {
    return h(
      'div',
      {
        class: 'flex gap-1'
      },
      colorizeName(v?.name)
    )
  }
}

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name'
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Description'
  },
  {
    name: 'permissions',
    type: 'autocomplete',
    label: 'Permissions',
    props: {
      ...labelProps,
      api: '/api/permissions',
      query: { options: true }
    }
  }
]

const columns = computed<TColumn<TRole>[]>(() => [
  {
    id: 'select',
    size: 48
  },
  {
    accessorKey: 'id',
    header: 'ID',
    pinned: 'left',
    sortBy: 'id',
    size: 48
  },
  {
    accessorKey: 'name',
    header: 'Name',
    sortBy: 'name',
    cell: ({ row }) =>
      row.original.name.split('-').map(label => {
        return h(UBadge, {
          label,
          class: 'mr-1 capitalize',
          variant: 'subtle',
          color: ColorsMap[label] || 'neutral'
        })
      })
  },
  {
    accessorKey: 'permissions',
    header: 'Permissions',
    display: {
      type: 'array',
      slice: 3,
      class: 'flex flex-wrap -ml-1 -mt-1'
    },
    cell({ row, ...ctx }) {
      if (!row.original.rolePermissions) return '—'
      if (!row.original.rolePermissions.length) return '—'
      return row.original.rolePermissions
        .map(rp => rp.permission?.name as string)
        .filter(Boolean)
        .map(label => {
          const modal = (ctx as any).modal
          return h(
            UBadge,
            {
              size: modal ? 'lg' : 'md',
              class: modal ? 'ml-1 mt-1' : 'mr-1',
              color: 'neutral',
              variant: 'subtle'
            },
            () => colorizeName(label)
          )
        })
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    sortBy: 'description',
    display: {
      type: 'text',
      class: 'w-64',
      length: 40
    },
    cell({ row }) {
      return row.original.description || '—'
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    sortBy: 'createdAt',
    cell: ({ row }) => $dfc(row.original.createdAt)
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    sortBy: 'updatedAt',
    cell: ({ row }) => $dfc(row.original.updatedAt)
  },
  {
    id: 'action',
    pinned: 'right'
  }
])

const filters: TFilter[] = [
  {
    name: 'q',
    type: 'inline-input',
    props: {
      placeholder: 'Search...'
    }
  },
  {
    name: 'id',
    type: 'input',
    props: {
      label: 'ID',
      placeholder: 'eg 1 or 1,2,3 or 1-10'
    }
  },
  // {
  //   name: 'name',
  //   type: 'input',
  //   props: {
  //     label: 'Name',
  //     placeholder: 'Search by name',
  //     modeable: true
  //   }
  // },
  // {
  //   name: 'description',
  //   type: 'input',
  //   props: {
  //     label: 'Description',
  //     placeholder: 'Search by description',
  //     modeable: true
  //   }
  // },
  {
    name: 'permissionIds',
    type: 'checkbox-api',
    props: {
      ...labelProps,
      label: 'Permissions',
      api: '/api/permissions',
      query: { options: true }
    }
  },
  {
    name: 'createdAt',
    type: 'date',
    props: {
      label: 'Created'
    }
  },
  {
    name: 'updatedAt',
    type: 'date',
    props: {
      label: 'Updated'
    }
  }
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Role' : 'Update Role',
    description: mode === 'create' ? 'Add a new role to the system' : 'Update the role',
    ui: {
      content: 'max-w-2xl'
    }
  })
}

const getActions: TGetActions<TRole> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        crudRef.value?.onView(item, {
          modal: {
            ui: {
              content: 'max-w-2xl'
            }
          }
        })
      }
    },
    {
      ...actions.update,
      onSelect() {
        crudRef.value?.onUpdate(item)
      }
    }
  ].filter((action: any) => !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ]
]

const getFormState = (v?: TRole) => ({
  id: v?.id,
  name: v?.name ?? '',
  description: v?.description ?? '',
  permissions: v?.rolePermissions?.map(rp => rp.permission).filter(Boolean) ?? []
})

const getPostBody = (v: Record<string, any>) => ({
  id: v.id,
  name: v.name,
  description: v.description,
  permissionIds: (v.permissions ?? []).map((p: any) => p.id)
})
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/roles"
    post-url="/api/roles"
    delete-url="/api/roles/{id}"
    :fields="fields"
    :columns="columns"
    :filters="filters"
    :modal="modal"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  />
</template>
