<script setup lang="ts">
definePageMeta({
  layout: 'default-layout',
})

const { data: users, refresh } = useAsyncData('users', () => $fetch('/api/users'), {
  // server: false,
})

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
  <div class="container mx-auto py-4">
    <h1>Home Page</h1>

    <form @submit.prevent="createUser" class="mt-4 flex gap-2">
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

    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="user in users"
        :key="user.id"
        class="p-4 border rounded-lg flex items-center justify-between"
      >
        <div>
          <div class="font-bold text-lg">{{ user.name }}</div>
          <div class="text-sm text-gray-500">{{ user.email }}</div>
        </div>
        <div class="flex gap-2">
          <button @click="openEditUser(user)" class="bg-blue-500 text-white px-2 rounded-md">
            Edit
          </button>
          <button @click="deleteUser(user.id)" class="bg-red-500 text-white px-2 rounded-md">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
