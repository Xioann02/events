const DAY = 86_400_000
const HOUR = 3_600_000
const MINUTE = 60_000

export function getCountdown(eventTime, now) {
  const remaining = Math.max(0, eventTime - now)

  return {
    remaining,
    values: [
      Math.floor(remaining / DAY),
      Math.floor((remaining % DAY) / HOUR),
      Math.floor((remaining % HOUR) / MINUTE),
      Math.floor((remaining % MINUTE) / 1000),
    ],
  }
}

export function getCountdownLabel(copy, eventTime, now, remaining) {
  if (remaining > 0) return copy.countdownEyebrow
  if (now < eventTime + DAY) return copy.countdownDone
  return copy.countdownPast
}

export function padCountdown(value) {
  return String(value).padStart(2, '0')
}
