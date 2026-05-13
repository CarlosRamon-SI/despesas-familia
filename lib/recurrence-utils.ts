function lastDayOf(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function nextMonthDate(date: Date): Date {
  const isLastDay = date.getDate() === lastDayOf(date.getFullYear(), date.getMonth())
  const nextYear  = date.getMonth() === 11 ? date.getFullYear() + 1 : date.getFullYear()
  const nextMonth = (date.getMonth() + 1) % 12
  const lastOfNext = lastDayOf(nextYear, nextMonth)
  const day = isLastDay ? lastOfNext : Math.min(date.getDate(), lastOfNext)
  return new Date(nextYear, nextMonth, day)
}
