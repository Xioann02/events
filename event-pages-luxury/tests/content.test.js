import assert from 'node:assert/strict'
import test from 'node:test'
import { translations } from '../src/lib/wedding-data.js'

test('English and Greek content stay structurally aligned', () => {
  assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.el).sort())
})

test('repeated wedding content keeps the expected item counts', () => {
  for (const copy of Object.values(translations)) {
    assert.equal(copy.timeline.length, 4)
    assert.equal(copy.faqs.length, 4)
    assert.equal(copy.galleryAlt.length, 3)
    assert.equal(copy.units.length, 4)
  }
})
