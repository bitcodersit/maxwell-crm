export const useAttachmentsMutation = () => {
  return useMutation({
    async mutationFn(data: {
      folder?: string
      attachableId?: TMaybe<number>
      attachableModelId?: TMaybe<number>
      attachableModelType?: 'task' | 'lead' | 'followUp' | 'property' | 'visit' | 'comment'
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
