import assert from 'node:assert/strict'
import test from 'node:test'
import { createDashboardData, createGift, createGuest, createTable, dashboardSummary } from '../src/lib/dashboard-data.js'

test('dashboard seed data is tied to the purchased website', () => {
  const data = createDashboardData({ title: 'Clara & Theo' })

  assert.equal(data.eventName, 'Clara & Theo')
  assert.equal(data.siteUrl, 'https://ourmoments.io/clara-and-theo')
  assert.ok(data.guests.length > 0)
  assert.ok(data.tables.length > 0)
})

test('guest and RSVP summary uses party size', () => {
  const guests = [
    createGuest({ name: 'One', email: '', party: 2, status: 'attending' }),
    createGuest({ name: 'Two', email: '', party: 3, status: 'pending' }),
    createGuest({ name: 'Three', email: '', party: 1, status: 'declined' }),
  ]

  assert.deepEqual(dashboardSummary({ guests }), { total: 6, attending: 2, pending: 3, declined: 1 })
})

test('dashboard creators normalise form values', () => {
  assert.equal(createTable(4, 1).capacity, 2)
  assert.equal(createGuest({ name: '  Maya  ', email: ' maya@example.com ', party: 0, status: 'pending' }).name, 'Maya')
  const { guest, gift, note, thanked } = createGift({ guest: '  Alex ', type: 'item', gift: '  Linen ', note: '  Thank you ' })
  assert.deepEqual({ guest, gift, note, thanked }, { guest: 'Alex', gift: 'Linen', note: 'Thank you', thanked: false })
  const moneyGift = createGift({ guest: 'Maya', type: 'money', amount: '150', currency: 'EUR', gift: '', note: '' })
  assert.equal(moneyGift.amount, '150')
  assert.equal(moneyGift.gift, '')
})
