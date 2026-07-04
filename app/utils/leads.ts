type TBadgeColor = 'success' | 'primary' | 'warning' | 'error' | 'neutral' | 'secondary'

export const leadStatusColors: Record<string, TBadgeColor> = {
  New: 'primary',
  Hot: 'error',
  Warm: 'warning',
  Cold: 'secondary',
  Not_Interested: 'neutral',
  Closed: 'success'
}

export const followUpStatusColors: Record<string, TBadgeColor> = {
  Pending: 'warning',
  Completed: 'success',
  Rescheduled: 'primary',
  Cancelled: 'neutral',
  Failed: 'error'
}

export const visitStatusColors: Record<string, TBadgeColor> = {
  Pending: 'warning',
  Completed: 'success',
  Rescheduled: 'primary',
  Cancelled: 'neutral',
  No_Show: 'error'
}

export const followUpTypeIcons: Record<string, string> = {
  Call: 'i-lucide-phone',
  Visit: 'i-lucide-map-pin',
  Email: 'i-lucide-mail',
  Message: 'i-lucide-message-square',
  Whatsapp: 'i-lucide-message-circle'
}

export function formatLeadStatus(status?: string | null) {
  if (!status) return '—'
  return status.split('_').join(' ')
}

export function formatBudgetRange(
  budgetMin?: TLead['budgetMin'],
  budgetMax?: TLead['budgetMax']
) {
  const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
  const min = budgetMin == null ? null : Number(budgetMin)
  const max = budgetMax == null ? null : Number(budgetMax)
  if (min == null && max == null) return '—'
  if (min != null && max != null) return `${formatter.format(min)} – ${formatter.format(max)}`
  if (min != null) return `From ${formatter.format(min)}`
  return `Up to ${formatter.format(max as number)}`
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileIconForMime(mime?: string | null) {
  if (!mime) return 'i-lucide-file'
  if (mime.startsWith('image/')) return 'i-lucide-image'
  if (mime.includes('pdf')) return 'i-lucide-file-text'
  if (mime.includes('sheet') || mime.includes('excel')) return 'i-lucide-sheet'
  if (mime.includes('word')) return 'i-lucide-file-type'
  return 'i-lucide-file'
}
