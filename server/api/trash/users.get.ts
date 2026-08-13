export default defineEventHandler((event) => getUsers(event, { trashed: true }))
