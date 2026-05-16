import { LazyBasePDFViewer } from '#components'

export const usePDFViewer = () => {
  const overlay = useOverlay()
  return overlay.create(LazyBasePDFViewer)
}
