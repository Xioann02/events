function id(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function createDashboardData(site) {
  const title = site?.title || 'Your celebration'
  const guests = [
    { id: id('guest'), name: 'Elena Marin', email: 'elena@example.com', phone: '+357 99 123456', party: 2, status: 'attending', attended: true, note: 'Travelling with partner.', tableId: 'table-1', meal: 'Vegetarian' },
    { id: id('guest'), name: 'Marcus Cole', email: 'marcus@example.com', phone: '+357 96 234567', party: 1, status: 'attending', attended: true, note: '', tableId: 'table-1', meal: 'Chicken' },
    { id: id('guest'), name: 'Amelia Hart', email: 'amelia@example.com', phone: '', party: 2, status: 'pending', attended: null, note: 'Follow up next week.', tableId: '', meal: '' },
    { id: id('guest'), name: 'Theo James', email: 'theo@example.com', phone: '+357 97 345678', party: 1, status: 'attending', attended: null, note: '', tableId: 'table-2', meal: 'Beef' },
    { id: id('guest'), name: 'Maya Lewis', email: 'maya@example.com', phone: '', party: 1, status: 'declined', attended: false, note: 'Sending her wishes.', tableId: '', meal: '' },
    { id: id('guest'), name: 'Noah Bennett', email: 'noah@example.com', phone: '+357 95 456789', party: 2, status: 'attending', attended: null, note: '', tableId: 'table-2', meal: 'Fish' },
    { id: id('guest'), name: 'Emma Bennett', email: 'emma@example.com', phone: '', party: 1, status: 'pending', attended: null, note: '', tableId: '', meal: '' },
    { id: id('guest'), name: 'Alex Reed', email: 'alex@example.com', phone: '+357 94 567890', party: 2, status: 'attending', attended: true, note: '', tableId: 'table-3', meal: 'Vegetarian' },
  ]

  const guestId = (name) => guests.find((guest) => guest.name === name)?.id ?? ''

  return {
    eventName: title,
    siteUrl: `https://ourmoments.io/${slugify(title) || 'your-event'}`,
    published: true,
    tables: [
      { id: 'table-1', name: 'Table 1', capacity: 8 },
      { id: 'table-2', name: 'Table 2', capacity: 8 },
      { id: 'table-3', name: 'Table 3', capacity: 6 },
    ],
    guests,
    gifts: [
      { id: id('gift'), guestId: guestId('Elena Marin'), guest: 'Elena Marin', type: 'item', amount: '', currency: 'EUR', gift: 'Handmade ceramic serving bowl', note: 'For all the dinners ahead.', thanked: true },
      { id: id('gift'), guestId: guestId('Marcus Cole'), guest: 'Marcus Cole', type: 'money', amount: '200', currency: 'EUR', gift: '', note: 'For the weekend away.', thanked: false },
      { id: id('gift'), guestId: guestId('Theo James'), guest: 'Theo James', type: 'item', amount: '', currency: 'EUR', gift: 'Linen table set', note: 'For your first Sunday lunch.', thanked: false },
    ],
    photos: [
      { id: id('photo'), title: 'The two of you', uploader: 'You', asset: 'couple', status: 'approved' },
      { id: id('photo'), title: 'Dinner details', uploader: 'Elena', asset: 'table', status: 'approved' },
      { id: id('photo'), title: 'A quiet detail', uploader: 'Marcus', asset: 'still-life', status: 'pending' },
    ],
    activity: [
      { id: id('activity'), text: 'Elena Marin confirmed attendance', time: '12 minutes ago', tone: 'positive' },
      { id: id('activity'), text: 'Marcus uploaded a photo', time: '1 hour ago', tone: 'neutral' },
      { id: id('activity'), text: 'Amelia opened the invitation', time: 'Yesterday', tone: 'neutral' },
    ],
  }
}

export function createGuest(values) {
  return {
    id: id('guest'),
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone?.trim() ?? '',
    party: Math.max(1, Number(values.party) || 1),
    status: values.status || 'pending',
    attended: null,
    note: values.note?.trim() ?? '',
    tableId: '',
    meal: '',
  }
}

export function createTable(number, capacity = 8) {
  return { id: id('table'), name: `Table ${number}`, capacity: Math.max(2, Number(capacity) || 8) }
}

export function createGift(values) {
  return {
    id: id('gift'),
    guestId: values.guestId || '',
    guest: values.guest.trim(),
    type: values.type === 'item' ? 'item' : 'money',
    amount: values.type === 'money' ? String(values.amount ?? '').trim() : '',
    currency: values.currency || 'EUR',
    gift: values.type === 'item' ? values.gift.trim() : '',
    note: values.note.trim(),
    thanked: false,
  }
}

export function dashboardSummary(data) {
  const guests = data?.guests ?? []
  return guests.reduce(
    (summary, guest) => {
      summary[guest.status] += guest.party
      summary.total += guest.party
      return summary
    },
    { total: 0, attending: 0, pending: 0, declined: 0 },
  )
}
