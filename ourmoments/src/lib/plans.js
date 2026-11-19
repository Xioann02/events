const essentialWebsiteHighlights = [
  'A beautiful invitation website',
  'RSVPs, countdown, maps and FAQs',
  'Easy sharing on every device',
]

const websiteHighlights = [
  'A beautiful invitation website',
  'RSVPs, countdown, maps and FAQs',
  'Easy sharing, QR guest photo uploads and multiple languages',
]

const guestManagementHighlights = [
  'Guest lists, attendance and seating',
  'Vendors, gifts and shared photos',
  'Messages, music, notes and calendar',
]

export const plans = [
  {
    id: 'website',
    name: 'Essential',
    price: 85,
    description: 'A polished event website with the core tools your guests need.',
    featureGroups: [
      { id: 'website', title: 'Event website', features: essentialWebsiteHighlights },
    ],
    features: essentialWebsiteHighlights,
  },
  {
    id: 'essential',
    name: 'Complete',
    price: 150,
    description: 'Your full event website and private guest-management workspace.',
    featureGroups: [
      { id: 'website', title: 'Event website', features: websiteHighlights },
      { id: 'guest-management', title: 'Guest management', features: guestManagementHighlights },
    ],
    features: [...websiteHighlights, ...guestManagementHighlights],
    badge: 'Most popular',
    featured: true,
  },
  {
    id: 'celebration',
    name: 'Multi-event',
    price: 300,
    description: 'Everything in Complete for celebrations with more than one event moment.',
    features: [
      'Everything in Complete',
      'Up to 5 events in one plan',
    ],
  },
]

export function getPlan(planId) {
  return plans.find((plan) => plan.id === planId)
}
