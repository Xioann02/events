export function isValidContact(value) {
  const trimmed = value.trim()
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  const looksLikePhone = trimmed.replace(/\D/g, '').length >= 8

  return looksLikeEmail || looksLikePhone
}
