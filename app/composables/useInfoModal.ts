import { LazyBaseInfoModal } from '#components'

export const useInfoModal = () => {
  const overlay = useOverlay()
  return overlay.create(LazyBaseInfoModal)
}
