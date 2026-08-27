import assert from 'node:assert/strict'
import test from 'node:test'
import { occasions, sectionOrder, templates } from '../src/lib/catalog.js'
import { adaptDraftToOccasion, addOrReplaceCartItem, cartTotal, createCartItem, createDraft } from '../src/lib/draft.js'

test('catalog ids are unique and prices are valid', () => {
  assert.equal(new Set(templates.map(({ id }) => id)).size, templates.length)
  assert.equal(new Set(occasions.map(({ id }) => id)).size, occasions.length)
  assert.ok(templates.every(({ price }) => Number.isFinite(price) && price > 0))
})

test('every occasion provides complete defaults and section labels', () => {
  for (const occasion of occasions) {
    assert.ok(occasion.defaults.title)
    assert.ok(occasion.defaults.intro)
    assert.ok(occasion.defaults.scheduleItems.length >= 1)
    assert.ok(occasion.defaults.faqItems.length >= 1)
    assert.deepEqual(Object.keys(occasion.sectionLabels), sectionOrder)
  }
})

test('createDraft makes isolated mutable content', () => {
  const first = createDraft('wedding', 'classic')
  const second = createDraft('wedding', 'classic')
  first.scheduleItems[0].title = 'Changed'
  assert.notEqual(second.scheduleItems[0].title, 'Changed')
})

test('occasion adaptation keeps universal logistics and changes occasion copy', () => {
  const wedding = createDraft('wedding', 'modern')
  wedding.date = '2027-01-02'
  wedding.venue = 'Our house'
  const birthday = adaptDraftToOccasion(wedding, 'birthday')

  assert.equal(birthday.occasionId, 'birthday')
  assert.equal(birthday.templateId, 'modern')
  assert.equal(birthday.date, '2027-01-02')
  assert.equal(birthday.venue, 'Our house')
  assert.equal(birthday.title, 'Maya turns 30')
})

test('cart takes an immutable snapshot and replaces the same configured invitation', () => {
  const draft = createDraft('baby-shower', 'luxury')
  const firstItem = createCartItem(draft)
  const firstCart = addOrReplaceCartItem([], firstItem)
  draft.title = 'Updated title'
  const secondCart = addOrReplaceCartItem(firstCart, createCartItem(draft))

  assert.equal(firstCart[0].title, firstItem.title)
  assert.equal(secondCart.length, 1)
  assert.equal(secondCart[0].title, 'Updated title')
  assert.equal(cartTotal(secondCart), 49)
})
