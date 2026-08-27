import { getOccasion, getTemplate, sectionOrder } from './catalog.js'

function copy(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createDraft(occasionId = 'wedding', templateId = 'classic') {
  const occasion = getOccasion(occasionId)

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    occasionId: occasion.id,
    templateId: getTemplate(templateId).id,
    ...copy(occasion.defaults),
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

export function addOrReplaceCartItem(items, item) {
  const existingIndex = items.findIndex((candidate) => candidate.id === item.id)
  if (existingIndex === -1) return [...items, copy(item)]

  return items.map((candidate, index) => (index === existingIndex ? copy(item) : candidate))
}

export function cartTotal(items) {
  return items.reduce((total, item) => total + item.price, 0)
}
