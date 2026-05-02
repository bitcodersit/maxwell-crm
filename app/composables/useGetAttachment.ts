import type { TMaybe } from '~~/shared/types'

export function useGetAttachment() {
  const config = useRuntimeConfig()

  const getAttachment = (id?: TMaybe<number>) => {
    return id ? `${config.public.siteUrl}/api/attachments/${id}` : undefined
  }

  return {
    getAttachment,
  }
}
