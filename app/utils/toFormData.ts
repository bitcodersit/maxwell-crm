export const toFormData = (data: Record<string, unknown>) => {
  const formData = new FormData()
  const keys = Object.keys(data)
  for (const key of keys) {
    const value = data[key]
    if (value instanceof FileList) {
      for (const item of value) {
        formData.append(key, item)
      }
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!value) continue
        formData.append(key, item)
      }
      continue
    }
    if (!value) continue
    formData.append(key, value as string)
  }
  return formData
}
