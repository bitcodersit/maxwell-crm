export const getQueryId = (query: any) => {
  return {
    ids: (query.id || '')
      .toString()
      .trim()
      .split(',')
      .filter((v: string) => v.trim())
      .map(Number)
      .filter((v: number) => !isNaN(v)) as number[],
  }
}
