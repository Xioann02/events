import assert from 'node:assert/strict'
import test from 'node:test'
import { createDashboardData, createGift, createGuest, createSong, createTable, dashboardSummary } from '../src/lib/dashboard-data.js'
import { fetchMusicMetadata, parseMusicLink } from '../src/lib/music-embeds.js'

test('dashboard seed data is tied to the purchased website', () => {
  const data = createDashboardData({ title: 'Clara & Theo' })

  assert.equal(data.eventName, 'Clara & Theo')
  assert.equal(data.siteUrl, 'https://ourmoments.io/clara-and-theo')
  assert.ok(data.guests.length > 0)
  assert.ok(data.tables.length > 0)
  assert.deepEqual(data.floorPlan, { shapes: [], tableShape: 'round' })
  assert.deepEqual(data.songs, [])
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
  assert.deepEqual(
    (({ name, link, type }) => ({ name, link, type }))(createSong({ name: '  At Last  ', link: '  https://example.com/song  ', type: 'first-dance' })),
    { name: 'At Last', link: 'https://example.com/song', type: 'first-dance' },
  )
  assert.equal(createSong({ name: 'Parents', link: '', type: 'parent-dance' }).type, 'parent-dance')
  assert.equal(createSong({ name: 'Cake', link: '', type: 'cake-cutting' }).type, 'cake-cutting')
})

test('music links use official non-autoplay embeds for songs and playlists', () => {
  const spotify = parseMusicLink('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')
  assert.equal(spotify.platform, 'spotify')
  assert.equal(spotify.kind, 'playlist')
  assert.match(spotify.embedUrl, /^https:\/\/open\.spotify\.com\/embed\/playlist\//)

  const apple = parseMusicLink('https://music.apple.com/us/album/example/id123456789?i=123456790')
  assert.equal(apple.platform, 'apple')
  assert.equal(apple.kind, 'track')
  assert.equal(new URL(apple.embedUrl).hostname, 'embed.music.apple.com')

  const cyprusApple = parseMusicLink('https://music.apple.com/cy/album/oh-my-my/1498261483?i=1498261484')
  assert.equal(cyprusApple.platform, 'apple')
  assert.equal(cyprusApple.kind, 'track')

  const youtube = parseMusicLink('https://music.youtube.com/playlist?list=PL123_example')
  assert.equal(youtube.platform, 'youtube')
  assert.equal(youtube.kind, 'playlist')
  assert.match(youtube.embedUrl, /autoplay=0/)
  assert.equal(parseMusicLink('https://example.com/song'), null)
})

test('music metadata normalises provider titles for table rows', async () => {
  const spotify = await fetchMusicMetadata('https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl', async () => ({ ok: true, json: async () => ({ title: 'Cut To The Feeling', thumbnail_url: 'cover.jpg' }) }))
  assert.equal(spotify.title, 'Cut To The Feeling')

  const apple = await fetchMusicMetadata('https://music.apple.com/cy/album/oh-my-my/1498261483?i=1498261484', async (url) => {
    assert.match(url, /id=1498261484/)
    return { ok: true, json: async () => ({ results: [{ trackId: 1498261484, trackName: 'Oh My My', artistName: 'Blue October' }] }) }
  })
  assert.deepEqual({ title: apple.title, artist: apple.artist }, { title: 'Oh My My', artist: 'Blue October' })
})
