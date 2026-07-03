export interface ClassTime {
  start: string
  end: string
}

export const CLASS_TIMES: Record<number, ClassTime> = {
  1: { start: '9:30', end: '11:00' },
  2: { start: '11:10', end: '12:40' },
  3: { start: '13:30', end: '15:00' },
  4: { start: '15:10', end: '16:40' },
  5: { start: '16:50', end: '18:20' },
}

export const getPeriodTime = (period: number) => {
  const time = CLASS_TIMES[period]
  return time ? `${time.start}〜${time.end}` : ''
}
