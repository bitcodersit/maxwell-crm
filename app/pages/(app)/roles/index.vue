<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { z } from 'zod'
import { h } from 'vue'

const roleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissionIds: z.array(z.number()).optional(),
})

interface RoleFormFields {
  name: string
  description: string
  permissionIds: number[]
}

const defaultFormState = {
  name: '',
  description: '',
  permissionIds: [] as number[],
} satisfies RoleFormFields

const { data: permissionsPaged } = await useFetch('/api/permissions', {
  query: { page: 1, perPage: 500 },
})

const permissionItems = computed(() => {
  const p = permissionsPaged.value as TPaginated<TPermission> | null | undefined
  return p?.data ?? []
})

const crudRef = ref<{ openEdit: (row: Record<string, unknown>) => void } | null>(null)

const UButton = resolveComponent('UButton')

const columns = computed<TableColumn<TRole>[]>(() => [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description || '—',
  },
  {
    id: 'permissions',
    header: 'Permissions',
    cell: ({ row }) => {
      const text =
        row.original.rolePermissions
          ?.map((rp) => rp.permission?.name)
          .filter(Boolean)
          .join(', ') || '—'
      return h('span', { class: 'text-sm text-muted line-clamp-2' }, text)
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(UButton, {
        icon: 'i-lucide-pencil',
        color: 'neutral',
        variant: 'ghost',
        size: 'xs',
        'aria-label': 'Edit',
        onClick: () => crudRef.value?.openEdit(row.original as unknown as Record<string, unknown>),
      }),
  },
])

function mapRowToForm(row: Record<string, unknown>): Record<string, unknown> {
  const r = row as unknown as TRole
  return {
    name: r.name,
    description: r.description ?? '',
    permissionIds:
      r.rolePermissions
        ?.map((rp) => rp.permission?.id)
        .filter((id): id is number => typeof id === 'number') ?? [],
  }
}

function asRoleForm(state: Record<string, unknown>): RoleFormFields {
  return state as unknown as RoleFormFields
}

function togglePermission(state: Record<string, unknown>, permissionId: number, checked: boolean) {
  const raw = state.permissionIds
  const ids = Array.isArray(raw) ? [...(raw as number[])] : []
  if (checked) {
    if (!ids.includes(permissionId)) ids.push(permissionId)
  } else {
    const i = ids.indexOf(permissionId)
    if (i !== -1) ids.splice(i, 1)
  }
  state.permissionIds = ids
}
</script>

<template>
  <BaseCrudAI
    ref="crudRef"
    title="Roles"
    list-url="/api/roles"
    save-url="/api/roles"
    :columns="(columns as TableColumn<Record<string, unknown>>[])"
    :form-schema="roleFormSchema"
    :default-form-state="defaultFormState as unknown as Record<string, unknown>"
    :map-row-to-form="mapRowToForm"
    create-button-label="New role"
    create-modal-title="New role"
    edit-modal-title="Edit role"
  >
    <template #form="{ state }">
      <UFormField label="Name" name="name" required>
        <UInput v-model="asRoleForm(state).name" class="w-full" autocomplete="off" />
      </UFormField>
      <UFormField label="Description" name="description">
        <UTextarea v-model="asRoleForm(state).description" class="w-full" :rows="3" autoresize />
      </UFormField>
      <UFormField label="Permissions" name="permissionIds">
        <div
          class="max-h-56 overflow-y-auto rounded-lg border border-default divide-y divide-default"
        >
          <label
            v-for="p in permissionItems"
            :key="p.id"
            class="flex items-start gap-3 p-2.5 hover:bg-elevated/50 cursor-pointer"
          >
            <UCheckbox
              :model-value="
                Array.isArray(state.permissionIds)
                && (state.permissionIds as number[]).includes(p.id)
              "
              @update:model-value="(v) => togglePermission(state, p.id, v === true)"
            />
            <span class="text-sm">
              <span class="font-medium text-highlighted">{{ p.name }}</span>
            </span>
          </label>
        </div>
      </UFormField>
    </template>
  </BaseCrudAI>
</template>
