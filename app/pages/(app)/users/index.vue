<script setup lang="ts">
useHead({ title: 'Users' })

const { data: users, refresh } = useAsyncData('users', () => $fetch('/api/users'))

const id = ref<number | null>(null)
const name = ref('')
const email = ref('')
const password = ref('')

const createUser = () => {
  $fetch('/api/users', {
    method: 'POST',
    body: {
      id: id.value,
      name: name.value,
      email: email.value,
      password: password.value,
    },
  }).then(() => {
    refresh()
    id.value = null
    name.value = ''
    email.value = ''
    password.value = ''
  })
}

const openEditUser = (user: any) => {
  id.value = user.id
  name.value = user.name
  email.value = user.email
  password.value = user.password
}

const deleteUser = (id: number) => {
  if (confirm('Are you sure you want to delete this user?')) {
    $fetch(`/api/users/${id}`, {
      method: 'DELETE',
    }).then(() => {
      refresh()
    })
  }
}
</script>

<template>
  <div class="p-4">
    <form @submit.prevent="createUser" class="flex gap-2">
      <input
        type="text"
        v-model="name"
        name="name"
        placeholder="Name"
        class="border rounded-md p-2 dark:bg-neutral-800"
      />
      <input
        type="email"
        v-model="email"
        name="email"
        placeholder="Email"
        class="border rounded-md p-2 dark:bg-neutral-800"
      />
      <input
        type="password"
        v-model="password"
        name="password"
        placeholder="Password"
        class="border rounded-md p-2 dark:bg-neutral-800"
      />
      <button type="submit" class="bg-blue-500 text-white px-4 rounded-md">
        {{ id ? 'Update User' : 'Create User' }}
      </button>
    </form>

    <div class="mt-4">
      <table class="w-full border-collapse border border-neutral-200 dark:border-neutral-800">
        <thead>
          <tr>
            <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">Name</th>
            <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">Email</th>
            <th class="border border-neutral-200 dark:border-neutral-800 p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="border border-neutral-200 dark:border-neutral-800"
          >
            <td class="border border-neutral-200 dark:border-neutral-800 p-2">{{ user.name }}</td>
            <td class="border border-neutral-200 dark:border-neutral-800 p-2">{{ user.email }}</td>
            <td class="border border-neutral-200 dark:border-neutral-800 p-2 flex gap-2">
              <button @click="openEditUser(user)" class="bg-blue-500 text-white px-2 rounded-md">
                Edit
              </button>
              <button @click="deleteUser(user.id)" class="bg-red-500 text-white px-2 rounded-md">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
