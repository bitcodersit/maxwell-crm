import { zTest } from './test.get'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  return await validate(body, zTest)
})
