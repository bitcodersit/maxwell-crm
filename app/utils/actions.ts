export const actions = {
  view: {
    label: 'View',
    icon: 'i-lucide-eye'
  },
  update: {
    label: 'Update',
    icon: 'i-lucide-pencil'
  },
  delete: {
    label: 'Delete',
    icon: 'i-lucide-trash',
    color: 'error' as const
  },
  restore: {
    label: 'Restore',
    icon: 'i-lucide-rotate-ccw'
  },
  deleteForever: {
    label: 'Delete permanently',
    icon: 'i-lucide-trash-2',
    color: 'error' as const
  }
}
