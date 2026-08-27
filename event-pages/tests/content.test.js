import assert from 'node:assert/strict'
import test from 'node:test'
import { MAP_LINKS } from '../src/lib/wedding-config.js'
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

test('each locale retains the core wedding content', () => {
  for (const copy of Object.values(translations)) {
    assert.ok(copy.names)
    assert.ok(copy.date)
    assert.ok(copy.parentsTitle)
    assert.ok(copy.brideParents)
    assert.ok(copy.groomParents)
    assert.ok(copy.rsvpTitle)
    assert.ok(copy.galleryTitle)
  }
})

test('localized schedule entries keep the central map order', () => {
  const expectedMaps = [MAP_LINKS.bride, MAP_LINKS.groom, MAP_LINKS.church, MAP_LINKS.venue]

  for (const copy of Object.values(translations)) {
    assert.deepEqual(
      copy.timeline.map((event) => event.map),
      expectedMaps,
    )
  }
})
