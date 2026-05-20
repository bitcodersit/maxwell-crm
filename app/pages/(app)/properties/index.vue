<script setup lang="ts">
import type {
  TBaseCrudModal,
  TColumn,
  TField,
  TFilter,
  TGetActions
} from '@/components/base/BaseCrud.vue'
import type { TProperty } from '~~/shared/types/Property'

type TPropertyStatus = 'Available' | 'Hold' | 'Sold'
type TPropertyRow = TProperty & Record<string, any>

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
    name: 'name',
    type: 'input',
    label: 'Property Name',
    col: 'col-span-3',
    props: { placeholder: 'e.g. Block A Plot 12' }
  },
  {
    name: 'status',
    type: 'select',
    label: 'Status',
    props: {
      items: ['Available', 'Hold', 'Sold'],
      placeholder: 'Select status'
    }
  },
  {
    type: 'separator',
    label: 'Address'
  },
  {
    name: 'addressLine1',
    type: 'input',
    label: 'Address Line 1',
    col: 'col-span-3',
    props: { placeholder: 'e.g. Purbachal' }
  },
  {
    name: 'road',
    type: 'input',
    label: 'Road',
    props: { placeholder: 'Road no' }
  },
  {
    name: 'block',
    type: 'input',
    label: 'Block',
    props: { placeholder: 'Block' }
  },
  {
    name: 'facing',
    type: 'input',
    label: 'Facing',
    props: { placeholder: 'e.g. East' }
  },
  {
    type: 'separator',
    label: 'Size'
  },
  {
    name: 'katha',
    type: 'input',
    label: 'Katha',
    props: { type: 'number', placeholder: 'Size...' }
  },
  {
    name: 'sqft',
    type: 'input',
    label: 'Sqft',
    props: { type: 'number', placeholder: 'Size...' }
  },
  {
    type: 'separator',
    label: 'Pricing'
  },
  {
    name: 'price',
    type: 'input',
    label: 'Price (BDT)',
    props: { type: 'number', placeholder: 'Price...' }
  },
  {
    name: 'previousPrice',
    type: 'input',
    label: 'Previous Price (BDT)',
    props: { type: 'number', placeholder: 'Price...' }
  },
  {
    name: 'purchaseType',
    type: 'autocomplete',
    label: 'Purchase Type',
    props: {
      api: '/api/options',
      query: {
        type: 'PROPERTY_PURCHASE_TYPE'
      },
      hideOnSelect: true,
      clearOnSelect: true,
      placeholder: 'Select purchase type'
    }
  }
]

const columns = computed<TColumn<TPropertyRow>[]>(() => [
  { id: 'select', size: 48 },
  {
    accessorKey: 'sid',
    header: 'Property ID',
    pinned: 'left',
    sortBy: 'sid',
    size: 110
  },
  {
    accessorKey: 'name',
    header: 'Name',
    sortBy: 'name'
  },
  {
    accessorKey: 'facing',
    header: 'Facing',
    sortBy: 'facing',
    cell: ({ row }) => row.original.facing || '—'
  },
  {
    id: 'purchaseType',
    header: 'Purchase Type',
    sortBy: 'purchaseType',
    cell: ({ row }) => row.original.purchaseType?.name || '—'
  },
  {
    id: 'size',
    header: 'Size',
    cell: ({ row }) => {
      const katha = Number(row.original.sizes?.find(v => v.size?.name === 'Katha')?.sizeValue || 0)
      const sqft = Number(row.original.sizes?.find(v => v.size?.name === 'Sqft')?.sizeValue || 0)
      return `${katha} Katha / ${sqft.toLocaleString()} Sqft`
    }
  },
  {
    id: 'address',
    header: 'Address',
    cell: ({ row }) => {
      const address = row.original.address
      if (!address) return '—'
      return [address.name, address.addressLine1, address.road, address.block]
        .filter(Boolean)
        .join(', ')
    }
  },
  {
    accessorKey: 'price',
    header: 'Price',
    sortBy: 'price',
    cell: ({ row }) => formatPrice(Number(row.original.price || 0))
  },
  {
    accessorKey: 'previousPrice',
    header: 'Previous Price',
    sortBy: 'previousPrice',
    cell: ({ row }) =>
      row.original.previousPrice == null ? '—' : formatPrice(Number(row.original.previousPrice))
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
  { id: 'action', pinned: 'right' }
])

const filters: TFilter[] = [
  {
    name: 'q',
    type: 'inline-input',
    props: { placeholder: 'Search by id, name or facing...' }
  },
  {
    name: 'status',
    type: 'input',
    props: { label: 'Status', placeholder: 'Available, Hold, Sold' }
  },
  {
    name: 'name',
    type: 'input',
    props: { label: 'Name', placeholder: 'Search by name', modeable: true }
  },
  {
    name: 'purchaseTypeId',
    type: 'checkbox-api',
    props: {
      label: 'Purchase type',
      api: '/api/options',
      query: {
        type: 'PROPERTY_PURCHASE_TYPE'
      }
    }
  }
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New Property' : 'Update Property',
    description:
      mode === 'create' ? 'Add a property to the inventory' : 'Update property information',
    ui: {
      content: 'max-w-2xl'
    }
  })
}

const getActions: TGetActions<TPropertyRow> = (item, v) => [
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

const getFormState = (v?: TPropertyRow) => {
  const state = {
    id: v?.id,
    name: v?.name ?? '',
    facing: v?.facing ?? '',
    price: v?.price,
    previousPrice: v?.previousPrice,
    status: v?.status ?? 'Available',
    purchaseType: v?.purchaseType ? [v.purchaseType] : [],
    katha: v?.sizes?.find(item => item.size?.name === 'Katha')?.sizeValue,
    sqft: v?.sizes?.find(item => item.size?.name === 'Sqft')?.sizeValue,
    addressId: v?.addressId,
    addressLine1: v?.address?.addressLine1 ?? '',
    road: v?.address?.road ?? '',
    block: v?.address?.block ?? ''
  }
  const normalized = toPayload(state)
  return v ? { ...state, _original: normalized } : state
}

const toPayload = (v: Record<string, unknown>) => {
  const purchaseTypeId = Array.isArray(v.purchaseType)
    ? (v.purchaseType[0] as { id?: number } | undefined)?.id
    : undefined
  const addressLine1 = String(v.addressLine1 ?? '').trim()
  const road = String(v.road ?? '').trim()
  const block = String(v.block ?? '').trim()
  const addressId = typeof v.addressId === 'number' ? v.addressId : undefined

  return {
    name: String(v.name ?? ''),
    facing: (v.facing as string | null | undefined) || undefined,
    price: Number(v.price ?? 0),
    previousPrice: Number(v.previousPrice ?? 0),
    status: String(v.status ?? 'Available'),
    purchaseTypeId: typeof purchaseTypeId === 'number' ? purchaseTypeId : undefined,
    katha: Number(v.katha ?? 0),
    sqft: Number(v.sqft ?? 0),
    addressId,
    address: addressLine1
      ? {
          id: addressId,
          addressLine1,
          road,
          block
        }
      : undefined
  }
}

const isSameValue = (a: unknown, b: unknown) => {
  if (a == null && b == null) return true
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b)
  }
  return a === b
}

const getPostBody = (v: Record<string, unknown>) => toPayload(v)

const getPatchBody = (v: Record<string, unknown>) => {
  const payload = toPayload(v)
  const original = (v._original as Record<string, unknown> | undefined) ?? {}
  const changed: Record<string, unknown> = {}
  for (const key of Object.keys(payload) as (keyof typeof payload)[]) {
    if (!isSameValue(payload[key], original[key as string])) {
      changed[key] = payload[key]
    }
  }
  return changed
}
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/properties"
    post-url="/api/properties"
    :patch-url="state => `/api/properties/${state.id}`"
    delete-url="/api/properties/{id}"
    form-class="grid grid-cols-3 gap-4"
    :fields="fields"
    :columns="columns"
    :filters="filters"
    :modal="modal"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-patch-body="getPatchBody"
    :get-form-state="getFormState"
  />
</template>
