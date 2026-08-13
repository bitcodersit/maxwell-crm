export default defineEventHandler((event) => getCustomers(event, { trashed: true }))
