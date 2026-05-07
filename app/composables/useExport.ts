export const useExport = () => {
  const toast = useToast()
  const exporting = ref(false)
  const execute = async (api: string, query: Record<string, unknown>) => {
    try {
      exporting.value = true
      const response = await $fetch.raw(api, {
        query,
        responseType: 'blob',
      })
      const disposition = response.headers.get('content-disposition') || ''
      const filenameMatch = disposition.match(/filename="?(?<name>[^"]+)"?/)
      const fallbackName = `Export ${new Date().toISOString().slice(0, 10)} - ${Date.now()}.${
        query.format === 'csv' ? 'csv' : 'xls'
      }`
      const filename = filenameMatch?.groups?.name || fallbackName
      const blob = new Blob([(response._data as BlobPart) ?? ''])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.add({
        color: 'success',
        title: 'Success! 😎',
        description: 'Exported successfully',
      })
    } catch (e) {
      const { message } = parseError(e)
      toast.add({
        color: 'error',
        title: 'Error! 😭',
        description: message,
      })
    } finally {
      exporting.value = false
    }
  }
  return {
    execute,
    exporting,
  }
}
