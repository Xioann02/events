const SPOTIFY_TYPES = new Set(['track', 'playlist', 'album'])

function safeUrl(value) {
  try {
    const input = String(value ?? '').trim()
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    return ['http:', 'https:'].includes(url.protocol) ? url : null
  } catch {
    return null
  }
}

function cleanId(value) {
  return /^[a-zA-Z0-9_-]+$/.test(value ?? '') ? value : ''
}

export function parseMusicLink(value) {
  const url = safeUrl(value)
  if (!url) return null
  const host = url.hostname.toLowerCase().replace(/^www\./, '')

  if (host === 'open.spotify.com') {
    const parts = url.pathname.split('/').filter(Boolean)
    const typeIndex = parts.findIndex((part) => SPOTIFY_TYPES.has(part))
    const kind = parts[typeIndex]
    const id = cleanId(parts[typeIndex + 1])
    if (!kind || !id) return null
    return {
      platform: 'spotify',
      platformLabel: 'Spotify',
      kind,
      kindLabel: kind === 'playlist' ? 'Playlist' : kind === 'album' ? 'Album' : 'Song',
      originalUrl: url.href,
      embedUrl: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator`,
      height: kind === 'track' ? 152 : 352,
    }
  }

  if (host === 'music.apple.com') {
    const parts = url.pathname.split('/').filter(Boolean)
    const kind = parts.includes('playlist') ? 'playlist' : parts.includes('album') ? (url.searchParams.has('i') ? 'track' : 'album') : ''
    if (!kind || !parts.some((part) => /^(id\d+|\d+|pl\.)/i.test(part))) return null
    const embed = new URL(url.href)
    embed.hostname = 'embed.music.apple.com'
    return {
      platform: 'apple',
      platformLabel: 'Apple Music',
      kind,
      kindLabel: kind === 'playlist' ? 'Playlist' : kind === 'album' ? 'Album' : 'Song',
      originalUrl: url.href,
      embedUrl: embed.href,
      height: kind === 'track' ? 175 : 450,
    }
  }

  const youtubeHosts = new Set(['music.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'])
  if (youtubeHosts.has(host)) {
    const playlistId = cleanId(url.searchParams.get('list'))
    if (playlistId) {
      return {
        platform: 'youtube',
        platformLabel: 'YouTube Music',
        kind: 'playlist',
        kindLabel: 'Playlist',
        originalUrl: url.href,
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=0&playsinline=1`,
        height: 315,
      }
    }
    const videoId = cleanId(host === 'youtu.be' ? url.pathname.split('/').filter(Boolean)[0] : url.searchParams.get('v'))
    if (!videoId) return null
    return {
      platform: 'youtube',
      platformLabel: 'YouTube Music',
      kind: 'track',
      kindLabel: 'Song',
      originalUrl: url.href,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&playsinline=1`,
      height: 315,
    }
  }

  return null
}

export function musicFallbackUrl(value) {
  return safeUrl(value)?.href ?? ''
}

export async function fetchMusicMetadata(value, fetcher = globalThis.fetch) {
  const music = parseMusicLink(value)
  if (!music || typeof fetcher !== 'function') return null

  try {
    if (music.platform === 'spotify') {
      const response = await fetcher(`https://open.spotify.com/oembed?url=${encodeURIComponent(music.originalUrl)}`)
      if (!response.ok) return null
      const metadata = await response.json()
      return metadata.title ? { title: metadata.title, artist: '', artwork: metadata.thumbnail_url ?? '' } : null
    }

    if (music.platform === 'youtube') {
      const source = new URL(music.originalUrl)
      if (source.hostname === 'music.youtube.com') source.hostname = 'www.youtube.com'
      const response = await fetcher(`https://www.youtube.com/oembed?url=${encodeURIComponent(source.href)}&format=json`)
      if (!response.ok) return null
      const metadata = await response.json()
      if (!metadata.title) return null
      return { title: metadata.title, artist: metadata.author_name ?? '', artwork: metadata.thumbnail_url ?? '' }
    }

    if (music.platform === 'apple') {
      const source = new URL(music.originalUrl)
      const parts = source.pathname.split('/').filter(Boolean)
      const id = source.searchParams.get('i') ?? [...parts].reverse().find((part) => /^\d+$/.test(part))
      if (!id) return null
      const storefront = /^[a-z]{2}$/i.test(parts[0] ?? '') ? parts[0].toLowerCase() : 'us'
      const response = await fetcher(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${storefront}`)
      if (!response.ok) return null
      const metadata = await response.json()
      const item = metadata.results?.find((result) => String(result.trackId ?? result.collectionId) === String(id)) ?? metadata.results?.[0]
      const title = item?.trackName ?? item?.collectionName
      if (!title) return null
      return { title, artist: item.artistName ?? '', artwork: item.artworkUrl100 ?? item.artworkUrl60 ?? '' }
    }
  } catch {
    return null
  }

  return null
}
