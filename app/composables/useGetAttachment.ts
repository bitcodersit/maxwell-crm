import type { TMaybe } from '~~/shared/types'

export function useGetAttachment() {
  const config = useRuntimeConfig()

  const getAttachment = (path?: TMaybe<string>) => {
    return path ? `${config.public.siteUrl}/api/attachments/path/${path}` : undefined
  }

  return {
    getAttachment
  }
}
