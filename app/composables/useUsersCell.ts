import { UBadge, UAvatar } from '#components'

export const useUsersCell = () => {
  const { getAttachment } = useGetAttachment()
  return <T extends Pick<TUser, 'name' | 'avatarId'>>(
    items: T[],
    options?: { modal?: boolean; right?: (user: T) => TMaybe<VNode> }
  ) => {
    const modal = options?.modal ?? false
    return items.map(item => {
      return h(
        UBadge,
        {
          size: modal ? 'lg' : 'md',
          class: modal ? 'ml-1 mt-1 rounded-full' : 'mr-1 rounded-full',
          color: 'neutral',
          variant: 'subtle',
          ui: {
            base: 'rounded-full'
          }
        },
        () =>
          h('div', { class: 'flex items-center gap-1' }, [
            h(UAvatar, {
              size: '2xs',
              src: getAttachment(item.avatarId),
              alt: item.name,
              class: 'bg-primary/20'
            }),
            h('span', item.name),
            options?.right?.(item)
          ])
      )
    })
  }
}
