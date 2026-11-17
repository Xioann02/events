<script>
  import { onMount, tick } from 'svelte'
  import { formatEventDate, getTemplate } from '../catalog.js'
  import { getDashboardCountdown } from '../dashboard-countdown.js'
  import { createGift, createGuest, createSong, createTable, createVendor, dashboardSummary } from '../dashboard-data.js'
  import { fetchMusicMetadata, musicFallbackUrl, parseMusicLink } from '../music-embeds.js'
  import couplePhoto from '../../assets/modern-couple.jpg'
  import tablePhoto from '../../assets/reception-table.jpg'
  import stillLifePhoto from '../../assets/editorial-still-life.jpg'
  import LogoMark from './LogoMark.svelte'
  import ConfirmDialog from './ConfirmDialog.svelte'

  let { account, site, data = $bindable(), onHome, onEditWebsite, onNotify } = $props()

  const navGroups = [
    { label: 'Home', items: [
      { id: 'overview', label: 'Overview', glyph: '⌂' },
    ] },
    { label: 'Guests', items: [
      { id: 'guests', label: 'Guest list', glyph: '◎' },
      { id: 'seating', label: 'Table seating', glyph: '⊞' },
      { id: 'messages', label: 'Messages', glyph: '✉' },
    ] },
    { label: 'Planning', items: [
      { id: 'notes', label: 'Calendar and Notes', glyph: '✎' },
      { id: 'vendors', label: 'Vendors', glyph: '▤' },
      { id: 'gifts', label: 'Gifts', glyph: '◇' },
      { id: 'music', label: 'Music', glyph: '♪' },
      { id: 'photos', label: 'Photos', glyph: '▧' },
    ] },
    { label: 'Website and sharing', items: [
      { id: 'website', label: 'Website', glyph: '↗' },
      { id: 'qr', label: 'QR code', glyph: '⌗' },
    ] },
  ]

  const photoAssets = { couple: couplePhoto, table: tablePhoto, 'still-life': stillLifePhoto }
  const MIN_FLOOR_CANVAS_WIDTH = 480
  const MIN_FLOOR_CANVAS_HEIGHT = 360

  let active = $state('overview')
  let mobileNavOpen = $state(false)
  let guestSearch = $state('')
  let giftSearch = $state('')
  let musicSearch = $state('')
  let messageSearch = $state('')
  let vendorSearch = $state('')
  let guestSort = $state({ key: 'name', direction: 'asc' })
  let giftSort = $state({ key: 'guest', direction: 'asc' })
  let musicSort = $state({ key: 'name', direction: 'asc' })
  let messageSort = $state({ key: 'sentAt', direction: 'desc' })
  let vendorSort = $state({ key: 'name', direction: 'asc' })
  let guestToDelete = $state(null)
  let vendorToDelete = $state(null)
  let bulkDeleteRequest = $state(null)
  let selectedGuestIds = $state([])
  let selectedGiftIds = $state([])
  let selectedSongIds = $state([])
  let selectedMessageIds = $state([])
  let selectedVendorIds = $state([])
  let openRowMenuKey = $state('')
  let editingGuestId = $state('')
  let editingGiftId = $state('')
  let editingSongId = $state('')
  let editingMessageId = $state('')
  let editingVendorId = $state('')
  let editingGuestField = $state('')
  let guestEditDirty = $state(false)
  let rsvpFilter = $state('all')
  let giftFilter = $state('all')
  let messageFilter = $state('all')
  let vendorFilter = $state('all')
  let showGuestForm = $state(false)
  let showTableForm = $state(false)
  let openSeatPicker = $state(null)
  let seatCapacityWarning = $state(null)
  let seatCapacityWarningTimer
  let seatGuestSearch = $state('')
  let messageRecipientPickerOpen = $state(false)
  let messageRecipientSearch = $state('')
  let showGiftForm = $state(false)
  let giftGuestPickerOpen = $state(false)
  let giftGuestSearch = $state('')
  let showMusicForm = $state(false)
  let showMessageForm = $state(false)
  let showVendorForm = $state(false)
  let shareGuestIds = $state([])
  let shareMethod = $state('whatsapp')
  let shareMessage = $state('')
  let shareResult = $state(null)
  let draggedGuestId = $state('')
  let seatingView = $state('tables')
  let floorTool = $state('select')
  let floorGesture = $state(null)
  let floorDraft = $state(null)
  let selectedFloorShapeId = $state('')
  let editingFloorTextId = $state('')
  let armedFloorTextId = $state('')
  let openFloorTableId = $state('')
  let floorTableMoved = false
  let suppressFloorTableClick = false
  let calendarCursor = $state(new Date())
  let selectedDayKey = $state(formatCalendarDate(new Date()))
  let notesSectionsCollapsed = $state({ calendar: false, day: false, fixed: false })
  let noteFormattingState = $state({})
  let activeGeneralNoteId = $state('')
  let draggedGeneralNoteId = $state('')
  let dragOverGeneralNoteId = $state('')
  let calendarEventFormOpen = $state(false)
  let calendarEventForm = $state({ title: '', time: '' })
  let copied = $state(false)
  let guestForm = $state({ name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' })
  let guestEditForm = $state({ name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' })
  let tableForm = $state({ capacity: 8 })
  let giftForm = $state({ guestId: '', guest: '', type: 'money', amount: '', currency: 'EUR', gift: '', note: '', thanked: false })
  let musicForm = $state({ name: '', link: '', type: 'other' })
  let messageForm = $state({ guestId: '', recipientIds: [], manualRecipients: [], name: '', email: '', phone: '', message: '', read: true, sentAt: '', direction: 'sent', channel: 'email' })
  let messageFormError = $state('')
  let musicLinkError = $state('')
  let musicMetadataLoading = $state(false)
  let musicSaving = $state(false)
  let openMusicPlayerId = $state('')
  let musicMetadataTimer
  let vendorForm = $state({ name: '', category: 'Venue', contact: '', email: '', phone: '', website: '', cost: '', deposit: '', status: 'researching', note: '' })
  let countdownNow = $state(Date.now())

  let summary = $derived(dashboardSummary(data))
  let template = $derived(getTemplate(site.templateId))
  let eventCountdown = $derived(getDashboardCountdown(site.date, site.draft?.time, countdownNow))
  let selectedFloorShape = $derived((data.floorPlan?.shapes ?? []).find((shape) => shape.id === selectedFloorShapeId))
  let floorTableShape = $derived(data.floorPlan?.tableShape === 'rectangle' ? 'rectangle' : 'round')
  let calendarDays = $derived.by(() => {
    const monthStart = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1)
    const mondayOffset = (monthStart.getDay() + 6) % 7
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index - mondayOffset + 1)
      return {
        date,
        key: formatCalendarDate(date),
        inMonth: date.getMonth() === calendarCursor.getMonth(),
      }
    })
  })
  let selectedDayEvents = $derived((data.notesCalendar?.events ?? []).filter((event) => event.date === selectedDayKey).sort((a, b) => (a.time || '').localeCompare(b.time || '')))
  let calendarMonthLabel = $derived(calendarCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
  let detectedMusicLink = $derived(parseMusicLink(musicForm.link))
  let visibleSelectedGuestIds = $derived(sortedGuests.filter((guest) => selectedGuestIds.includes(guest.id)).map((guest) => guest.id))
  let allVisibleGuestsSelected = $derived(sortedGuests.length > 0 && visibleSelectedGuestIds.length === sortedGuests.length)
  let someVisibleGuestsSelected = $derived(visibleSelectedGuestIds.length > 0 && !allVisibleGuestsSelected)
  let filteredGifts = $derived(data.gifts.filter((gift) => `${gift.guest} ${giftLabel(gift)} ${gift.note}`.toLowerCase().includes(giftSearch.toLowerCase()) && (giftFilter === 'all' || (giftFilter === 'thanked' ? gift.thanked : !gift.thanked))))
  let giftGuestResults = $derived(data.guests.filter((guest) => `${guest.name} ${guest.email ?? ''} ${guest.phone ?? ''}`.toLowerCase().includes(giftGuestSearch.toLowerCase())))
  let filteredSongs = $derived((data.songs ?? []).filter((song) => `${song.name} ${song.link} ${songTypeLabel(song.type)}`.toLowerCase().includes(musicSearch.toLowerCase())))
  let filteredMessages = $derived((data.messages ?? []).filter((message) => {
    const direction = message.direction ?? 'received'
    const matchesSearch = `${message.name} ${message.email} ${message.phone} ${message.message} ${direction} ${messageChannelLabel(message.channel ?? 'website')}`.toLowerCase().includes(messageSearch.toLowerCase())
    const matchesFilter = messageFilter === 'all'
      || messageFilter === direction
      || (messageFilter === 'unread' && direction === 'received' && !message.read)
    return matchesSearch && matchesFilter
  }))
  let filteredVendors = $derived((data.vendors ?? []).filter((vendor) => {
    const matchesSearch = `${vendor.name} ${vendor.category} ${vendor.contact} ${vendor.email} ${vendor.phone} ${vendor.note}`.toLowerCase().includes(vendorSearch.toLowerCase())
    const booked = ['booked', 'paid'].includes(vendor.status)
    return matchesSearch && (vendorFilter === 'all' || (vendorFilter === 'booked' ? booked : !booked))
  }))
  let visibleSelectedGiftIds = $derived(filteredGifts.filter((gift) => selectedGiftIds.includes(gift.id)).map((gift) => gift.id))
  let allGiftsSelected = $derived(filteredGifts.length > 0 && visibleSelectedGiftIds.length === filteredGifts.length)
  let someGiftsSelected = $derived(visibleSelectedGiftIds.length > 0 && !allGiftsSelected)
  let visibleSelectedSongIds = $derived(filteredSongs.filter((song) => selectedSongIds.includes(song.id)).map((song) => song.id))
  let allSongsSelected = $derived(filteredSongs.length > 0 && visibleSelectedSongIds.length === filteredSongs.length)
  let someSongsSelected = $derived(visibleSelectedSongIds.length > 0 && !allSongsSelected)
  let visibleSelectedMessageIds = $derived(filteredMessages.filter((message) => selectedMessageIds.includes(message.id)).map((message) => message.id))
  let allMessagesSelected = $derived(filteredMessages.length > 0 && visibleSelectedMessageIds.length === filteredMessages.length)
  let someMessagesSelected = $derived(visibleSelectedMessageIds.length > 0 && !allMessagesSelected)
  let messageRecipientResults = $derived(data.guests.filter((guest) => `${guest.name} ${guest.email ?? ''} ${guest.phone ?? ''}`.toLowerCase().includes(messageRecipientSearch.toLowerCase())))
  let visibleSelectedVendorIds = $derived(filteredVendors.filter((vendor) => selectedVendorIds.includes(vendor.id)).map((vendor) => vendor.id))
  let allVendorsSelected = $derived(filteredVendors.length > 0 && visibleSelectedVendorIds.length === filteredVendors.length)
  let someVendorsSelected = $derived(visibleSelectedVendorIds.length > 0 && !allVendorsSelected)
  let filteredGuests = $derived(
    data.guests.filter((guest) => {
      const matchesSearch = `${guest.name} ${guest.email} ${guest.phone ?? ''} ${shareMethodLabel(guest.invitedVia)} ${guest.invitedVia ? 'invited' : 'not invited'}`.toLowerCase().includes(guestSearch.toLowerCase())
      const matchesStatus = rsvpFilter === 'all' || guest.status === rsvpFilter
      return matchesSearch && matchesStatus
    }),
  )
  let sortedGuests = $derived(
    [...filteredGuests].sort((first, second) => {
      const firstValue = first[guestSort.key] ?? ''
      const secondValue = second[guestSort.key] ?? ''
      const comparison = guestSort.key === 'party'
        ? Number(firstValue) - Number(secondValue)
        : String(firstValue).localeCompare(String(secondValue), undefined, { sensitivity: 'base', numeric: true })
      return guestSort.direction === 'asc' ? comparison : -comparison
    }),
  )
  let sortedGifts = $derived(sortTableRows(filteredGifts, giftSort))
  let sortedSongs = $derived(sortTableRows(filteredSongs, musicSort))
  let sortedMessages = $derived(sortTableRows(filteredMessages, messageSort))
  let sortedVendors = $derived(sortTableRows(filteredVendors, vendorSort))
  let unassignedGuests = $derived(data.guests.filter((guest) => guest.status === 'attending' && !guest.tableId))

  onMount(() => {
    const countdownTimer = window.setInterval(() => (countdownNow = Date.now()), 1000)
    return () => window.clearInterval(countdownTimer)
  })

  function navigate(section) {
    active = section
    mobileNavOpen = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToWebsiteEditor() {
    const templateId = site.templateId ?? site.draft?.templateId ?? 'classic'
    const occasionId = site.occasionId ?? site.draft?.occasionId ?? 'wedding'
    const params = new URLSearchParams({ editor: templateId, occasion: occasionId, source: 'dashboard' })
    window.location.assign(`${window.location.pathname}?${params.toString()}`)
  }

  function tableSortValue(item, key) {
    if (key === 'giftValue') return giftLabel(item)
    if (key === 'contact') return `${item.contact ?? ''} ${item.email ?? ''} ${item.phone ?? ''}`
    if (key === 'cost') return Number(item.cost) || 0
    if (key === 'sentAt') return new Date(item.sentAt).getTime() || 0
    if (key === 'direction') return item.direction ?? 'received'
    return item[key] ?? ''
  }

  function sortTableRows(rows, sort) {
    return [...rows].sort((first, second) => {
      const firstValue = tableSortValue(first, sort.key)
      const secondValue = tableSortValue(second, sort.key)
      const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue), undefined, { sensitivity: 'base', numeric: true })
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }

  function toggleTableSort(table, key) {
    const current = table === 'guests' ? guestSort : table === 'gifts' ? giftSort : table === 'music' ? musicSort : table === 'messages' ? messageSort : vendorSort
    const next = { key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }
    if (table === 'guests') guestSort = next
    if (table === 'gifts') giftSort = next
    if (table === 'music') musicSort = next
    if (table === 'messages') messageSort = next
    if (table === 'vendors') vendorSort = next
  }

  function sortArrow(sort, key) {
    if (sort.key !== key) return '↕'
    return sort.direction === 'asc' ? '↑' : '↓'
  }

  function addGuest(event) {
    event.preventDefault()
    if (!guestForm.name.trim()) return
    const adults = Math.max(1, Number(guestForm.adults) || 1)
    const children = Math.max(0, Number(guestForm.children) || 0)
    if (editingGuestId) {
      updateGuest(editingGuestId, { ...guestForm, name: guestForm.name.trim(), adults, children, party: adults + children })
    } else {
      const guest = createGuest({ ...guestForm, adults, children })
      data = { ...data, guests: [...data.guests, guest] }
    }
    guestForm = { name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' }
    showGuestForm = false
    onNotify(editingGuestId ? 'Guest changes saved.' : 'Guest added to your list.')
    editingGuestId = ''
  }

  function openGuestRow() {
    openRowMenuKey = ''
    editingGuestId = ''
    guestForm = { name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' }
    showGuestForm = true
  }

  function cancelGuestRow() {
    guestForm = { name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' }
    showGuestForm = false
    editingGuestId = ''
  }

  function openGuestEditModal(guest) {
    guestForm = { name: guest.name, email: guest.email ?? '', phone: guest.phone ?? '', adults: guest.adults ?? guest.party ?? 1, children: guest.children ?? 0, status: guest.status ?? 'pending', note: guest.note ?? '', meal: guest.meal ?? '' }
    editingGuestId = guest.id
    showGuestForm = true
  }

  function removeGuest(guestId) {
    const guest = data.guests.find((item) => item.id === guestId)
    if (!guest) return
    data = {
      ...data,
      guests: data.guests.filter((guest) => guest.id !== guestId),
      gifts: data.gifts.map((gift) => (gift.guestId === guestId ? { ...gift, guestId: '' } : gift)),
    }
    selectedGuestIds = selectedGuestIds.filter((id) => id !== guestId)
    openRowMenuKey = ''
    guestToDelete = null
    onNotify('Guest removed.')
  }

  function setIndeterminate(node, value) {
    node.indeterminate = value
    return { update(nextValue) { node.indeterminate = nextValue } }
  }

  function toggleGuestSelection(guestId) {
    selectedGuestIds = selectedGuestIds.includes(guestId)
      ? selectedGuestIds.filter((id) => id !== guestId)
      : [...selectedGuestIds, guestId]
  }

  function selectVisibleGuests(checked) {
    const visibleIds = new Set(sortedGuests.map((guest) => guest.id))
    selectedGuestIds = checked
      ? [...new Set([...selectedGuestIds, ...visibleIds])]
      : selectedGuestIds.filter((id) => !visibleIds.has(id))
  }

  function openGuestShareModal(guestIds) {
    const validIds = [...new Set(guestIds)].filter((id) => data.guests.some((guest) => guest.id === id))
    if (!validIds.length) return
    shareGuestIds = validIds
    shareMethod = 'whatsapp'
    shareMessage = `Hi! We'd love you to join us for ${data.eventName}. You can view all the details and RSVP here:\n${data.siteUrl}`
    shareResult = null
    openRowMenuKey = ''
  }

  function closeGuestShareModal() {
    shareGuestIds = []
    shareResult = null
    messageFormError = ''
  }

  function simulateGuestShare(event) {
    event.preventDefault()
    const guests = data.guests.filter((guest) => shareGuestIds.includes(guest.id))
    const usesEmail = shareMethod === 'email'
    const sent = guests.filter((guest) => usesEmail ? guest.email?.trim() : guest.phone?.trim())
    const failed = guests.filter((guest) => !sent.includes(guest))
    const sentIds = new Set(sent.map((guest) => guest.id))
    const invitedAt = new Date().toISOString()
    data = {
      ...data,
      guests: data.guests.map((guest) => sentIds.has(guest.id) ? { ...guest, invitedVia: shareMethod, invitedAt } : guest),
    }
    shareResult = { sent, failed, method: shareMethod }
    onNotify(`Recorded ${sent.length} ${sent.length === 1 ? 'invitation' : 'invitations'} via ${shareMethodLabel(shareMethod)}${failed.length ? `; ${failed.length} missing ${usesEmail ? 'an email address' : 'a phone number'}` : ''}. Development preview only — nothing was actually sent.`)
  }

  function shareMethodLabel(method) {
    return ({ whatsapp: 'WhatsApp', viber: 'Viber', email: 'Email', sms: 'SMS' })[method] ?? method
  }

  function updateSelectedGuestStatus(status) {
    const selectedIds = new Set(visibleSelectedGuestIds)
    if (!selectedIds.size) return
    data = {
      ...data,
      guests: data.guests.map((guest) => selectedIds.has(guest.id) ? { ...guest, status } : guest),
    }
    onNotify(`Updated RSVP status for ${selectedIds.size} ${selectedIds.size === 1 ? 'guest' : 'guests'}.`)
  }

  function toggleGiftSelection(giftId) {
    selectedGiftIds = selectedGiftIds.includes(giftId)
      ? selectedGiftIds.filter((id) => id !== giftId)
      : [...selectedGiftIds, giftId]
  }

  function selectAllGifts(checked) {
    selectedGiftIds = checked
      ? [...new Set([...selectedGiftIds, ...filteredGifts.map((gift) => gift.id)])]
      : selectedGiftIds.filter((id) => !filteredGifts.some((gift) => gift.id === id))
  }

  function updateSelectedGiftStatus(status) {
    const selectedIds = new Set(visibleSelectedGiftIds)
    if (!selectedIds.size) return
    const thanked = status === 'thanked'
    data = {
      ...data,
      gifts: data.gifts.map((gift) => selectedIds.has(gift.id) ? { ...gift, thanked } : gift),
    }
    onNotify(`Marked ${selectedIds.size} selected ${selectedIds.size === 1 ? 'gift' : 'gifts'} as ${thanked ? 'thanked' : 'pending'}.`)
  }

  function toggleSongSelection(songId) {
    selectedSongIds = selectedSongIds.includes(songId)
      ? selectedSongIds.filter((id) => id !== songId)
      : [...selectedSongIds, songId]
  }

  function selectAllSongs(checked) {
    selectedSongIds = checked
      ? [...new Set([...selectedSongIds, ...filteredSongs.map((song) => song.id)])]
      : selectedSongIds.filter((id) => !filteredSongs.some((song) => song.id === id))
  }

  function toggleMessageSelection(messageId) {
    selectedMessageIds = selectedMessageIds.includes(messageId)
      ? selectedMessageIds.filter((id) => id !== messageId)
      : [...selectedMessageIds, messageId]
  }

  function selectAllMessages(checked) {
    selectedMessageIds = checked
      ? [...new Set([...selectedMessageIds, ...filteredMessages.map((message) => message.id)])]
      : selectedMessageIds.filter((id) => !filteredMessages.some((message) => message.id === id))
  }

  function toggleVendorSelection(vendorId) {
    selectedVendorIds = selectedVendorIds.includes(vendorId)
      ? selectedVendorIds.filter((id) => id !== vendorId)
      : [...selectedVendorIds, vendorId]
  }

  function selectAllVendors(checked) {
    selectedVendorIds = checked
      ? [...new Set([...selectedVendorIds, ...filteredVendors.map((vendor) => vendor.id)])]
      : selectedVendorIds.filter((id) => !filteredVendors.some((vendor) => vendor.id === id))
  }

  function updateSelectedVendorStatus(status) {
    const selectedIds = new Set(visibleSelectedVendorIds)
    if (!selectedIds.size) return
    data = {
      ...data,
      vendors: (data.vendors ?? []).map((vendor) => selectedIds.has(vendor.id) ? { ...vendor, status } : vendor),
    }
    const label = status === 'quoted' ? 'quote received' : status
    onNotify(`Updated ${selectedIds.size} selected ${selectedIds.size === 1 ? 'vendor' : 'vendors'} to ${label}.`)
  }

  function requestBulkDelete(type) {
    const ids = ({ guests: visibleSelectedGuestIds, gifts: visibleSelectedGiftIds, music: visibleSelectedSongIds, messages: visibleSelectedMessageIds, vendors: visibleSelectedVendorIds })[type] ?? []
    if (!ids.length) return
    bulkDeleteRequest = { type, ids }
  }

  function bulkDeleteTitle(request) {
    const labels = { guests: 'guests', gifts: 'gifts', music: 'songs', messages: 'messages', vendors: 'vendors' }
    return `Delete ${request.ids.length} selected ${labels[request.type] ?? 'items'}?`
  }

  function bulkDeleteMessage(type) {
    if (type === 'guests') return 'Selected guests will be removed from the guest list and seating. Their gift records will remain, but will no longer be linked to a guest.'
    if (type === 'vendors') return 'Selected vendors and all of their saved contact, cost and booking details will be permanently removed.'
    if (type === 'messages') return 'Selected guest messages will be permanently removed.'
    if (type === 'music') return 'Selected songs will be permanently removed from your music list.'
    return 'Selected gift records will be permanently removed.'
  }

  function confirmBulkDelete() {
    if (!bulkDeleteRequest) return
    const { type, ids } = bulkDeleteRequest
    const deletedIds = new Set(ids)
    if (type === 'guests') {
      data = {
        ...data,
        guests: data.guests.filter((guest) => !deletedIds.has(guest.id)),
        gifts: data.gifts.map((gift) => (deletedIds.has(gift.guestId) ? { ...gift, guestId: '' } : gift)),
      }
      selectedGuestIds = selectedGuestIds.filter((id) => !deletedIds.has(id))
      onNotify(`${ids.length} selected ${ids.length === 1 ? 'guest' : 'guests'} removed.`)
    } else if (type === 'gifts') {
      data = { ...data, gifts: data.gifts.filter((gift) => !deletedIds.has(gift.id)) }
      selectedGiftIds = selectedGiftIds.filter((id) => !deletedIds.has(id))
      onNotify(`${ids.length} selected ${ids.length === 1 ? 'gift' : 'gifts'} removed.`)
    } else if (type === 'messages') {
      data = { ...data, messages: (data.messages ?? []).filter((message) => !deletedIds.has(message.id)) }
      selectedMessageIds = selectedMessageIds.filter((id) => !deletedIds.has(id))
      onNotify(`${ids.length} selected ${ids.length === 1 ? 'message' : 'messages'} removed.`)
    } else if (type === 'music') {
      data = { ...data, songs: (data.songs ?? []).filter((song) => !deletedIds.has(song.id)) }
      selectedSongIds = selectedSongIds.filter((id) => !deletedIds.has(id))
      onNotify(`${ids.length} selected ${ids.length === 1 ? 'song' : 'songs'} removed.`)
    } else if (type === 'vendors') {
      data = { ...data, vendors: (data.vendors ?? []).filter((vendor) => !deletedIds.has(vendor.id)) }
      selectedVendorIds = selectedVendorIds.filter((id) => !deletedIds.has(id))
      onNotify(`${ids.length} selected ${ids.length === 1 ? 'vendor' : 'vendors'} removed.`)
    }
    bulkDeleteRequest = null
  }

  function toggleRowMenu(type, id) {
    const key = `${type}:${id}`
    openRowMenuKey = openRowMenuKey === key ? '' : key
  }

  function closeGuestMenuFromOutside(event) {
    if (!event.target.closest?.('.guest-action-menu')) openRowMenuKey = ''
    if (!event.target.closest?.('.general-note-card')) {
      if (document.activeElement?.closest?.('.general-note-card')) document.activeElement.blur()
      activeGeneralNoteId = ''
    }
  }

  function loadGuestEditForm(guest) {
    guestEditForm = {
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      adults: guest.adults ?? guest.party,
      children: guest.children ?? 0,
      status: guest.status,
      note: guest.note,
      meal: guest.meal,
    }
    editingGuestId = guest.id
    editingGuestField = ''
    guestEditDirty = false
    openRowMenuKey = ''
    showGuestForm = false
  }

  async function openGuestField(field, guest) {
    if (editingGuestId !== guest.id) {
      loadGuestEditForm(guest)
    }
    editingGuestField = field
    await tick()
    const input = document.querySelector(`[data-guest-edit="${field}"]`)
    input?.focus()
    if (input?.setSelectionRange) {
      const end = input.value.length
      input.setSelectionRange(end, end)
    }
  }

  function markGuestEditDirty() {
    guestEditDirty = true
  }

  function saveGuestPartyChange(event, field) {
    guestEditForm[field] = Number(event.currentTarget.value)
    guestEditDirty = true
    saveGuestEdit()
  }

  function changeGuestStatus(guest, status) {
    updateGuest(guest.id, { status })
    if (editingGuestId === guest.id) {
      guestEditForm.status = status
      guestEditDirty = false
    }
  }

  function saveGuestEdit() {
    if (!editingGuestId || !guestEditDirty) return
    const originalGuest = data.guests.find((guest) => guest.id === editingGuestId)
    if (!originalGuest) return
    const name = guestEditForm.name.trim() || originalGuest.name
    const adults = Math.max(1, Number(guestEditForm.adults) || 1)
    const children = Math.max(0, Number(guestEditForm.children) || 0)
    updateGuest(editingGuestId, {
      ...guestEditForm,
      name,
      adults,
      children,
      party: adults + children,
    })
    editingGuestId = ''
    editingGuestField = ''
    guestEditDirty = false
    guestEditForm = { ...guestEditForm, name }
    onNotify('Guest changes saved.')
  }

  function sortGuests(key) {
    guestSort = {
      key,
      direction: guestSort.key === key && guestSort.direction === 'asc' ? 'desc' : 'asc',
    }
  }

  function updateGuest(guestId, changes) {
    data = {
      ...data,
      guests: data.guests.map((guest) => (guest.id === guestId ? { ...guest, ...changes } : guest)),
    }
  }

  function addTable(event) {
    event.preventDefault()
    const tableIndex = data.tables.length
    const table = {
      ...createTable(tableIndex + 1, tableForm.capacity),
      x: 18 + (tableIndex % 4) * 21,
      y: 22 + Math.floor(tableIndex / 4) * 22,
    }
    data = { ...data, tables: [...data.tables, table] }
    tableForm = { capacity: 8 }
    showTableForm = false
    onNotify(`${table.name} added.`)
  }

  function removeTable(tableId) {
    data = {
      ...data,
      tables: data.tables.filter((table) => table.id !== tableId),
      guests: data.guests.map((guest) => (guest.tableId === tableId ? { ...guest, tableId: '' } : guest)),
    }
    onNotify('Table removed. Its guests are now unassigned.')
  }

  function tableGuests(tableId) {
    return data.guests.filter((guest) => guest.tableId === tableId && guest.status === 'attending')
  }

  function tablePartyCount(tableId) {
    return tableGuests(tableId).reduce((count, guest) => count + guest.party, 0)
  }

  function guestForSeat(tableId, seatIndex) {
    let firstSeat = 0
    for (const guest of tableGuests(tableId)) {
      const lastSeat = firstSeat + Math.max(1, Number(guest.party) || 1)
      if (seatIndex >= firstSeat && seatIndex < lastSeat) return guest
      firstSeat = lastSeat
    }
    return null
  }

  function openGuestPickerForSeat(table, seatIndex) {
    seatGuestSearch = ''
    openSeatPicker = { tableId: table.id, tableName: table.name, seatIndex, guest: guestForSeat(table.id, seatIndex) }
  }

  function assignGuestFromSeatPicker(guest) {
    if (!openSeatPicker) return
    const table = data.tables.find((item) => item.id === openSeatPicker.tableId)
    if (!table) return
    if (!canSeatGuest(table, guest)) {
      openSeatPicker = null
      return
    }
    updateGuest(guest.id, { tableId: openSeatPicker.tableId })
    clearSeatCapacityWarning()
    onNotify(`${guest.name} assigned to ${openSeatPicker.tableName}.`)
    openSeatPicker = null
  }

  function canSeatGuest(table, guest) {
    const occupiedByOthers = tablePartyCount(table.id) - (guest.tableId === table.id ? guest.party : 0)
    const requestedSeats = Math.max(1, Number(guest.party) || 1)
    if (occupiedByOthers + requestedSeats <= table.capacity) return true

    const message = `${guest.name} needs ${requestedSeats} seats, but only ${Math.max(0, table.capacity - occupiedByOthers)} ${table.capacity - occupiedByOthers === 1 ? 'seat is' : 'seats are'} left at ${table.name}.`
    seatCapacityWarning = {
      tableId: table.id,
      message,
    }
    window.clearTimeout(seatCapacityWarningTimer)
    seatCapacityWarningTimer = window.setTimeout(() => {
      seatCapacityWarning = null
      seatCapacityWarningTimer = undefined
    }, 2000)
    return false
  }

  function clearSeatCapacityWarning() {
    window.clearTimeout(seatCapacityWarningTimer)
    seatCapacityWarningTimer = undefined
    seatCapacityWarning = null
  }

  function clearSelectedSeat() {
    if (!openSeatPicker?.guest) return
    const guest = openSeatPicker.guest
    updateGuest(guest.id, { tableId: '' })
    onNotify(`${guest.name} moved to unassigned guests.`)
    openSeatPicker = null
  }

  function unassignGuestFromTable(guest) {
    updateGuest(guest.id, { tableId: '' })
    onNotify(`${guest.name} moved to unassigned guests.`)
  }

  function setFloorTableShape(shape) {
    data = { ...data, floorPlan: { ...data.floorPlan, tableShape: shape } }
  }

  function updateFloorText(shapeId, value) {
    data = {
      ...data,
      floorPlan: {
        ...data.floorPlan,
        shapes: (data.floorPlan?.shapes ?? []).map((shape) => shape.id === shapeId
          ? { ...shape, [shape.type === 'text' ? 'text' : 'label']: value }
          : shape),
      },
    }
  }

  async function editFloorText(shapeId) {
    selectedFloorShapeId = shapeId
    editingFloorTextId = shapeId
    await tick()
    const input = document.querySelector(`[data-floor-text-input="${shapeId}"]`)
    input?.focus()
    input?.select()
  }

  function handleFloorTextClick(shapeId) {
    if (armedFloorTextId === shapeId) {
      editFloorText(shapeId)
      return
    }
    selectedFloorShapeId = shapeId
    armedFloorTextId = shapeId
  }

  function handleFloorTextKeydown(event) {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      editingFloorTextId = ''
      event.currentTarget.blur()
    }
  }

  function handleFloorShapeDoubleClick(event) {
    if (active !== 'seating' || seatingView !== 'floor') return
    const shapeId = event.target.closest?.('[data-floor-shape]')?.dataset.floorShape
    const shape = data.floorPlan?.shapes?.find((item) => item.id === shapeId)
    if (!shape || shape.type === 'text') return
    editFloorText(shape.id)
  }

  function toggleFloorTablePopup(tableId) {
    if (suppressFloorTableClick) {
      suppressFloorTableClick = false
      return
    }
    openFloorTableId = openFloorTableId === tableId ? '' : tableId
  }

  function dropGuest(tableId) {
    if (!draggedGuestId) return
    const guest = data.guests.find((item) => item.id === draggedGuestId)
    const table = data.tables.find((item) => item.id === tableId)
    if (table && guest && !canSeatGuest(table, guest)) {
      draggedGuestId = ''
      return
    }
    if (guest) updateGuest(draggedGuestId, { tableId })
    clearSeatCapacityWarning()
    draggedGuestId = ''
  }

  function floorTablePosition(table, index) {
    return { x: table.x ?? 18 + (index % 4) * 21, y: table.y ?? 22 + Math.floor(index / 4) * 22 }
  }

  function seatDotStyle(seat, capacity, shape, view) {
    const count = Math.max(1, capacity)
    if (shape !== 'rectangle') {
      return `--seat-angle:${(seat * 360) / count}deg;--seat-offset:${view === 'list' ? -93 : -45}px`
    }

    const halfWidth = view === 'list' ? 104 : 61
    const halfHeight = view === 'list' ? 64 : 34
    const topCount = Math.ceil(count / 2)
    const bottomCount = count - topCount
    const onTopSide = seat < topCount
    const sideIndex = onTopSide ? seat : seat - topCount
    const sideCount = onTopSide ? topCount : bottomCount
    const x = -halfWidth + ((sideIndex + 1) / (sideCount + 1)) * (halfWidth * 2)
    const y = onTopSide ? -halfHeight : halfHeight
    return `--seat-x:${x}px;--seat-y:${y}px`
  }

  function floorCanvasStyle() {
    const width = data.floorPlan?.width ? `${data.floorPlan.width}px` : '100%'
    const height = data.floorPlan?.height ?? 520
    return `--canvas-width:${width};--canvas-height:${height}px`
  }

  function floorPoint(event) {
    const canvas = document.querySelector('.floor-canvas')
    if (!canvas) return null
    const bounds = canvas.getBoundingClientRect()
    return {
      x: Math.max(2, Math.min(98, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(4, Math.min(96, ((event.clientY - bounds.top) / bounds.height) * 100)),
      width: bounds.width,
      height: bounds.height,
    }
  }

  function beginFloorGesture(event) {
    if (active !== 'seating' || seatingView !== 'floor') return
    const canvas = event.target.closest?.('.floor-canvas')
    if (!canvas) return
    const marker = event.target.closest?.('[data-floor-table]')
    const resizeHandle = event.target.closest?.('[data-floor-resize]')
    const canvasResizeHandle = event.target.closest?.('[data-floor-canvas-resize]')
    const shapeNode = event.target.closest?.('[data-floor-shape]')
    const textInput = event.target.closest?.('[data-floor-text-input]')
    if (textInput) return
    if (canvasResizeHandle) {
      const bounds = canvas.getBoundingClientRect()
      floorGesture = { kind: 'canvas-resize', startX: event.clientX, startY: event.clientY, width: bounds.width, height: bounds.height }
      return
    }
    const point = floorPoint(event)
    if (!point) return

    if (resizeHandle && floorTool === 'select') {
      const shape = data.floorPlan?.shapes?.find((item) => item.id === resizeHandle.dataset.floorResize)
      if (!shape) return
      selectedFloorShapeId = shape.id
      floorGesture = { kind: 'shape-resize', id: shape.id, endpoint: resizeHandle.dataset.floorEndpoint, original: shape }
      return
    }

    if (marker && floorTool === 'select') {
      selectedFloorShapeId = ''
      armedFloorTextId = ''
      floorTableMoved = false
      const table = data.tables.find((item) => item.id === marker.dataset.floorTable)
      if (!table) return
      const position = floorTablePosition(table, data.tables.indexOf(table))
      floorGesture = { kind: 'table', id: table.id, startX: point.x, startY: point.y, offsetX: point.x - position.x, offsetY: point.y - position.y }
      return
    }

    if (shapeNode && floorTool === 'select') {
      const shape = data.floorPlan?.shapes?.find((item) => item.id === shapeNode.dataset.floorShape)
      if (!shape) return
      if (shape.type !== 'text') armedFloorTextId = ''
      selectedFloorShapeId = shape.id
      floorGesture = { kind: 'shape-move', id: shape.id, startX: point.x, startY: point.y, original: shape }
      return
    }

    if (floorTool !== 'select') {
      selectedFloorShapeId = ''
      armedFloorTextId = ''
    } else {
      selectedFloorShapeId = ''
      armedFloorTextId = ''
    }

    if (!marker && floorTool === 'text') {
      const shapes = data.floorPlan?.shapes ?? []
      const shape = {
        id: `shape-${Date.now()}`,
        type: 'text',
        text: 'Text',
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        width: point.width,
        height: point.height,
      }
      data = { ...data, floorPlan: { ...data.floorPlan, shapes: [...shapes, shape] } }
      selectedFloorShapeId = shape.id
      armedFloorTextId = shape.id
      floorTool = 'select'
      editFloorText(shape.id)
      return
    }

    if (!marker && floorTool !== 'select') {
      floorGesture = { kind: 'shape-create', type: floorTool }
      floorDraft = { type: floorTool, x1: point.x, y1: point.y, x2: point.x, y2: point.y, width: point.width, height: point.height }
    }
  }

  function moveFloorGesture(event) {
    if (!floorGesture) return
    if (floorGesture.kind === 'canvas-resize') {
      const canvas = document.querySelector('.floor-canvas')
      const view = canvas?.closest('.dashboard-view')
      const settings = view?.querySelector('.floor-table-settings')
      const canvasBounds = canvas?.getBoundingClientRect()
      const settingsBounds = settings?.getBoundingClientRect()
      const settingsBesideCanvas = canvasBounds && settingsBounds && settingsBounds.top < canvasBounds.bottom
      const rightEdge = settingsBesideCanvas ? settingsBounds.left - 14 : view?.getBoundingClientRect().right
      const availableWidth = canvasBounds && rightEdge
        ? rightEdge - canvasBounds.left
        : floorGesture.width
      const maxWidth = Math.max(1, availableWidth)
      const minWidth = Math.min(MIN_FLOOR_CANVAS_WIDTH, maxWidth, floorGesture.width)
      const width = Math.min(maxWidth, Math.max(minWidth, floorGesture.width + event.clientX - floorGesture.startX))
      const height = Math.max(MIN_FLOOR_CANVAS_HEIGHT, floorGesture.height + event.clientY - floorGesture.startY)
      const shapes = data.floorPlan?.shapes ?? []
      data = {
        ...data,
        floorPlan: {
          ...data.floorPlan,
          width,
          height,
          shapes: shapes.map((shape) => ({ ...shape, width, height })),
        },
      }
      return
    }
    const point = floorPoint(event)
    if (!point) return
    if (floorGesture.kind === 'table') {
      if (Math.hypot(point.x - floorGesture.startX, point.y - floorGesture.startY) > 0.4) floorTableMoved = true
      data = {
        ...data,
        tables: data.tables.map((table) => table.id === floorGesture.id
          ? { ...table, x: Math.max(4, Math.min(96, point.x - floorGesture.offsetX)), y: Math.max(6, Math.min(94, point.y - floorGesture.offsetY)) }
          : table),
      }
      return
    }
    if (floorGesture.kind === 'shape-create') {
      floorDraft = { ...floorDraft, x2: point.x, y2: point.y, width: point.width, height: point.height }
      return
    }
    const deltaX = point.x - floorGesture.startX
    const deltaY = point.y - floorGesture.startY
    const original = floorGesture.original
    const shapes = data.floorPlan?.shapes ?? []
    data = {
      ...data,
      floorPlan: {
        ...data.floorPlan,
        shapes: shapes.map((shape) => {
          if (shape.id !== floorGesture.id) return shape
          if (floorGesture.kind === 'shape-move') {
            const minX = Math.min(original.x1, original.x2)
            const maxX = Math.max(original.x1, original.x2)
            const minY = Math.min(original.y1, original.y2)
            const maxY = Math.max(original.y1, original.y2)
            const safeX = Math.max(-minX, Math.min(100 - maxX, deltaX))
            const safeY = Math.max(-minY, Math.min(100 - maxY, deltaY))
            return { ...original, x1: original.x1 + safeX, y1: original.y1 + safeY, x2: original.x2 + safeX, y2: original.y2 + safeY }
          }
          const endpoint = floorGesture.endpoint === 'start' ? '1' : '2'
          return { ...original, [`x${endpoint}`]: point.x, [`y${endpoint}`]: point.y, width: point.width, height: point.height }
        }),
      },
    }
  }

  function finishFloorGesture() {
    if (floorGesture?.kind === 'table' && floorTableMoved) {
      suppressFloorTableClick = true
      window.setTimeout(() => (suppressFloorTableClick = false), 0)
    }
    floorTableMoved = false
    if (floorGesture?.kind === 'shape-create' && floorDraft) {
      const shapes = data.floorPlan?.shapes ?? []
      const shape = { ...floorDraft, id: `shape-${Date.now()}` }
      data = { ...data, floorPlan: { ...data.floorPlan, shapes: [...shapes, shape] } }
      selectedFloorShapeId = shape.id
      floorTool = 'select'
    }
    floorGesture = null
    floorDraft = null
  }

  function undoFloorShape() {
    const shapes = data.floorPlan?.shapes ?? []
    if (shapes.at(-1)?.id === selectedFloorShapeId) selectedFloorShapeId = ''
    data = { ...data, floorPlan: { ...data.floorPlan, shapes: shapes.slice(0, -1) } }
  }

  function deleteSelectedFloorShape() {
    if (!selectedFloorShapeId) return
    data = {
      ...data,
      floorPlan: { ...data.floorPlan, shapes: (data.floorPlan?.shapes ?? []).filter((shape) => shape.id !== selectedFloorShapeId) },
    }
    if (editingFloorTextId === selectedFloorShapeId) editingFloorTextId = ''
    if (armedFloorTextId === selectedFloorShapeId) armedFloorTextId = ''
    selectedFloorShapeId = ''
  }

  function handleFloorShapeDeleteKey(event) {
    if (!['Backspace', 'Delete'].includes(event.key)) return
    if (active !== 'seating' || seatingView !== 'floor' || !selectedFloorShapeId) return
    const focusedTextInput = document.activeElement?.closest?.('[data-floor-text-input]')
    if (selectedFloorShape?.type === 'text' && !focusedTextInput) {
      event.preventDefault()
      deleteSelectedFloorShape()
      return
    }
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
    event.preventDefault()
    deleteSelectedFloorShape()
  }

  function resizeShapeWithKeyboard(event, shape, endpoint) {
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const movement = moves[event.key]
    if (!movement) return
    event.preventDefault()
    const xKey = endpoint === 'start' ? 'x1' : 'x2'
    const yKey = endpoint === 'start' ? 'y1' : 'y2'
    const shapes = data.floorPlan?.shapes ?? []
    data = {
      ...data,
      floorPlan: {
        ...data.floorPlan,
        shapes: shapes.map((item) => item.id === shape.id ? {
          ...item,
          [xKey]: Math.max(0, Math.min(100, item[xKey] + movement[0])),
          [yKey]: Math.max(0, Math.min(100, item[yKey] + movement[1])),
        } : item),
      },
    }
  }

  function removeFloorTable(tableId) {
    removeTable(tableId)
  }

  function floorShapeGeometry(shape) {
    const x = Math.min(shape.x1, shape.x2)
    const y = Math.min(shape.y1, shape.y2)
    const width = Math.abs(shape.x2 - shape.x1)
    const height = Math.abs(shape.y2 - shape.y1)
    const radiusPixels = Math.hypot((shape.x2 - shape.x1) * (shape.width ?? 1) / 100, (shape.y2 - shape.y1) * (shape.height ?? 1) / 100) / 2
    return {
      x, y, width, height,
      cx: (shape.x1 + shape.x2) / 2,
      cy: (shape.y1 + shape.y2) / 2,
      rx: (radiusPixels / (shape.width ?? 1)) * 100,
      ry: (radiusPixels / (shape.height ?? 1)) * 100,
    }
  }

  function addGift(event) {
    event.preventDefault()
    const selectedGuest = data.guests.find((guest) => guest.id === giftForm.guestId)
    const guestName = selectedGuest?.name || giftForm.guest
    if (!guestName.trim()) return
    if (giftForm.type === 'money' && !String(giftForm.amount).trim()) return
    if (giftForm.type === 'item' && !giftForm.gift.trim()) return
    const values = { ...giftForm, guest: guestName }
    if (editingGiftId) {
      data = { ...data, gifts: data.gifts.map((gift) => gift.id === editingGiftId ? { ...gift, ...values } : gift) }
    } else {
      data = { ...data, gifts: [{ ...createGift(values), thanked: Boolean(values.thanked) }, ...data.gifts] }
    }
    giftForm = { guestId: '', guest: '', type: 'money', amount: '', currency: 'EUR', gift: '', note: '', thanked: false }
    showGiftForm = false
    onNotify(editingGiftId ? 'Gift changes saved.' : 'Gift added.')
    editingGiftId = ''
  }

  function openGiftForm(guest = null) {
    editingGiftId = ''
    giftForm = { guestId: guest?.id ?? '', guest: guest?.name ?? '', type: 'money', amount: '', currency: 'EUR', gift: '', note: '', thanked: false }
    showGiftForm = true
    if (guest) navigate('gifts')
  }

  function openGiftGuestPicker() {
    giftGuestSearch = ''
    giftGuestPickerOpen = true
  }

  function selectGiftGuest(guest) {
    giftForm.guestId = guest.id
    giftForm.guest = guest.name
    giftGuestPickerOpen = false
  }

  function openGiftEditModal(gift) {
    giftForm = { guestId: gift.guestId ?? '', guest: gift.guest ?? '', type: gift.type ?? 'money', amount: gift.amount ?? '', currency: gift.currency ?? 'EUR', gift: gift.gift ?? '', note: gift.note ?? '', thanked: Boolean(gift.thanked) }
    editingGiftId = gift.id
    showGiftForm = true
  }

  function updateGiftGuestName(value) {
    const matchingGuest = data.guests.find((guest) => guest.name.toLowerCase() === value.trim().toLowerCase())
    giftForm.guest = value
    giftForm.guestId = matchingGuest?.id ?? ''
  }

  function songTypeLabel(type) {
    return ({ entrance: 'Entrance', 'first-dance': 'First dance', 'parent-dance': 'Parent dance', 'cake-cutting': 'Cake cutting', party: 'Party', reception: 'Reception', other: 'Other' })[type] ?? 'Other'
  }

  function musicMetadataTitle(metadata) {
    if (!metadata?.title) return ''
    return metadata.artist && !metadata.title.toLowerCase().includes(metadata.artist.toLowerCase()) ? `${metadata.title} — ${metadata.artist}` : metadata.title
  }

  function scheduleMusicMetadataLookup() {
    musicLinkError = ''
    window.clearTimeout(musicMetadataTimer)
    const link = musicForm.link.trim()
    if (!link || musicForm.name.trim() || !parseMusicLink(link)) {
      musicMetadataLoading = false
      return
    }
    musicMetadataTimer = window.setTimeout(async () => {
      const requestedLink = musicForm.link.trim()
      musicMetadataLoading = true
      const metadata = await fetchMusicMetadata(requestedLink)
      if (musicForm.link.trim() === requestedLink && !musicForm.name.trim()) musicForm.name = musicMetadataTitle(metadata)
      if (musicForm.link.trim() === requestedLink) musicMetadataLoading = false
    }, 350)
  }

  async function addSong(event) {
    event.preventDefault()
    const link = musicForm.link.trim()
    const music = link ? parseMusicLink(link) : null
    if (!musicForm.name.trim() && !link) {
      musicLinkError = 'Add a title or a music link.'
      return
    }
    musicSaving = true
    let name = musicForm.name.trim()
    if (!name && music) name = musicMetadataTitle(await fetchMusicMetadata(link))
    name ||= music ? `${music.platformLabel} ${music.kindLabel}` : 'Music link'
    const values = { ...musicForm, name, platform: music?.platform ?? '', contentType: music?.kind ?? '' }
    if (editingSongId) {
      data = { ...data, songs: (data.songs ?? []).map((song) => song.id === editingSongId ? { ...song, ...values } : song) }
    } else {
      data = { ...data, songs: [createSong(values), ...(data.songs ?? [])] }
    }
    musicForm = { name: '', link: '', type: 'other' }
    musicLinkError = ''
    musicMetadataLoading = false
    musicSaving = false
    showMusicForm = false
    onNotify(editingSongId ? 'Music changes saved.' : (music ? `${music.kindLabel} added from ${music.platformLabel}.` : 'Music added to your list.'))
    editingSongId = ''
  }

  function openMusicForm() {
    editingSongId = ''
    musicForm = { name: '', link: '', type: 'other' }
    musicLinkError = ''
    musicMetadataLoading = false
    musicSaving = false
    showMusicForm = true
  }

  function openMusicEditModal(song) {
    musicForm = { name: song.name ?? '', link: song.link ?? '', type: song.type ?? 'other' }
    musicLinkError = ''
    musicMetadataLoading = false
    musicSaving = false
    editingSongId = song.id
    showMusicForm = true
  }

  function removeSong(songId) {
    data = { ...data, songs: (data.songs ?? []).filter((song) => song.id !== songId) }
    selectedSongIds = selectedSongIds.filter((id) => id !== songId)
    onNotify('Song removed.')
  }

  function songLinkHref(link) {
    if (!link) return ''
    return /^https?:\/\//i.test(link) ? link : `https://${link}`
  }

  function musicDetails(link) {
    return parseMusicLink(link)
  }

  function addVendor(event) {
    event.preventDefault()
    if (!vendorForm.name.trim()) return
    const vendor = editingVendorId ? { ...vendorForm, name: vendorForm.name.trim() } : createVendor(vendorForm)
    data = { ...data, vendors: editingVendorId ? (data.vendors ?? []).map((item) => item.id === editingVendorId ? { ...item, ...vendor } : item) : [...(data.vendors ?? []), vendor] }
    vendorForm = { name: '', category: 'Venue', contact: '', email: '', phone: '', website: '', cost: '', deposit: '', status: 'researching', note: '' }
    showVendorForm = false
    onNotify(editingVendorId ? 'Vendor changes saved.' : `${vendor.name} added to vendors.`)
    editingVendorId = ''
  }

  function openVendorForm() {
    vendorForm = { name: '', category: 'Venue', contact: '', email: '', phone: '', website: '', cost: '', deposit: '', status: 'researching', note: '' }
    editingVendorId = ''
    showVendorForm = true
  }

  function openVendorEditModal(vendor) {
    vendorForm = { name: vendor.name ?? '', category: vendor.category ?? 'Venue', contact: vendor.contact ?? '', email: vendor.email ?? '', phone: vendor.phone ?? '', website: vendor.website ?? '', cost: vendor.cost ?? '', deposit: vendor.deposit ?? '', status: vendor.status ?? 'researching', note: vendor.note ?? '' }
    editingVendorId = vendor.id
    showVendorForm = true
  }

  function removeVendor(vendorId) {
    data = { ...data, vendors: (data.vendors ?? []).filter((vendor) => vendor.id !== vendorId) }
    selectedVendorIds = selectedVendorIds.filter((id) => id !== vendorId)
    vendorToDelete = null
    onNotify('Vendor removed.')
  }

  function updateVendor(vendorId, changes) {
    data = { ...data, vendors: (data.vendors ?? []).map((vendor) => vendor.id === vendorId ? { ...vendor, ...changes } : vendor) }
  }

  function vendorWebsiteHref(website) {
    if (!website) return ''
    return /^https?:\/\//i.test(website) ? website : `https://${website}`
  }

  function updateMessage(messageId, changes) {
    data = { ...data, messages: (data.messages ?? []).map((message) => message.id === messageId ? { ...message, ...changes } : message) }
  }

  function messageDirection(message) {
    return message.direction ?? 'received'
  }

  function messageChannelLabel(channel) {
    return ({ website: 'Website', email: 'Email', whatsapp: 'WhatsApp', viber: 'Viber' })[channel] ?? 'Website'
  }

  function toggleMessageRecipient(guestId) {
    messageForm.recipientIds = messageForm.recipientIds.includes(guestId)
      ? messageForm.recipientIds.filter((id) => id !== guestId)
      : [...messageForm.recipientIds, guestId]
    messageFormError = ''
  }

  function openMessageRecipientPicker() {
    messageRecipientSearch = ''
    messageRecipientPickerOpen = true
  }

  function selectAllMessageRecipientResults() {
    const resultIds = messageRecipientResults.map((guest) => guest.id)
    const allSelected = resultIds.length > 0 && resultIds.every((id) => messageForm.recipientIds.includes(id))
    messageForm.recipientIds = allSelected
      ? messageForm.recipientIds.filter((id) => !resultIds.includes(id))
      : [...new Set([...messageForm.recipientIds, ...resultIds])]
  }

  function addManualMessageRecipient() {
    messageForm.manualRecipients = [...messageForm.manualRecipients, {
      id: `manual-recipient-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      name: '',
      email: '',
      phone: '',
    }]
    messageFormError = ''
  }

  function updateManualMessageRecipient(recipientId, changes) {
    messageForm.manualRecipients = messageForm.manualRecipients.map((recipient) => recipient.id === recipientId ? { ...recipient, ...changes } : recipient)
    messageFormError = ''
  }

  function removeManualMessageRecipient(recipientId) {
    messageForm.manualRecipients = messageForm.manualRecipients.filter((recipient) => recipient.id !== recipientId)
    messageFormError = ''
  }

  function openMessageEditModal(message) {
    messageForm = { guestId: message.guestId ?? '', recipientIds: [], manualRecipients: [], name: message.name ?? '', email: message.email ?? '', phone: message.phone ?? '', message: message.message ?? '', read: Boolean(message.read), sentAt: toDateTimeLocal(message.sentAt), direction: messageDirection(message), channel: message.channel ?? 'website' }
    messageFormError = ''
    editingMessageId = message.id
    showMessageForm = true
  }

  function saveMessageEdit(event) {
    event.preventDefault()
    messageFormError = ''
    if (!messageForm.message.trim()) {
      messageFormError = 'Write a message before sending.'
      return
    }
    if (!editingMessageId && messageForm.direction === 'sent') {
      const selectedGuests = data.guests.filter((guest) => messageForm.recipientIds.includes(guest.id))
      const manualRecipients = messageForm.manualRecipients.map((recipient) => ({ ...recipient, manual: true, name: recipient.name.trim(), email: recipient.email.trim(), phone: recipient.phone.trim() }))
      if (manualRecipients.some((recipient) => !recipient.name)) {
        messageFormError = 'Add a name for every manual contact.'
        return
      }
      const recipients = [...selectedGuests, ...manualRecipients]
      if (!recipients.length) {
        messageFormError = 'Select at least one guest or add a contact manually.'
        return
      }
      const needsEmail = messageForm.channel === 'email'
      const missing = recipients.filter((recipient) => needsEmail ? !recipient.email?.trim() : !recipient.phone?.trim())
      if (missing.length) {
        messageFormError = `${missing.map((recipient) => recipient.name).join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing ${needsEmail ? 'an email address' : 'a phone number'}.`
        return
      }
      const sentAt = new Date().toISOString()
      const messages = recipients.map((recipient) => ({
        id: `message-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`,
        guestId: recipient.manual ? '' : recipient.id,
        name: recipient.name,
        email: recipient.email?.trim() ?? '',
        phone: recipient.phone?.trim() ?? '',
        message: messageForm.message.trim(),
        read: true,
        sentAt,
        direction: 'sent',
        channel: messageForm.channel,
      }))
      data = { ...data, messages: [...messages, ...(data.messages ?? [])] }
      showMessageForm = false
      onNotify(`${messages.length} ${messages.length === 1 ? 'message' : 'messages'} recorded as sent via ${messageChannelLabel(messageForm.channel)}. Development preview only.`)
      return
    }
    if (!messageForm.name.trim()) {
      messageFormError = 'Add a recipient name.'
      return
    }
    if (messageForm.direction === 'sent' && messageForm.channel === 'email' && !messageForm.email.trim()) {
      messageFormError = 'Add an email address for this recipient.'
      return
    }
    if (messageForm.direction === 'sent' && ['whatsapp', 'viber'].includes(messageForm.channel) && !messageForm.phone.trim()) {
      messageFormError = `Add a phone number to send via ${messageChannelLabel(messageForm.channel)}.`
      return
    }
    const wasEditing = Boolean(editingMessageId)
    const values = { ...messageForm, name: messageForm.name.trim(), email: messageForm.email.trim(), phone: messageForm.phone.trim(), message: messageForm.message.trim(), sentAt: messageForm.sentAt ? new Date(messageForm.sentAt).toISOString() : new Date().toISOString() }
    if (editingMessageId) {
      updateMessage(editingMessageId, values)
    } else {
      const message = { id: `message-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`, ...values }
      data = { ...data, messages: [message, ...(data.messages ?? [])] }
    }
    showMessageForm = false
    editingMessageId = ''
    onNotify(wasEditing ? 'Message changes saved.' : `Message recorded as sent via ${messageChannelLabel(values.channel)}. Development preview only.`)
  }

  function openMessageForm() {
    messageForm = { guestId: '', recipientIds: [], manualRecipients: [], name: '', email: '', phone: '', message: '', read: true, sentAt: toDateTimeLocal(new Date().toISOString()), direction: 'sent', channel: 'email' }
    messageFormError = ''
    editingMessageId = ''
    showMessageForm = true
  }

  function toDateTimeLocal(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
  }

  function removeMessage(messageId) {
    data = { ...data, messages: (data.messages ?? []).filter((message) => message.id !== messageId) }
    selectedMessageIds = selectedMessageIds.filter((id) => id !== messageId)
    onNotify('Message deleted.')
  }

  function formatMessageDate(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown date'
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  }

  function giftLabel(gift) {
    if (gift.type === 'money') return `${gift.currency === 'EUR' ? '€' : `${gift.currency} `}${gift.amount}`
    return gift.gift
  }

  function csvCell(value) {
    return `"${String(value ?? '').replaceAll('"', '""')}"`
  }

  function downloadCsv(filename, headers, rows) {
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function downloadGuestCsv() {
    downloadCsv('guest-list.csv', ['Name', 'Adults', 'Children', 'Party size', 'Email', 'Phone', 'Note', 'Invited', 'Invitation method', 'RSVP', 'Table'], sortedGuests.map((guest) => [
      guest.name,
      guestAdults(guest),
      guestChildren(guest),
      guest.party,
      guest.email,
      guest.phone,
      guest.meal || guest.note,
      guest.invitedVia ? 'Yes' : 'No',
      guest.invitedVia ? shareMethodLabel(guest.invitedVia) : '',
      guest.status,
      data.tables.find((table) => table.id === guest.tableId)?.name ?? '',
    ]))
  }

  function downloadGiftCsv() {
    downloadCsv('gift-list.csv', ['Guest', 'Gift type', 'Amount or gift', 'Note', 'Thank you'], sortedGifts.map((gift) => [
      gift.guest,
      gift.type === 'money' ? 'Money' : 'Item',
      giftLabel(gift),
      gift.note,
      gift.thanked ? 'Thanked' : 'Pending',
    ]))
  }

  function downloadMessageCsv() {
    downloadCsv('guest-messages.csv', ['Guest', 'Date', 'Direction', 'Channel', 'Email', 'Phone', 'Message', 'Status'], sortedMessages.map((message) => [
      message.name,
      formatMessageDate(message.sentAt),
      messageDirection(message) === 'sent' ? 'Sent' : 'Received',
      messageChannelLabel(message.channel ?? 'website'),
      message.email,
      message.phone,
      message.message,
      messageDirection(message) === 'sent' ? 'Sent' : (message.read ? 'Read' : 'Unread'),
    ]))
  }

  function downloadMusicCsv() {
    downloadCsv('music-list.csv', ['Song', 'Link', 'Type'], sortedSongs.map((song) => [song.name, song.link, songTypeLabel(song.type)]))
  }

  function downloadVendorCsv() {
    downloadCsv('vendors.csv', ['Vendor', 'Category', 'Contact', 'Email', 'Phone', 'Website', 'Estimated cost', 'Deposit', 'Status', 'Notes'], sortedVendors.map((vendor) => [vendor.name, vendor.category, vendor.contact, vendor.email, vendor.phone, vendor.website, vendor.cost, vendor.deposit, vendor.status, vendor.note]))
  }

  function toggleThanked(giftId) {
    data = {
      ...data,
      gifts: data.gifts.map((gift) => (gift.id === giftId ? { ...gift, thanked: !gift.thanked } : gift)),
    }
  }

  function removeGift(giftId) {
    data = { ...data, gifts: data.gifts.filter((gift) => gift.id !== giftId) }
    selectedGiftIds = selectedGiftIds.filter((id) => id !== giftId)
  }

  function updatePhoto(photoId, status) {
    data = {
      ...data,
      photos: data.photos.map((photo) => (photo.id === photoId ? { ...photo, status } : photo)),
    }
  }

  function removePhoto(photoId) {
    data = { ...data, photos: data.photos.filter((photo) => photo.id !== photoId) }
  }

  function uploadPhotos(event) {
    const files = [...event.currentTarget.files].slice(0, 4)
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 1_500_000) continue
      const reader = new FileReader()
      reader.onload = () => {
        const photo = {
          id: `photo-${crypto.randomUUID?.() ?? Date.now()}`,
          title: file.name.replace(/\.[^.]+$/, ''),
          uploader: 'You',
          src: reader.result,
          status: 'approved',
        }
        data = { ...data, photos: [photo, ...data.photos] }
      }
      reader.readAsDataURL(file)
    }
    event.currentTarget.value = ''
    onNotify('Selected photos added.')
  }

  function photoSource(photo) {
    return photo.src || photoAssets[photo.asset] || stillLifePhoto
  }

  async function copySiteLink() {
    await navigator.clipboard?.writeText(data.siteUrl)
    copied = true
    window.setTimeout(() => (copied = false), 1800)
  }

  function initials() {
    return `${account.firstName?.[0] ?? ''}${account.lastName?.[0] ?? ''}`.toUpperCase() || 'OM'
  }

  function avatarTone(value = '') {
    const hash = [...String(value)].reduce((total, character) => total + character.charCodeAt(0), 0)
    return `avatar-tone--${(hash % 6) + 1}`
  }

  function guestAdults(guest) {
    return guest.adults ?? guest.party
  }

  function guestChildren(guest) {
    return guest.children ?? 0
  }

  function partyLabel(guest) {
    const adults = guestAdults(guest)
    const children = guestChildren(guest)
    const adultLabel = `${adults} ${adults === 1 ? 'adult' : 'adults'}`
    if (children === 0) return adultLabel
    return `${adultLabel}, ${children} ${children === 1 ? 'child' : 'children'}`
  }

  function closeForms() {
    showGuestForm = false
    showTableForm = false
    showGiftForm = false
    giftGuestPickerOpen = false
    showMusicForm = false
    showMessageForm = false
    showVendorForm = false
    shareGuestIds = []
    shareResult = null
    messageFormError = ''
    messageRecipientPickerOpen = false
    editingGuestId = ''
    editingGiftId = ''
    editingSongId = ''
    editingMessageId = ''
    editingVendorId = ''
  }

  function formatCalendarDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function notesCalendarData() {
    return data.notesCalendar ?? { events: [], dailyNotes: {}, fixedNotes: '' }
  }

  function updateNotesCalendar(changes) {
    data = { ...data, notesCalendar: { ...notesCalendarData(), ...changes } }
  }

  function changeCalendarMonth(offset) {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + offset, 1)
  }

  function goToToday() {
    const today = new Date()
    calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1)
    selectedDayKey = formatCalendarDate(today)
  }

  function escapeCalendarText(value = '') {
    return String(value)
      .replaceAll('\\', '\\\\')
      .replaceAll(';', '\\;')
      .replaceAll(',', '\\,')
      .replaceAll(/\r?\n/g, '\\n')
  }

  function compactCalendarDate(value) {
    return String(value).replaceAll('-', '')
  }

  function nextCalendarDate(value) {
    const [year, month, day] = value.split('-').map(Number)
    return formatCalendarDate(new Date(year, month - 1, day + 1))
  }

  function exportCalendar() {
    const notes = notesCalendarData()
    const events = notes.events ?? []
    if (!events.length) {
      onNotify('Add at least one calendar event before exporting.')
      return
    }

    const stamp = new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/, 'Z')
    const eventBlocks = events.map((calendarEvent) => {
      const date = compactCalendarDate(calendarEvent.date)
      const description = notes.dailyNotes?.[calendarEvent.date]?.trim()
      const timing = calendarEvent.time
        ? `DTSTART:${date}T${calendarEvent.time.replace(':', '')}00\r\nDURATION:PT1H`
        : `DTSTART;VALUE=DATE:${date}\r\nDTEND;VALUE=DATE:${compactCalendarDate(nextCalendarDate(calendarEvent.date))}`
      return [
        'BEGIN:VEVENT',
        `UID:${escapeCalendarText(calendarEvent.id)}@ourmoments.io`,
        `DTSTAMP:${stamp}`,
        timing,
        `SUMMARY:${escapeCalendarText(calendarEvent.title)}`,
        description ? `DESCRIPTION:${escapeCalendarText(description)}` : '',
        'END:VEVENT',
      ].filter(Boolean).join('\r\n')
    })
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'PRODID:-//ourmoments.io//Planning Calendar//EN',
      `X-WR-CALNAME:${escapeCalendarText(`${data.eventName} planning`)}`,
      ...eventBlocks,
      'END:VCALENDAR',
      '',
    ].join('\r\n')
    const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ourmoments'}-calendar.ics`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    onNotify(`Exported ${events.length} calendar ${events.length === 1 ? 'event' : 'events'}.`)
  }

  function toggleNotesSection(section) {
    notesSectionsCollapsed = { ...notesSectionsCollapsed, [section]: !notesSectionsCollapsed[section] }
  }

  function toggleCalendarAndDaySections() {
    const collapsed = !notesSectionsCollapsed.calendar
    notesSectionsCollapsed = { ...notesSectionsCollapsed, calendar: collapsed, day: collapsed }
  }

  function addCalendarEvent(event) {
    event.preventDefault()
    const title = calendarEventForm.title.trim()
    if (!title) return
    const notes = notesCalendarData()
    const calendarEvent = {
      id: `calendar-event-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      date: selectedDayKey,
      title,
      time: calendarEventForm.time,
    }
    updateNotesCalendar({ events: [...(notes.events ?? []), calendarEvent] })
    calendarEventForm = { title: '', time: '' }
    calendarEventFormOpen = false
  }

  function removeCalendarEvent(eventId) {
    const notes = notesCalendarData()
    updateNotesCalendar({ events: (notes.events ?? []).filter((event) => event.id !== eventId) })
  }

  function updateSelectedDayNotes(value) {
    const notes = notesCalendarData()
    updateNotesCalendar({ dailyNotes: { ...(notes.dailyNotes ?? {}), [selectedDayKey]: value } })
  }

  function updateFixedNotes(value) {
    updateNotesCalendar({ fixedNotes: value })
  }

  function escapeNoteText(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
      .replaceAll('\n', '<br>')
  }

  function generalNotesData() {
    const notes = notesCalendarData()
    if (Array.isArray(notes.generalNotes)) {
      return notes.generalNotes.map((note) => {
        if (!note.checkpoints?.length) return note
        const checklist = note.checkpoints.map((checkpoint) => `<div data-checkpoint="true"><input type="checkbox"${checkpoint.checked ? ' checked' : ''}><span data-checkpoint-text="true">${escapeNoteText(checkpoint.text)}</span></div>`).join('')
        return { ...note, content: `${note.content || ''}${checklist}`, checkpoints: [] }
      })
    }
    if (!notes.fixedNotes?.trim()) return []
    return [{ id: 'legacy-general-note', title: 'General note', color: 'yellow', content: escapeNoteText(notes.fixedNotes), checkpoints: [] }]
  }

  function updateGeneralNotes(generalNotes) {
    updateNotesCalendar({ generalNotes, fixedNotes: '' })
  }

  async function addGeneralNote() {
    const note = {
      id: `general-note-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      title: '',
      color: 'yellow',
      content: '',
    }
    updateGeneralNotes([...generalNotesData(), note])
    notesSectionsCollapsed = { ...notesSectionsCollapsed, fixed: false }
    activeGeneralNoteId = note.id
    await tick()
    document.getElementById(`general-note-title-${note.id}`)?.focus()
  }

  function updateGeneralNote(noteId, changes) {
    updateGeneralNotes(generalNotesData().map((note) => note.id === noteId ? { ...note, ...changes } : note))
  }

  function removeGeneralNote(noteId) {
    updateGeneralNotes(generalNotesData().filter((note) => note.id !== noteId))
    if (activeGeneralNoteId === noteId) activeGeneralNoteId = ''
  }

  function startGeneralNoteDrag(event, noteId) {
    draggedGeneralNoteId = noteId
    dragOverGeneralNoteId = ''
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', noteId)
    const card = event.currentTarget.closest('.general-note-card')
    if (card) {
      const bounds = card.getBoundingClientRect()
      event.dataTransfer.setDragImage(card, Math.max(0, bounds.width - 14), bounds.height / 2)
    }
  }

  function dropGeneralNote(event, targetId) {
    event.preventDefault()
    const sourceId = draggedGeneralNoteId || event.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) {
      draggedGeneralNoteId = ''
      dragOverGeneralNoteId = ''
      return
    }
    const notes = generalNotesData()
    const source = notes.find((note) => note.id === sourceId)
    const target = notes.find((note) => note.id === targetId)
    if (!source || !target) return
    const reordered = notes.filter((note) => note.id !== sourceId)
    const targetIndex = reordered.findIndex((note) => note.id === targetId)
    const sourceIndex = notes.findIndex((note) => note.id === sourceId)
    const originalTargetIndex = notes.findIndex((note) => note.id === targetId)
    const movingForward = sourceIndex < originalTargetIndex
    // The whole target card is an active drop zone. Its side is inferred from
    // the drag direction, so no centre threshold needs to be crossed.
    const insertAfter = movingForward
    reordered.splice(targetIndex + (insertAfter ? 1 : 0), 0, source)
    updateGeneralNotes(reordered)
    draggedGeneralNoteId = ''
    dragOverGeneralNoteId = ''
  }

  function finishGeneralNoteDrag() {
    draggedGeneralNoteId = ''
    dragOverGeneralNoteId = ''
  }

  function sanitizeNoteHtml(value) {
    const template = document.createElement('template')
    template.innerHTML = value || ''
    const allowed = new Set(['B', 'BR', 'DIV', 'EM', 'FONT', 'I', 'INPUT', 'P', 'SPAN', 'STRONG', 'U'])
    for (const element of [...template.content.querySelectorAll('*')]) {
      if (!allowed.has(element.tagName)) {
        element.replaceWith(...element.childNodes)
        continue
      }
      if (element.tagName === 'INPUT' && element.getAttribute('type') !== 'checkbox') {
        element.remove()
        continue
      }
      const color = element.tagName === 'FONT' ? element.getAttribute('color') : null
      const size = element.tagName === 'FONT' ? element.getAttribute('size') : null
      const isCheckpoint = element.tagName === 'DIV' && element.hasAttribute('data-checkpoint')
      const isCheckpointText = element.tagName === 'SPAN' && (element.hasAttribute('data-checkpoint-text') || element.parentElement?.hasAttribute('data-checkpoint'))
      const isChecked = element.tagName === 'INPUT' && element.hasAttribute('checked')
      for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name)
      if (color && /^(#[0-9a-f]{3,8}|rgb\([0-9 ,.]+\))$/i.test(color)) element.setAttribute('color', color)
      if (size && /^[1-7]$/.test(size)) element.setAttribute('size', size)
      if (isCheckpoint) element.setAttribute('data-checkpoint', 'true')
      if (isCheckpointText) element.setAttribute('data-checkpoint-text', 'true')
      if (element.tagName === 'INPUT') {
        element.setAttribute('type', 'checkbox')
        if (isChecked) element.setAttribute('checked', '')
      }
    }
    for (const checkpoint of template.content.querySelectorAll('[data-checkpoint="true"]')) {
      if (checkpoint.querySelector(':scope > [data-checkpoint-text="true"]')) continue
      const text = document.createElement('span')
      text.setAttribute('data-checkpoint-text', 'true')
      for (const child of [...checkpoint.childNodes]) {
        if (!(child.nodeType === Node.ELEMENT_NODE && child.matches('input[type="checkbox"]'))) text.append(child)
      }
      if (!text.hasChildNodes()) text.append(document.createTextNode('\u200b'))
      checkpoint.append(text)
    }
    return template.innerHTML
  }

  function richTextEditor(node, content) {
    node.innerHTML = sanitizeNoteHtml(content)
    return {
      update(nextContent) {
        if (document.activeElement !== node) {
          const safeContent = sanitizeNoteHtml(nextContent)
          if (node.innerHTML !== safeContent) node.innerHTML = safeContent
        }
      },
    }
  }

  function updateGeneralNoteContent(noteId, editor) {
    updateGeneralNote(noteId, { content: sanitizeNoteHtml(editor.innerHTML) })
  }

  function applyGeneralNoteFormat(noteId, command, value = null) {
    const editor = document.getElementById(`general-note-editor-${noteId}`)
    if (!editor) return
    editor.focus()
    document.execCommand('styleWithCSS', false, false)
    document.execCommand(command, false, value)
    updateGeneralNoteContent(noteId, editor)
    refreshGeneralNoteFormatting(noteId)
  }

  function refreshGeneralNoteFormatting(noteId) {
    const editor = document.getElementById(`general-note-editor-${noteId}`)
    const selection = window.getSelection()
    if (!editor || !selection.rangeCount || !editor.contains(selection.anchorNode)) return
    noteFormattingState = {
      ...noteFormattingState,
      [noteId]: {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        fontSize: String(document.queryCommandValue('fontSize') || '3'),
        color: String(document.queryCommandValue('foreColor') || '').replaceAll(' ', '').toLowerCase(),
      },
    }
  }

  function noteFormatActive(noteId, format, value = true) {
    const state = noteFormattingState[noteId] ?? {}
    return state[format] === value
  }

  function noteColorActive(noteId, hex, rgb) {
    const color = noteFormattingState[noteId]?.color ?? ''
    return color === hex || color === rgb.replaceAll(' ', '').toLowerCase()
  }

  function insertGeneralNoteCheckpoint(noteId) {
    const editor = document.getElementById(`general-note-editor-${noteId}`)
    if (!editor) return
    const checkpointId = `inline-checkpoint-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`
    editor.focus()
    document.execCommand('insertHTML', false, `<div data-checkpoint="true" data-new-checkpoint="${checkpointId}"><input type="checkbox"><span data-checkpoint-text="true">​</span></div>`)
    const checkpoint = editor.querySelector(`[data-new-checkpoint="${checkpointId}"]`)
    if (checkpoint) {
      checkpoint.removeAttribute('data-new-checkpoint')
      const text = checkpoint.querySelector('span')
      placeCaretAtChecklistStart(text)
    }
    updateGeneralNoteContent(noteId, editor)
  }

  function handleGeneralNoteCheckboxClick(noteId, event) {
    if (event.target.matches?.('input[type="checkbox"]')) {
      event.target.toggleAttribute('checked', event.target.checked)
      updateGeneralNoteContent(noteId, event.currentTarget)
    }
  }

  function placeCaretInNote(node, atStart = false) {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(node)
    range.collapse(atStart)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  function noteCaretIsAtStart(container, selection) {
    if (!selection.rangeCount || !selection.isCollapsed) return false
    const beforeCaret = document.createRange()
    beforeCaret.selectNodeContents(container)
    try {
      beforeCaret.setEnd(selection.anchorNode, selection.anchorOffset)
    } catch {
      return false
    }
    return beforeCaret.toString().replace(/[\s\u200b]/g, '').length === 0
  }

  function placeCaretAtChecklistStart(text) {
    let firstNode = text.firstChild
    if (firstNode?.nodeType !== Node.TEXT_NODE || !firstNode.data.startsWith('\u200b')) {
      firstNode = document.createTextNode('\u200b')
      text.prepend(firstNode)
    }
    const selection = window.getSelection()
    const range = document.createRange()
    range.setStart(firstNode, 1)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  function checkpointFromCaret(editor, selection) {
    const anchorNode = selection.anchorNode
    if (!anchorNode) return null
    const anchorElement = anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement
    const ancestorCheckpoint = anchorElement?.closest?.('[data-checkpoint="true"]')
    if (ancestorCheckpoint && editor.contains(ancestorCheckpoint)) return ancestorCheckpoint
    if (anchorNode.nodeType !== Node.ELEMENT_NODE) return null

    const checkpointInside = (node, fromEnd) => {
      let current = node
      while (current?.childNodes?.length) current = current.childNodes[fromEnd ? current.childNodes.length - 1 : 0]
      const element = current?.nodeType === Node.ELEMENT_NODE ? current : current?.parentElement
      const checkpoint = element?.closest?.('[data-checkpoint="true"]')
      return checkpoint && editor.contains(checkpoint) ? checkpoint : null
    }

    return checkpointInside(anchorNode.childNodes[selection.anchorOffset - 1], true)
      ?? checkpointInside(anchorNode.childNodes[selection.anchorOffset], false)
  }

  function outerChecklistWrapper(checkpoint, editor) {
    let wrapper = checkpoint
    while (wrapper.parentElement !== editor && wrapper.parentElement?.childNodes.length === 1) wrapper = wrapper.parentElement
    return wrapper
  }

  function handleGeneralNoteChecklistInput(noteId, event) {
    const isEnter = event.key === 'Enter' || event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak'
    const isBackspace = event.key === 'Backspace' || event.inputType === 'deleteContentBackward'
    if (!isEnter && !isBackspace) return
    const editor = event.currentTarget
    const selection = window.getSelection()
    const checkpoint = event.target.closest?.('[data-checkpoint="true"]') ?? checkpointFromCaret(editor, selection)
    if (!checkpoint || !editor.contains(checkpoint)) return
    const text = checkpoint.querySelector('span')
    if (!text) return

    if (isBackspace) {
      if (!noteCaretIsAtStart(text, selection)) return
      event.preventDefault()
      const removableRow = outerChecklistWrapper(checkpoint, editor)
      const normalLine = document.createElement('div')
      while (text.firstChild) normalLine.append(text.firstChild)
      if (normalLine.firstChild?.nodeType === Node.TEXT_NODE) normalLine.firstChild.data = normalLine.firstChild.data.replace(/^\u200b/, '')
      if (!normalLine.textContent && !normalLine.querySelector('br')) normalLine.append(document.createElement('br'))
      removableRow.replaceWith(normalLine)
      placeCaretInNote(normalLine, true)
      updateGeneralNoteContent(noteId, editor)
      return
    }

    event.preventDefault()
    if (!selection.rangeCount) return
    const activeRange = selection.getRangeAt(0)
    if (!activeRange.collapsed) activeRange.deleteContents()
    const trailingContent = document.createDocumentFragment()
    if (text === activeRange.startContainer || text.contains(activeRange.startContainer)) {
      const trailingRange = document.createRange()
      trailingRange.setStart(activeRange.startContainer, activeRange.startOffset)
      trailingRange.setEnd(text, text.childNodes.length)
      trailingContent.append(trailingRange.extractContents())
    }
    if (!text.textContent.replace(/\u200b/g, '') && !text.querySelector('br')) text.replaceChildren(document.createTextNode('\u200b'))

    const nextCheckpoint = document.createElement('div')
    nextCheckpoint.setAttribute('data-checkpoint', 'true')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    const nextText = document.createElement('span')
    nextText.setAttribute('data-checkpoint-text', 'true')
    nextText.append(document.createTextNode('\u200b'))
    if (trailingContent.hasChildNodes()) nextText.append(trailingContent)
    nextCheckpoint.append(checkbox, nextText)
    outerChecklistWrapper(checkpoint, editor).after(nextCheckpoint)
    placeCaretAtChecklistStart(nextText)
    updateGeneralNoteContent(noteId, editor)
  }

  function pastePlainNoteText(event) {
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '')
  }
</script>

<svelte:window
  onclick={closeGuestMenuFromOutside}
  onkeydown={(event) => {
    if (event.key === 'Escape') {
      openRowMenuKey = ''
      closeForms()
    }
    handleFloorShapeDeleteKey(event)
  }}
  onpointerdown={beginFloorGesture}
  onpointermove={moveFloorGesture}
  onpointerup={finishFloorGesture}
  onpointercancel={finishFloorGesture}
  ondblclick={handleFloorShapeDoubleClick}
/>

<svelte:head>
  <title>{data.eventName} dashboard — ourmoments.io</title>
</svelte:head>

<div class="dashboard-page">
  <aside class:open={mobileNavOpen} class="dashboard-sidebar">
    <div class="dashboard-brand-row">
      <button class="dashboard-brand" type="button" onclick={onHome} aria-label="Go to ourmoments.io home">
        <LogoMark />
        <span>ourmoments<span>.io</span></span>
      </button>
      <button class="dashboard-nav-close" type="button" onclick={() => (mobileNavOpen = false)} aria-label="Close navigation">×</button>
    </div>

    <div class="dashboard-event-switcher">
      <span>Current event</span>
      <button type="button">
        <i>{data.eventName.slice(0, 1)}</i>
        <span><strong>{data.eventName}</strong><small>{template.name}</small></span>
        <b aria-hidden="true">⌄</b>
      </button>
    </div>

    <nav class="dashboard-nav" aria-label="Dashboard navigation">
      {#each navGroups as group}
        <div class="dashboard-nav-group" role="group" aria-label={group.label}>
          {#each group.items as item}
            <button class:active={active === item.id} type="button" onclick={() => navigate(item.id)}>
              <i aria-hidden="true">{item.glyph}</i>
              <span>{item.label}</span>
              {#if item.id === 'guests' && summary.pending > 0}<b>{summary.pending}</b>{/if}
            </button>
          {/each}
        </div>
      {/each}
    </nav>

    <div class="dashboard-sidebar__footer">
      <div class="dashboard-account">
        <i>{initials()}</i>
        <span><strong>{account.firstName} {account.lastName}</strong><small>{account.email}</small></span>
      </div>
    </div>
  </aside>

  {#if mobileNavOpen}<button class="dashboard-nav-scrim" type="button" onclick={() => (mobileNavOpen = false)} aria-label="Close navigation"></button>{/if}

  <main class="dashboard-main">
    <header class="dashboard-topbar">
      <button class="dashboard-menu" type="button" onclick={() => (mobileNavOpen = true)} aria-label="Open navigation">☰</button>
      <div class="dashboard-topbar__event">
        <span>{data.published ? 'Website live' : 'Draft'}</span>
        <i></i>
        <p>{site.date ? formatEventDate(site.date) : 'Date to be confirmed'}</p>
      </div>
      <div class="dashboard-topbar__actions">
        <a href={data.siteUrl} target="_blank" rel="noreferrer">View website <span aria-hidden="true">↗</span></a>
        <button type="button" onclick={goToWebsiteEditor}>Edit website</button>
      </div>
    </header>

    <div class="dashboard-content">
      {#if active === 'overview'}
        <section class="dashboard-view dashboard-overview" aria-labelledby="dashboard-heading">
          <header class="dashboard-page-heading dashboard-page-heading--overview">
            <div>
              <p class="dashboard-eyebrow">Welcome back, {account.firstName}🤍</p>
              <h1 id="dashboard-heading">Your celebration,<br /><em>beautifully organised.</em></h1>
            </div>
            {#if eventCountdown}
              <aside class:complete={eventCountdown.complete} class="dashboard-countdown" aria-label={`${eventCountdown.label}: ${eventCountdown.values.map((item) => `${item.value} ${item.label}`).join(', ')}`}>
                <p>{eventCountdown.label}</p>
                <div>
                  {#each eventCountdown.values as item, index}
                    <span><strong>{index === 0 ? item.value : String(item.value).padStart(2, '0')}</strong><small>{item.label}</small></span>
                  {/each}
                </div>
              </aside>
            {/if}
          </header>

          <div class="dashboard-metrics">
            <article><span>Guests</span><strong>{summary.total}</strong><p>{data.guests.length} invitations</p><i>◎</i></article>
            <article><span>Attending</span><strong>{summary.attending}</strong><p>{Math.round((summary.attending / Math.max(1, summary.total)) * 100)}% confirmed</p><i>✓</i></article>
            <article><span>Awaiting reply</span><strong>{summary.pending}</strong><p>Send a gentle reminder</p><i>◷</i></article>
            <article><span>Seats assigned</span><strong>{data.guests.filter((guest) => guest.tableId).reduce((total, guest) => total + guest.party, 0)}</strong><p>Across {data.tables.length} tables</p><i>⊞</i></article>
          </div>

          <div class="dashboard-overview-grid">
            <section class="dashboard-panel dashboard-next-step">
              <div class="dashboard-panel-heading"><div><span>Next up</span><h2>Finish your guest plan</h2></div><b>{Math.round((data.guests.filter((guest) => guest.tableId).length / Math.max(1, data.guests.length)) * 100)}%</b></div>
              <div class="dashboard-progress"><i style={`width:${Math.round((data.guests.filter((guest) => guest.tableId).length / Math.max(1, data.guests.length)) * 100)}%`}></i></div>
              <p>{unassignedGuests.length} attending {unassignedGuests.length === 1 ? 'guest still needs' : 'guests still need'} a seat.</p>
              <button type="button" onclick={() => navigate('seating')}>Arrange seating <span>→</span></button>
            </section>

            <section class="dashboard-panel dashboard-activity">
              <div class="dashboard-panel-heading"><div><span>Live updates</span><h2>Recent activity</h2></div><button type="button" onclick={() => navigate('guests')}>View all</button></div>
              <ol>
                {#each data.activity as item}
                  <li><i class:positive={item.tone === 'positive'}></i><p><strong>{item.text}</strong><span>{item.time}</span></p></li>
                {/each}
              </ol>
            </section>

            <section class="dashboard-panel dashboard-quick-actions">
              <div class="dashboard-panel-heading"><div><span>Shortcuts</span><h2>Keep things moving</h2></div></div>
              <div>
                <button type="button" onclick={() => { navigate('guests'); openGuestRow() }}><i>+</i><span><strong>Add a guest</strong><small>Grow your guest list</small></span><b>→</b></button>
                <button type="button" onclick={() => navigate('photos')}><i>▧</i><span><strong>Review photos</strong><small>{data.photos.filter((photo) => photo.status === 'pending').length} waiting</small></span><b>→</b></button>
                <button type="button" onclick={() => navigate('qr')}><i>⌗</i><span><strong>Get QR code</strong><small>Print or share it</small></span><b>→</b></button>
              </div>
            </section>

            <section class="dashboard-panel dashboard-site-card">
              <span class="dashboard-site-card__status"><i></i> Live</span>
              <p>{template.name}</p>
              <h2>{data.eventName}</h2>
              <small>{data.siteUrl.replace('https://', '')}</small>
              <div><button type="button" onclick={goToWebsiteEditor}>Edit website</button><a href={data.siteUrl} target="_blank" rel="noreferrer" aria-label="Open website">↗</a></div>
            </section>
          </div>
        </section>

      {:else if active === 'guests'}
        <section class="dashboard-view" aria-labelledby="guests-heading">
          <header class="dashboard-page-heading">
            <div><h1 id="guests-heading">Guest list</h1><p>Keep every invitation, reply and dietary note together.</p></div>
            <button class="dashboard-primary" type="button" onclick={openGuestRow}>+ Add guest</button>
          </header>

          <div class="table-topbar">
            <div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={guestSearch} placeholder="Search guests" aria-label="Search guests or email" /><span>{filteredGuests.length}</span></label>{#if visibleSelectedGuestIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedGuestIds.length} selected</span><label class="bulk-rsvp-control"><select aria-label="Change RSVP for selected guests" onchange={(event) => updateSelectedGuestStatus(event.currentTarget.value)}><option value="" selected disabled>RSVP</option><option value="attending">Attending</option><option value="pending">Pending</option><option value="declined">Declined</option></select></label><button type="button" class="bulk-share-button" onclick={() => openGuestShareModal(visibleSelectedGuestIds)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.1M8.7 13.3l6.6 4.1" /></svg>Invite</button><button type="button" class="bulk-delete-button" aria-label="Delete selected guests" title="Delete selected" onclick={() => requestBulkDelete('guests')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div>
            <div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Filter guests by RSVP"><button class:active={rsvpFilter === 'all'} type="button" onclick={() => (rsvpFilter = 'all')}>All <strong>{summary.total}</strong></button><button class:active={rsvpFilter === 'attending'} type="button" onclick={() => (rsvpFilter = 'attending')}>Attending <strong>{summary.attending}</strong></button><button class:active={rsvpFilter === 'pending'} type="button" onclick={() => (rsvpFilter = 'pending')}>Pending <strong>{summary.pending}</strong></button><button class:active={rsvpFilter === 'declined'} type="button" onclick={() => (rsvpFilter = 'declined')}>Declined <strong>{summary.declined}</strong></button></div><button class="table-download-button" type="button" onclick={downloadGuestCsv} aria-label="Download guest list CSV" title="Download to CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div>
          </div>

          <div class="dashboard-table-wrap" role="region" aria-label="Guest list table">
            <table class="dashboard-data-table dashboard-guest-table">
              <thead><tr>
                <th aria-sort={guestSort.key === 'name' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><div class="bulk-header-cell"><input class="bulk-select-checkbox" use:setIndeterminate={someVisibleGuestsSelected} type="checkbox" checked={allVisibleGuestsSelected} onchange={(event) => selectVisibleGuests(event.currentTarget.checked)} aria-label="Select all visible guests" /><button class="guest-sort-button" class:sorted={guestSort.key === 'name'} type="button" onclick={() => sortGuests('name')}>Name <span aria-hidden="true">{sortArrow(guestSort, 'name')}</span></button></div></th>
                <th aria-sort={guestSort.key === 'party' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'party'} type="button" onclick={() => sortGuests('party')}>Guests <span aria-hidden="true">{sortArrow(guestSort, 'party')}</span></button></th>
                <th aria-sort={guestSort.key === 'email' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'email'} type="button" onclick={() => sortGuests('email')}>Contact details <span aria-hidden="true">{sortArrow(guestSort, 'email')}</span></button></th>
                <th aria-sort={guestSort.key === 'meal' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'meal'} type="button" onclick={() => sortGuests('meal')}>Note <span aria-hidden="true">{sortArrow(guestSort, 'meal')}</span></button></th>
                <th aria-sort={guestSort.key === 'invitedVia' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'invitedVia'} type="button" onclick={() => sortGuests('invitedVia')}>Invitation <span aria-hidden="true">{sortArrow(guestSort, 'invitedVia')}</span></button></th>
                <th aria-sort={guestSort.key === 'status' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'status'} type="button" onclick={() => sortGuests('status')}>RSVP <span aria-hidden="true">{sortArrow(guestSort, 'status')}</span></button></th>
                <th class="guest-action-heading"><span class="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {#each sortedGuests as guest, index}
                  <tr>
                    <td><input class="bulk-select-checkbox" type="checkbox" checked={selectedGuestIds.includes(guest.id)} onchange={() => toggleGuestSelection(guest.id)} aria-label={`Select ${guest.name}`} /><i class={avatarTone(guest.id || guest.name)}>{guest.name.slice(0, 1)}</i><span><strong>{guest.name}</strong></span></td>
                    <td><span>{partyLabel(guest)}</span></td>
                    <td><span class="guest-contact-copy"><span>{guest.email || 'No email'}</span><small>{guest.phone || 'No phone'}</small></span></td>
                    <td><span class="guest-note-text">{guest.meal || 'Not provided'}</span></td>
                    <td><span class:invited={guest.invitedVia} class="invitation-status"><strong>{guest.invitedVia ? 'Invited' : 'Not invited'}</strong>{#if guest.invitedVia}<small>via {shareMethodLabel(guest.invitedVia)}</small>{/if}</span></td>
                    <td><span class={`status-select status-select--${guest.status}`}>{guest.status === 'attending' ? 'Attending' : guest.status === 'declined' ? 'Declined' : 'Pending'}</span></td>
                    <td class="guest-row-action-cell">
                      <div class="guest-action-menu">
                        <button class="guest-menu-trigger" type="button" onclick={() => toggleRowMenu('guest', guest.id)} aria-label={`Actions for ${guest.name}`} aria-haspopup="menu" aria-expanded={openRowMenuKey === `guest:${guest.id}`}>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
                        </button>
                        {#if openRowMenuKey === `guest:${guest.id}`}
                          <div class:opens-up={index >= sortedGuests.length - 2} class="guest-menu-popover" role="menu">
                            <button type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; openGuestEditModal(guest) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>Edit</button>
                            <button type="button" role="menuitem" onclick={() => openGuestShareModal([guest.id])}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.1M8.7 13.3l6.6 4.1" /></svg>Invite</button>
                            <button class="danger" type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; guestToDelete = guest }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>Delete</button>
                          </div>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'seating'}
        <section class="dashboard-view" aria-labelledby="seating-heading">
          <header class="dashboard-page-heading">
            <div><h1 id="seating-heading">Table seating</h1><p>Drag guests between tables, then adjust table sizes as your plan changes.</p></div>
            <button class="dashboard-primary" type="button" onclick={() => (showTableForm = true)}>+ Add table</button>
          </header>

          <div class="seating-summary"><span><strong>{data.tables.length}</strong> tables</span><span><strong>{summary.attending}</strong> attending</span><span><strong>{unassignedGuests.reduce((total, guest) => total + guest.party, 0)}</strong> seats unassigned</span></div>

          <div class="seating-controls">
            <div class="table-shape-setting">
              <div class="table-shape-options" role="group" aria-label="Table shape" data-tooltip="Table shape">
                <button class:active={floorTableShape === 'round'} type="button" aria-label="Round tables" title="Round" aria-pressed={floorTableShape === 'round'} onclick={() => setFloorTableShape('round')}><i class="shape-swatch shape-swatch--round" aria-hidden="true"></i></button>
                <button class:active={floorTableShape === 'rectangle'} type="button" aria-label="Rectangle tables" title="Rectangle" aria-pressed={floorTableShape === 'rectangle'} onclick={() => setFloorTableShape('rectangle')}><i class="shape-swatch shape-swatch--rectangle" aria-hidden="true"></i></button>
              </div>
            </div>
            {#if seatingView === 'floor'}
              <div class="floor-plan-toolbar" role="group" aria-label="Floor plan tools">
                <button class="floor-plan-tool" class:active={floorTool === 'select'} type="button" aria-label="Select and move" data-tooltip="Select and move" aria-pressed={floorTool === 'select'} onclick={() => (floorTool = 'select')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3v17l5-5 3 6 3-1-3-6h7L5 3z" /></svg></button>
                <button class="floor-plan-tool" class:active={floorTool === 'rect'} type="button" aria-label="Rectangle" data-tooltip="Rectangle" aria-pressed={floorTool === 'rect'} onclick={() => (floorTool = 'rect')}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="1" /></svg></button>
                <button class="floor-plan-tool" class:active={floorTool === 'circle'} type="button" aria-label="Circle" data-tooltip="Circle" aria-pressed={floorTool === 'circle'} onclick={() => (floorTool = 'circle')}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg></button>
                <button class="floor-plan-tool" class:active={floorTool === 'line'} type="button" aria-label="Line" data-tooltip="Line" aria-pressed={floorTool === 'line'} onclick={() => (floorTool = 'line')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 19 14-14" /></svg></button>
                <button class="floor-plan-tool floor-plan-text-tool" class:active={floorTool === 'text'} type="button" aria-label="Text" data-tooltip="Text" aria-pressed={floorTool === 'text'} onclick={() => (floorTool = 'text')}><span aria-hidden="true">T</span></button>
                {#if selectedFloorShape && floorTool === 'select'}
                  <button class="floor-plan-tool floor-plan-delete" type="button" aria-label="Delete shape" data-tooltip="Delete shape" onclick={deleteSelectedFloorShape}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" /></svg></button>
                {/if}
                <button class="floor-plan-tool floor-plan-undo" type="button" onclick={undoFloorShape} disabled={!data.floorPlan?.shapes?.length} aria-label="Undo last shape" data-tooltip="Undo last shape"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg></button>
              </div>
            {:else}
              <span class="seating-tools-placeholder" aria-hidden="true"></span>
            {/if}
            <div class="seating-view-switch" role="group" aria-label="Seating view"><button class:active={seatingView === 'tables'} type="button" aria-pressed={seatingView === 'tables'} onclick={() => (seatingView = 'tables')}>Tables</button><button class:active={seatingView === 'floor'} type="button" aria-pressed={seatingView === 'floor'} onclick={() => (seatingView = 'floor')}>Floor plan</button></div>
          </div>

          {#if seatingView === 'tables' && unassignedGuests.length > 0}
            <section class="unassigned-pool" role="group" aria-label="Unassigned guests" ondragover={(event) => event.preventDefault()} ondrop={() => dropGuest('')}>
              <div><span>Unassigned guests</span><small>Drag each guest to a table</small></div>
              <div>{#each unassignedGuests as guest}<button draggable="true" ondragstart={() => (draggedGuestId = guest.id)} type="button"><i class={avatarTone(guest.id || guest.name)}>{guest.name.slice(0, 1)}</i>{guest.name}<b>{guest.party}</b></button>{/each}</div>
            </section>
          {/if}

          {#if seatingView === 'floor'}
            <div class="floor-plan-layout">
              <div class="floor-canvas-wrap" style={floorCanvasStyle()}>
                <div class:draw-mode={floorTool !== 'select'} class="floor-canvas" style={floorCanvasStyle()} aria-label="Floor plan canvas">
                  <svg class="floor-canvas__shapes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {#each [...(data.floorPlan?.shapes ?? []), ...(floorDraft ? [floorDraft] : [])] as shape (shape.id ?? 'preview')}
                      {@const geometry = floorShapeGeometry(shape)}
                      <g data-floor-shape={shape.id}>
                        {#if shape.type === 'rect'}
                          <rect class:preview={!shape.id} class:selected={shape.id === selectedFloorShapeId} x={geometry.x} y={geometry.y} width={Math.max(geometry.width, 0.3)} height={Math.max(geometry.height, 0.3)} />
                        {:else if shape.type === 'circle'}
                          <ellipse class:preview={!shape.id} class:selected={shape.id === selectedFloorShapeId} cx={geometry.cx} cy={geometry.cy} rx={Math.max(geometry.rx, 0.15)} ry={Math.max(geometry.ry, 0.15)} />
                        {:else if shape.type === 'line'}
                          <line class:preview={!shape.id} class:selected={shape.id === selectedFloorShapeId} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} />
                          <line class="floor-shape-hit-area" x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} />
                        {/if}
                      </g>
                    {/each}
                  </svg>
                  {#each (data.floorPlan?.shapes ?? []).filter((shape) => shape.type !== 'text' && (shape.label || editingFloorTextId === shape.id)) as shape (shape.id)}
                    {@const labelX = (shape.x1 + shape.x2) / 2}
                    {@const labelY = (shape.y1 + shape.y2) / 2}
                    {#if editingFloorTextId === shape.id}
                      <input class="floor-canvas-text floor-canvas-text-input floor-shape-label selected" style={`--text-x:${labelX}%;--text-y:${labelY}%`} value={shape.label ?? ''} data-floor-text-input={shape.id} aria-label="Edit shape label" oninput={(event) => updateFloorText(shape.id, event.currentTarget.value)} onkeydown={handleFloorTextKeydown} onblur={() => (editingFloorTextId = '')} />
                    {:else}
                      <button class:selected={shape.id === selectedFloorShapeId} class="floor-canvas-text floor-shape-label" style={`--text-x:${labelX}%;--text-y:${labelY}%`} type="button" data-floor-shape={shape.id} aria-label={`Shape label: ${shape.label}`} ondblclick={(event) => { event.stopPropagation(); editFloorText(shape.id) }}>{shape.label}</button>
                    {/if}
                  {/each}
                  {#each (data.floorPlan?.shapes ?? []).filter((shape) => shape.type === 'text') as shape (shape.id)}
                    {#if editingFloorTextId === shape.id}
                      <input class="floor-canvas-text floor-canvas-text-input selected" style={`--text-x:${shape.x1}%;--text-y:${shape.y1}%`} value={shape.text ?? ''} data-floor-text-input={shape.id} aria-label="Edit floor plan text" oninput={(event) => updateFloorText(shape.id, event.currentTarget.value)} onkeydown={handleFloorTextKeydown} onblur={() => (editingFloorTextId = '')} />
                    {:else}
                      <button class:selected={shape.id === selectedFloorShapeId} class="floor-canvas-text" style={`--text-x:${shape.x1}%;--text-y:${shape.y1}%`} type="button" data-floor-shape={shape.id} aria-label={`Text: ${shape.text || 'Text'}`} onclick={() => handleFloorTextClick(shape.id)}>{shape.text || 'Text'}</button>
                    {/if}
                  {/each}
                  {#if selectedFloorShape && selectedFloorShape.type !== 'text' && floorTool === 'select'}
                    <button class="floor-shape-handle" style={`--handle-x:${selectedFloorShape.x1}%;--handle-y:${selectedFloorShape.y1}%`} type="button" data-floor-resize={selectedFloorShape.id} data-floor-endpoint="start" aria-label="Resize shape from start point" title="Drag to resize" onkeydown={(event) => resizeShapeWithKeyboard(event, selectedFloorShape, 'start')}></button>
                    <button class="floor-shape-handle" style={`--handle-x:${selectedFloorShape.x2}%;--handle-y:${selectedFloorShape.y2}%`} type="button" data-floor-resize={selectedFloorShape.id} data-floor-endpoint="end" aria-label="Resize shape from end point" title="Drag to resize" onkeydown={(event) => resizeShapeWithKeyboard(event, selectedFloorShape, 'end')}></button>
                  {/if}
                  {#each data.tables as table, tableIndex (table.id)}
                    {@const position = floorTablePosition(table, tableIndex)}
                    {@const seated = tableGuests(table.id)}
                    {@const occupied = tablePartyCount(table.id)}
                    <div class:opens-left={position.x > 62} class:opens-up={position.y > 66} class:popup-open={openFloorTableId === table.id} class="floor-table-marker-wrap" style={`--floor-x:${position.x}%;--floor-y:${position.y}%`}>
                      <button class={`floor-table-marker floor-table-marker--${floorTableShape}`} class:dragging={floorGesture?.id === table.id} type="button" data-floor-table={table.id} aria-label={`${table.name}, ${occupied} of ${table.capacity} seats occupied`} aria-haspopup="dialog" aria-expanded={openFloorTableId === table.id} onclick={() => toggleFloorTablePopup(table.id)}>
                        <span>{table.name}</span>
                        {#each Array(table.capacity) as _, seat}
                          <i class:filled={seat < occupied} style={seatDotStyle(seat, table.capacity, floorTableShape, 'floor')} aria-hidden="true"></i>
                        {/each}
                      </button>
                      {#if openFloorTableId === table.id}
                        <div class="floor-table-popover" role="dialog" tabindex="-1" aria-label={`${table.name} seated guests`}>
                          <header><strong>{table.name}</strong><button type="button" aria-label="Close guest list" onclick={() => (openFloorTableId = '')}>×</button></header>
                          {#if seated.length > 0}
                            <ul>{#each seated as guest (guest.id)}<li><span>{guest.name}</span><button type="button" title="Unassign guest" aria-label={`Unassign ${guest.name} from ${table.name}`} onclick={() => unassignGuestFromTable(guest)}>×</button></li>{/each}</ul>
                          {:else}
                            <p>No guests seated yet.</p>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/each}
                  <button class="floor-canvas-resize" type="button" data-floor-canvas-resize aria-label="Resize floor plan canvas" title="Drag to resize canvas"><span></span></button>
                </div>
              </div>
            </div>
          {:else}
          <div class="table-plan-grid">
            {#each data.tables as table, tableIndex}
              {@const seated = tableGuests(table.id)}
              {@const occupied = tablePartyCount(table.id)}
              <article class:over-capacity={occupied > table.capacity} class="seating-table" ondragover={(event) => event.preventDefault()} ondrop={() => dropGuest(table.id)}>
                <header><span>0{tableIndex + 1}</span><div><input value={table.name} onchange={(event) => (data = { ...data, tables: data.tables.map((item) => item.id === table.id ? { ...item, name: event.currentTarget.value } : item) })} aria-label="Table name" /><small>{occupied} of {table.capacity} seats</small></div><button type="button" onclick={() => removeTable(table.id)} aria-label={`Remove ${table.name}`}>×</button></header>
                <div class:capacity-warning={seatCapacityWarning?.tableId === table.id} class={`seating-table__visual seating-table__visual--${floorTableShape}`}><div><strong>{table.name}</strong><span>{table.capacity} seats</span></div>{#each Array(table.capacity) as _, seat}{@const seatedGuest = guestForSeat(table.id, seat)}<button class:filled={Boolean(seatedGuest)} class:warning={seatCapacityWarning?.tableId === table.id && !seatedGuest} class="seating-chair" style={seatDotStyle(seat, table.capacity, floorTableShape, 'list')} type="button" aria-label={seatedGuest ? `Seat ${seat + 1}, ${seatedGuest.name}. Choose guest` : `Seat ${seat + 1}, empty. Choose guest`} title={seatedGuest?.name ?? 'Choose guest'} onclick={() => openGuestPickerForSeat(table, seat)}></button>{/each}</div>
                {#if seatCapacityWarning?.tableId === table.id}<p class="seating-capacity-warning" role="alert"><strong>Not enough seats</strong>{seatCapacityWarning.message}</p>{/if}
                <div class="seating-table__guests" role="list">
                  {#each seated as guest}<div class="seating-guest-row" role="listitem" draggable="true" ondragstart={() => (draggedGuestId = guest.id)}><i class={avatarTone(guest.id || guest.name)}>{guest.name.slice(0, 1)}</i><span>{guest.name}<small>Party of {guest.party}</small></span><b aria-hidden="true">⋮⋮</b><button type="button" title="Unassign guest" aria-label={`Unassign ${guest.name} from ${table.name}`} onclick={() => unassignGuestFromTable(guest)}>×</button></div>{/each}
                  {#if seated.length === 0}<p>Drop guests here</p>{/if}
                </div>
              </article>
            {/each}
          </div>
          {/if}
        </section>

      {:else if active === 'photos'}
        <section class="dashboard-view" aria-labelledby="photos-heading">
          <header class="dashboard-page-heading"><div><h1 id="photos-heading">Shared photographs</h1><p>Review what guests upload before it appears on your website.</p></div><label class="dashboard-primary dashboard-upload">+ Upload photos<input type="file" accept="image/*" multiple onchange={uploadPhotos} /></label></header>
          <div class="photo-filter-row"><span>{data.photos.length} photographs</span><p>{data.photos.filter((photo) => photo.status === 'pending').length} waiting for review</p></div>
          <div class="dashboard-photo-grid">
            {#each data.photos as photo}
              <article><img src={photoSource(photo)} alt={photo.title} /><span class:pending={photo.status === 'pending'}>{photo.status}</span><div><p><strong>{photo.title}</strong><small>Uploaded by {photo.uploader}</small></p><div>{#if photo.status === 'pending'}<button type="button" onclick={() => updatePhoto(photo.id, 'approved')}>Approve</button>{/if}<button type="button" onclick={() => removePhoto(photo.id)}>Remove</button></div></div></article>
            {/each}
          </div>
        </section>

      {:else if active === 'gifts'}
        <section class="dashboard-view" aria-labelledby="gifts-heading">
          <header class="dashboard-page-heading"><div><h1 id="gifts-heading">Gift list</h1><p>Track monetary gifts and meaningful items, linked directly to your guests.</p></div><button class="dashboard-primary" type="button" onclick={() => openGiftForm()}>+ Add gift</button></header>
          <div class="table-topbar"><div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={giftSearch} placeholder="Search gifts" aria-label="Search gifts" /><span>{filteredGifts.length}</span></label>{#if visibleSelectedGiftIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedGiftIds.length} selected</span><label class="bulk-rsvp-control"><select aria-label="Change thank-you status for selected gifts" onchange={(event) => updateSelectedGiftStatus(event.currentTarget.value)}><option value="" selected disabled>Status</option><option value="thanked">Thanked</option><option value="pending">Pending</option></select></label><button type="button" class="bulk-delete-button" aria-label="Delete selected gifts" title="Delete selected" onclick={() => requestBulkDelete('gifts')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div><div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Filter gifts"><button class:active={giftFilter === 'all'} type="button" onclick={() => (giftFilter = 'all')}>All <strong>{data.gifts.length}</strong></button><button class:active={giftFilter === 'thanked'} type="button" onclick={() => (giftFilter = 'thanked')}>Thanked <strong>{data.gifts.filter((gift) => gift.thanked).length}</strong></button><button class:active={giftFilter === 'pending'} type="button" onclick={() => (giftFilter = 'pending')}>Pending <strong>{data.gifts.filter((gift) => !gift.thanked).length}</strong></button></div><button class="table-download-button" type="button" onclick={downloadGiftCsv} aria-label="Download gift list CSV" title="Download to CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div></div>
          <div class="dashboard-table-wrap" role="region" aria-label="Gift list table">
            <table class="dashboard-data-table dashboard-gift-table">
              <thead><tr>
                <th aria-sort={giftSort.key === 'guest' ? (giftSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><div class="bulk-header-cell"><input class="bulk-select-checkbox" use:setIndeterminate={someGiftsSelected} type="checkbox" checked={allGiftsSelected} onchange={(event) => selectAllGifts(event.currentTarget.checked)} aria-label="Select all gifts" /><button class="guest-sort-button" class:sorted={giftSort.key === 'guest'} type="button" onclick={() => toggleTableSort('gifts', 'guest')}>Guest <span aria-hidden="true">{sortArrow(giftSort, 'guest')}</span></button></div></th>
                <th aria-sort={giftSort.key === 'type' ? (giftSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={giftSort.key === 'type'} type="button" onclick={() => toggleTableSort('gifts', 'type')}>Gift type <span aria-hidden="true">{sortArrow(giftSort, 'type')}</span></button></th>
                <th aria-sort={giftSort.key === 'giftValue' ? (giftSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={giftSort.key === 'giftValue'} type="button" onclick={() => toggleTableSort('gifts', 'giftValue')}>Amount or gift <span aria-hidden="true">{sortArrow(giftSort, 'giftValue')}</span></button></th>
                <th aria-sort={giftSort.key === 'note' ? (giftSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={giftSort.key === 'note'} type="button" onclick={() => toggleTableSort('gifts', 'note')}>Note <span aria-hidden="true">{sortArrow(giftSort, 'note')}</span></button></th>
                <th aria-sort={giftSort.key === 'thanked' ? (giftSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={giftSort.key === 'thanked'} type="button" onclick={() => toggleTableSort('gifts', 'thanked')}>Thank you <span aria-hidden="true">{sortArrow(giftSort, 'thanked')}</span></button></th>
                <th class="table-actions-heading"><span class="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {#each sortedGifts as gift, index}<tr class:thanked={gift.thanked}><td><input class="bulk-select-checkbox" type="checkbox" checked={selectedGiftIds.includes(gift.id)} onchange={() => toggleGiftSelection(gift.id)} aria-label={`Select gift from ${gift.guest}`} /><i class={avatarTone(gift.guestId || gift.guest)}>{gift.guest.slice(0, 1)}</i><span><strong>{gift.guest}</strong></span></td><td><span class={`gift-type gift-type--${gift.type}`}>{gift.type === 'money' ? 'Money' : 'Item'}</span></td><td><strong class="gift-value">{giftLabel(gift)}</strong></td><td><span class="gift-note">{gift.note || 'No note added'}</span></td><td><span class="gift-thank-toggle" class:active={gift.thanked}><i>{gift.thanked ? '✓' : ''}</i>{gift.thanked ? 'Thanked' : 'Pending'}</span></td><td class="table-row-menu-cell"><div class="guest-action-menu"><button class="guest-menu-trigger" type="button" onclick={() => toggleRowMenu('gift', gift.id)} aria-label={`Actions for gift from ${gift.guest}`} aria-haspopup="menu" aria-expanded={openRowMenuKey === `gift:${gift.id}`}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg></button>{#if openRowMenuKey === `gift:${gift.id}`}<div class:opens-up={index >= sortedGifts.length - 2} class="guest-menu-popover" role="menu"><button type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; openGiftEditModal(gift) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>Edit</button><button class="danger" type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; removeGift(gift.id) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>Delete</button></div>{/if}</div></td></tr>{/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'music'}
        <section class="dashboard-view" aria-labelledby="music-heading">
          <header class="dashboard-page-heading"><div><h1 id="music-heading">Music</h1><p>Add official Spotify, Apple Music, and YouTube Music players for songs and playlists.</p></div><button class="dashboard-primary" type="button" onclick={openMusicForm}>+ Add music</button></header>

          <div class="table-topbar"><div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={musicSearch} placeholder="Search music" aria-label="Search songs or links" /><span>{filteredSongs.length}</span></label>{#if visibleSelectedSongIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedSongIds.length} selected</span><button type="button" class="bulk-delete-button" aria-label="Delete selected songs" title="Delete selected" onclick={() => requestBulkDelete('music')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div><div class="table-topbar-right"><button class="table-download-button" type="button" onclick={downloadMusicCsv} aria-label="Download music list CSV" title="Download to CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div></div>

          <div class="dashboard-table-wrap" role="region" aria-label="Music list table">
            <table class="dashboard-data-table dashboard-music-table">
              <thead><tr>
                <th aria-sort={musicSort.key === 'name' ? (musicSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><div class="bulk-header-cell"><input class="bulk-select-checkbox" use:setIndeterminate={someSongsSelected} type="checkbox" checked={allSongsSelected} onchange={(event) => selectAllSongs(event.currentTarget.checked)} aria-label="Select all songs" /><button class="guest-sort-button" class:sorted={musicSort.key === 'name'} type="button" onclick={() => toggleTableSort('music', 'name')}>Song <span aria-hidden="true">{sortArrow(musicSort, 'name')}</span></button></div></th>
                <th aria-sort={musicSort.key === 'link' ? (musicSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={musicSort.key === 'link'} type="button" onclick={() => toggleTableSort('music', 'link')}>Link <span aria-hidden="true">{sortArrow(musicSort, 'link')}</span></button></th>
                <th aria-sort={musicSort.key === 'type' ? (musicSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={musicSort.key === 'type'} type="button" onclick={() => toggleTableSort('music', 'type')}>Type <span aria-hidden="true">{sortArrow(musicSort, 'type')}</span></button></th>
                <th><span class="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {#each sortedSongs as song, index (song.id)}
                  {@const music = musicDetails(song.link)}
                  <tr class:music-row-open={openMusicPlayerId === song.id}><td><input class="bulk-select-checkbox" type="checkbox" checked={selectedSongIds.includes(song.id)} onchange={() => toggleSongSelection(song.id)} aria-label={`Select ${song.name}`} /><span class="music-song-name"><i aria-hidden="true">♪</i><strong>{song.name}</strong></span></td><td>{#if music}<div class={`music-table-player-bar music-table-player-bar--${music.platform}`}><span><i aria-hidden="true"></i>{music.platformLabel} {music.kindLabel}</span><button type="button" aria-expanded={openMusicPlayerId === song.id} aria-controls={`music-player-${song.id}`} onclick={() => (openMusicPlayerId = openMusicPlayerId === song.id ? '' : song.id)}>{openMusicPlayerId === song.id ? 'Close' : 'Open player'}</button></div>{:else if song.link}<a class="music-link" href={songLinkHref(song.link)} target="_blank" rel="noreferrer">Open link <span aria-hidden="true">↗</span></a>{:else}<span class="music-no-link">No link</span>{/if}</td><td><span class={`music-type music-type--${song.type}`}>{songTypeLabel(song.type)}</span></td><td class="table-row-menu-cell"><div class="guest-action-menu"><button class="guest-menu-trigger" type="button" onclick={() => toggleRowMenu('music', song.id)} aria-label={`Actions for ${song.name}`} aria-haspopup="menu" aria-expanded={openRowMenuKey === `music:${song.id}`}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg></button>{#if openRowMenuKey === `music:${song.id}`}<div class:opens-up={index >= sortedSongs.length - 2} class="guest-menu-popover" role="menu"><button type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; openMusicEditModal(song) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>Edit</button><button class="danger" type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; removeSong(song.id) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>Delete</button></div>{/if}</div></td></tr>
                  {#if music && openMusicPlayerId === song.id}
                    <tr class="music-expanded-player-row"><td colspan="4"><div id={`music-player-${song.id}`} class="music-expanded-player"><iframe class={`music-embed music-embed--${music.platform}`} src={music.embedUrl} title={`${song.name} on ${music.platformLabel}`} height={music.height} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe><div><p>Playback availability depends on the visitor’s region, login, and subscription.</p><a href={musicFallbackUrl(song.link)} target="_blank" rel="noreferrer">Open in Music App <span aria-hidden="true">↗</span></a></div></div></td></tr>
                  {/if}
                {:else}
                  <tr class="music-empty-row"><td colspan="4"><p>No songs added yet. Add your first song to start planning the soundtrack.</p></td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'messages'}
        <section class="dashboard-view" aria-labelledby="messages-heading">
          <header class="dashboard-page-heading">
            <div><h1 id="messages-heading">Messages</h1><p>Keep website replies and messages sent to guests together.</p></div>
            <button class="dashboard-primary" type="button" onclick={openMessageForm}>Send message</button>
          </header>

          <div class="table-topbar"><div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={messageSearch} placeholder="Search messages" aria-label="Search messages" /><span>{filteredMessages.length}</span></label>{#if visibleSelectedMessageIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedMessageIds.length} selected</span><button type="button" class="bulk-delete-button" aria-label="Delete selected messages" title="Delete selected" onclick={() => requestBulkDelete('messages')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div><div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Filter messages"><button class:active={messageFilter === 'all'} type="button" onclick={() => (messageFilter = 'all')}>All <strong>{(data.messages ?? []).length}</strong></button><button class:active={messageFilter === 'received'} type="button" onclick={() => (messageFilter = 'received')}>Received <strong>{(data.messages ?? []).filter((message) => messageDirection(message) === 'received').length}</strong></button><button class:active={messageFilter === 'sent'} type="button" onclick={() => (messageFilter = 'sent')}>Sent <strong>{(data.messages ?? []).filter((message) => messageDirection(message) === 'sent').length}</strong></button><button class:active={messageFilter === 'unread'} type="button" onclick={() => (messageFilter = 'unread')}>Unread <strong>{(data.messages ?? []).filter((message) => messageDirection(message) === 'received' && !message.read).length}</strong></button></div><button class="table-download-button" type="button" onclick={downloadMessageCsv} aria-label="Download messages CSV" title="Download to CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div></div>

          <div class="dashboard-table-wrap" role="region" aria-label="Guest messages table">
            <table class="dashboard-data-table dashboard-message-table">
              <thead><tr>
                <th aria-sort={messageSort.key === 'name' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><div class="bulk-header-cell"><input class="bulk-select-checkbox" use:setIndeterminate={someMessagesSelected} type="checkbox" checked={allMessagesSelected} onchange={(event) => selectAllMessages(event.currentTarget.checked)} aria-label="Select all messages" /><button class="guest-sort-button" class:sorted={messageSort.key === 'name'} type="button" onclick={() => toggleTableSort('messages', 'name')}>Guest <span aria-hidden="true">{sortArrow(messageSort, 'name')}</span></button></div></th>
                <th aria-sort={messageSort.key === 'sentAt' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'sentAt'} type="button" onclick={() => toggleTableSort('messages', 'sentAt')}>Date <span aria-hidden="true">{sortArrow(messageSort, 'sentAt')}</span></button></th>
                <th aria-sort={messageSort.key === 'direction' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'direction'} type="button" onclick={() => toggleTableSort('messages', 'direction')}>Direction <span aria-hidden="true">{sortArrow(messageSort, 'direction')}</span></button></th>
                <th aria-sort={messageSort.key === 'contact' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'contact'} type="button" onclick={() => toggleTableSort('messages', 'contact')}>Contact details <span aria-hidden="true">{sortArrow(messageSort, 'contact')}</span></button></th>
                <th aria-sort={messageSort.key === 'message' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'message'} type="button" onclick={() => toggleTableSort('messages', 'message')}>Message <span aria-hidden="true">{sortArrow(messageSort, 'message')}</span></button></th>
                <th aria-sort={messageSort.key === 'read' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'read'} type="button" onclick={() => toggleTableSort('messages', 'read')}>Status <span aria-hidden="true">{sortArrow(messageSort, 'read')}</span></button></th>
                <th><span class="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {#each sortedMessages as message, index (message.id)}
                  <tr class:unread={messageDirection(message) === 'received' && !message.read}>
                    <td><input class="bulk-select-checkbox" type="checkbox" checked={selectedMessageIds.includes(message.id)} onchange={() => toggleMessageSelection(message.id)} aria-label={`Select message for ${message.name}`} /><i class={avatarTone(message.guestId || message.name)}>{message.name.slice(0, 1)}</i><span><strong>{message.name}</strong><small>{message.guestId ? 'Guest list' : messageDirection(message) === 'sent' ? 'Manual contact' : 'Website visitor'}</small></span></td>
                    <td><time datetime={message.sentAt}>{formatMessageDate(message.sentAt)}</time></td>
                    <td><span class={`message-direction message-direction--${messageDirection(message)}`}><strong>{messageDirection(message) === 'sent' ? 'Sent' : 'Received'}</strong><small>{messageDirection(message) === 'sent' ? 'via' : 'from'} {messageChannelLabel(message.channel ?? 'website')}</small></span></td>
                    <td><span class="message-contact">{#if message.email}<a href={`mailto:${message.email}`}>{message.email}</a>{/if}{#if message.phone}<a href={`tel:${message.phone}`}>{message.phone}</a>{/if}{#if !message.email && !message.phone}<small>No contact details</small>{/if}</span></td>
                    <td><p class="message-copy">{message.message}</p></td>
                    <td>{#if messageDirection(message) === 'sent'}<span class="message-delivery-status"><i>✓</i>Sent</span>{:else}<span class:active={message.read} class="message-read-toggle"><i>{message.read ? '✓' : ''}</i>{message.read ? 'Read' : 'Unread'}</span>{/if}</td>
                    <td class="table-row-menu-cell"><div class="guest-action-menu"><button class="guest-menu-trigger" type="button" onclick={() => toggleRowMenu('message', message.id)} aria-label={`Actions for message from ${message.name}`} aria-haspopup="menu" aria-expanded={openRowMenuKey === `message:${message.id}`}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg></button>{#if openRowMenuKey === `message:${message.id}`}<div class:opens-up={index >= sortedMessages.length - 2} class="guest-menu-popover" role="menu"><button type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; openMessageEditModal(message) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>Edit</button><button class="danger" type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; removeMessage(message.id) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>Delete</button></div>{/if}</div></td>
                  </tr>
                {:else}
                  <tr class="message-empty-row"><td colspan="7"><p>No messages yet. Website replies and messages sent to guests will appear here.</p></td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'vendors'}
        <section class="dashboard-view" aria-labelledby="vendors-heading">
          <header class="dashboard-page-heading">
            <div><h1 id="vendors-heading">Vendors</h1><p>Keep every supplier, contact, quote and booking detail together.</p></div>
            <button class="dashboard-primary" type="button" onclick={openVendorForm}>+ Add vendor</button>
          </header>

          <div class="table-topbar"><div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={vendorSearch} placeholder="Search vendors" aria-label="Search vendors" /><span>{filteredVendors.length}</span></label>{#if visibleSelectedVendorIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedVendorIds.length} selected</span><label class="bulk-rsvp-control"><select aria-label="Change status for selected vendors" onchange={(event) => updateSelectedVendorStatus(event.currentTarget.value)}><option value="" selected disabled>Status</option><option value="researching">Researching</option><option value="contacted">Contacted</option><option value="quoted">Quote received</option><option value="booked">Booked</option><option value="paid">Paid</option></select></label><button type="button" class="bulk-delete-button" aria-label="Delete selected vendors" title="Delete selected" onclick={() => requestBulkDelete('vendors')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div><div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Vendor status and budget"><button class:active={vendorFilter === 'all'} type="button" onclick={() => (vendorFilter = 'all')}>All <strong>{(data.vendors ?? []).length}</strong></button><button class:active={vendorFilter === 'booked'} type="button" onclick={() => (vendorFilter = 'booked')}>Booked <strong>{(data.vendors ?? []).filter((vendor) => ['booked', 'paid'].includes(vendor.status)).length}</strong></button><button class:active={vendorFilter === 'planning'} type="button" onclick={() => (vendorFilter = 'planning')}>Planning <strong>{(data.vendors ?? []).filter((vendor) => !['booked', 'paid'].includes(vendor.status)).length}</strong></button><span class="table-info-chip">Budget <strong>€{(data.vendors ?? []).reduce((total, vendor) => total + (Number(vendor.cost) || 0), 0).toLocaleString()}</strong></span></div><button class="table-download-button" type="button" onclick={downloadVendorCsv} aria-label="Download vendors CSV" title="Download to CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div></div>

          <div class="dashboard-table-wrap" role="region" aria-label="Vendor list table">
            <table class="dashboard-data-table dashboard-vendor-table">
              <thead><tr>
                <th aria-sort={vendorSort.key === 'name' ? (vendorSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><div class="bulk-header-cell"><input class="bulk-select-checkbox" use:setIndeterminate={someVendorsSelected} type="checkbox" checked={allVendorsSelected} onchange={(event) => selectAllVendors(event.currentTarget.checked)} aria-label="Select all vendors" /><button class="guest-sort-button" class:sorted={vendorSort.key === 'name'} type="button" onclick={() => toggleTableSort('vendors', 'name')}>Vendor <span aria-hidden="true">{sortArrow(vendorSort, 'name')}</span></button></div></th>
                <th aria-sort={vendorSort.key === 'category' ? (vendorSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={vendorSort.key === 'category'} type="button" onclick={() => toggleTableSort('vendors', 'category')}>Category <span aria-hidden="true">{sortArrow(vendorSort, 'category')}</span></button></th>
                <th aria-sort={vendorSort.key === 'contact' ? (vendorSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={vendorSort.key === 'contact'} type="button" onclick={() => toggleTableSort('vendors', 'contact')}>Contact <span aria-hidden="true">{sortArrow(vendorSort, 'contact')}</span></button></th>
                <th aria-sort={vendorSort.key === 'cost' ? (vendorSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={vendorSort.key === 'cost'} type="button" onclick={() => toggleTableSort('vendors', 'cost')}>Budget <span aria-hidden="true">{sortArrow(vendorSort, 'cost')}</span></button></th>
                <th aria-sort={vendorSort.key === 'status' ? (vendorSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={vendorSort.key === 'status'} type="button" onclick={() => toggleTableSort('vendors', 'status')}>Status <span aria-hidden="true">{sortArrow(vendorSort, 'status')}</span></button></th>
                <th aria-sort={vendorSort.key === 'note' ? (vendorSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={vendorSort.key === 'note'} type="button" onclick={() => toggleTableSort('vendors', 'note')}>Notes <span aria-hidden="true">{sortArrow(vendorSort, 'note')}</span></button></th>
                <th><span class="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {#each sortedVendors as vendor, index (vendor.id)}
                  <tr>
                    <td><div class="vendor-name-cell"><input class="bulk-select-checkbox" type="checkbox" checked={selectedVendorIds.includes(vendor.id)} onchange={() => toggleVendorSelection(vendor.id)} aria-label={`Select ${vendor.name}`} /><span class="vendor-name"><strong>{vendor.name}</strong>{#if vendor.website}<a href={vendorWebsiteHref(vendor.website)} target="_blank" rel="noreferrer">{vendor.website}</a>{/if}</span></div></td>
                    <td><span class="vendor-category">{vendor.category}</span></td>
                    <td><span class="vendor-contact"><strong>{vendor.contact || 'No contact name'}</strong>{#if vendor.email}<a href={`mailto:${vendor.email}`}>{vendor.email}</a>{/if}{#if vendor.phone}<a href={`tel:${vendor.phone}`}>{vendor.phone}</a>{/if}</span></td>
                    <td><span class="vendor-budget"><strong>{vendor.cost ? `€${Number(vendor.cost).toLocaleString()}` : 'Not set'}</strong><small>{vendor.deposit ? `€${Number(vendor.deposit).toLocaleString()} deposit` : 'No deposit recorded'}</small></span></td>
                    <td><span class={`vendor-status vendor-status--${vendor.status}`}>{vendor.status === 'quoted' ? 'Quote received' : vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}</span></td>
                    <td><span class="vendor-note">{vendor.note || 'No notes'}</span></td>
                    <td class="table-row-menu-cell"><div class="guest-action-menu"><button class="guest-menu-trigger" type="button" onclick={() => toggleRowMenu('vendor', vendor.id)} aria-label={`Actions for ${vendor.name}`} aria-haspopup="menu" aria-expanded={openRowMenuKey === `vendor:${vendor.id}`}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg></button>{#if openRowMenuKey === `vendor:${vendor.id}`}<div class:opens-up={index >= sortedVendors.length - 2} class="guest-menu-popover" role="menu"><button type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; openVendorEditModal(vendor) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>Edit</button><button class="danger" type="button" role="menuitem" onclick={() => { openRowMenuKey = ''; vendorToDelete = vendor }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>Delete</button></div>{/if}</div></td>
                  </tr>
                {:else}
                  <tr class="vendor-empty-row"><td colspan="7"><p>No vendors added yet. Add your first supplier to start tracking plans and costs.</p></td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'notes'}
        <section class="dashboard-view notes-view" aria-labelledby="notes-heading">
          <header class="dashboard-page-heading notes-heading">
            <div><h1 id="notes-heading">Calendar and Notes</h1></div>
            <button class="dashboard-secondary calendar-export-button" type="button" onclick={exportCalendar}><span aria-hidden="true">↓</span> Export calendar</button>
          </header>

          <div class="notes-calendar-layout">
            <div class:collapsed={notesSectionsCollapsed.calendar} class="notes-date-panel">
              <button class="notes-collapse-button notes-date-panel__collapse" type="button" aria-expanded={!notesSectionsCollapsed.calendar} aria-controls="notes-calendar-content selected-day-content" aria-label={notesSectionsCollapsed.calendar ? 'Expand calendar and selected day' : 'Minimize calendar and selected day'} onclick={toggleCalendarAndDaySections}>{notesSectionsCollapsed.calendar ? '+' : '−'}</button>
              <section class="notes-calendar-panel" aria-labelledby="calendar-panel-heading">
              <header class="notes-section-header">
                <h2 id="calendar-panel-heading">Calendar</h2>
              </header>
              {#if !notesSectionsCollapsed.calendar}
                <div id="notes-calendar-content">
                  <div class="notes-calendar-toolbar">
                    <button class="notes-calendar-nav" type="button" aria-label="Previous month" onclick={() => changeCalendarMonth(-1)}>‹</button>
                    <h3>{calendarMonthLabel}</h3>
                    <button class="notes-calendar-nav" type="button" aria-label="Next month" onclick={() => changeCalendarMonth(1)}>›</button>
                    <button class="notes-today-button" type="button" onclick={goToToday}>Today</button>
                  </div>
                  <div class="notes-calendar-grid" role="grid" aria-label={calendarMonthLabel}>
                    {#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as weekday}
                      <span class="notes-calendar-weekday" role="columnheader">{weekday}</span>
                    {/each}
                    {#each calendarDays as day (day.key)}
                      {@const eventCount = (data.notesCalendar?.events ?? []).filter((event) => event.date === day.key).length}
                      <button class:outside-month={!day.inMonth} class:selected-day={selectedDayKey === day.key} class:has-events={eventCount > 0} class="notes-calendar-day" type="button" role="gridcell" aria-selected={selectedDayKey === day.key} aria-label={`${day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${eventCount ? `, ${eventCount} events` : ''}`} onclick={() => { selectedDayKey = day.key; calendarEventFormOpen = false }}>
                        <span>{day.date.getDate()}</span>
                        {#if eventCount > 0}<i aria-hidden="true"></i>{/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
              </section>

              {#if !notesSectionsCollapsed.day}<section class="notes-content-panel" aria-labelledby="day-notes-heading">
              <header class="notes-section-header">
                <div><p class="dashboard-eyebrow">Selected day</p><h2 id="day-notes-heading">{new Date(`${selectedDayKey}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2></div>
              </header>
              {#if !notesSectionsCollapsed.day}
                <div id="selected-day-content">
                  <div class="notes-day-events">
                    <div class="notes-subsection-heading"><h3>Events</h3><button class="dashboard-primary" type="button" onclick={() => (calendarEventFormOpen = !calendarEventFormOpen)}>{calendarEventFormOpen ? 'Cancel' : '+ Add event'}</button></div>
                    {#if calendarEventFormOpen}
                      <form class="calendar-event-form" onsubmit={addCalendarEvent}>
                        <label><span>Event</span><input bind:value={calendarEventForm.title} required maxlength="120" placeholder="Event title" /></label>
                        <label><span>Time</span><input bind:value={calendarEventForm.time} type="time" aria-label="Event time (optional)" /></label>
                        <button class="dashboard-primary" type="submit">Add</button>
                      </form>
                    {/if}
                    {#if selectedDayEvents.length}
                      <ul class="calendar-event-list">{#each selectedDayEvents as event (event.id)}<li><time>{event.time || 'All day'}</time><span>{event.title}</span><button type="button" aria-label={`Remove ${event.title}`} onclick={() => removeCalendarEvent(event.id)}>×</button></li>{/each}</ul>
                    {:else if !calendarEventFormOpen}
                      <p class="notes-empty-hint">No events for this day.</p>
                    {/if}
                  </div>
                  <label class="notes-textarea-label" for="selected-day-notes"><span>Notes for this day</span><textarea id="selected-day-notes" value={data.notesCalendar?.dailyNotes?.[selectedDayKey] ?? ''} oninput={(event) => updateSelectedDayNotes(event.currentTarget.value)} placeholder="Add notes for this date…"></textarea></label>
                </div>
              {/if}
              </section>{/if}
            </div>

            <section class="notes-content-panel notes-fixed-panel" aria-labelledby="fixed-notes-heading">
              <header class="notes-section-header">
                <div><h2 id="fixed-notes-heading">General notes</h2></div>
                <div class="general-notes-header-actions">
                  <button class="dashboard-primary general-note-add" type="button" onclick={addGeneralNote}>+ Add note</button>
                  <button class="notes-collapse-button" type="button" aria-expanded={!notesSectionsCollapsed.fixed} aria-label={notesSectionsCollapsed.fixed ? 'Expand general notes' : 'Minimize general notes'} onclick={() => toggleNotesSection('fixed')}>{notesSectionsCollapsed.fixed ? '+' : '−'}</button>
                </div>
              </header>
              {#if !notesSectionsCollapsed.fixed}
                <div class="general-notes-list" role="list">
                  {#each generalNotesData() as note (note.id)}
                    <article role="listitem" class:editing={activeGeneralNoteId === note.id} class:full-width={note.fullWidth} class:dragging={draggedGeneralNoteId === note.id} class:drag-over={dragOverGeneralNoteId === note.id && draggedGeneralNoteId !== note.id} class={`general-note-card general-note-card--${note.color || 'yellow'}`} onfocusin={(event) => { if (!event.target.matches?.('input[type="checkbox"], .general-note-drag-handle, .general-note-width-toggle, .general-note-remove, .general-note-background-picker button')) activeGeneralNoteId = note.id }} ondragover={(event) => { if (draggedGeneralNoteId && draggedGeneralNoteId !== note.id) { event.preventDefault(); dragOverGeneralNoteId = note.id } }} ondrop={(event) => dropGeneralNote(event, note.id)}>
                      <div class="general-note-topline">
                        {#if activeGeneralNoteId === note.id}
                          <input id={`general-note-title-${note.id}`} class="general-note-title" value={note.title} oninput={(event) => updateGeneralNote(note.id, { title: event.currentTarget.value })} maxlength="100" aria-label="Note title" placeholder="Note title" />
                        {:else}
                          <h3 class="general-note-title-display">{note.title || 'Untitled note'}</h3>
                        {/if}
                        <button class="general-note-drag-handle" type="button" draggable="true" aria-label={`Drag ${note.title || 'note'} to reorder`} title="Drag to reorder" ondragstart={(event) => startGeneralNoteDrag(event, note.id)} ondragend={finishGeneralNoteDrag}><svg viewBox="0 0 16 20" aria-hidden="true"><circle cx="5" cy="4" r="1"></circle><circle cx="11" cy="4" r="1"></circle><circle cx="5" cy="10" r="1"></circle><circle cx="11" cy="10" r="1"></circle><circle cx="5" cy="16" r="1"></circle><circle cx="11" cy="16" r="1"></circle></svg></button>
                      </div>
                      <div class="general-note-card-actions">
                        <div class="general-note-background-picker" role="group" aria-label="Note background color">
                          {#each [{ value: 'yellow', label: 'Yellow' }, { value: 'rose', label: 'Rose' }, { value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' }, { value: 'white', label: 'White' }] as color}
                            <button class:active={(note.color || 'yellow') === color.value} class={`general-note-background-swatch general-note-background-swatch--${color.value}`} type="button" aria-label={`${color.label} background`} aria-pressed={(note.color || 'yellow') === color.value} onclick={() => updateGeneralNote(note.id, { color: color.value })}></button>
                          {/each}
                        </div>
                        <button class:active={note.fullWidth} class="general-note-width-toggle" type="button" aria-label={note.fullWidth ? `Use half width for ${note.title || 'note'}` : `Make ${note.title || 'note'} full width`} aria-pressed={Boolean(note.fullWidth)} title={note.fullWidth ? 'Use half width' : 'Make full width'} onclick={() => updateGeneralNote(note.id, { fullWidth: !note.fullWidth })}><svg viewBox="0 0 20 20" aria-hidden="true">{#if note.fullWidth}<path d="m7 6-3 4 3 4M13 6l3 4-3 4M4 10h12"></path>{:else}<path d="M8 6 4 10l4 4M12 6l4 4-4 4M4 10h12"></path>{/if}</svg></button>
                        <button class="general-note-remove" type="button" onmousedown={(event) => event.preventDefault()} onclick={(event) => { event.stopPropagation(); removeGeneralNote(note.id) }} aria-label={`Delete ${note.title || 'note'}`}>×</button>
                      </div>

                      {#if activeGeneralNoteId === note.id}<div class="general-note-toolbar" role="group" aria-label="Text formatting">
                        <button class:active={noteFormatActive(note.id, 'bold')} type="button" aria-pressed={noteFormatActive(note.id, 'bold')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'bold')} aria-label="Bold"><strong>B</strong></button>
                        <button class:active={noteFormatActive(note.id, 'italic')} type="button" aria-pressed={noteFormatActive(note.id, 'italic')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'italic')} aria-label="Italic"><em>I</em></button>
                        <button class:active={noteFormatActive(note.id, 'underline')} type="button" aria-pressed={noteFormatActive(note.id, 'underline')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'underline')} aria-label="Underline"><u>U</u></button>
                        <span aria-hidden="true"></span>
                        <button class:active={noteFormatActive(note.id, 'fontSize', '2')} class="general-note-font-size general-note-font-size--small" type="button" aria-pressed={noteFormatActive(note.id, 'fontSize', '2')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'fontSize', '2')} aria-label="Small text">A</button>
                        <button class:active={noteFormatActive(note.id, 'fontSize', '3')} class="general-note-font-size" type="button" aria-pressed={noteFormatActive(note.id, 'fontSize', '3')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'fontSize', '3')} aria-label="Normal text">A</button>
                        <button class:active={noteFormatActive(note.id, 'fontSize', '5')} class="general-note-font-size general-note-font-size--large" type="button" aria-pressed={noteFormatActive(note.id, 'fontSize', '5')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'fontSize', '5')} aria-label="Large text">A</button>
                        <span aria-hidden="true"></span>
                        <button class:active={noteColorActive(note.id, '#302f2b', 'rgb(48,47,43)')} class="general-note-text-color general-note-text-color--ink" type="button" aria-pressed={noteColorActive(note.id, '#302f2b', 'rgb(48,47,43)')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'foreColor', '#302f2b')} aria-label="Dark text"></button>
                        <button class:active={noteColorActive(note.id, '#9b3f47', 'rgb(155,63,71)')} class="general-note-text-color general-note-text-color--red" type="button" aria-pressed={noteColorActive(note.id, '#9b3f47', 'rgb(155,63,71)')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'foreColor', '#9b3f47')} aria-label="Red text"></button>
                        <button class:active={noteColorActive(note.id, '#345f83', 'rgb(52,95,131)')} class="general-note-text-color general-note-text-color--blue" type="button" aria-pressed={noteColorActive(note.id, '#345f83', 'rgb(52,95,131)')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'foreColor', '#345f83')} aria-label="Blue text"></button>
                        <button class:active={noteColorActive(note.id, '#37704a', 'rgb(55,112,74)')} class="general-note-text-color general-note-text-color--green" type="button" aria-pressed={noteColorActive(note.id, '#37704a', 'rgb(55,112,74)')} onmousedown={(event) => event.preventDefault()} onclick={() => applyGeneralNoteFormat(note.id, 'foreColor', '#37704a')} aria-label="Green text"></button>
                        <span aria-hidden="true"></span>
                        <button class="general-note-checklist-button" type="button" onmousedown={(event) => event.preventDefault()} onclick={() => insertGeneralNoteCheckpoint(note.id)} aria-label="Insert checklist item" title="Insert checklist item"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2.5"></circle><path d="m4.8 7 1 1 1.7-2M11 7h9M4 14h4M11 14h9M4 19h4M11 19h9"></path></svg></button>
                      </div>{/if}

                      <div id={`general-note-editor-${note.id}`} class="general-note-editor" contenteditable="true" role="textbox" tabindex="0" aria-multiline="true" aria-label={`Contents of ${note.title || 'note'}`} data-placeholder="Write a note…" use:richTextEditor={note.content} oninput={(event) => { updateGeneralNoteContent(note.id, event.currentTarget); refreshGeneralNoteFormatting(note.id) }} onclick={(event) => { handleGeneralNoteCheckboxClick(note.id, event); refreshGeneralNoteFormatting(note.id) }} onkeyup={() => refreshGeneralNoteFormatting(note.id)} onmouseup={() => refreshGeneralNoteFormatting(note.id)} onfocus={() => refreshGeneralNoteFormatting(note.id)} onkeydown={(event) => handleGeneralNoteChecklistInput(note.id, event)} onbeforeinput={(event) => handleGeneralNoteChecklistInput(note.id, event)} onpaste={pastePlainNoteText}></div>
                    </article>
                  {:else}
                    <button class="general-notes-empty" type="button" onclick={addGeneralNote}><span>+</span>Add your first note</button>
                  {/each}
                </div>
              {/if}
            </section>
          </div>
        </section>

      {:else if active === 'website'}
        <section class="dashboard-view" aria-labelledby="website-heading">
          <header class="dashboard-page-heading"><div><p class="dashboard-eyebrow">Your digital invitation</p><h1 id="website-heading">Website settings</h1><p>Edit the invitation your guests see and manage its public link.</p></div><button class="dashboard-primary" type="button" onclick={goToWebsiteEditor}>Edit website</button></header>
          <div class="website-management-grid">
            <section class="website-preview-card"><div class={`cart-item__art cart-item__art--${template.id}`}><span>{site.title}</span><i>{site.occasionName}</i></div><div><span><i></i> Published</span><h2>{template.name}</h2><p>Last saved just now</p><button type="button" onclick={goToWebsiteEditor}>Open website editor <span>→</span></button></div></section>
            <section class="dashboard-panel website-link-card"><span>Public link</span><h2>Share your invitation</h2><p>Anyone with this link can view the event and send an RSVP.</p><div><input value={data.siteUrl} readonly /><button type="button" onclick={copySiteLink}>{copied ? 'Copied' : 'Copy'}</button></div><small>Connected to your QR code automatically.</small></section>
            <section class="dashboard-panel website-status-card"><span>Publishing</span><div><p><strong>Website status</strong><small>Visible to guests</small></p><button class:active={data.published} type="button" onclick={() => (data = { ...data, published: !data.published })} aria-label="Toggle website visibility" aria-pressed={data.published}><i></i></button></div><div><p><strong>RSVP collection</strong><small>Accept guest responses</small></p><button class="active" type="button" aria-label="RSVP collection enabled" aria-pressed="true"><i></i></button></div></section>
          </div>
        </section>

      {:else if active === 'qr'}
        <section class="dashboard-view" aria-labelledby="qr-heading">
          <header class="dashboard-page-heading"><div><p class="dashboard-eyebrow">Easy sharing</p><h1 id="qr-heading">Your QR code</h1><p>Add it to printed invitations, table cards or signs so guests can open your website instantly.</p></div></header>
          <div class="qr-layout">
            <section class="qr-card"><div class="qr-frame"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=16&data=${encodeURIComponent(data.siteUrl)}`} alt={`QR code for ${data.siteUrl}`} /></div><span>SCAN TO OPEN</span><h2>{data.eventName}</h2><p>{data.siteUrl.replace('https://', '')}</p></section>
            <section class="dashboard-panel qr-actions"><span>Ready to share</span><h2>One code, every detail.</h2><p>The QR code always points to your live website, so you can keep editing without printing it again.</p><a class="dashboard-primary" href={`https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&margin=32&data=${encodeURIComponent(data.siteUrl)}`} target="_blank" rel="noreferrer">Download high resolution <span>↓</span></a><button class="dashboard-secondary" type="button" onclick={copySiteLink}>{copied ? 'Link copied' : 'Copy website link'}</button><small>Tip: use at least 25 mm wide when printing.</small></section>
          </div>
        </section>
      {/if}
    </div>
  </main>
</div>

{#if shareGuestIds.length}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeGuestShareModal()}>
    <div class="dashboard-modal guest-share-modal" role="dialog" aria-modal="true" aria-labelledby="guest-share-heading">
      <button class="dashboard-modal-close" type="button" onclick={closeGuestShareModal} aria-label="Close">×</button>
      <h2 id="guest-share-heading">Invite guests</h2>
      <p>Choose how to invite {shareGuestIds.length} selected {shareGuestIds.length === 1 ? 'guest' : 'guests'}.</p>
      <form onsubmit={simulateGuestShare}>
        <fieldset class="share-method-grid"><legend>Invite using</legend>{#each [{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'viber', label: 'Viber' }, { value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }] as method}<button class:active={shareMethod === method.value} type="button" aria-pressed={shareMethod === method.value} onclick={() => { shareMethod = method.value; shareResult = null }}>{#if method.value === 'whatsapp'}<svg class="service-logo service-logo--whatsapp" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2a9.84 9.84 0 0 0-8.46 14.86L2 22l5.28-1.55A9.86 9.86 0 1 0 12.04 2Zm0 17.92a8 8 0 0 1-4.08-1.12l-.29-.17-3.13.92.93-3.05-.19-.31a7.94 7.94 0 1 1 6.76 3.73Zm4.36-5.96c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.64-1.19-1.42-1.33-1.66-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>{:else if method.value === 'viber'}<svg class="service-logo service-logo--viber" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.7 4.3C17.8 2.4 14.9 2 12 2S6.2 2.4 4.3 4.3 2 8.2 2 11.4c0 3 .4 5.3 2.1 7l-.8 3.4 3.6-1.1c1.5.8 3.2 1.1 5.1 1.1 2.9 0 5.8-.4 7.7-2.3S22 15.6 22 12s-.4-5.8-2.3-7.7Z" /><path class="service-logo-detail" d="M8.2 7.4c.3-.4.8-.5 1.2-.2l1.3 1c.4.3.5.8.2 1.2l-.7.9c.7 1.5 1.8 2.6 3.3 3.3l.9-.7c.4-.3.9-.2 1.2.2l1 1.3c.3.4.2.9-.2 1.2l-.8.7c-.5.4-1.2.6-1.8.4-3.4-1-6.1-3.7-7.1-7.1-.2-.6 0-1.3.4-1.8l.7-.4ZM14.7 7.1c1.2.5 1.9 1.2 2.4 2.4M14.4 4.9c2.5.6 4.1 2.2 4.7 4.7" /></svg>{:else if method.value === 'email'}<svg class="service-logo service-logo--generic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>{:else}<svg class="service-logo service-logo--generic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg>{/if}{method.label}</button>{/each}</fieldset>
        <label><span>Message</span><textarea bind:value={shareMessage} rows="6"></textarea></label>
        <div class="share-link-preview"><span>Website link</span><strong>{data.siteUrl}</strong></div>
        <p class="share-development-note">Development preview — Send records the invitation method for valid recipients, but no message is actually delivered.</p>
        {#if shareResult}
          <div class="share-result" role="status">
            <strong>{shareResult.sent.length} {shareResult.sent.length === 1 ? 'guest is' : 'guests are'} ready for {shareMethodLabel(shareResult.method)}.</strong>
            {#if shareResult.failed.length}<p>Could not send to {shareResult.failed.map((guest) => guest.name).join(', ')} because {shareResult.method === 'email' ? 'an email address is missing' : 'a phone number is missing'}.</p>{:else}<p>Every selected guest has the required contact details.</p>{/if}
          </div>
        {/if}
        <button class="dashboard-primary share-send-button" type="submit">Send</button>
      </form>
    </div>
  </div>
{/if}

{#if showGuestForm}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeForms()}>
    <div class="dashboard-modal table-edit-modal" role="dialog" aria-modal="true" aria-labelledby="guest-form-heading">
      <button class="dashboard-modal-close" type="button" onclick={closeForms} aria-label="Close">×</button>
      <h2 id="guest-form-heading">{editingGuestId ? 'Edit guest' : 'Add guest'}</h2><p>{editingGuestId ? 'Update all saved details for this guest.' : 'Add a guest and their invitation details.'}</p>
      <form id="guest-table-form" onsubmit={addGuest}>
        <label><span>Full name *</span><input bind:value={guestForm.name} required placeholder="Full name" /></label>
        <div class="dashboard-form-row"><label><span>Email</span><input bind:value={guestForm.email} type="email" placeholder="guest@example.com" /></label><label><span>Phone</span><input bind:value={guestForm.phone} type="tel" placeholder="Phone number" /></label></div>
        <div class="dashboard-form-row"><label><span>Adults</span><select bind:value={guestForm.adults}>{#each Array(20) as _, index}<option value={index + 1}>{index + 1}</option>{/each}</select></label><label><span>Children</span><select bind:value={guestForm.children}>{#each Array(11) as _, index}<option value={index}>{index}</option>{/each}</select></label></div>
        <label><span>RSVP</span><select bind:value={guestForm.status}><option value="attending">Attending</option><option value="pending">Pending</option><option value="declined">Declined</option></select></label>
        <label><span>Dietary or guest note</span><textarea bind:value={guestForm.meal} rows="3" placeholder="Dietary needs, accessibility, reminders…"></textarea></label>
        <label><span>Private note</span><textarea bind:value={guestForm.note} rows="2" placeholder="Optional internal note"></textarea></label>
      </form>
      <div class="table-modal-footer"><button class="dashboard-primary table-modal-save" type="submit" form="guest-table-form">Save</button></div>
    </div>
  </div>
{/if}

{#if showGiftForm}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeForms()}>
    <div class="dashboard-modal table-edit-modal" role="dialog" aria-modal="true" aria-labelledby="gift-form-heading">
      <button class="dashboard-modal-close" type="button" onclick={closeForms} aria-label="Close">×</button>
      <h2 id="gift-form-heading">{editingGiftId ? 'Edit gift' : 'Add gift'}</h2><p>Record the giver, gift details, notes, and thank-you status.</p>
      <form id="gift-table-form" onsubmit={addGift}>
        <div class="gift-guest-field"><span>Giver</span><button class="message-recipient-open" type="button" onclick={openGiftGuestPicker}><span><strong>{giftForm.guestId ? giftForm.guest : 'Choose a guest'}</strong><small>{giftForm.guestId ? 'Linked to your guest list' : 'Search your guest list'}</small></span><b aria-hidden="true">›</b></button></div>
        <div class="gift-guest-divider"><span>or enter a name manually</span></div>
        <label><span>Giver name *</span><input value={giftForm.guest} oninput={(event) => updateGiftGuestName(event.currentTarget.value)} required placeholder="Full name" /><small>{giftForm.guestId ? 'Editing the name will unlink this gift from the selected guest.' : 'This name does not need to be in your guest list.'}</small></label>
        <div class="dashboard-form-row"><label><span>Gift type</span><select bind:value={giftForm.type}><option value="money">Money</option><option value="item">Item or other</option></select></label><label><span>Thank you</span><select bind:value={giftForm.thanked}><option value={false}>Pending</option><option value={true}>Thanked</option></select></label></div>
        {#if giftForm.type === 'money'}<div class="dashboard-form-row"><label><span>Currency</span><select bind:value={giftForm.currency}><option value="EUR">€ EUR</option><option value="GBP">£ GBP</option><option value="USD">$ USD</option></select></label><label><span>Amount *</span><input bind:value={giftForm.amount} type="number" min="0" step="0.01" required placeholder="0" /></label></div>{:else}<label><span>Gift *</span><input bind:value={giftForm.gift} required placeholder="What they brought" /></label>{/if}
        <label><span>Note</span><textarea bind:value={giftForm.note} rows="3" placeholder="Optional note"></textarea></label>
      </form>
      <div class="table-modal-footer"><button class="dashboard-primary table-modal-save" type="submit" form="gift-table-form">Save</button></div>
    </div>
  </div>
{/if}

{#if giftGuestPickerOpen}
  <div class="dashboard-modal-backdrop gift-guest-picker-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && (giftGuestPickerOpen = false)}>
    <div class="dashboard-modal seat-picker-dialog gift-guest-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="gift-guest-picker-heading">
      <button class="dashboard-modal-close" type="button" onclick={() => (giftGuestPickerOpen = false)} aria-label="Close guest picker">×</button>
      <span>Add gift</span>
      <h2 id="gift-guest-picker-heading">Choose a guest</h2>
      <p>Search your guest list and choose the giver.</p>
      <label class="seat-picker-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={giftGuestSearch} type="search" placeholder="Search guests or contact details" aria-label="Search gift giver" /><span>{giftGuestResults.length}</span></label>
      <div class="seat-picker-list gift-guest-results">
        {#each giftGuestResults as guest (guest.id)}
          <button class:current={giftForm.guestId === guest.id} type="button" onclick={() => selectGiftGuest(guest)}>
            <i class={avatarTone(guest.id || guest.name)}>{guest.name.slice(0, 1)}</i>
            <span><strong>{guest.name}</strong><small>{guest.email || guest.phone || 'No contact details'}</small></span>
            <b>{giftForm.guestId === guest.id ? 'Selected' : 'Choose'}</b>
          </button>
        {:else}
          <p class="seat-picker-empty">No guests match your search.</p>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if showMusicForm}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeForms()}>
    <div class="dashboard-modal table-edit-modal" role="dialog" aria-modal="true" aria-labelledby="music-form-heading">
      <button class="dashboard-modal-close" type="button" onclick={closeForms} aria-label="Close">×</button>
      <h2 id="music-form-heading">{editingSongId ? 'Edit music' : 'Add music'}</h2><p>Add a title and an optional Spotify, Apple Music, YouTube Music, or external link.</p>
      <form id="music-table-form" onsubmit={addSong}>
        <label><span>Title and artist</span><input bind:value={musicForm.name} oninput={scheduleMusicMetadataLookup} placeholder={musicMetadataLoading ? 'Finding title…' : 'Title and artist'} /></label>
        <label><span>Music link</span><input bind:value={musicForm.link} oninput={scheduleMusicMetadataLookup} type="text" inputmode="url" aria-invalid={musicLinkError ? 'true' : undefined} placeholder="Optional music link" />{#if musicMetadataLoading}<small>Finding title and artist…</small>{:else if detectedMusicLink}<small class="music-link-detected">✓ {detectedMusicLink.platformLabel} detected</small>{:else if musicForm.link.trim()}<small>Saved as an external link without a player.</small>{/if}{#if musicLinkError}<small class="music-link-error">{musicLinkError}</small>{/if}</label>
        <label><span>Type</span><select bind:value={musicForm.type}><option value="entrance">Entrance</option><option value="first-dance">First dance</option><option value="parent-dance">Parent dance</option><option value="cake-cutting">Cake cutting</option><option value="party">Party</option><option value="reception">Reception</option><option value="other">Other</option></select></label>
      </form>
      <div class="table-modal-footer"><button class="dashboard-primary table-modal-save" type="submit" form="music-table-form" disabled={musicSaving}>{musicSaving ? 'Saving…' : 'Save'}</button></div>
    </div>
  </div>
{/if}

{#if showMessageForm}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeForms()}>
    <div class="dashboard-modal table-edit-modal message-compose-modal" role="dialog" aria-modal="true" aria-labelledby="message-form-heading">
      <button class="dashboard-modal-close" type="button" onclick={closeForms} aria-label="Close">×</button>
      <h2 id="message-form-heading">{editingMessageId ? `Edit ${messageForm.direction === 'sent' ? 'sent' : 'received'} message` : 'Send message'}</h2><p>{messageForm.direction === 'sent' ? 'Choose a guest or enter contact details, then select how to reach them.' : 'Edit the website message and its read status.'}</p>
      <form id="message-table-form" onsubmit={saveMessageEdit}>
        {#if messageForm.direction === 'sent'}
          <fieldset class="message-channel-grid"><legend>Send using</legend>{#each [{ value: 'email', label: 'Email' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'viber', label: 'Viber' }] as channel}<button class:active={messageForm.channel === channel.value} type="button" aria-pressed={messageForm.channel === channel.value} onclick={() => { messageForm.channel = channel.value; messageFormError = '' }}>{channel.label}</button>{/each}</fieldset>
          {#if !editingMessageId}
            <div class="message-recipient-field">
              <span>Recipients</span>
              <button class="message-recipient-open" type="button" onclick={openMessageRecipientPicker}><span><strong>{messageForm.recipientIds.length ? `${messageForm.recipientIds.length} ${messageForm.recipientIds.length === 1 ? 'guest' : 'guests'} selected` : 'Choose guests'}</strong><small>Search and select from your guest list</small></span><b aria-hidden="true">›</b></button>
              {#if messageForm.recipientIds.length}<div class="message-recipient-chips">{#each data.guests.filter((guest) => messageForm.recipientIds.includes(guest.id)) as guest}<span>{guest.name}<button type="button" onclick={() => toggleMessageRecipient(guest.id)} aria-label={`Remove ${guest.name}`}>×</button></span>{/each}</div>{/if}
              {#if messageForm.manualRecipients.length}<div class="message-manual-recipient-list">{#each messageForm.manualRecipients as recipient, index (recipient.id)}<div class="message-manual-recipient"><header><strong>Manual contact {index + 1}</strong><button type="button" onclick={() => removeManualMessageRecipient(recipient.id)} aria-label={`Remove manual contact ${index + 1}`}>×</button></header><label><span>Name *</span><input value={recipient.name} oninput={(event) => updateManualMessageRecipient(recipient.id, { name: event.currentTarget.value })} required placeholder="Full name" /></label>{#if messageForm.channel === 'email'}<label><span>Email address *</span><input value={recipient.email} oninput={(event) => updateManualMessageRecipient(recipient.id, { email: event.currentTarget.value })} type="email" required placeholder="guest@example.com" /></label>{:else}<label><span>Phone number *</span><input value={recipient.phone} oninput={(event) => updateManualMessageRecipient(recipient.id, { phone: event.currentTarget.value })} type="tel" required placeholder="Phone number with country code" /></label>{/if}</div>{/each}</div>{/if}
              <button class="message-manual-contact-toggle" type="button" onclick={addManualMessageRecipient}>+ Add contact manually</button>
            </div>
          {/if}
          {#if editingMessageId}
            <label><span>Recipient name *</span><input bind:value={messageForm.name} required placeholder="Full name" /></label>
            {#if messageForm.channel === 'email'}
              <label><span>Email address *</span><input bind:value={messageForm.email} type="email" required placeholder="guest@example.com" /></label>
            {:else}
              <label><span>Phone number *</span><input bind:value={messageForm.phone} type="tel" required placeholder="Phone number with country code" /></label>
            {/if}
          {/if}
        {:else}
          <label><span>Guest name *</span><input bind:value={messageForm.name} required placeholder="Full name" /></label>
          <div class="dashboard-form-row"><label><span>Email</span><input bind:value={messageForm.email} type="email" placeholder="guest@example.com" /></label><label><span>Phone</span><input bind:value={messageForm.phone} type="tel" placeholder="Phone number" /></label></div>
          <div class="dashboard-form-row"><label><span>Date received</span><input bind:value={messageForm.sentAt} type="datetime-local" /></label><label><span>Status</span><select bind:value={messageForm.read}><option value={false}>Unread</option><option value={true}>Read</option></select></label></div>
        {/if}
        <label><span>Message *</span><textarea bind:value={messageForm.message} required rows="5" placeholder="Write the message"></textarea></label>
        {#if messageFormError}<p class="message-form-error" role="alert">{messageFormError}</p>{/if}
        {#if messageForm.direction === 'sent'}<p class="share-development-note">Development preview — the message will be recorded as sent, but no external message is delivered.</p>{/if}
      </form>
      <div class="table-modal-footer"><button class="dashboard-primary table-modal-save" type="submit" form="message-table-form">{editingMessageId ? 'Save' : 'Send message'}</button></div>
    </div>
  </div>
{/if}

{#if messageRecipientPickerOpen}
  <div class="dashboard-modal-backdrop message-recipient-picker-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && (messageRecipientPickerOpen = false)}>
    <div class="dashboard-modal seat-picker-dialog message-recipient-dialog" role="dialog" aria-modal="true" aria-labelledby="message-recipient-heading">
      <button class="dashboard-modal-close" type="button" onclick={() => (messageRecipientPickerOpen = false)} aria-label="Close recipient picker">×</button>
      <span>Send message</span>
      <h2 id="message-recipient-heading">Choose guests</h2>
      <p>Select as many recipients as you need.</p>
      <label class="seat-picker-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={messageRecipientSearch} type="search" placeholder="Search guests or contact details" aria-label="Search message recipients" /><span>{messageRecipientResults.length}</span></label>
      <div class="message-recipient-picker-toolbar"><span>{messageForm.recipientIds.length} selected</span><button type="button" onclick={selectAllMessageRecipientResults}>{messageRecipientResults.length > 0 && messageRecipientResults.every((guest) => messageForm.recipientIds.includes(guest.id)) ? 'Clear results' : 'Select all results'}</button></div>
      <div class="seat-picker-list message-recipient-results">
        {#each messageRecipientResults as guest (guest.id)}
          <button class:current={messageForm.recipientIds.includes(guest.id)} type="button" aria-pressed={messageForm.recipientIds.includes(guest.id)} onclick={() => toggleMessageRecipient(guest.id)}>
            <i class={avatarTone(guest.id || guest.name)}>{guest.name.slice(0, 1)}</i>
            <span><strong>{guest.name}</strong><small>{messageForm.channel === 'email' ? (guest.email || 'No email address') : (guest.phone || 'No phone number')}</small></span>
            <b>{messageForm.recipientIds.includes(guest.id) ? '✓' : ''}</b>
          </button>
        {:else}
          <p class="seat-picker-empty">No guests match your search.</p>
        {/each}
      </div>
      <div class="table-modal-footer"><button class="dashboard-primary table-modal-save" type="button" onclick={() => (messageRecipientPickerOpen = false)}>Done · {messageForm.recipientIds.length} selected</button></div>
    </div>
  </div>
{/if}

{#if showVendorForm}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeForms()}>
    <div class="dashboard-modal table-edit-modal table-edit-modal--wide" role="dialog" aria-modal="true" aria-labelledby="vendor-form-heading">
      <button class="dashboard-modal-close" type="button" onclick={closeForms} aria-label="Close">×</button>
      <h2 id="vendor-form-heading">{editingVendorId ? 'Edit vendor' : 'Add vendor'}</h2><p>Keep supplier, contact, budget, booking status, and notes together.</p>
      <form id="vendor-table-form" onsubmit={addVendor}>
        <div class="dashboard-form-row"><label><span>Vendor or company *</span><input bind:value={vendorForm.name} required placeholder="Company name" /></label><label><span>Category</span><select bind:value={vendorForm.category}><option>Venue</option><option>Catering</option><option>Photography</option><option>Videography</option><option>Flowers</option><option>Music / DJ</option><option>Decor</option><option>Transport</option><option>Entertainment</option><option>Beauty</option><option>Stationery</option><option>Other</option></select></label></div>
        <div class="dashboard-form-row"><label><span>Contact person</span><input bind:value={vendorForm.contact} placeholder="Full name" /></label><label><span>Status</span><select bind:value={vendorForm.status}><option value="researching">Researching</option><option value="contacted">Contacted</option><option value="quoted">Quote received</option><option value="booked">Booked</option><option value="paid">Paid</option></select></label></div>
        <div class="dashboard-form-row"><label><span>Email</span><input bind:value={vendorForm.email} type="email" placeholder="hello@example.com" /></label><label><span>Phone</span><input bind:value={vendorForm.phone} type="tel" placeholder="Phone number" /></label></div>
        <label><span>Website</span><input bind:value={vendorForm.website} type="text" placeholder="example.com" /></label>
        <div class="dashboard-form-row"><label><span>Estimated cost (€)</span><input bind:value={vendorForm.cost} type="number" min="0" step="0.01" placeholder="0" /></label><label><span>Deposit paid (€)</span><input bind:value={vendorForm.deposit} type="number" min="0" step="0.01" placeholder="0" /></label></div>
        <label><span>Notes</span><textarea bind:value={vendorForm.note} rows="3" placeholder="Package details, next steps, reminders…"></textarea></label>
      </form>
      <div class="table-modal-footer"><button class="dashboard-primary table-modal-save" type="submit" form="vendor-table-form">Save</button></div>
    </div>
  </div>
{/if}

{#if guestToDelete}
  <ConfirmDialog
    title="Delete this guest?"
    message={`Are you sure you want to delete ${guestToDelete.name} from your guest list?`}
    confirmLabel="Delete guest"
    cancelLabel="Keep guest"
    tone="danger"
    onConfirm={() => removeGuest(guestToDelete.id)}
    onCancel={() => (guestToDelete = null)}
  />
{/if}

{#if vendorToDelete}
  <ConfirmDialog
    title="Delete this vendor?"
    message={`Are you sure you want to delete ${vendorToDelete.name} and all of its saved contact, cost and booking details?`}
    confirmLabel="Delete vendor"
    cancelLabel="Keep vendor"
    tone="danger"
    onConfirm={() => removeVendor(vendorToDelete.id)}
    onCancel={() => (vendorToDelete = null)}
  />
{/if}

{#if bulkDeleteRequest}
  <ConfirmDialog
    title={bulkDeleteTitle(bulkDeleteRequest)}
    message={bulkDeleteMessage(bulkDeleteRequest.type)}
    confirmLabel="Delete selected"
    cancelLabel="Cancel"
    tone="danger"
    onConfirm={confirmBulkDelete}
    onCancel={() => (bulkDeleteRequest = null)}
  />
{/if}

{#if openSeatPicker}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && (openSeatPicker = null)}>
    <div class="dashboard-modal seat-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="seat-picker-heading">
      <button class="dashboard-modal-close" type="button" onclick={() => (openSeatPicker = null)} aria-label="Close guest picker">×</button>
      <span>{openSeatPicker.tableName} · Chair {openSeatPicker.seatIndex + 1}</span>
      <h2 id="seat-picker-heading">Choose a guest</h2>
      <p>Select an unassigned attending guest to add them to this table.</p>
      <label class="seat-picker-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={seatGuestSearch} type="search" placeholder="Search unassigned guests" aria-label="Search unassigned attending guests" /><span>{data.guests.filter((guest) => guest.status === 'attending' && !guest.tableId && `${guest.name} ${guest.email} ${guest.phone}`.toLowerCase().includes(seatGuestSearch.toLowerCase())).length}</span></label>
      {#if openSeatPicker.guest}
        <button class="seat-picker-clear" type="button" onclick={clearSelectedSeat}><span aria-hidden="true">×</span><span><strong>Leave chair empty</strong><small>Unassign {openSeatPicker.guest.name} from this table</small></span></button>
      {/if}
      <div class="seat-picker-list">
        {#each data.guests.filter((guest) => guest.status === 'attending' && !guest.tableId && `${guest.name} ${guest.email} ${guest.phone}`.toLowerCase().includes(seatGuestSearch.toLowerCase())) as guest (guest.id)}
          <button class:current={guest.id === openSeatPicker.guest?.id} type="button" onclick={() => assignGuestFromSeatPicker(guest)}>
            <i class={avatarTone(guest.id || guest.name)}>{guest.name.slice(0, 1)}</i>
            <span><strong>{guest.name}</strong><small>Unassigned</small></span>
            <b>{guest.party} {guest.party === 1 ? 'seat' : 'seats'}</b>
          </button>
        {:else}
          <p class="seat-picker-empty">{seatGuestSearch ? 'No unassigned guests match your search.' : 'No unassigned attending guests are available.'}</p>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if showTableForm}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeForms()}>
    <div class="dashboard-modal" role="dialog" aria-modal="true" aria-label="Add table">
      <button class="dashboard-modal-close" type="button" onclick={closeForms} aria-label="Close">×</button>
      <span>Table plan</span><h2>Add another table</h2><p>You can arrange guests as soon as it is added.</p>
      <form onsubmit={addTable}><label><span>Number of seats</span><input bind:value={tableForm.capacity} type="number" min="2" max="20" required /></label><button class="dashboard-primary" type="submit">Add table</button></form>
    </div>
  </div>
{/if}
