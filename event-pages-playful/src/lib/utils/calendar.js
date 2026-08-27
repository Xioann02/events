import { CALENDAR_CONFIG } from '../wedding-config.js'

function escapeCalendarText(value) {
  return value.replace(/,/g, '\\,')
}

export function createWeddingCalendar(copy) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${CALENDAR_CONFIG.productId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${CALENDAR_CONFIG.uid}`,
    `DTSTAMP:${CALENDAR_CONFIG.timestamp}`,
    `DTSTART:${CALENDAR_CONFIG.startsAt}`,
    `DTEND:${CALENDAR_CONFIG.endsAt}`,
    `SUMMARY:${escapeCalendarText(copy.calendarEvent)}`,
    `DESCRIPTION:${escapeCalendarText(copy.calendarDescription)}`,
    `LOCATION:${escapeCalendarText(CALENDAR_CONFIG.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadWeddingCalendar(copy) {
  const calendar = createWeddingCalendar(copy)

  const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = CALENDAR_CONFIG.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
