<script setup lang="ts">
import type { TColumn, TFilter, TGetActions } from '@/components/base/BaseCrud.vue'
import type { TProperty } from '~~/shared/types/Property'
import { formatPropertyPrice } from '@/utils/properties'

type TPropertyStatus = 'Available' | 'Hold' | 'Sold'
type TPropertyRow = TProperty & Record<string, any>

definePageMeta({ title: 'Property Inventory' })

const crudRef = useTemplateRef('crudRef')
const { user } = useCurrentUser()
const UBadge = resolveComponent('UBadge')

const canUpdate = computed(
  () =>
    !!(
      user.value?.updateAnyProperties ||
      user.value?.updateOwnProperties ||
      user.value?.isSuperAdmin
    )
)
const canDelete = computed(
  () =>
    !!(
      user.value?.deleteAnyProperties ||
      user.value?.deleteOwnProperties ||
      user.value?.isSuperAdmin
    )
)

const statusColorMap: Record<TPropertyStatus, string> = {
  Available: 'success',
  Hold: 'warning',
  Sold: 'neutral'
}

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
    header: 'Title',
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
    id: 'salesManager',
    header: 'Sales Manager',
    cell: ({ row }) => {
      const names = (row.original.assignable?.users ?? [])
        .map(item => item.user?.name)
        .filter(Boolean)
      return names.length ? names.join(', ') : '—'
    }
  },
  {
    id: 'documents',
    header: 'Documents',
    cell: ({ row }) => {
      const count = row.original.attachable?.attachments?.length ?? 0
      return count ? `${count} file${count === 1 ? '' : 's'}` : '—'
    }
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
    id: 'location',
    header: 'Location',
    cell: ({ row }) => row.original.address?.addressLine1 || '—'
  },
  {
    id: 'blockRoad',
    header: 'Block & Road',
    cell: ({ row }) => {
      const address = row.original.address
      if (!address) return '—'
      const parts = [address.block, address.road].filter(Boolean)
      return parts.length ? parts.join(' · ') : '—'
    }
  },
  {
    accessorKey: 'price',
    header: 'Price',
    sortBy: 'price',
    cell: ({ row }) => formatPropertyPrice(Number(row.original.price || 0))
  },
  {
    accessorKey: 'previousPrice',
    header: 'Previous Price',
    sortBy: 'previousPrice',
    cell: ({ row }) =>
      row.original.previousPrice == null ? '—' : formatPropertyPrice(Number(row.original.previousPrice))
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
    type: 'tabs',
    props: {
      api: '/api/enums',
      query: {
        type: 'PropertyStatus'
      }
    }
  },
  {
    name: 'name',
    type: 'input',
    props: { label: 'Title', placeholder: 'Search by title', modeable: true }
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

const getActions: TGetActions<TPropertyRow> = item => [
  [
    {
      ...actions.view,
      onSelect() {
        navigateTo(`/properties/${item.id}`)
      }
    },
    {
      ...actions.update,
      hidden: !canUpdate.value,
      onSelect() {
        navigateTo(`/properties/${item.id}`)
      }
    }
  ].filter((action: any) => !action.hidden),
  [
    {
      ...actions.delete,
      hidden: !canDelete.value,
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ].filter((action: any) => !action.hidden)
]
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/properties"
    delete-url="/api/properties/{id}"
    :columns="columns"
    :filters="filters"
    :get-actions="getActions"
    :show-add-button="true"
  >
    <template #actions>
      <UTooltip text="Add new property">
        <UButton
          icon="i-lucide-plus"
          size="sm"
          color="primary"
          variant="solid"
          to="/properties/new"
        >
          Add New
        </UButton>
      </UTooltip>
    </template>
  </BaseCrud>
</template>
