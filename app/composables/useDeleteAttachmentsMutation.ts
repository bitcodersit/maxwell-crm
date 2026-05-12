export const useDeleteAttachmentsMutation = () => {
  return useMutation({
    async mutationFn(ids: number[]) {
      return $fetch<any[]>(`/api/attachments/${ids.join(',')}`, {
        method: 'DELETE'
      })
    }
  })
}
