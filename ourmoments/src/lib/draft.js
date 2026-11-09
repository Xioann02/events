import { getOccasion, getTemplate, sectionOrder } from './catalog.js'

function copy(value) {
  return JSON.parse(JSON.stringify(value))
}

export function normalizeCoverPosition(position) {
  const x = Number(position?.x)
  const y = Number(position?.y)
  return {
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 50,
  }
}

export function normalizeCoverZoom(value) {
  const zoom = Number(value)
  return Number.isFinite(zoom) ? Math.min(2, Math.max(0.5, zoom)) : 1
}

export function createDraft(occasionId = 'wedding', templateId = 'classic') {
  const occasion = getOccasion(occasionId)

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    occasionId: occasion.id,
    templateId: getTemplate(templateId).id,
    ...copy(occasion.defaults),
    images: { cover: '', coverPosition: { x: 50, y: 50 }, coverZoom: 1 },
    sections: Object.fromEntries(
      sectionOrder.map((sectionId) => [sectionId, occasion.defaultSections.includes(sectionId)]),
    ),
  }
}

export function adaptDraftToOccasion(draft, occasionId) {
  const adapted = createDraft(occasionId, draft.templateId)

  return {
    ...adapted,
    id: draft.id,
    date: draft.date,
    time: draft.time,
    venue: draft.venue,
    location: draft.location,
    images: {
      cover: draft.images?.cover ?? '',
      coverPosition: normalizeCoverPosition(draft.images?.coverPosition),
      coverZoom: normalizeCoverZoom(draft.images?.coverZoom),
    },
  }
}

export function setSectionEnabled(draft, sectionId, enabled) {
  if (!sectionOrder.includes(sectionId)) return draft

  return {
    ...draft,
    sections: {
      ...draft.sections,
      [sectionId]: Boolean(enabled),
    },
  }
}

export function createCartItem(draft) {
  const template = getTemplate(draft.templateId)
  const occasion = getOccasion(draft.occasionId)

  return {
    id: draft.id,
    templateId: template.id,
    templateName: template.name,
    occasionId: occasion.id,
    occasionName: occasion.label,
    title: draft.title,
    date: draft.date,
    price: template.price,
    draft: copy(draft),
  }
}

export function createPlanCartItem(plan, draftOrOccasionId = 'wedding', templateId = 'classic') {
  const draft = typeof draftOrOccasionId === 'string'
    ? createDraft(draftOrOccasionId, templateId)
    : copy(draftOrOccasionId)
  return {
    ...createCartItem(draft),
    id: `${plan.id}-${draft.id}`,
    planId: plan.id,
    planName: plan.name,
    price: plan.price,
  }
}

export function addOrReplaceCartItem(items, item) {
  const existingIndex = items.findIndex((candidate) => candidate.id === item.id)
  if (existingIndex === -1) return [...items, copy(item)]

  return items.map((candidate, index) => (index === existingIndex ? copy(item) : candidate))
}

export function cartTotal(items) {
  return items.reduce((total, item) => total + item.price, 0)
}
