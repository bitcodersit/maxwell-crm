export const useAttachmentsMutation = () => {
  return useMutation({
    async mutationFn(data: {
      folder?: string
      attachableId?: number
      attachableField?: string
      files: File | File[] | FileList
    }) {
      const body = toFormData(data)
      return $fetch<TAttachment[]>('/api/attachments', {
        method: 'POST',
        body
      })
    }
  })
}
