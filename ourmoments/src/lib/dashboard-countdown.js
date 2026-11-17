const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function getEventTimestamp(date, time = '00:00') {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '')
  const timeParts = /^(\d{1,2}):(\d{2})/.exec(time ?? '')
  if (!dateParts) return null

  const [, year, month, day] = dateParts
  const hours = timeParts ? Number(timeParts[1]) : 0
  const minutes = timeParts ? Number(timeParts[2]) : 0
  const timestamp = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function getDashboardCountdown(date, time, now = Date.now()) {
  const eventTimestamp = getEventTimestamp(date, time)
  if (eventTimestamp === null) return null

  const remaining = Math.max(0, eventTimestamp - now)
  const complete = remaining === 0
  return {
    complete,
    label: complete ? (now < eventTimestamp + DAY ? 'Today is the day' : 'A day to remember') : 'Until the celebration',
    values: [
      { label: 'Days', value: Math.floor(remaining / DAY) },
      { label: 'Hrs', value: Math.floor((remaining % DAY) / HOUR) },
      { label: 'Min', value: Math.floor((remaining % HOUR) / MINUTE) },
      { label: 'Sec', value: Math.floor((remaining % MINUTE) / SECOND) },
    ],
  }
}
