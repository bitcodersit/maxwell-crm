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
const getCustomerAddressLine1 = (user?: TUser) =>
  ((user as any)?.addressable?.addresses?.[0]?.addressLine1 as string | undefined) || ''

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name',
    col: 'col-span-2'
  },
  {
    name: 'phone',
    type: 'input',
    label: 'Phone'
  },
  {
    name: 'email',
    type: 'input',
    label: 'Email (optional)',
    props: {
      type: 'email'
    }
  },
  {
    name: 'company',
    type: 'input',
    label: 'Company'
  },
  {
    name: 'designation',
    type: 'input',
    label: 'Designation'
  },
  {
    name: 'addressLine1',
    type: 'textarea',
    label: 'Address',
    col: 'col-span-2'
  }
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
          src: getAttachment(row.original.avatar?.path),
          alt: row.original.name,
          ui: {
            fallback: 'text-xs'
          }
        }),
        h('div', {}, row.original.name)
      ])
    }
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    sortBy: 'phone',
    cell({ row }) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.phone || '—'),
        hCopy(row.original.phone)
      ])
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
    sortBy: 'email',
    cell({ row }) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.email || '—'),
        hCopy(row.original.email)
      ])
    }
  },
  {
    accessorKey: 'organization',
    header: 'Company',
    sortBy: 'organization',
    cell: ({ row }) => row.original.organization || '—'
  },
  {
    accessorKey: 'designation',
    header: 'Designation',
    sortBy: 'designation',
    cell: ({ row }) => row.original.designation || '—'
  },
  {
    accessorKey: 'addressLine1',
    header: 'Address',
    cell: ({ row }) => getCustomerAddressLine1(row.original) || '—'
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
  {
    name: 'email',
    type: 'input',
    props: {
      label: 'Email',
      placeholder: 'Search by email',
      modeable: true
    }
  },
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
    name: 'company',
    type: 'input',
    props: {
      label: 'Company',
      placeholder: 'Search by company',
      modeable: true
    }
  },
  {
    name: 'designation',
    type: 'input',
    props: {
      label: 'Designation',
      placeholder: 'Search by designation',
      modeable: true
    }
  },
  {
    name: 'addressLine1',
    type: 'input',
    props: {
      label: 'Address',
      placeholder: 'Search by address',
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
  email: v?.email ?? '',
  phone: v?.phone ?? '',
  company: v?.organization ?? '',
  designation: v?.designation ?? '',
  addressLine1: getCustomerAddressLine1(v)
})

const getPostBody = (v: Record<string, unknown>) => ({
  id: v.id,
  name: v.name,
  email: typeof v.email === 'string' && v.email.trim() ? v.email.trim() : null,
  phone: typeof v.phone === 'string' && v.phone.trim() ? v.phone.trim() : undefined,
  company: typeof v.company === 'string' && v.company.trim() ? v.company.trim() : null,
  designation:
    typeof v.designation === 'string' && v.designation.trim() ? v.designation.trim() : null,
  addressLine1:
    typeof v.addressLine1 === 'string' && v.addressLine1.trim() ? v.addressLine1.trim() : null
})

const importOpen = ref(false)

const onImportDone = () => {
  crudRef.value?.refetch()
}
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
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  >
    <template #actions>
      <UTooltip text="Bulk import customers">
        <UButton
          icon="i-lucide-upload"
          size="sm"
          color="neutral"
          variant="subtle"
          @click="
            () => {
              importOpen = true
            }
          "
        >
          Bulk Import
        </UButton>
      </UTooltip>
      <UTooltip text="Add new item">
        <UButton
          icon="i-lucide-plus"
          size="sm"
          color="primary"
          variant="solid"
          @click="() => crudRef?.onAddNew()"
        >
          Add New
        </UButton>
      </UTooltip>
    </template>
  </BaseCrud>

  <CustomerImportModal
    v-model:open="importOpen"
    @success="onImportDone"
    @failed="onImportDone"
  />
</template>
