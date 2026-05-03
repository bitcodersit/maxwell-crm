export const getQueryQ = (query: any) => {
  return {
    contains: (query.q || '').toString().trim() as string,
  }
}
