export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)

  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']

  if (mode !== 'subscribe' || !challenge) {
    throw err.denied()
  }

  if (!config.facebookVerifyToken || token !== config.facebookVerifyToken) {
    throw err.denied('Invalid Facebook verify token')
  }

  setResponseHeader(event, 'Content-Type', 'text/plain')
  return String(challenge)
})
