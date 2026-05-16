export const formatBytes = (bytes: TMaybe<number>) => {
  if (!bytes) return
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, index)).toFixed(2) + ' ' + units[index]
}
