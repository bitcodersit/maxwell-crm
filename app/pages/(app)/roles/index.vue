<script setup lang="ts">
definePageMeta({
  layout: 'app-layout',
})

const { data: roles, refresh } = useAsyncData(
  'roles',
  () => $fetch('/api/roles') as unknown as Promise<TPaginated<TRole>>,
)
</script>

<template>
  <div class="p-4">
    <h1>Roles Management</h1>
    <table class="w-full border-collapse border border-neutral-200 dark:border-neutral-800">
      <thead>
        <tr>
          <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">Name</th>
          <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">
            Description
          </th>
          <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">
            Permissions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="role in roles?.data ?? []"
          :key="role.id"
          class="border border-neutral-200 dark:border-neutral-800"
        >
          <td class="border border-neutral-200 dark:border-neutral-800 p-2" width="200">
            {{ role.name }}
          </td>
          <td class="border border-neutral-200 dark:border-neutral-800 p-2" width="200">
            {{ role.description }}
          </td>
          <td class="border border-neutral-200 dark:border-neutral-800 p-2">
            {{
              role.rolePermissions
                ?.map((rp) => rp.permission?.name)
                .filter(Boolean)
                .join(', ')
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
