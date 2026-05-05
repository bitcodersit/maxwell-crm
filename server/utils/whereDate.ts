import { endOfDay, startOfDay } from 'date-fns'

export const whereDate = (where: any, query: any, field: string) => {
  const date = query[field]

  // array of dates
  if (Array.isArray(date) && date.length > 0) {
    where.OR = date.map((date) => ({
      [field]: {
        gte: startOfDay(new Date(date)),
        lte: endOfDay(new Date(date)),
      },
    }))
    return
  }

  // string date, single date or range
  const dateStr = date?.toString()?.trim()
  if (!dateStr) return

  // range
  const [start, end] = dateStr.split(',')
  if (start && end) {
    where[field] = {
      gte: startOfDay(new Date(start)),
      lte: endOfDay(new Date(end)),
    }
    return
  }

  // single date
  where[field] = {
    gte: startOfDay(new Date(dateStr)),
    lte: endOfDay(new Date(dateStr)),
  }
}
