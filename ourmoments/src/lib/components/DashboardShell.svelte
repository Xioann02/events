<script>
  import { tick } from 'svelte'
  import { formatEventDate, getTemplate } from '../catalog.js'
  import { createGift, createGuest, createSong, createTable, createVendor, dashboardSummary } from '../dashboard-data.js'
  import couplePhoto from '../../assets/modern-couple.jpg'
  import tablePhoto from '../../assets/reception-table.jpg'
  import stillLifePhoto from '../../assets/editorial-still-life.jpg'
  import LogoMark from './LogoMark.svelte'
  import ConfirmDialog from './ConfirmDialog.svelte'

  let { account, site, data = $bindable(), onHome, onEditWebsite, onNotify } = $props()

  const navItems = [
    { id: 'overview', label: 'Overview', glyph: '⌂' },
    { id: 'guests', label: 'Guest list', glyph: '◎' },
    { id: 'seating', label: 'Table seating', glyph: '⊞' },
    { id: 'photos', label: 'Photos', glyph: '▧' },
    { id: 'gifts', label: 'Gifts', glyph: '◇' },
    { id: 'music', label: 'Music', glyph: '♪' },
    { id: 'vendors', label: 'Vendors', glyph: '▤' },
    { id: 'messages', label: 'Messages', glyph: '✉' },
    { id: 'notes', label: 'Notes', glyph: '✎' },
    { id: 'website', label: 'Website', glyph: '↗' },
    { id: 'qr', label: 'QR code', glyph: '⌗' },
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
  let openGuestMenuId = $state('')
  let editingGuestId = $state('')
  let editingGuestField = $state('')
  let guestEditDirty = $state(false)
  let rsvpFilter = $state('all')
  let giftFilter = $state('all')
  let musicFilter = $state('all')
  let messageFilter = $state('all')
  let vendorFilter = $state('all')
  let showGuestForm = $state(false)
  let showTableForm = $state(false)
  let openSeatPicker = $state(null)
  let seatCapacityWarning = $state(null)
  let seatCapacityWarningTimer
  let seatGuestSearch = $state('')
  let showGiftForm = $state(false)
  let showMusicForm = $state(false)
  let showVendorForm = $state(false)
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
  let calendarEventFormOpen = $state(false)
  let calendarEventForm = $state({ title: '', time: '' })
  let copied = $state(false)
  let guestForm = $state({ name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' })
  let guestEditForm = $state({ name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' })
  let tableForm = $state({ capacity: 8 })
  let giftForm = $state({ guestId: '', guest: '', type: 'money', amount: '', currency: 'EUR', gift: '', note: '' })
  let musicForm = $state({ name: '', link: '', type: 'other' })
  let vendorForm = $state({ name: '', category: 'Venue', contact: '', email: '', phone: '', website: '', cost: '', deposit: '', status: 'researching', note: '' })

  let summary = $derived(dashboardSummary(data))
  let template = $derived(getTemplate(site.templateId))
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
  let visibleSelectedGuestIds = $derived(sortedGuests.filter((guest) => selectedGuestIds.includes(guest.id)).map((guest) => guest.id))
  let allVisibleGuestsSelected = $derived(sortedGuests.length > 0 && visibleSelectedGuestIds.length === sortedGuests.length)
  let someVisibleGuestsSelected = $derived(visibleSelectedGuestIds.length > 0 && !allVisibleGuestsSelected)
  let filteredGifts = $derived(data.gifts.filter((gift) => `${gift.guest} ${giftLabel(gift)} ${gift.note}`.toLowerCase().includes(giftSearch.toLowerCase()) && (giftFilter === 'all' || (giftFilter === 'thanked' ? gift.thanked : !gift.thanked))))
  let filteredSongs = $derived((data.songs ?? []).filter((song) => `${song.name} ${song.link} ${songTypeLabel(song.type)}`.toLowerCase().includes(musicSearch.toLowerCase()) && (musicFilter === 'all' || song.type === musicFilter)))
  let filteredMessages = $derived((data.messages ?? []).filter((message) => `${message.name} ${message.email} ${message.phone} ${message.message}`.toLowerCase().includes(messageSearch.toLowerCase()) && (messageFilter === 'all' || (messageFilter === 'read' ? message.read : !message.read))))
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
  let visibleSelectedVendorIds = $derived(filteredVendors.filter((vendor) => selectedVendorIds.includes(vendor.id)).map((vendor) => vendor.id))
  let allVendorsSelected = $derived(filteredVendors.length > 0 && visibleSelectedVendorIds.length === filteredVendors.length)
  let someVendorsSelected = $derived(visibleSelectedVendorIds.length > 0 && !allVendorsSelected)
  let filteredGuests = $derived(
    data.guests.filter((guest) => {
      const matchesSearch = `${guest.name} ${guest.email}`.toLowerCase().includes(guestSearch.toLowerCase())
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

  function navigate(section) {
    active = section
    mobileNavOpen = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function tableSortValue(item, key) {
    if (key === 'giftValue') return giftLabel(item)
    if (key === 'contact') return `${item.contact ?? ''} ${item.email ?? ''} ${item.phone ?? ''}`
    if (key === 'cost') return Number(item.cost) || 0
    if (key === 'sentAt') return new Date(item.sentAt).getTime() || 0
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
    const guest = createGuest(guestForm)
    data = { ...data, guests: [...data.guests, guest] }
    guestForm = { name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' }
    showGuestForm = false
    onNotify('Guest added to your list.')
  }

  function openGuestRow() {
    openGuestMenuId = ''
    editingGuestId = ''
    guestForm = { name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' }
    showGuestForm = true
  }

  function cancelGuestRow() {
    guestForm = { name: '', email: '', phone: '', adults: 1, children: 0, status: 'pending', note: '', meal: '' }
    showGuestForm = false
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
    openGuestMenuId = ''
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

  function toggleGuestMenu(guestId) {
    openGuestMenuId = openGuestMenuId === guestId ? '' : guestId
  }

  function closeGuestMenuFromOutside(event) {
    if (!event.target.closest?.('.guest-action-menu')) openGuestMenuId = ''
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
    openGuestMenuId = ''
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
    data = { ...data, gifts: [createGift({ ...giftForm, guest: guestName }), ...data.gifts] }
    giftForm = { guestId: '', guest: '', type: 'money', amount: '', currency: 'EUR', gift: '', note: '' }
    showGiftForm = false
    onNotify('Gift added.')
  }

  function openGiftForm(guest = null) {
    giftForm = { guestId: guest?.id ?? '', guest: guest?.name ?? '', type: 'money', amount: '', currency: 'EUR', gift: '', note: '' }
    showGiftForm = true
    if (guest) navigate('gifts')
  }

  function songTypeLabel(type) {
    return ({ entrance: 'Entrance', 'first-dance': 'First dance', party: 'Party', reception: 'Reception', other: 'Other' })[type] ?? 'Other'
  }

  function addSong(event) {
    event.preventDefault()
    if (!musicForm.name.trim()) return
    data = { ...data, songs: [createSong(musicForm), ...(data.songs ?? [])] }
    musicForm = { name: '', link: '', type: 'other' }
    showMusicForm = false
    onNotify('Song added to your music list.')
  }

  function openMusicForm() {
    musicForm = { name: '', link: '', type: 'other' }
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

  function addVendor(event) {
    event.preventDefault()
    if (!vendorForm.name.trim()) return
    const vendor = createVendor(vendorForm)
    data = { ...data, vendors: [...(data.vendors ?? []), vendor] }
    vendorForm = { name: '', category: 'Venue', contact: '', email: '', phone: '', website: '', cost: '', deposit: '', status: 'researching', note: '' }
    showVendorForm = false
    onNotify(`${vendor.name} added to vendors.`)
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
    downloadCsv('guest-list.csv', ['Name', 'Adults', 'Children', 'Party size', 'Email', 'Phone', 'Note', 'RSVP', 'Table'], sortedGuests.map((guest) => [
      guest.name,
      guestAdults(guest),
      guestChildren(guest),
      guest.party,
      guest.email,
      guest.phone,
      guest.meal || guest.note,
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
    downloadCsv('guest-messages.csv', ['Guest', 'Date sent', 'Email', 'Phone', 'Message', 'Status'], sortedMessages.map((message) => [message.name, formatMessageDate(message.sentAt), message.email, message.phone, message.message, message.read ? 'Read' : 'Unread']))
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
    showMusicForm = false
    showVendorForm = false
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

  function toggleNotesSection(section) {
    notesSectionsCollapsed = { ...notesSectionsCollapsed, [section]: !notesSectionsCollapsed[section] }
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
</script>

<svelte:window
  onclick={closeGuestMenuFromOutside}
  onkeydown={(event) => {
    if (event.key === 'Escape') openGuestMenuId = ''
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
      <span>Manage</span>
      {#each navItems as item}
        <button class:active={active === item.id} type="button" onclick={() => navigate(item.id)}>
          <i aria-hidden="true">{item.glyph}</i>
          <span>{item.label}</span>
          {#if item.id === 'guests' && summary.pending > 0}<b>{summary.pending}</b>{/if}
        </button>
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
        <button type="button" onclick={onEditWebsite}>Edit website</button>
      </div>
    </header>

    <div class="dashboard-content">
      {#if active === 'overview'}
        <section class="dashboard-view dashboard-overview" aria-labelledby="dashboard-heading">
          <header class="dashboard-page-heading dashboard-page-heading--overview">
            <div>
              <p class="dashboard-eyebrow">Good morning, {account.firstName}</p>
              <h1 id="dashboard-heading">Your celebration,<br /><em>beautifully organised.</em></h1>
            </div>
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
              <div><button type="button" onclick={onEditWebsite}>Edit website</button><a href={data.siteUrl} target="_blank" rel="noreferrer" aria-label="Open website">↗</a></div>
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
            <div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={guestSearch} placeholder="Search guests" aria-label="Search guests or email" /><span>{filteredGuests.length}</span></label>{#if visibleSelectedGuestIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedGuestIds.length} selected</span><label class="bulk-rsvp-control"><select aria-label="Change RSVP for selected guests" onchange={(event) => updateSelectedGuestStatus(event.currentTarget.value)}><option value="" selected disabled>RSVP</option><option value="attending">Attending</option><option value="pending">Pending</option><option value="declined">Declined</option></select></label><button type="button" class="bulk-delete-button" aria-label="Delete selected guests" title="Delete selected" onclick={() => requestBulkDelete('guests')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div>
            <div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Filter guests by RSVP"><button class:active={rsvpFilter === 'all'} type="button" onclick={() => (rsvpFilter = 'all')}>All <strong>{summary.total}</strong></button><button class:active={rsvpFilter === 'attending'} type="button" onclick={() => (rsvpFilter = 'attending')}>Attending <strong>{summary.attending}</strong></button><button class:active={rsvpFilter === 'pending'} type="button" onclick={() => (rsvpFilter = 'pending')}>Pending <strong>{summary.pending}</strong></button><button class:active={rsvpFilter === 'declined'} type="button" onclick={() => (rsvpFilter = 'declined')}>Declined <strong>{summary.declined}</strong></button></div><button class="table-download-button" type="button" onclick={downloadGuestCsv} aria-label="Download guest list CSV" title="Download CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div>
          </div>

          <div class="dashboard-table-wrap">
            <table class="dashboard-data-table dashboard-guest-table">
              <thead><tr>
                <th aria-sort={guestSort.key === 'name' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><div class="bulk-header-cell"><input class="bulk-select-checkbox" use:setIndeterminate={someVisibleGuestsSelected} type="checkbox" checked={allVisibleGuestsSelected} onchange={(event) => selectVisibleGuests(event.currentTarget.checked)} aria-label="Select all visible guests" /><button class="guest-sort-button" class:sorted={guestSort.key === 'name'} type="button" onclick={() => sortGuests('name')}>Name <span aria-hidden="true">{sortArrow(guestSort, 'name')}</span></button></div></th>
                <th aria-sort={guestSort.key === 'party' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'party'} type="button" onclick={() => sortGuests('party')}>Number of people <span aria-hidden="true">{sortArrow(guestSort, 'party')}</span></button></th>
                <th aria-sort={guestSort.key === 'email' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'email'} type="button" onclick={() => sortGuests('email')}>Contact details <span aria-hidden="true">{sortArrow(guestSort, 'email')}</span></button></th>
                <th aria-sort={guestSort.key === 'meal' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'meal'} type="button" onclick={() => sortGuests('meal')}>Note <span aria-hidden="true">{sortArrow(guestSort, 'meal')}</span></button></th>
                <th aria-sort={guestSort.key === 'status' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'status'} type="button" onclick={() => sortGuests('status')}>RSVP <span aria-hidden="true">{sortArrow(guestSort, 'status')}</span></button></th>
                <th class="guest-action-heading"><span class="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {#if showGuestForm}
                  <tr class="dashboard-inline-row">
                    <td><input bind:value={guestForm.name} aria-label="Guest name" required placeholder="Full name" /></td>
                    <td><div class="guest-party-fields"><label><span>Adults</span><select bind:value={guestForm.adults} aria-label="Number of adults">{#each Array(20) as _, index}<option value={index + 1}>{index + 1}</option>{/each}</select></label><label><span>Children</span><select bind:value={guestForm.children} aria-label="Number of children">{#each Array(11) as _, index}<option value={index}>{index}</option>{/each}</select></label></div></td>
                    <td><div class="guest-contact"><input bind:value={guestForm.email} type="email" aria-label="Guest email" placeholder="Email" /><input bind:value={guestForm.phone} type="tel" aria-label="Guest phone" placeholder="Phone" /></div></td>
                    <td><input class="guest-note-input" bind:value={guestForm.meal} aria-label="Guest note" placeholder="Add note" /></td>
                    <td><select class={`status-select status-select--${guestForm.status}`} bind:value={guestForm.status} aria-label="Attendance status"><option value="attending">Attending</option><option value="pending">Pending</option><option value="declined">Declined</option></select></td>
                    <td class="guest-row-action-cell"><div class="inline-row-actions guest-row-actions"><button class="guest-save-button" type="button" onclick={addGuest} aria-label="Save guest" title="Save guest">Save</button><button class="guest-cancel-button" type="button" onclick={cancelGuestRow} aria-label="Close guest row" title="Close">×</button></div></td>
                  </tr>
                {/if}
                {#each sortedGuests as guest, index}
                  {@const isEditing = editingGuestId === guest.id}
                  <tr>
                    <td>
                      <input class="bulk-select-checkbox" type="checkbox" checked={selectedGuestIds.includes(guest.id)} onchange={() => toggleGuestSelection(guest.id)} aria-label={`Select ${guest.name}`} />
                      <i class={avatarTone(guest.id || guest.name)}>{guest.name.slice(0, 1)}</i>
                      {#if isEditing && editingGuestField === 'name'}
                        <input class="guest-inline-editor" data-guest-edit="name" bind:value={guestEditForm.name} oninput={markGuestEditDirty} onblur={saveGuestEdit} aria-label="Guest name" />
                      {:else if isEditing}
                        <button class="guest-edit-value guest-edit-value--strong" type="button" onclick={() => openGuestField('name', guest)}>{guestEditForm.name}</button>
                      {:else}
                        <button class="guest-edit-value guest-edit-value--strong" type="button" onclick={() => openGuestField('name', guest)}>{guest.name}</button>
                      {/if}
                    </td>
                    <td>
                      {#if isEditing && editingGuestField === 'party'}
                        <div class="guest-party-fields guest-party-fields--inline"><label><span>Adults</span><select data-guest-edit="party" bind:value={guestEditForm.adults} onchange={(event) => saveGuestPartyChange(event, 'adults')} aria-label="Number of adults">{#each Array(20) as _, optionIndex}<option value={optionIndex + 1}>{optionIndex + 1}</option>{/each}</select></label><label><span>Children</span><select bind:value={guestEditForm.children} onchange={(event) => saveGuestPartyChange(event, 'children')} aria-label="Number of children">{#each Array(11) as _, optionIndex}<option value={optionIndex}>{optionIndex}</option>{/each}</select></label></div>
                      {:else if isEditing}
                        <button class="guest-edit-value guest-party-label" type="button" onclick={() => openGuestField('party', guest)}>{partyLabel(guestEditForm)}</button>
                      {:else}
                        <button class="guest-edit-value guest-party-label" type="button" onclick={() => openGuestField('party', guest)}>{partyLabel(guest)}</button>
                      {/if}
                    </td>
                    <td>
                      {#if isEditing && editingGuestField === 'contact'}
                        <div class="guest-contact guest-contact--inline"><input class="guest-inline-editor" data-guest-edit="contact" bind:value={guestEditForm.email} oninput={markGuestEditDirty} onblur={saveGuestEdit} type="email" aria-label="Guest email" placeholder="Email" /><input class="guest-inline-editor" bind:value={guestEditForm.phone} oninput={markGuestEditDirty} onblur={saveGuestEdit} type="tel" aria-label="Guest phone" placeholder="Phone" /></div>
                      {:else if isEditing}
                        <button class="guest-edit-value" type="button" onclick={() => openGuestField('contact', guest)}>{[guestEditForm.email, guestEditForm.phone].filter(Boolean).join(', ') || 'No contact details'}</button>
                      {:else}
                        <button class="guest-edit-value" type="button" onclick={() => openGuestField('contact', guest)}>{[guest.email, guest.phone].filter(Boolean).join(', ') || 'No contact details'}</button>
                      {/if}
                    </td>
                    <td>
                      {#if isEditing && editingGuestField === 'meal'}
                        <input class="guest-inline-editor" data-guest-edit="meal" bind:value={guestEditForm.meal} oninput={markGuestEditDirty} onblur={saveGuestEdit} aria-label="Guest note" placeholder="Not provided" />
                      {:else if isEditing}
                        <button class="guest-edit-value" type="button" onclick={() => openGuestField('meal', guest)}>{guestEditForm.meal || 'Not provided'}</button>
                      {:else}
                        <button class="guest-edit-value guest-note-text" type="button" onclick={() => openGuestField('meal', guest)}>{guest.meal || 'Not provided'}</button>
                      {/if}
                    </td>
                    <td>
                      {#if isEditing}
                        <select class={`status-select status-select--${guestEditForm.status}`} bind:value={guestEditForm.status} onchange={(event) => changeGuestStatus(guest, event.currentTarget.value)} aria-label={`Attendance status for ${guest.name}`}><option value="attending">Attending</option><option value="pending">Pending</option><option value="declined">Declined</option></select>
                      {:else}
                        <select class={`status-select status-select--${guest.status}`} value={guest.status} onchange={(event) => changeGuestStatus(guest, event.currentTarget.value)} aria-label={`Attendance status for ${guest.name}`}><option value="attending">Attending</option><option value="pending">Pending</option><option value="declined">Declined</option></select>
                      {/if}
                    </td>
                    <td class="guest-row-action-cell">
                      <div class="guest-action-menu">
                        <button class="guest-menu-trigger" type="button" onclick={() => toggleGuestMenu(guest.id)} aria-label={`Actions for ${guest.name}`} aria-haspopup="menu" aria-expanded={openGuestMenuId === guest.id}>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
                        </button>
                        {#if openGuestMenuId === guest.id}
                          <div class:opens-up={index >= sortedGuests.length - 2} class="guest-menu-popover" role="menu">
                            <button class="danger" type="button" role="menuitem" onclick={() => { openGuestMenuId = ''; guestToDelete = guest }}>
                              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>
                              Delete
                            </button>
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
          <div class="table-topbar"><div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={giftSearch} placeholder="Search gifts" aria-label="Search gifts" /><span>{filteredGifts.length}</span></label>{#if visibleSelectedGiftIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedGiftIds.length} selected</span><button type="button" class="bulk-delete-button" aria-label="Delete selected gifts" title="Delete selected" onclick={() => requestBulkDelete('gifts')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div><div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Filter gifts"><button class:active={giftFilter === 'all'} type="button" onclick={() => (giftFilter = 'all')}>All <strong>{data.gifts.length}</strong></button><button class:active={giftFilter === 'thanked'} type="button" onclick={() => (giftFilter = 'thanked')}>Thanked <strong>{data.gifts.filter((gift) => gift.thanked).length}</strong></button><button class:active={giftFilter === 'pending'} type="button" onclick={() => (giftFilter = 'pending')}>Pending <strong>{data.gifts.filter((gift) => !gift.thanked).length}</strong></button></div><button class="table-download-button" type="button" onclick={downloadGiftCsv} aria-label="Download gift list CSV" title="Download CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div></div>
          <div class="dashboard-table-wrap">
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
                {#if showGiftForm}
                  <tr class="dashboard-inline-row dashboard-inline-gift-row">
                    <td><div class="inline-guest-picker"><select bind:value={giftForm.guestId} aria-label="Select guest"><option value="">Other / not listed</option>{#each data.guests as guest}<option value={guest.id}>{guest.name}</option>{/each}</select>{#if !giftForm.guestId}<input bind:value={giftForm.guest} aria-label="Gift giver name" required placeholder="Guest name" />{/if}</div></td>
                    <td><select bind:value={giftForm.type} aria-label="Gift type"><option value="money">Money</option><option value="item">Item or other</option></select></td>
                    <td>{#if giftForm.type === 'money'}<div class="inline-money-fields"><select bind:value={giftForm.currency} aria-label="Currency"><option value="EUR">€ EUR</option><option value="GBP">£ GBP</option><option value="USD">$ USD</option></select><input bind:value={giftForm.amount} type="number" min="0" step="0.01" required aria-label="Gift amount" placeholder="Amount" /></div>{:else}<input bind:value={giftForm.gift} required aria-label="Gift description" placeholder="What they brought" />{/if}</td>
                    <td><textarea bind:value={giftForm.note} rows="2" aria-label="Gift note" placeholder="Optional note"></textarea></td>
                    <td><span class="inline-empty-value">Pending</span></td>
                    <td><div class="inline-row-actions"><button type="button" onclick={addGift}>Save</button><button type="button" onclick={() => (showGiftForm = false)}>Cancel</button></div></td>
                  </tr>
                {/if}
                {#each sortedGifts as gift}<tr class:thanked={gift.thanked}><td><input class="bulk-select-checkbox" type="checkbox" checked={selectedGiftIds.includes(gift.id)} onchange={() => toggleGiftSelection(gift.id)} aria-label={`Select gift from ${gift.guest}`} /><i class={avatarTone(gift.guestId || gift.guest)}>{gift.guest.slice(0, 1)}</i><span><strong>{gift.guest}</strong><small>{gift.guestId ? 'Guest list' : 'Not on guest list'}</small></span></td><td><span class={`gift-type gift-type--${gift.type}`}>{gift.type === 'money' ? 'Money' : 'Item'}</span></td><td><strong class="gift-value">{giftLabel(gift)}</strong></td><td><span class="gift-note">{gift.note || 'No note added'}</span></td><td><button class="gift-thank-toggle" class:active={gift.thanked} type="button" onclick={() => toggleThanked(gift.id)} aria-pressed={gift.thanked}><i>{gift.thanked ? '✓' : ''}</i>{gift.thanked ? 'Thanked' : 'Pending'}</button></td><td><button class="dashboard-row-remove" type="button" onclick={() => removeGift(gift.id)} aria-label={`Remove gift from ${gift.guest}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></td></tr>{/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'music'}
        <section class="dashboard-view" aria-labelledby="music-heading">
          <header class="dashboard-page-heading"><div><h1 id="music-heading">Music</h1><p>Keep every important song and playlist link organized by moment.</p></div><button class="dashboard-primary" type="button" onclick={openMusicForm}>+ Add song</button></header>

          <div class="table-topbar"><div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={musicSearch} placeholder="Search music" aria-label="Search songs or links" /><span>{filteredSongs.length}</span></label>{#if visibleSelectedSongIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedSongIds.length} selected</span><button type="button" class="bulk-delete-button" aria-label="Delete selected songs" title="Delete selected" onclick={() => requestBulkDelete('music')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div><div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Filter music by type"><button class:active={musicFilter === 'all'} type="button" onclick={() => (musicFilter = 'all')}>All <strong>{(data.songs ?? []).length}</strong></button><button class:active={musicFilter === 'entrance'} type="button" onclick={() => (musicFilter = 'entrance')}>Entrance <strong>{(data.songs ?? []).filter((song) => song.type === 'entrance').length}</strong></button><button class:active={musicFilter === 'first-dance'} type="button" onclick={() => (musicFilter = 'first-dance')}>First dance <strong>{(data.songs ?? []).filter((song) => song.type === 'first-dance').length}</strong></button><button class:active={musicFilter === 'party'} type="button" onclick={() => (musicFilter = 'party')}>Party <strong>{(data.songs ?? []).filter((song) => song.type === 'party').length}</strong></button><button class:active={musicFilter === 'reception'} type="button" onclick={() => (musicFilter = 'reception')}>Reception <strong>{(data.songs ?? []).filter((song) => song.type === 'reception').length}</strong></button><button class:active={musicFilter === 'other'} type="button" onclick={() => (musicFilter = 'other')}>Other <strong>{(data.songs ?? []).filter((song) => song.type === 'other').length}</strong></button></div><button class="table-download-button" type="button" onclick={downloadMusicCsv} aria-label="Download music list CSV" title="Download CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div></div>

          <div class="dashboard-table-wrap">
            <table class="dashboard-data-table dashboard-music-table">
              <thead><tr>
                <th aria-sort={musicSort.key === 'name' ? (musicSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><div class="bulk-header-cell"><input class="bulk-select-checkbox" use:setIndeterminate={someSongsSelected} type="checkbox" checked={allSongsSelected} onchange={(event) => selectAllSongs(event.currentTarget.checked)} aria-label="Select all songs" /><button class="guest-sort-button" class:sorted={musicSort.key === 'name'} type="button" onclick={() => toggleTableSort('music', 'name')}>Song <span aria-hidden="true">{sortArrow(musicSort, 'name')}</span></button></div></th>
                <th aria-sort={musicSort.key === 'link' ? (musicSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={musicSort.key === 'link'} type="button" onclick={() => toggleTableSort('music', 'link')}>Link <span aria-hidden="true">{sortArrow(musicSort, 'link')}</span></button></th>
                <th aria-sort={musicSort.key === 'type' ? (musicSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={musicSort.key === 'type'} type="button" onclick={() => toggleTableSort('music', 'type')}>Type <span aria-hidden="true">{sortArrow(musicSort, 'type')}</span></button></th>
                <th><span class="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {#if showMusicForm}
                  <tr class="dashboard-inline-row dashboard-inline-music-row">
                    <td><input bind:value={musicForm.name} aria-label="Song name" required placeholder="Song name and artist" /></td>
                    <td><input bind:value={musicForm.link} type="text" aria-label="Song link" placeholder="https://…" /></td>
                    <td><select bind:value={musicForm.type} aria-label="Song type"><option value="entrance">Entrance</option><option value="first-dance">First dance</option><option value="party">Party</option><option value="reception">Reception</option><option value="other">Other</option></select></td>
                    <td><div class="inline-row-actions"><button type="button" onclick={addSong}>Save</button><button type="button" onclick={() => (showMusicForm = false)}>Cancel</button></div></td>
                  </tr>
                {/if}
                {#each sortedSongs as song (song.id)}
                  <tr><td><input class="bulk-select-checkbox" type="checkbox" checked={selectedSongIds.includes(song.id)} onchange={() => toggleSongSelection(song.id)} aria-label={`Select ${song.name}`} /><span class="music-song-name"><i aria-hidden="true">♪</i><strong>{song.name}</strong></span></td><td>{#if song.link}<a class="music-link" href={songLinkHref(song.link)} target="_blank" rel="noreferrer">Open song <span aria-hidden="true">↗</span></a>{:else}<span class="music-no-link">No link</span>{/if}</td><td><span class={`music-type music-type--${song.type}`}>{songTypeLabel(song.type)}</span></td><td><button class="dashboard-row-remove" type="button" onclick={() => removeSong(song.id)} aria-label={`Remove ${song.name}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></td></tr>
                {:else}
                  {#if !showMusicForm}<tr class="music-empty-row"><td colspan="4"><p>No songs added yet. Add your first song to start planning the soundtrack.</p></td></tr>{/if}
                {/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'messages'}
        <section class="dashboard-view" aria-labelledby="messages-heading">
          <header class="dashboard-page-heading">
            <div><h1 id="messages-heading">Messages</h1><p>Read the notes your guests leave through your event website.</p></div>
          </header>

          <div class="table-topbar"><div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={messageSearch} placeholder="Search messages" aria-label="Search messages" /><span>{filteredMessages.length}</span></label>{#if visibleSelectedMessageIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedMessageIds.length} selected</span><button type="button" class="bulk-delete-button" aria-label="Delete selected messages" title="Delete selected" onclick={() => requestBulkDelete('messages')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div><div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Filter messages"><button class:active={messageFilter === 'all'} type="button" onclick={() => (messageFilter = 'all')}>All <strong>{(data.messages ?? []).length}</strong></button><button class:active={messageFilter === 'unread'} type="button" onclick={() => (messageFilter = 'unread')}>Unread <strong>{(data.messages ?? []).filter((message) => !message.read).length}</strong></button><button class:active={messageFilter === 'read'} type="button" onclick={() => (messageFilter = 'read')}>Read <strong>{(data.messages ?? []).filter((message) => message.read).length}</strong></button></div><button class="table-download-button" type="button" onclick={downloadMessageCsv} aria-label="Download messages CSV" title="Download CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div></div>

          <div class="dashboard-table-wrap">
            <table class="dashboard-data-table dashboard-message-table">
              <thead><tr>
                <th aria-sort={messageSort.key === 'name' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><div class="bulk-header-cell"><input class="bulk-select-checkbox" use:setIndeterminate={someMessagesSelected} type="checkbox" checked={allMessagesSelected} onchange={(event) => selectAllMessages(event.currentTarget.checked)} aria-label="Select all messages" /><button class="guest-sort-button" class:sorted={messageSort.key === 'name'} type="button" onclick={() => toggleTableSort('messages', 'name')}>Guest <span aria-hidden="true">{sortArrow(messageSort, 'name')}</span></button></div></th>
                <th aria-sort={messageSort.key === 'sentAt' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'sentAt'} type="button" onclick={() => toggleTableSort('messages', 'sentAt')}>Date sent <span aria-hidden="true">{sortArrow(messageSort, 'sentAt')}</span></button></th>
                <th aria-sort={messageSort.key === 'contact' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'contact'} type="button" onclick={() => toggleTableSort('messages', 'contact')}>Contact details <span aria-hidden="true">{sortArrow(messageSort, 'contact')}</span></button></th>
                <th aria-sort={messageSort.key === 'message' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'message'} type="button" onclick={() => toggleTableSort('messages', 'message')}>Message <span aria-hidden="true">{sortArrow(messageSort, 'message')}</span></button></th>
                <th aria-sort={messageSort.key === 'read' ? (messageSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={messageSort.key === 'read'} type="button" onclick={() => toggleTableSort('messages', 'read')}>Status <span aria-hidden="true">{sortArrow(messageSort, 'read')}</span></button></th>
                <th><span class="sr-only">Actions</span></th>
              </tr></thead>
              <tbody>
                {#each sortedMessages as message (message.id)}
                  <tr class:unread={!message.read}>
                    <td><input class="bulk-select-checkbox" type="checkbox" checked={selectedMessageIds.includes(message.id)} onchange={() => toggleMessageSelection(message.id)} aria-label={`Select message from ${message.name}`} /><i class={avatarTone(message.guestId || message.name)}>{message.name.slice(0, 1)}</i><span><strong>{message.name}</strong><small>{message.guestId ? 'Guest list' : 'Website visitor'}</small></span></td>
                    <td><time datetime={message.sentAt}>{formatMessageDate(message.sentAt)}</time></td>
                    <td><span class="message-contact">{#if message.email}<a href={`mailto:${message.email}`}>{message.email}</a>{/if}{#if message.phone}<a href={`tel:${message.phone}`}>{message.phone}</a>{/if}{#if !message.email && !message.phone}<small>No contact details</small>{/if}</span></td>
                    <td><p class="message-copy">{message.message}</p></td>
                    <td><button class:active={message.read} class="message-read-toggle" type="button" aria-pressed={message.read} onclick={() => updateMessage(message.id, { read: !message.read })}><i>{message.read ? '✓' : ''}</i>{message.read ? 'Read' : 'Mark as read'}</button></td>
                    <td><button class="dashboard-row-remove" type="button" aria-label={`Delete message from ${message.name}`} onclick={() => removeMessage(message.id)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></td>
                  </tr>
                {:else}
                  <tr class="message-empty-row"><td colspan="6"><p>No guest messages yet. Messages submitted through your website will appear here.</p></td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'vendors'}
        <section class="dashboard-view" aria-labelledby="vendors-heading">
          <header class="dashboard-page-heading">
            <div><h1 id="vendors-heading">Vendors</h1><p>Keep every supplier, contact, quote and booking detail together.</p></div>
            <button class="dashboard-primary" type="button" onclick={() => (showVendorForm = true)}>+ Add vendor</button>
          </header>

          <div class="table-topbar"><div class="table-topbar-left"><label class="table-search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg><input bind:value={vendorSearch} placeholder="Search vendors" aria-label="Search vendors" /><span>{filteredVendors.length}</span></label>{#if visibleSelectedVendorIds.length > 0}<div class="table-selected-actions"><span>{visibleSelectedVendorIds.length} selected</span><button type="button" class="bulk-delete-button" aria-label="Delete selected vendors" title="Delete selected" onclick={() => requestBulkDelete('vendors')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></div>{/if}</div><div class="table-topbar-right"><div class="table-filter-chips" role="group" aria-label="Vendor status and budget"><button class:active={vendorFilter === 'all'} type="button" onclick={() => (vendorFilter = 'all')}>All <strong>{(data.vendors ?? []).length}</strong></button><button class:active={vendorFilter === 'booked'} type="button" onclick={() => (vendorFilter = 'booked')}>Booked <strong>{(data.vendors ?? []).filter((vendor) => ['booked', 'paid'].includes(vendor.status)).length}</strong></button><button class:active={vendorFilter === 'planning'} type="button" onclick={() => (vendorFilter = 'planning')}>Planning <strong>{(data.vendors ?? []).filter((vendor) => !['booked', 'paid'].includes(vendor.status)).length}</strong></button><span class="table-info-chip">Budget <strong>€{(data.vendors ?? []).reduce((total, vendor) => total + (Number(vendor.cost) || 0), 0).toLocaleString()}</strong></span></div><button class="table-download-button" type="button" onclick={downloadVendorCsv} aria-label="Download vendors CSV" title="Download CSV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 18v3h14v-3" /></svg></button></div></div>

          <div class="dashboard-table-wrap">
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
                {#if showVendorForm}
                  <tr class="vendor-form-row"><td colspan="7">
                    <form class="vendor-inline-form" onsubmit={addVendor}>
                      <label><span>Vendor or company *</span><input bind:value={vendorForm.name} required placeholder="Company name" /></label>
                      <label><span>Category</span><select bind:value={vendorForm.category}><option>Venue</option><option>Catering</option><option>Photography</option><option>Videography</option><option>Flowers</option><option>Music / DJ</option><option>Decor</option><option>Transport</option><option>Entertainment</option><option>Beauty</option><option>Stationery</option><option>Other</option></select></label>
                      <label><span>Contact person</span><input bind:value={vendorForm.contact} placeholder="Full name" /></label>
                      <label><span>Email</span><input bind:value={vendorForm.email} type="email" placeholder="hello@example.com" /></label>
                      <label><span>Phone</span><input bind:value={vendorForm.phone} type="tel" placeholder="Phone number" /></label>
                      <label><span>Website</span><input bind:value={vendorForm.website} type="text" placeholder="example.com" /></label>
                      <label><span>Estimated cost (€)</span><input bind:value={vendorForm.cost} type="number" min="0" step="0.01" placeholder="0" /></label>
                      <label><span>Deposit paid (€)</span><input bind:value={vendorForm.deposit} type="number" min="0" step="0.01" placeholder="0" /></label>
                      <label><span>Status</span><select bind:value={vendorForm.status}><option value="researching">Researching</option><option value="contacted">Contacted</option><option value="quoted">Quote received</option><option value="booked">Booked</option><option value="paid">Paid</option></select></label>
                      <label class="vendor-note-field"><span>Notes</span><textarea bind:value={vendorForm.note} rows="2" placeholder="Package details, next steps, reminders…"></textarea></label>
                      <div class="vendor-form-actions"><button class="dashboard-primary" type="submit">Save vendor</button><button class="dashboard-secondary" type="button" onclick={() => (showVendorForm = false)}>Cancel</button></div>
                    </form>
                  </td></tr>
                {/if}
                {#each sortedVendors as vendor (vendor.id)}
                  <tr>
                    <td><div class="vendor-name-cell"><input class="bulk-select-checkbox" type="checkbox" checked={selectedVendorIds.includes(vendor.id)} onchange={() => toggleVendorSelection(vendor.id)} aria-label={`Select ${vendor.name}`} /><span class="vendor-name"><strong>{vendor.name}</strong>{#if vendor.website}<a href={vendorWebsiteHref(vendor.website)} target="_blank" rel="noreferrer">{vendor.website}</a>{/if}</span></div></td>
                    <td><span class="vendor-category">{vendor.category}</span></td>
                    <td><span class="vendor-contact"><strong>{vendor.contact || 'No contact name'}</strong>{#if vendor.email}<a href={`mailto:${vendor.email}`}>{vendor.email}</a>{/if}{#if vendor.phone}<a href={`tel:${vendor.phone}`}>{vendor.phone}</a>{/if}</span></td>
                    <td><span class="vendor-budget"><strong>{vendor.cost ? `€${Number(vendor.cost).toLocaleString()}` : 'Not set'}</strong><small>{vendor.deposit ? `€${Number(vendor.deposit).toLocaleString()} deposit` : 'No deposit recorded'}</small></span></td>
                    <td><select class={`vendor-status vendor-status--${vendor.status}`} value={vendor.status} aria-label={`Status for ${vendor.name}`} onchange={(event) => updateVendor(vendor.id, { status: event.currentTarget.value })}><option value="researching">Researching</option><option value="contacted">Contacted</option><option value="quoted">Quote received</option><option value="booked">Booked</option><option value="paid">Paid</option></select></td>
                    <td><span class="vendor-note">{vendor.note || 'No notes'}</span></td>
                    <td><button class="dashboard-row-remove" type="button" aria-label={`Remove ${vendor.name}`} onclick={() => (vendorToDelete = vendor)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg></button></td>
                  </tr>
                {:else}
                  {#if !showVendorForm}<tr class="vendor-empty-row"><td colspan="7"><p>No vendors added yet. Add your first supplier to start tracking plans and costs.</p></td></tr>{/if}
                {/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'notes'}
        <section class="dashboard-view notes-view" aria-labelledby="notes-heading">
          <header class="dashboard-page-heading notes-heading">
            <div><h1 id="notes-heading">Notes and Calendar</h1></div>
          </header>

          <div class="notes-calendar-layout">
            <section class="notes-calendar-panel" aria-labelledby="calendar-panel-heading">
              <header class="notes-section-header">
                <h2 id="calendar-panel-heading">Calendar</h2>
                <button class="notes-collapse-button" type="button" aria-expanded={!notesSectionsCollapsed.calendar} aria-label={notesSectionsCollapsed.calendar ? 'Expand calendar' : 'Minimize calendar'} onclick={() => toggleNotesSection('calendar')}>{notesSectionsCollapsed.calendar ? '+' : '−'}</button>
              </header>
              {#if !notesSectionsCollapsed.calendar}
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
                    <button class:outside-month={!day.inMonth} class:selected-day={selectedDayKey === day.key} class:has-events={eventCount > 0} class="notes-calendar-day" type="button" role="gridcell" aria-pressed={selectedDayKey === day.key} aria-label={`${day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${eventCount ? `, ${eventCount} events` : ''}`} onclick={() => { selectedDayKey = day.key; calendarEventFormOpen = false }}>
                      <span>{day.date.getDate()}</span>
                      {#if eventCount > 0}<i aria-hidden="true"></i>{/if}
                    </button>
                  {/each}
                </div>
              {/if}
            </section>

            <section class="notes-content-panel" aria-labelledby="day-notes-heading">
              <header class="notes-section-header">
                <div><p class="dashboard-eyebrow">Selected day</p><h2 id="day-notes-heading">{new Date(`${selectedDayKey}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2></div>
                <button class="notes-collapse-button" type="button" aria-expanded={!notesSectionsCollapsed.day} aria-label={notesSectionsCollapsed.day ? 'Expand selected-day notes' : 'Minimize selected-day notes'} onclick={() => toggleNotesSection('day')}>{notesSectionsCollapsed.day ? '+' : '−'}</button>
              </header>
              {#if !notesSectionsCollapsed.day}
                <div class="notes-day-events">
                  <div class="notes-subsection-heading"><h3>Events</h3><button class="dashboard-secondary" type="button" onclick={() => (calendarEventFormOpen = !calendarEventFormOpen)}>{calendarEventFormOpen ? 'Cancel' : '+ Add event'}</button></div>
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
              {/if}
            </section>

            <section class="notes-content-panel notes-fixed-panel" aria-labelledby="fixed-notes-heading">
              <header class="notes-section-header">
                <div><p class="dashboard-eyebrow">Always available</p><h2 id="fixed-notes-heading">Fixed notes</h2></div>
                <button class="notes-collapse-button" type="button" aria-expanded={!notesSectionsCollapsed.fixed} aria-label={notesSectionsCollapsed.fixed ? 'Expand fixed notes' : 'Minimize fixed notes'} onclick={() => toggleNotesSection('fixed')}>{notesSectionsCollapsed.fixed ? '+' : '−'}</button>
              </header>
              {#if !notesSectionsCollapsed.fixed}
                <label class="notes-textarea-label" for="fixed-notes"><span>Notes that stay here</span><textarea id="fixed-notes" value={data.notesCalendar?.fixedNotes ?? ''} oninput={(event) => updateFixedNotes(event.currentTarget.value)} placeholder="Keep important notes here…"></textarea></label>
              {/if}
            </section>
          </div>
        </section>

      {:else if active === 'website'}
        <section class="dashboard-view" aria-labelledby="website-heading">
          <header class="dashboard-page-heading"><div><p class="dashboard-eyebrow">Your digital invitation</p><h1 id="website-heading">Website settings</h1><p>Edit the invitation your guests see and manage its public link.</p></div><button class="dashboard-primary" type="button" onclick={onEditWebsite}>Edit website</button></header>
          <div class="website-management-grid">
            <section class="website-preview-card"><div class={`cart-item__art cart-item__art--${template.id}`}><span>{site.title}</span><i>{site.occasionName}</i></div><div><span><i></i> Published</span><h2>{template.name}</h2><p>Last saved just now</p><button type="button" onclick={onEditWebsite}>Open website editor <span>→</span></button></div></section>
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
