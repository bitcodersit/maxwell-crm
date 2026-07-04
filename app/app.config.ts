export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc'
    },
    table: {
      variants: {
        pinned: {
          true: {
            th: 'sticky bg-default z-1',
            td: 'sticky bg-default z-1'
          }
        },
        sticky: {
          true: {
            thead: 'sticky top-0 inset-x-0 bg-default z-1',
            tfoot: 'sticky bottom-0 inset-x-0 bg-default z-1'
          },
          header: {
            thead: 'sticky top-0 inset-x-0 bg-default z-1'
          },
          footer: {
            tfoot: 'sticky bottom-0 inset-x-0 bg-default z-1'
          }
        }
      }
    }
  }
})
