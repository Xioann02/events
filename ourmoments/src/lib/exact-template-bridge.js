import { formatEventDate, formatTime, getOccasion } from './catalog.js'
import { normalizeCoverPosition, normalizeCoverZoom } from './draft.js'
import modernCoupleSample from '../assets/modern-couple.jpg'
import receptionTableSample from '../assets/reception-table.jpg'
import invitationDetailSample from '../assets/editorial-still-life.jpg'
import celebrationSparklerSample from '../assets/sparkler-hero.jpg'

const gallerySamples = {
  wedding: [
    [modernCoupleSample, 'A couple walking together'],
    [receptionTableSample, 'A celebration table prepared for dinner'],
    [invitationDetailSample, 'Invitation stationery and celebration details'],
  ],
  birthday: [
    [celebrationSparklerSample, 'A sparkler glowing at a celebration'],
    [receptionTableSample, 'A dinner table set for a celebration'],
    [invitationDetailSample, 'A celebration invitation detail'],
  ],
  'baby-shower': [
    [invitationDetailSample, 'A soft-toned invitation and floral detail'],
    [receptionTableSample, 'A table set for a family gathering'],
    [modernCoupleSample, 'A family celebrating together'],
  ],
  engagement: [
    [modernCoupleSample, 'A couple walking together'],
    [celebrationSparklerSample, 'A sparkler glowing at a celebration'],
    [invitationDetailSample, 'Invitation stationery for a celebration'],
  ],
  graduation: [
    [celebrationSparklerSample, 'A sparkler at a milestone celebration'],
    [receptionTableSample, 'A table set for a graduation gathering'],
    [modernCoupleSample, 'Friends celebrating a milestone together'],
  ],
  dinner: [
    [receptionTableSample, 'A dinner table prepared for guests'],
    [invitationDetailSample, 'A place setting and paper detail'],
    [celebrationSparklerSample, 'Warm lights at an evening gathering'],
  ],
}

const managedSectionSelectors = {
  story: '.invitation-section',
  schedule: '.timeline-section',
  rsvp: '.rsvp-section',
  faq: '.faq-section',
  gallery: '.gallery-section',
}

function setText(selector, value, document) {
  const element = document.querySelector(selector)
  if (element && element.textContent !== String(value)) element.textContent = value
}

function splitTitle(title) {
  const parts = title.split('&').map((part) => part.trim()).filter(Boolean)
  return parts.length === 2 ? parts : [title.trim(), '']
}

function initials(title) {
  const [first, second] = splitTitle(title)
  return second
    ? `${first.charAt(0).toUpperCase()} & ${second.charAt(0).toUpperCase()}`
    : first.charAt(0).toUpperCase()
}

function dotInitials(title) {
  return initials(title).replace(' & ', ' · ')
}

function shortDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return ''
  const [year, month, day] = value.split('-')
  return `${day} · ${month} · ${year}`
}

function dateParts(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return { month: '', day: '', year: '' }
  const date = new Date(`${value}T12:00:00`)
  return {
    month: new Intl.DateTimeFormat('en', { month: 'short' }).format(date).toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
    year: String(date.getFullYear()),
  }
}

function displayDate(draft) {
  return `${formatEventDate(draft.date)} · ${formatTime(draft.time)}`
}

function setSplitTitle(root, title) {
  if (!root) return
  const [first, second] = splitTitle(title)
  const spans = root.querySelectorAll(':scope > span')
  const separator = root.querySelector(':scope > i')

  if (!spans.length) {
    if (root.textContent !== title) root.textContent = title
    return
  }

  if (spans[0].textContent !== first) spans[0].textContent = first
  if (spans[1]) {
    if (spans[1].textContent !== second) spans[1].textContent = second
    spans[1].hidden = !second
  }
  if (separator) separator.hidden = !second
  root.setAttribute('aria-label', title)
}

function setSplitDate(root, draft) {
  if (!root) return
  const spans = root.querySelectorAll(':scope > span')
  const date = formatEventDate(draft.date)
  const time = formatTime(draft.time)

  if (spans.length >= 2) {
    if (spans[0].textContent !== date) spans[0].textContent = date
    if (spans[1].textContent !== time) spans[1].textContent = time
  } else {
    const value = `${date} · ${time}`
    if (root.textContent !== value) root.textContent = value
  }
  root.setAttribute('datetime', `${draft.date}T${draft.time}`)
  root.setAttribute('aria-label', displayDate(draft))
}

function setCompoundInitials(selector, title, document) {
  const element = document.querySelector(selector)
  if (!element) return
  const [first, second] = splitTitle(title)
  const firstInitial = first.charAt(0).toUpperCase()
  const secondInitial = second.charAt(0).toUpperCase()
  const directTextNodes = [...element.childNodes].filter((node) => node.nodeType === 3)
  const styledSeparator = element.querySelector(':scope > i, :scope > span')

  if (!directTextNodes.length) return
  const firstValue = secondInitial ? `${firstInitial} ` : firstInitial
  if (directTextNodes[0].nodeValue !== firstValue) directTextNodes[0].nodeValue = firstValue
  if (directTextNodes.length > 1) {
    const lastValue = secondInitial ? ` ${secondInitial}` : ''
    const lastNode = directTextNodes.at(-1)
    if (lastNode.nodeValue !== lastValue) lastNode.nodeValue = lastValue
  }
  if (styledSeparator) styledSeparator.hidden = !secondInitial
}

function patchCountdown(document, draft) {
  const eventTime = new Date(`${draft.date}T${draft.time || '00:00'}`).getTime()
  const remaining = Math.max(0, eventTime - Date.now())
  const seconds = Math.floor(remaining / 1000)
  const values = [
    Math.floor(seconds / 86400),
    Math.floor((seconds % 86400) / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]

  document.querySelectorAll('.countdown-unit strong').forEach((element, index) => {
    const value = String(values[index] ?? 0).padStart(2, '0')
    if (element.textContent !== value) element.textContent = value
  })
  setText(
    '.countdown-block > .eyebrow',
    remaining > 0 ? 'Until the celebration' : 'The celebration is here',
    document,
  )
}

function patchGeneratedMarks(document, draft) {
  let style = document.getElementById('ourmoments-template-overrides')
  if (!style) {
    style = document.createElement('style')
    style.id = 'ourmoments-template-overrides'
    document.head.append(style)
  }
  const mark = initials(draft.title)
  const compactMark = mark.replaceAll(' ', '')
  style.textContent = `
    .invitation-card::before { content: ${JSON.stringify(compactMark)} !important; }
    .invitation-copy::before { content: ${JSON.stringify(mark)} !important; }
  `
}

function patchHero(document, draft, templateId) {
  const title = document.querySelector('#couple-names')
  if (templateId === 'classic') setText('#couple-names', draft.title, document)
  else setSplitTitle(title, draft.title)

  if (templateId === 'classic') {
    setText('.hero-heading > p', displayDate(draft), document)
  } else {
    setSplitDate(document.querySelector('time.hero-date'), draft)
  }

  setText('.hero-photo__number', dotInitials(draft.title), document)

  const mark = initials(draft.title)
  const date = dateParts(draft.date)
  const short = shortDate(draft.date)

  setText('.modern-brand > span', dotInitials(draft.title).replaceAll(' ', '').replace('·', '—'), document)
  setText('.modern-brand > small', `${short} · EDITION 02`, document)
  document.querySelector('.modern-brand')?.setAttribute('aria-label', draft.title)

  for (const selector of ['.playful-brand', '.luxury-brand']) {
    document.querySelector(selector)?.setAttribute('aria-label', draft.title)
    setCompoundInitials(`${selector} > span`, draft.title, document)
    setText(`${selector} > small`, `${draft.location} · ${short}`, document)
  }

  setText('.invitation-card__label', `${draft.eyebrow} · ${short}`, document)
  setCompoundInitials('.wax-seal', draft.title, document)
  setText('.hero-photo figcaption > span:first-child', mark, document)
  setText('.hero-photo figcaption > span:last-child', `${draft.location} · ${date.year}`, document)
  setCompoundInitials('.stationery-backdrop .backdrop-monogram', draft.title, document)
  setText('.stationery-backdrop small', draft.location, document)
  setText('.date-medallion > span', date.month, document)
  setText('.date-medallion > strong', date.day, document)
  setText('.date-medallion > small', date.year, document)

  const heroPhoto = document.querySelector('.hero-photo img')
  if (heroPhoto) {
    if (!heroPhoto.dataset.ourmomentsDefaultSrc) {
      heroPhoto.dataset.ourmomentsDefaultSrc = heroPhoto.getAttribute('src') ?? ''
      heroPhoto.dataset.ourmomentsDefaultObjectPosition = document.defaultView
        .getComputedStyle(heroPhoto)
        .objectPosition
    }
    const coverSrc = draft.images?.cover || heroPhoto.dataset.ourmomentsDefaultSrc
    if (heroPhoto.getAttribute('src') !== coverSrc) heroPhoto.setAttribute('src', coverSrc)
    const figure = heroPhoto.closest('.hero-photo')
    const hasUploadedCover = Boolean(draft.images?.cover)
    const coverPosition = normalizeCoverPosition(draft.images?.coverPosition)
    const coverZoom = normalizeCoverZoom(draft.images?.coverZoom)
    heroPhoto.style.objectPosition = hasUploadedCover
      ? `${coverPosition.x}% ${coverPosition.y}%`
      : heroPhoto.dataset.ourmomentsDefaultObjectPosition
    heroPhoto.classList.toggle('ourmoments-draggable', hasUploadedCover)
    figure?.classList.toggle('ourmoments-custom-cover', hasUploadedCover)
    if (hasUploadedCover) {
      figure?.style.setProperty('--ourmoments-cover-image', `url("${coverSrc}")`)
      heroPhoto.style.setProperty('--ourmoments-cover-zoom', String(coverZoom))
    } else {
      figure?.style.removeProperty('--ourmoments-cover-image')
      heroPhoto.style.removeProperty('--ourmoments-cover-zoom')
    }
    attachCoverPhotoDrag(heroPhoto)
  }
}

function attachCoverPhotoDrag(image) {
  if (image.dataset.ourmomentsDragReady) return
  image.dataset.ourmomentsDragReady = 'true'

  const figure = image.closest('.hero-photo')
  if (!figure) return
  if (!image.ownerDocument.getElementById('ourmoments-cover-drag-style')) {
    const style = image.ownerDocument.createElement('style')
    style.id = 'ourmoments-cover-drag-style'
    style.textContent = `
      .hero-photo.ourmoments-custom-cover { isolation: isolate; }
      .hero-photo.ourmoments-custom-cover::before {
        content: ''; position: absolute; z-index: 0; inset: -12px; pointer-events: none;
        background: var(--ourmoments-cover-image) center / cover no-repeat;
        filter: blur(14px) brightness(.78); transform: scale(1.05);
      }
      .hero-photo img.ourmoments-draggable {
        position: relative; z-index: 1; object-fit: contain !important;
        transform: scale(var(--ourmoments-cover-zoom, 1)) !important;
        transform-origin: center; cursor: grab; touch-action: none;
      }
      .hero-photo:has(img.ourmoments-draggable):active img { cursor: grabbing; }
    `
    image.ownerDocument.head.append(style)
  }

  let drag = null
  figure.addEventListener('pointerdown', (event) => {
    if (event.target !== image || !image.classList.contains('ourmoments-draggable') || event.button !== 0) return
    const position = image.style.objectPosition.match(/([\d.]+)%\s+([\d.]+)%/)
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: Number(position?.[1] ?? 50),
      y: Number(position?.[2] ?? 50),
    }
    figure.setPointerCapture(event.pointerId)
    event.preventDefault()
  })

  figure.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return
    const bounds = image.getBoundingClientRect()
    const zoom = normalizeCoverZoom(image.style.getPropertyValue('--ourmoments-cover-zoom'))
    const scale = Math.min(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight) * zoom
    const overflowX = bounds.width - image.naturalWidth * scale
    const overflowY = bounds.height - image.naturalHeight * scale
    const position = normalizeCoverPosition({
      x: drag.x + (overflowX ? ((event.clientX - drag.startX) / overflowX) * 100 : 0),
      y: drag.y + (overflowY ? ((event.clientY - drag.startY) / overflowY) * 100 : 0),
    })
    image.style.objectPosition = `${position.x}% ${position.y}%`
  })

  function finishDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return
    drag = null
    const position = image.style.objectPosition.match(/([\d.]+)%\s+([\d.]+)%/)
    window.dispatchEvent(new CustomEvent('ourmoments:cover-position', {
      detail: normalizeCoverPosition({ x: position?.[1], y: position?.[2] }),
    }))
  }

  figure.addEventListener('pointerup', finishDrag)
  figure.addEventListener('pointercancel', finishDrag)
}

function patchInvitation(document, draft, occasion) {
  setText('.invitation-copy > .eyebrow', draft.eyebrow, document)
  setText('#invitation-title', draft.storyTitle, document)
  setText('.invitation-section .large-copy', draft.storyBody, document)
  const parents = document.querySelector('.parents-block')
  if (parents) parents.hidden = draft.occasionId !== 'wedding'
  if (draft.occasionId === 'wedding') {
    const groups = document.querySelectorAll('.parents-list > div')
    if (groups[0]) {
      setText('span', draft.hostOneLabel, groups[0])
      setText('strong', draft.hostOne, groups[0])
    }
    if (groups[1]) {
      setText('span', draft.hostTwoLabel, groups[1])
      setText('strong', draft.hostTwo, groups[1])
    }
    document.querySelector('.parents-block')?.setAttribute('aria-label', 'Our families')
  }
  const section = document.querySelector('.invitation-section')
  section?.setAttribute('aria-label', occasion.sectionLabels.story)
}

function ensureRows(document, containerSelector, rowSelector, count) {
  const container = document.querySelector(containerSelector)
  if (!container) return []
  let rows = [...container.querySelectorAll(`:scope > ${rowSelector}`)]
  const source = rows.at(-1)

  while (rows.length < count && source) {
    const clone = source.cloneNode(true)
    clone.dataset.ourmomentsClone = 'true'
    container.append(clone)
    rows = [...container.querySelectorAll(`:scope > ${rowSelector}`)]
  }
  return rows
}

function patchSchedule(document, draft, occasion) {
  setText('.timeline-section .section-header .eyebrow', formatEventDate(draft.date), document)
  setText('#timeline-title', occasion.sectionLabels.schedule, document)
  setText('.timeline-section .section-header--split > p', draft.scheduleTitle, document)

  const rows = ensureRows(document, '.timeline-list', '.timeline-item', draft.scheduleItems.length)
  rows.forEach((row, index) => {
    const item = draft.scheduleItems[index]
    row.hidden = !item
    if (!item) return
    setText('.timeline-time', item.time, row)
    setText('.timeline-marker span', String(index + 1).padStart(2, '0'), row)
    setText('.timeline-content h3', item.title, row)
    setText('.timeline-place', item.detail || draft.venue, row)
    setText('.timeline-address', index === draft.scheduleItems.length - 1 ? draft.location : draft.venue, row)
    const link = row.querySelector('.timeline-content a')
    if (link) {
      link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${draft.venue}, ${draft.location}`)}`
      link.setAttribute('aria-label', `Open map: ${item.detail || draft.venue}`)
    }
  })
}

function patchRsvp(document, draft, occasion) {
  setText('.rsvp-intro > .eyebrow', occasion.sectionLabels.rsvp, document)
  setText('#rsvp-title', draft.rsvpTitle, document)
  setText('.rsvp-deadline', draft.rsvpBody, document)
  const contact = document.querySelector('.contact-card')
  if (contact) contact.hidden = true
}

function patchFaq(document, draft, occasion) {
  setText('.faq-heading > .eyebrow', occasion.sectionLabels.faq, document)
  setText('#faq-title', draft.faqTitle, document)
  const rows = ensureRows(document, '.accordion-list', 'div', draft.faqItems.length)
  rows.forEach((row, index) => {
    const item = draft.faqItems[index]
    row.hidden = !item
    if (!item) return
    setText('details > summary > span:first-child', item.question, row)
    setText('.accordion-content__inner > p', item.answer, row)
  })
}

function patchGallery(document, draft, occasion) {
  setText('.gallery-heading > .eyebrow', occasion.sectionLabels.gallery, document)
  setText('#gallery-title', draft.galleryTitle, document)
  setText(
    '.gallery-heading > p:last-child',
    `${draft.galleryBody} Sample template photos are shown here; guests can add their photos after publishing is available.`,
    document,
  )
  for (const element of document.querySelectorAll('.slideshow, .slide-dots')) {
    element.setAttribute('aria-label', draft.galleryTitle)
  }

  const galleryImages = [...document.querySelectorAll('.slideshow-frame > img')]
  const samples = gallerySamples[draft.occasionId] ?? gallerySamples.wedding
  galleryImages.forEach((image, index) => {
    if (!image.dataset.ourmomentsDefaultSrc) {
      image.dataset.ourmomentsDefaultSrc = image.getAttribute('src') ?? ''
    }
    const [gallerySrc, alt] = samples[index % samples.length]
    if (image.getAttribute('src') !== gallerySrc) image.setAttribute('src', gallerySrc)
    if (image.getAttribute('alt') !== alt) image.setAttribute('alt', alt)
  })
}

function patchFooter(document, draft) {
  setCompoundInitials('.footer-monogram', draft.title, document)
  setText('footer > p:nth-of-type(2)', shortDate(draft.date), document)
  setText('footer > p:nth-of-type(3)', draft.footerNote, document)
}

export function applyDraftToTemplate(document, draft, templateId) {
  if (!document?.body) return
  const occasion = getOccasion(draft.occasionId)
  document.documentElement.lang = 'en'
  document.title = `${draft.title} — ${formatEventDate(draft.date)}`

  patchHero(document, draft, templateId)
  patchGeneratedMarks(document, draft)
  patchCountdown(document, draft)
  patchInvitation(document, draft, occasion)
  patchSchedule(document, draft, occasion)
  patchRsvp(document, draft, occasion)
  patchFaq(document, draft, occasion)
  patchGallery(document, draft, occasion)
  patchFooter(document, draft)

  for (const [sectionId, selector] of Object.entries(managedSectionSelectors)) {
    const section = document.querySelector(selector)
    if (section) section.hidden = !draft.sections[sectionId]
  }
}

export function templateUrl(templateId) {
  return `/templates/${templateId}/index.html`
}
