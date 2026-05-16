<script setup lang="ts">
import type {
  TBaseCrudModal,
  TColumn,
  TField,
  TFilter,
  TGetActions
} from '@/components/base/BaseCrud.vue'

const crudRef = useTemplateRef('crudRef')
const UAvatar = resolveComponent('UAvatar')

const { hCopy } = useHCopy()
const { getAttachment } = useGetAttachment()

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name'
  },
  {
    name: 'phone',
    type: 'input',
    label: 'Phone'
  }
  // {
  //   name: 'email',
  //   type: 'input',
  //   label: 'Email (optional)',
  //   props: {
  //     type: 'email'
  //   }
  // }
]

const columns = computed<TColumn<TUser>[]>(() => [
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
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          size: 'sm',
          src: getAttachment(row.original.avatarId),
          alt: row.original.name,
          ui: {
            fallback: 'text-xs'
          }
        }),
        h('div', {}, row.original.name)
      ])
    }
  },
  // {
  //   accessorKey: 'email',
  //   header: 'Email',
  //   sortBy: 'email',
  //   cell({ row }) {
  //     return h('div', { class: 'flex items-center gap-2' }, [
  //       h('span', row.original.email || '—'),
  //       hVerified(row.original.email, row.original.emailVerifiedAt, 'Email not verified')
  //     ])
  //   }
  // },
  {
    accessorKey: 'phone',
    header: 'Phone',
    sortBy: 'phone',
    cell({ row }) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.phone || '—'),
        hVerified(row.original.phone, row.original.phoneVerifiedAt, 'Phone not verified'),
        hCopy(row.original.phone)
      ])
    }
  },
  {
    accessorKey: 'creator',
    header: 'Creator',
    cell: ({ row }) => row.original.creator?.name || '—'
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
  //   name: 'email',
  //   type: 'input',
  //   props: {
  //     label: 'Email',
  //     placeholder: 'Search by email',
  //     modeable: true
  //   }
  // },
  {
    name: 'phone',
    type: 'input',
    props: {
      label: 'Phone',
      placeholder: 'Search by phone',
      modeable: true
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
    title: mode === 'create' ? 'Add New Customer' : 'Update Customer',
    description: mode === 'create' ? 'Create a customer profile' : 'Update customer details'
  })
}

const getActions: TGetActions<TUser> = (item, v) => [
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
  ].filter(action => !('hidden' in action) || !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ]
]

const getFormState = (v?: TUser) => ({
  id: v?.id,
  name: v?.name ?? '',
  // email: v?.email ?? '',
  phone: v?.phone ?? ''
})

const getPostBody = (v: Record<string, unknown>) => ({
  id: v.id,
  name: v.name,
  // email: typeof v.email === 'string' && v.email.trim() ? v.email.trim() : undefined,
  phone: typeof v.phone === 'string' && v.phone.trim() ? v.phone.trim() : undefined
})
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/customers"
    post-url="/api/customers"
    delete-url="/api/customers/{id}"
    :modal="modal"
    :fields="fields"
    :filters="filters"
    :columns="columns"
    :date-fields="['createdAt', 'updatedAt']"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  />
</template>
