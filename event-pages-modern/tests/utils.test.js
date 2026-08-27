import assert from 'node:assert/strict'
import test from 'node:test'
import { createWeddingCalendar } from '../src/lib/utils/calendar.js'
import { isValidContact } from '../src/lib/utils/contact.js'
import { getCountdown, getCountdownLabel, padCountdown } from '../src/lib/utils/countdown.js'
import { isSupportedMedia, MAX_UPLOAD_SIZE } from '../src/lib/utils/media.js'

test('countdown returns stable day, hour, minute, and second values', () => {
  const eventTime = Date.UTC(2026, 8, 19, 14)
  const now = eventTime - (2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5_000)

  assert.deepEqual(getCountdown(eventTime, now), {
    remaining: 183_845_000,
    values: [2, 3, 4, 5],
  })
  assert.equal(padCountdown(5), '05')
})

test('countdown clamps after the event and selects all three labels', () => {
  const copy = {
    countdownEyebrow: 'upcoming',
    countdownDone: 'today',
    countdownPast: 'complete',
  }
  const eventTime = 1_000_000

  assert.equal(getCountdownLabel(copy, eventTime, eventTime - 1, 1), 'upcoming')
  assert.equal(getCountdownLabel(copy, eventTime, eventTime + 1, 0), 'today')
  assert.equal(getCountdownLabel(copy, eventTime, eventTime + 86_400_001, 0), 'complete')
  assert.deepEqual(getCountdown(eventTime, eventTime + 1), { remaining: 0, values: [0, 0, 0, 0] })
})

test('contact validation accepts email or a sufficiently long phone number', () => {
  assert.equal(isValidContact('guest@example.com'), true)
  assert.equal(isValidContact('+357 99 000 123'), true)
  assert.equal(isValidContact('not-contact'), false)
})

test('calendar generation escapes text and uses central event configuration', () => {
  const calendar = createWeddingCalendar({
    calendarEvent: 'Andreas, Eleni',
    calendarDescription: 'Dinner, drinks',
  })

  assert.match(calendar, /SUMMARY:Andreas\\, Eleni/)
  assert.match(calendar, /DESCRIPTION:Dinner\\, drinks/)
  assert.match(calendar, /DTSTART:20260919T140000Z/)
  assert.match(calendar, /LOCATION:Panagia Chryseleousa Church\\, Strovolos\\, Cyprus/)
})

test('upload filtering accepts supported media under the size limit', () => {
  assert.equal(isSupportedMedia({ name: 'photo.jpg', size: MAX_UPLOAD_SIZE }), true)
  assert.equal(isSupportedMedia({ name: 'clip.webm', size: 1_024 }), true)
  assert.equal(isSupportedMedia({ name: 'notes.txt', size: 1_024 }), false)
  assert.equal(isSupportedMedia({ name: 'photo.png', size: MAX_UPLOAD_SIZE + 1 }), false)
})
