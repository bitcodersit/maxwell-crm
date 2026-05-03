<script setup lang="ts">
useHead({ title: 'Permissions' })

const { data: permissions, refresh } = useAsyncData(
  'permissions',
  () => $fetch('/api/permissions') as unknown as Promise<TPaginated<TPermission>>
)
</script>

<template>
  <div class="p-4">
    <h1>Permissions Management</h1>
    <table class="w-full border-collapse border border-neutral-200 dark:border-neutral-800">
      <thead>
        <tr>
          <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">Name</th>
          <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">Slug</th>
          <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">
            Description
          </th>
          <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">Roles</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="permission in permissions?.data ?? []"
          :key="permission.id"
          class="border border-neutral-200 dark:border-neutral-800"
        >
          <td class="border border-neutral-200 dark:border-neutral-800 p-2">
            {{ permission.name }}
          </td>
          <td class="border border-neutral-200 dark:border-neutral-800 p-2">
            {{ permission.slug }}
          </td>
          <td class="border border-neutral-200 dark:border-neutral-800 p-2">
            {{ permission.description }}
          </td>
          <td class="border border-neutral-200 dark:border-neutral-800 p-2">
            {{
              permission.rolePermissions
                ?.map((rp) => rp.role?.name)
                .filter(Boolean)
                .join(', ')
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
