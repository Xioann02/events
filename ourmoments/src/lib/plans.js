export const plans = [
  {
    id: 'essential',
    name: 'Standard',
    price: 150,
    description: 'Everything you need to bring one event together in one beautiful place.',
    features: [
      'One invitation website',
      'Choose from the full template collection',
      'Edit event details, schedule and FAQs',
      'Private planning dashboard',
    ],
  },
  {
    id: 'celebration',
    name: 'Plus',
    price: 200,
    description: 'More room for the details, people and moments around your celebration.',
    features: [
      'Everything in Standard',
      'Multiple event moments in one plan',
      'Guest and seating organisation',
      'Photo and gift tracking tools',
    ],
    featured: true,
  },
]

export function getPlan(planId) {
  return plans.find((plan) => plan.id === planId)
}