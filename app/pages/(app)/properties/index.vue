<script setup lang="ts">
import type {
  TBaseCrudModal,
  TColumn,
  TField,
  TFilter,
  TGetActions
} from '@/components/base/BaseCrud.vue'
import type { TProperty, TPropertyStatus } from '~~/shared/types/Property'

definePageMeta({ title: 'Property Inventory' })

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')

const statusColorMap: Record<TPropertyStatus, string> = {
  Available: 'success',
  Hold: 'warning',
  Sold: 'neutral'
}

function formatPrice(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(1)} Lac`
  return n.toLocaleString()
}

const fields: TField[] = [
  {
    name: 'title',
    type: 'input',
    label: 'Property Title',
    props: { placeholder: 'e.g. Block A Plot 12' }
  },
  {
    name: 'project',
    type: 'input',
    label: 'Project Name',
    props: { placeholder: 'e.g. Maxwell Garden City' }
  },
  {
    name: 'area',
    type: 'input',
    label: 'Area',
    props: { placeholder: 'e.g. Purbachal' }
  },
  {
    name: 'block',
    type: 'input',
    label: 'Block',
    props: { placeholder: 'Block' }
  },
  {
    name: 'road',
    type: 'input',
    label: 'Road',
    props: { placeholder: 'Road' }
  },
  {
    name: 'face',
    type: 'input',
    label: 'Face',
    props: { placeholder: 'e.g. East' }
  },
  {
    name: 'katha',
    type: 'input',
    label: 'Katha',
    props: { type: 'number', placeholder: '0' }
  },
  {
    name: 'sqft',
    type: 'input',
    label: 'Sqft',
    props: { type: 'number', placeholder: '0' }
  },
  {
    name: 'currentPrice',
    type: 'input',
    label: 'Current Price (BDT)',
    props: { type: 'number', placeholder: '0' }
  },
  {
    name: 'previousPrice',
    type: 'input',
    label: 'Previous Price (BDT)',
    props: { type: 'number', placeholder: '0' }
  },
  {
    name: 'installment',
    type: 'input',
    label: 'Installment (true/false)',
    props: { placeholder: 'true or false' }
  },
  {
    name: 'status',
    type: 'input',
    label: 'Status',
    props: { placeholder: 'Available | Hold | Sold' }
  },
  {
    name: 'purchaseType',
    type: 'input',
    label: 'Purchase Type',
    props: {
      placeholder: 'Contracted for sale | Power Registration | Sab Kobla | Ongoing'
    }
  },
  {
    name: 'manager',
    type: 'input',
    label: 'Assigned Manager',
    props: { placeholder: 'Manager name' }
  }
]

const columns = computed<TColumn<TProperty>[]>(() => [
  { id: 'select', size: 48 },
  {
    accessorKey: 'serialCode',
    header: 'Property ID',
    pinned: 'left',
    sortBy: 'serialCode',
    size: 110
  },
  {
    accessorKey: 'title',
    header: 'Title',
    sortBy: 'title'
  },
  {
    accessorKey: 'project',
    header: 'Project',
    sortBy: 'project'
  },
  {
    accessorKey: 'area',
    header: 'Area',
    sortBy: 'area'
  },
  {
    accessorKey: 'block',
    header: 'Block',
    sortBy: 'block'
  },
  {
    id: 'size',
    header: 'Size',
    cell: ({ row }) =>
      `${row.original.katha} Katha / ${row.original.sqft.toLocaleString()} Sqft`
  },
  {
    accessorKey: 'currentPrice',
    header: 'Price',
    sortBy: 'currentPrice',
    cell: ({ row }) => formatPrice(row.original.currentPrice)
  },
  {
    accessorKey: 'status',
    header: 'Status',
    sortBy: 'status',
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.status,
        color: statusColorMap[row.original.status] || 'neutral',
        variant: 'soft',
        size: 'sm'
      })
  },
  {
    accessorKey: 'manager',
    header: 'Manager',
    sortBy: 'manager'
  },
  { id: 'action', pinned: 'right' }
])

const filters: TFilter[] = [
  {
    name: 'q',
    type: 'inline-input',
    props: { placeholder: 'Search property, project or area…' }
  },
  {
    name: 'status',
    type: 'input',
    props: { label: 'Status', placeholder: 'Available, Hold, Sold' }
  },
  {
    name: 'area',
    type: 'input',
    props: { label: 'Area', placeholder: 'Location' }
  },
  {
    name: 'project',
    type: 'input',
    props: { label: 'Project', placeholder: 'Project name' }
  }
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Property' : 'Update Property',
    description:
      mode === 'create'
        ? 'Add a property to the inventory'
        : 'Update property information'
  })
}

const getActions: TGetActions<TProperty> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        crudRef.value?.onView(item, { modal: { ui: { content: 'max-w-2xl' } } })
      }
    },
    {
      ...actions.update,
      onSelect() {
        crudRef.value?.onUpdate(item)
      }
    }
  ].filter((action: { hidden?: boolean }) => !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ]
]

const getFormState = (v?: TProperty) => ({
  id: v?.id,
  title: v?.title ?? '',
  project: v?.project ?? '',
  area: v?.area ?? '',
  block: v?.block ?? '',
  road: v?.road ?? '',
  face: v?.face ?? '',
  katha: v?.katha ?? 0,
  sqft: v?.sqft ?? 0,
  currentPrice: v?.currentPrice ?? 0,
  previousPrice: v?.previousPrice ?? '',
  installment: v?.installment ? 'true' : 'false',
  status: v?.status ?? 'Available',
  purchaseType: v?.purchaseType ?? 'Contracted for sale',
  manager: v?.manager ?? ''
})

const getPostBody = (v: Record<string, unknown>) => ({
  id: v.id,
  title: v.title,
  project: v.project,
  area: v.area,
  block: v.block,
  road: v.road,
  face: v.face,
  katha: v.katha,
  sqft: v.sqft,
  currentPrice: v.currentPrice,
  previousPrice: v.previousPrice === '' || v.previousPrice == null ? null : v.previousPrice,
  installment: v.installment === true || v.installment === 'true',
  status: v.status,
  purchaseType: v.purchaseType,
  manager: v.manager
})
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/properties"
    post-url="/api/properties"
    delete-url="/api/properties/{id}"
    :fields="fields"
    :columns="columns"
    :filters="filters"
    :modal="modal"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  />
</template>
