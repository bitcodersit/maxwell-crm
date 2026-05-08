import type { TConfirmProps } from '~/components/base/BaseConfirm.vue'
import { LazyBaseConfirm } from '#components'

export const useConfirm = () => {
  const overlay = useOverlay()
  const modal = overlay.create(LazyBaseConfirm)
  const confirm = (props: string | TConfirmProps) => {
    const instance = modal.open(typeof props === 'string' ? { description: props } : props)
    return instance.result
  }
  return {
    confirm
  }
}
