export const stringToIds = (str: TMaybe<string | string[]>) => {
  let arr = []
  if (Array.isArray(str)) {
    arr = str
  } else {
    arr = (str || '').trim().split(',')
  }
  return arr.map(v => Number(v.trim())).filter(v => Number.isInteger(v) && v > 0)
}
