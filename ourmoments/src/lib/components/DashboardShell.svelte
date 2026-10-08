<script>
  import { formatEventDate, getTemplate } from '../catalog.js'
  import { createGift, createGuest, createTable, dashboardSummary } from '../dashboard-data.js'
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
    { id: 'rsvps', label: 'RSVPs', glyph: '✓' },
    { id: 'photos', label: 'Photos', glyph: '▧' },
    { id: 'gifts', label: 'Gifts', glyph: '◇' },
    { id: 'website', label: 'Website', glyph: '↗' },
    { id: 'qr', label: 'QR code', glyph: '⌗' },
  ]

  const photoAssets = { couple: couplePhoto, table: tablePhoto, 'still-life': stillLifePhoto }

  let active = $state('overview')
  let mobileNavOpen = $state(false)
  let guestSearch = $state('')
  let guestSort = $state({ key: 'name', direction: 'asc' })
  let guestToDelete = $state(null)
  let openGuestMenuId = $state('')
  let editingGuestId = $state('')
  let rsvpFilter = $state('all')
  let showGuestForm = $state(false)
  let showTableForm = $state(false)
  let showGiftForm = $state(false)
  let draggedGuestId = $state('')
  let copied = $state(false)
  let guestForm = $state({ name: '', email: '', phone: '', party: 1, status: 'pending', note: '' })
  let guestEditForm = $state({ name: '', email: '', phone: '', party: 1, status: 'pending', note: '' })
  let tableForm = $state({ capacity: 8 })
  let giftForm = $state({ guestId: '', guest: '', type: 'money', amount: '', currency: 'EUR', gift: '', note: '' })

  let summary = $derived(dashboardSummary(data))
  let template = $derived(getTemplate(site.templateId))
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
  let unassignedGuests = $derived(data.guests.filter((guest) => guest.status === 'attending' && !guest.tableId))

  function navigate(section) {
    active = section
    mobileNavOpen = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function addGuest(event) {
    event.preventDefault()
    if (!guestForm.name.trim()) return
    const guest = createGuest(guestForm)
    data = { ...data, guests: [...data.guests, guest] }
    guestForm = { name: '', email: '', phone: '', party: 1, status: 'pending', note: '' }
    showGuestForm = false
    onNotify('Guest added to your list.')
  }

  function openGuestRow() {
    openGuestMenuId = ''
    editingGuestId = ''
    guestForm = { name: '', email: '', phone: '', party: 1, status: 'pending', note: '' }
    showGuestForm = true
  }

  function cancelGuestRow() {
    guestForm = { name: '', email: '', phone: '', party: 1, status: 'pending', note: '' }
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
    openGuestMenuId = ''
    guestToDelete = null
    onNotify('Guest removed.')
  }

  function toggleGuestMenu(guestId) {
    openGuestMenuId = openGuestMenuId === guestId ? '' : guestId
  }

  function closeGuestMenuFromOutside(event) {
    if (!event.target.closest?.('.guest-action-menu')) openGuestMenuId = ''
  }

  function startEditingGuest(guest) {
    guestEditForm = {
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      party: guest.party,
      status: guest.status,
      note: guest.note,
    }
    editingGuestId = guest.id
    openGuestMenuId = ''
    showGuestForm = false
  }

  function saveGuestEdit() {
    if (!guestEditForm.name.trim()) return
    updateGuest(editingGuestId, {
      ...guestEditForm,
      name: guestEditForm.name.trim(),
      party: Math.max(1, Number(guestEditForm.party) || 1),
    })
    editingGuestId = ''
    onNotify('Guest updated.')
  }

  function cancelGuestEdit() {
    editingGuestId = ''
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
    const table = createTable(data.tables.length + 1, tableForm.capacity)
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

  function dropGuest(tableId) {
    if (!draggedGuestId) return
    updateGuest(draggedGuestId, { tableId })
    draggedGuestId = ''
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

  function giftLabel(gift) {
    if (gift.type === 'money') return `${gift.currency === 'EUR' ? '€' : `${gift.currency} `}${gift.amount}`
    return gift.gift
  }

  function toggleThanked(giftId) {
    data = {
      ...data,
      gifts: data.gifts.map((gift) => (gift.id === giftId ? { ...gift, thanked: !gift.thanked } : gift)),
    }
  }

  function removeGift(giftId) {
    data = { ...data, gifts: data.gifts.filter((gift) => gift.id !== giftId) }
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

  function closeForms() {
    showGuestForm = false
    showTableForm = false
    showGiftForm = false
  }
</script>

<svelte:window
  onclick={closeGuestMenuFromOutside}
  onkeydown={(event) => event.key === 'Escape' && (openGuestMenuId = '')}
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
          {#if item.id === 'rsvps' && summary.pending > 0}<b>{summary.pending}</b>{/if}
        </button>
      {/each}
    </nav>

    <div class="dashboard-sidebar__footer">
      <button type="button" onclick={onHome}><span aria-hidden="true">←</span> Back to storefront</button>
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
            <p>Everything for {data.eventName}, from the first reply to the final photograph.</p>
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
              <div class="dashboard-panel-heading"><div><span>Live updates</span><h2>Recent activity</h2></div><button type="button" onclick={() => navigate('rsvps')}>View all</button></div>
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
            <div><p class="dashboard-eyebrow">Guest management</p><h1 id="guests-heading">Your guest list</h1><p>Keep every invitation, reply and dietary note together.</p></div>
          </header>

          <div class="dashboard-toolbar dashboard-guest-toolbar">
            <label class="dashboard-search"><span aria-hidden="true">⌕</span><input bind:value={guestSearch} placeholder="Search guests or email" aria-label="Search guests" /></label>
            <span>{filteredGuests.length} guests shown</span>
          </div>

          <div class="dashboard-table-wrap">
            <table class="dashboard-data-table dashboard-guest-table">
              <thead><tr>
                <th aria-sort={guestSort.key === 'name' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'name'} type="button" onclick={() => sortGuests('name')}>Name <span aria-hidden="true">{guestSort.key === 'name' && guestSort.direction === 'desc' ? '↓' : '↑'}</span></button></th>
                <th aria-sort={guestSort.key === 'party' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'party'} type="button" onclick={() => sortGuests('party')}>Number of people <span aria-hidden="true">{guestSort.key === 'party' && guestSort.direction === 'desc' ? '↓' : '↑'}</span></button></th>
                <th aria-sort={guestSort.key === 'email' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'email'} type="button" onclick={() => sortGuests('email')}>Contact details <span aria-hidden="true">{guestSort.key === 'email' && guestSort.direction === 'desc' ? '↓' : '↑'}</span></button></th>
                <th aria-sort={guestSort.key === 'note' ? (guestSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}><button class="guest-sort-button" class:sorted={guestSort.key === 'note'} type="button" onclick={() => sortGuests('note')}>Note <span aria-hidden="true">{guestSort.key === 'note' && guestSort.direction === 'desc' ? '↓' : '↑'}</span></button></th>
                <th class="guest-action-heading"><button class="guest-add-icon dashboard-primary" type="button" onclick={openGuestRow}><span aria-hidden="true">+</span> Add guest</button></th>
              </tr></thead>
              <tbody>
                {#if showGuestForm}
                  <tr class="dashboard-inline-row">
                    <td><input bind:value={guestForm.name} aria-label="Guest name" required placeholder="Full name" /></td>
                    <td><input class="guest-number-input" bind:value={guestForm.party} type="number" min="1" max="20" aria-label="Number of people" /></td>
                    <td><div class="guest-contact"><input bind:value={guestForm.email} type="email" aria-label="Guest email" placeholder="Email" /><input bind:value={guestForm.phone} type="tel" aria-label="Guest phone" placeholder="Phone" /></div></td>
                    <td><textarea bind:value={guestForm.note} rows="2" aria-label="Guest note" placeholder="Add note"></textarea></td>
                    <td class="guest-row-action-cell"><div class="inline-row-actions guest-row-actions"><button class="guest-save-button" type="button" onclick={addGuest} aria-label="Save guest" title="Save guest">OK</button><button class="guest-cancel-button" type="button" onclick={cancelGuestRow} aria-label="Close guest row" title="Close">×</button></div></td>
                  </tr>
                {/if}
                {#each sortedGuests as guest, index}
                  {#if editingGuestId === guest.id}
                    <tr class="dashboard-edit-row">
                      <td><input bind:value={guestEditForm.name} aria-label="Guest name" required placeholder="Full name" /></td>
                      <td><input class="guest-number-input" bind:value={guestEditForm.party} type="number" min="1" max="20" aria-label="Number of people" /></td>
                      <td><div class="guest-contact"><input bind:value={guestEditForm.email} type="email" aria-label="Guest email" placeholder="Email" /><input bind:value={guestEditForm.phone} type="tel" aria-label="Guest phone" placeholder="Phone" /></div></td>
                      <td><textarea bind:value={guestEditForm.note} rows="2" aria-label="Guest note" placeholder="Add note"></textarea></td>
                      <td class="guest-row-action-cell"><div class="inline-row-actions guest-row-actions"><button class="guest-save-button" type="button" onclick={saveGuestEdit} aria-label="Save guest changes" title="Save changes">OK</button><button class="guest-cancel-button" type="button" onclick={cancelGuestEdit} aria-label="Cancel editing" title="Cancel">×</button></div></td>
                    </tr>
                  {:else}
                    <tr>
                      <td><i>{guest.name.slice(0, 1)}</i><span><strong>{guest.name}</strong></span></td>
                      <td><span>{guest.party}</span></td>
                      <td><div class="guest-contact-copy"><span>{guest.email || 'No email'}</span><small>{guest.phone || 'No phone'}</small></div></td>
                      <td><span class="guest-note-copy">{guest.note || 'No note'}</span></td>
                      <td class="guest-row-action-cell">
                        <div class="guest-action-menu">
                          <button class="guest-menu-trigger" type="button" onclick={() => toggleGuestMenu(guest.id)} aria-label={`Actions for ${guest.name}`} aria-haspopup="menu" aria-expanded={openGuestMenuId === guest.id}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
                          </button>
                          {#if openGuestMenuId === guest.id}
                            <div class:opens-up={index >= sortedGuests.length - 2} class="guest-menu-popover" role="menu">
                              <button type="button" role="menuitem" onclick={() => startEditingGuest(guest)}>
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" /><path d="m14.8 6.3 2.9 2.9" /></svg>
                                Edit
                              </button>
                              <button class="danger" type="button" role="menuitem" onclick={() => { openGuestMenuId = ''; guestToDelete = guest }}>
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>
                                Delete
                              </button>
                            </div>
                          {/if}
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </section>

      {:else if active === 'seating'}
        <section class="dashboard-view" aria-labelledby="seating-heading">
          <header class="dashboard-page-heading">
            <div><p class="dashboard-eyebrow">Table plan</p><h1 id="seating-heading">Arrange the room</h1><p>Drag guests between tables, then adjust table sizes as your plan changes.</p></div>
            <button class="dashboard-primary" type="button" onclick={() => (showTableForm = true)}>+ Add table</button>
          </header>

          <div class="seating-summary"><span><strong>{data.tables.length}</strong> tables</span><span><strong>{summary.attending}</strong> attending</span><span><strong>{unassignedGuests.reduce((total, guest) => total + guest.party, 0)}</strong> seats unassigned</span></div>

          {#if unassignedGuests.length > 0}
            <section class="unassigned-pool" role="group" aria-label="Unassigned guests" ondragover={(event) => event.preventDefault()} ondrop={() => dropGuest('')}>
              <div><span>Unassigned guests</span><small>Drag each guest to a table</small></div>
              <div>{#each unassignedGuests as guest}<button draggable="true" ondragstart={() => (draggedGuestId = guest.id)} type="button"><i>{guest.name.slice(0, 1)}</i>{guest.name}<b>{guest.party}</b></button>{/each}</div>
            </section>
          {/if}

          <div class="table-plan-grid">
            {#each data.tables as table, tableIndex}
              {@const seated = tableGuests(table.id)}
              {@const occupied = tablePartyCount(table.id)}
              <article class:over-capacity={occupied > table.capacity} class="seating-table" ondragover={(event) => event.preventDefault()} ondrop={() => dropGuest(table.id)}>
                <header><span>0{tableIndex + 1}</span><div><input value={table.name} onchange={(event) => (data = { ...data, tables: data.tables.map((item) => item.id === table.id ? { ...item, name: event.currentTarget.value } : item) })} aria-label="Table name" /><small>{occupied} of {table.capacity} seats</small></div><button type="button" onclick={() => removeTable(table.id)} aria-label={`Remove ${table.name}`}>×</button></header>
                <div class="seating-table__visual"><div><strong>{table.name}</strong><span>{table.capacity} seats</span></div>{#each Array(table.capacity) as _, seat}<i class:filled={seat < occupied}></i>{/each}</div>
                <div class="seating-table__guests">
                  {#each seated as guest}<button draggable="true" ondragstart={() => (draggedGuestId = guest.id)} type="button"><i>{guest.name.slice(0, 1)}</i><span>{guest.name}<small>Party of {guest.party}</small></span><b>⋮⋮</b></button>{/each}
                  {#if seated.length === 0}<p>Drop guests here</p>{/if}
                </div>
              </article>
            {/each}
          </div>
        </section>

      {:else if active === 'rsvps'}
        <section class="dashboard-view" aria-labelledby="rsvp-heading">
          <header class="dashboard-page-heading"><div><p class="dashboard-eyebrow">Responses</p><h1 id="rsvp-heading">Manage RSVPs</h1><p>See who is coming and follow up with anyone yet to reply.</p></div><button class="dashboard-secondary" type="button" onclick={() => onNotify('Reminder emails queued in demo mode.')}>Send reminders</button></header>
          <div class="rsvp-stat-grid"><button class:active={rsvpFilter === 'all'} onclick={() => (rsvpFilter = 'all')} type="button"><span>All guests</span><strong>{summary.total}</strong></button><button class:active={rsvpFilter === 'attending'} onclick={() => (rsvpFilter = 'attending')} type="button"><span>Attending</span><strong>{summary.attending}</strong></button><button class:active={rsvpFilter === 'pending'} onclick={() => (rsvpFilter = 'pending')} type="button"><span>Awaiting reply</span><strong>{summary.pending}</strong></button><button class:active={rsvpFilter === 'declined'} onclick={() => (rsvpFilter = 'declined')} type="button"><span>Declined</span><strong>{summary.declined}</strong></button></div>
          <div class="dashboard-toolbar"><label class="dashboard-search"><span>⌕</span><input bind:value={guestSearch} placeholder="Search responses" /></label><span>Updates save automatically</span></div>
          <div class="rsvp-list">
            {#each filteredGuests as guest}
              <article><i>{guest.name.slice(0, 1)}</i><div><strong>{guest.name}</strong><span>{guest.email || 'No email yet'} · Party of {guest.party}</span></div><label><span>Meal note</span><input value={guest.meal} onchange={(event) => updateGuest(guest.id, { meal: event.currentTarget.value })} placeholder="Not provided" /></label><select class={`status-select status-select--${guest.status}`} value={guest.status} onchange={(event) => updateGuest(guest.id, { status: event.currentTarget.value })}><option value="attending">Attending</option><option value="pending">Pending</option><option value="declined">Declined</option></select></article>
            {/each}
          </div>
        </section>

      {:else if active === 'photos'}
        <section class="dashboard-view" aria-labelledby="photos-heading">
          <header class="dashboard-page-heading"><div><p class="dashboard-eyebrow">Guest gallery</p><h1 id="photos-heading">Shared photographs</h1><p>Review what guests upload before it appears on your website.</p></div><label class="dashboard-primary dashboard-upload">+ Upload photos<input type="file" accept="image/*" multiple onchange={uploadPhotos} /></label></header>
          <div class="photo-filter-row"><span>{data.photos.length} photographs</span><p>{data.photos.filter((photo) => photo.status === 'pending').length} waiting for review</p></div>
          <div class="dashboard-photo-grid">
            {#each data.photos as photo}
              <article><img src={photoSource(photo)} alt={photo.title} /><span class:pending={photo.status === 'pending'}>{photo.status}</span><div><p><strong>{photo.title}</strong><small>Uploaded by {photo.uploader}</small></p><div>{#if photo.status === 'pending'}<button type="button" onclick={() => updatePhoto(photo.id, 'approved')}>Approve</button>{/if}<button type="button" onclick={() => removePhoto(photo.id)}>Remove</button></div></div></article>
            {/each}
          </div>
        </section>

      {:else if active === 'gifts'}
        <section class="dashboard-view" aria-labelledby="gifts-heading">
          <header class="dashboard-page-heading"><div><p class="dashboard-eyebrow">Gift list</p><h1 id="gifts-heading">Thoughtful things</h1><p>Track monetary gifts and meaningful items, linked directly to your guests.</p></div><button class="dashboard-primary" type="button" onclick={() => openGiftForm()}>+ Add gift</button></header>
          <div class="gift-summary"><span><strong>{data.gifts.length}</strong> gifts received</span><span><strong>{data.gifts.filter((gift) => gift.thanked).length}</strong> thank-yous sent</span><i style={`--progress:${(data.gifts.filter((gift) => gift.thanked).length / Math.max(1, data.gifts.length)) * 100}%`}></i></div>
          <div class="dashboard-table-wrap">
            <table class="dashboard-data-table dashboard-gift-table">
              <thead><tr><th>Guest</th><th>Gift type</th><th>Amount or gift</th><th>Note</th><th>Thank you</th><th><span class="sr-only">Actions</span></th></tr></thead>
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
                {#each data.gifts as gift}<tr class:thanked={gift.thanked}><td><i>{gift.guest.slice(0, 1)}</i><span><strong>{gift.guest}</strong><small>{gift.guestId ? 'Guest list' : 'Not on guest list'}</small></span></td><td><span class={`gift-type gift-type--${gift.type}`}>{gift.type === 'money' ? 'Money' : 'Item'}</span></td><td><strong class="gift-value">{giftLabel(gift)}</strong></td><td><span class="gift-note">{gift.note || 'No note added'}</span></td><td><button class="gift-thank-toggle" class:active={gift.thanked} type="button" onclick={() => toggleThanked(gift.id)} aria-pressed={gift.thanked}><i>{gift.thanked ? '✓' : ''}</i>{gift.thanked ? 'Thanked' : 'Pending'}</button></td><td><button class="dashboard-row-remove" type="button" onclick={() => removeGift(gift.id)} aria-label={`Remove gift from ${gift.guest}`}>×</button></td></tr>{/each}
              </tbody>
            </table>
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

{#if showTableForm}
  <div class="dashboard-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeForms()}>
    <div class="dashboard-modal" role="dialog" aria-modal="true" aria-label="Add table">
      <button class="dashboard-modal-close" type="button" onclick={closeForms} aria-label="Close">×</button>
      <span>Table plan</span><h2>Add another table</h2><p>You can arrange guests as soon as it is added.</p>
      <form onsubmit={addTable}><label><span>Number of seats</span><input bind:value={tableForm.capacity} type="number" min="2" max="20" required /></label><button class="dashboard-primary" type="submit">Add table</button></form>
    </div>
  </div>
{/if}
