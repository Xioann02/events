<script>
  import { onMount } from 'svelte'
  import coupleWalk from './assets/couple-walk.jpg'
  import receptionTable from './assets/reception-table.jpg'
  import weddingRings from './assets/wedding-rings.jpg'
  import AccordionItem from './lib/components/ui/AccordionItem.svelte'
  import Button from './lib/components/ui/Button.svelte'
  import { translations, WEDDING_DATE } from './lib/wedding-data.js'

  const eventTime = new Date(WEDDING_DATE).getTime()
  const baseGallery = [coupleWalk, receptionTable, weddingRings]

  let language = 'en'
  let now = Date.now()
  let currentSlide = 0
  let isPlaying = false
  let uploads = []
  let fileInput
  let uploadMessage = ''
  let uploadHasError = false

  let attendance = 'yes'
  let fullName = ''
  let contactInfo = ''
  let guestCount = 1
  let note = ''
  let formError = ''
  let rsvpSent = false
  let nameInput
  let contactInput
  let guestInput

  $: copy = translations[language]
  $: remaining = Math.max(0, eventTime - now)
  $: countdown = {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1000),
  }
  $: countdownValues = [countdown.days, countdown.hours, countdown.minutes, countdown.seconds]
  $: countdownLabel =
    remaining > 0
      ? copy.countdownEyebrow
      : now < eventTime + 86_400_000
        ? copy.countdownDone
        : copy.countdownPast
  $: slides = [
    ...baseGallery.map((src, index) => ({
      id: `editorial-${index}`,
      src,
      type: 'image',
      alt: copy.galleryAlt[index],
      uploaded: false,
    })),
    ...uploads,
  ]
  $: if (typeof document !== 'undefined') document.documentElement.lang = language

  function scrollReveal(node, options = {}) {
    const { delay = 0, distance = 18, scale = 1 } = options
    node.classList.add('scroll-reveal')
    node.style.setProperty('--reveal-delay', `${delay}ms`)
    node.style.setProperty('--reveal-distance', `${distance}px`)
    node.style.setProperty('--reveal-scale', scale)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || !('IntersectionObserver' in window)) {
      node.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        node.classList.add('is-visible')
        observer.unobserve(node)
      },
      { threshold: 0.12, rootMargin: '0px 0px -7% 0px' },
    )

    observer.observe(node)
    return {
      destroy() {
        observer.disconnect()
      },
    }
  }

  onMount(() => {
    const countdownTimer = window.setInterval(() => {
      now = Date.now()
    }, 1000)

    const slideshowTimer = window.setInterval(() => {
      if (isPlaying && slides.length > 1 && slides[currentSlide]?.type !== 'video') {
        currentSlide = (currentSlide + 1) % slides.length
      }
    }, 5000)

    return () => {
      window.clearInterval(countdownTimer)
      window.clearInterval(slideshowTimer)
      uploads.forEach((item) => URL.revokeObjectURL(item.src))
    }
  })

  function setLanguage(nextLanguage) {
    language = nextLanguage
    uploadMessage = ''
    formError = ''
  }

  function isValidContact(value) {
    const trimmed = value.trim()
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    const looksLikePhone = trimmed.replace(/\D/g, '').length >= 8
    return looksLikeEmail || looksLikePhone
  }

  function pad(value) {
    return String(value).padStart(2, '0')
  }

  function downloadCalendar() {
    const title = copy.calendarEvent.replace(/,/g, '\\,')
    const description = copy.calendarDescription.replace(/,/g, '\\,')
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Andreas & Eleni//Wedding//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:andreas-eleni-20260919@wedding.local',
      'DTSTAMP:20260801T090000Z',
      'DTSTART:20260919T140000Z',
      'DTEND:20260919T210000Z',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      'LOCATION:Panagia Chryseleousa Church\\, Strovolos\\, Cyprus',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'andreas-eleni-wedding.ics'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function submitRsvp(event) {
    event.preventDefault()
    formError = ''

    if (!fullName.trim() || !contactInfo.trim()) {
      formError = copy.requiredError
      window.requestAnimationFrame(() => {
        if (!fullName.trim()) nameInput?.focus()
        else contactInput?.focus()
      })
      return
    }

    if (!isValidContact(contactInfo)) {
      formError = copy.contactError
      window.requestAnimationFrame(() => contactInput?.focus())
      return
    }

    if (
      attendance === 'yes' &&
      (!Number.isInteger(Number(guestCount)) || Number(guestCount) < 1 || Number(guestCount) > 12)
    ) {
      formError = copy.guestError
      window.requestAnimationFrame(() => guestInput?.focus())
      return
    }

    rsvpSent = true
  }

  function editRsvp() {
    rsvpSent = false
  }

  function updateGuestCount(change) {
    const current = Number.isFinite(Number(guestCount)) ? Number(guestCount) : 1
    guestCount = Math.min(12, Math.max(1, current + change))
  }

  function previousSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length
  }

  function handleDrop(event) {
    event.preventDefault()
    addFiles(event.dataTransfer?.files)
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || [])
    const validFiles = files.filter((file) => {
      const supportedExtension = /\.(jpe?g|png|webp|mp4|webm)$/i.test(file.name)
      return supportedExtension && file.size <= 50 * 1024 * 1024
    })

    if (!validFiles.length) {
      uploadHasError = true
      uploadMessage = copy.uploadError
      return
    }

    const firstNewSlide = slides.length
    const newUploads = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      src: URL.createObjectURL(file),
      type: file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name) ? 'video' : 'image',
      alt: file.name,
      name: file.name,
      uploaded: true,
    }))

    uploads = [...uploads, ...newUploads]
    currentSlide = firstNewSlide
    uploadHasError = false
    uploadMessage = copy.uploadAdded
    if (fileInput) fileInput.value = ''
  }

  function removeUpload(id) {
    const item = uploads.find((upload) => upload.id === id)
    if (item) URL.revokeObjectURL(item.src)
    uploads = uploads.filter((upload) => upload.id !== id)
    currentSlide = Math.min(currentSlide, slides.length - 2)
  }
</script>

<svelte:head>
  <title>{copy.pageTitle}</title>
  <meta
    name="description"
    content={copy.pageDescription}
  />
</svelte:head>

<a class="skip-link" href="#main-content">{copy.skip}</a>

<div class="language-switch" role="group" aria-label={copy.language}>
  <button
    type="button"
    class:active={language === 'en'}
    aria-pressed={language === 'en'}
    onclick={() => setLanguage('en')}>EN</button
  >
  <span aria-hidden="true"></span>
  <button
    type="button"
    class:active={language === 'el'}
    aria-pressed={language === 'el'}
    onclick={() => setLanguage('el')}>ΕΛ</button
  >
</div>

<main id="main-content">
  <section class="hero-section" aria-labelledby="couple-names">
    <div class="hero-heading reveal">
      <h1 id="couple-names">{copy.names}</h1>
      <p>{copy.date}</p>
    </div>

    <figure class="hero-photo reveal">
      <img src={coupleWalk} alt={copy.heroAlt} width="1536" height="1024" fetchpriority="high" />
      <span class="hero-photo__number" aria-hidden="true">A · E</span>
    </figure>

    <div class="countdown-block reveal">
      <p class="sr-only" aria-live="polite">{remaining === 0 ? countdownLabel : ''}</p>
      <p class="eyebrow">{countdownLabel}</p>
      <div class="countdown-grid" aria-label={copy.countdownEyebrow}>
        {#each countdownValues as value, index}
          <div class="countdown-unit">
            <strong>{pad(value)}</strong>
            <span>{copy.units[index]}</span>
          </div>
        {/each}
      </div>
      <Button onclick={downloadCalendar} variant="primary" size="large">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
        {copy.calendar}
      </Button>
    </div>
  </section>

  <section class="invitation-section" aria-labelledby="invitation-title">
    <div class="section-shell invitation-copy" use:scrollReveal={{ distance: 18 }}>
      <p class="eyebrow">{copy.invitationEyebrow}</p>
      <h2 id="invitation-title">{copy.invitationTitle}</h2>
      <p class="large-copy">{copy.invitationText}</p>
      <div class="parents-block" aria-label={copy.parentsTitle}>
        <div class="parents-list">
          <div>
            <span>{copy.brideParentsLabel}</span>
            <strong>{copy.brideParents}</strong>
          </div>
          <i aria-hidden="true"></i>
          <div>
            <span>{copy.groomParentsLabel}</span>
            <strong>{copy.groomParents}</strong>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="timeline-section" aria-labelledby="timeline-title">
    <div class="section-shell">
      <header class="section-header section-header--split" use:scrollReveal>
        <div>
          <p class="eyebrow">{copy.timelineEyebrow}</p>
          <h2 id="timeline-title">{copy.timelineTitle}</h2>
        </div>
        <p>{copy.timelineIntro}</p>
      </header>

      <ol class="timeline-list" use:scrollReveal={{ delay: 80, distance: 12 }}>
        {#each copy.timeline as event, index}
          <li
            class="timeline-item"
            use:scrollReveal={{ delay: Math.min(index * 65, 195), distance: 16 }}
          >
            <div class="timeline-time">{event.time}</div>
            <div class="timeline-marker" aria-hidden="true">
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div class="timeline-content">
              <h3>{event.title}</h3>
              <p class="timeline-place">{event.place}</p>
              <p class="timeline-address">{event.address}</p>
              <Button
                href={event.map}
                target="_blank"
                rel="noreferrer"
                variant="link"
                aria-label={`${copy.map}: ${event.place}`}
              >
                {copy.map}
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14m-5-5 5 5-5 5" />
                </svg>
              </Button>
            </div>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  <section class="rsvp-section" aria-labelledby="rsvp-title">
    <div class="section-shell rsvp-layout">
      <div class="rsvp-intro" use:scrollReveal={{ distance: 20 }}>
        <p class="eyebrow">{copy.rsvpEyebrow}</p>
        <h2 id="rsvp-title">{copy.rsvpTitle}</h2>
        <p class="rsvp-deadline">{copy.rsvpDeadline}</p>

        <aside class="contact-card" aria-labelledby="contact-title">
          <span class="contact-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 10h10M7 14h6m-8.5 5.5 1.1-3.4A8 8 0 1 1 9 19.4l-4.5.1Z" />
            </svg>
          </span>
          <div>
            <h3 id="contact-title">{copy.contactTitle}</h3>
            <p>{copy.contactText}</p>
            <div class="contact-links">
              <a href="tel:+35799000101">Eleni · +357 99 000 101</a>
              <a href="tel:+35799000102">Andreas · +357 99 000 102</a>
              <a href="mailto:hello@andreas-eleni.com">hello@andreas-eleni.com</a>
            </div>
          </div>
        </aside>
      </div>

      <div class="rsvp-card" use:scrollReveal={{ delay: 100, distance: 20, scale: 0.992 }}>
        {#if rsvpSent}
          <div class="success-state" aria-live="polite">
            <span class="success-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="m5 12 4.5 4.5L19 7" /></svg>
            </span>
            <h3>{copy.rsvpSuccessTitle}</h3>
            <p>{attendance === 'yes' ? copy.rsvpSuccessText : copy.rsvpDeclineText}</p>
            <Button onclick={editRsvp} variant="outline">{copy.editResponse}</Button>
          </div>
        {:else}
          <form onsubmit={submitRsvp} novalidate>
            <fieldset class="attendance-group">
              <legend class="sr-only">{copy.rsvpTitle}</legend>
              <label class:checked={attendance === 'yes'}>
                <input type="radio" name="attendance" value="yes" bind:group={attendance} />
                <span class="radio-dot" aria-hidden="true"></span>
                <span>{copy.attending}</span>
              </label>
              <label class:checked={attendance === 'no'}>
                <input type="radio" name="attendance" value="no" bind:group={attendance} />
                <span class="radio-dot" aria-hidden="true"></span>
                <span>{copy.declining}</span>
              </label>
            </fieldset>

            <div class="form-grid">
              <label class="form-field">
                <span>{copy.name}</span>
                <input
                  bind:this={nameInput}
                  bind:value={fullName}
                  autocomplete="name"
                  placeholder={copy.namePlaceholder}
                  required
                  aria-invalid={Boolean(formError && !fullName.trim())}
                  aria-describedby={formError ? 'rsvp-error' : undefined}
                />
              </label>
              <label class="form-field">
                <span>{copy.contact}</span>
                <input
                  bind:this={contactInput}
                  bind:value={contactInfo}
                  autocomplete="email"
                  placeholder={copy.contactPlaceholder}
                  required
                  aria-invalid={Boolean(formError && !isValidContact(contactInfo))}
                  aria-describedby={formError ? 'rsvp-error' : undefined}
                />
              </label>
            </div>

            {#if attendance === 'yes'}
              <label class="form-field guest-field">
                <span>{copy.guests}</span>
                <span class="number-control">
                  <button
                    type="button"
                    aria-label={copy.decreaseGuests}
                    onclick={() => updateGuestCount(-1)}>−</button
                  >
                  <input
                    bind:this={guestInput}
                    type="number"
                    min="1"
                    max="12"
                    bind:value={guestCount}
                    inputmode="numeric"
                    required
                    aria-invalid={Boolean(formError && attendance === 'yes')}
                    aria-describedby={formError ? 'rsvp-error' : undefined}
                  />
                  <button
                    type="button"
                    aria-label={copy.increaseGuests}
                    onclick={() => updateGuestCount(1)}>+</button
                  >
                </span>
              </label>
            {/if}

            <label class="form-field">
              <span>{copy.message} <em>{copy.optional}</em></span>
              <textarea bind:value={note} rows="4" placeholder={copy.messagePlaceholder}></textarea>
            </label>

            {#if formError}
              <p id="rsvp-error" class="form-error" role="alert">{formError}</p>
            {/if}

            <Button type="submit" variant="primary" size="large" class="submit-button">
              {copy.submit}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </Button>
            <p class="privacy-note">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12a1 1 0 0 1 1 1v9H5v-9a1 1 0 0 1 1-1Z" />
              </svg>
              {copy.privacy}
            </p>
          </form>
        {/if}
      </div>
    </div>
  </section>

  <section class="faq-section" aria-labelledby="faq-title">
    <div class="section-shell faq-layout">
      <header class="faq-heading" use:scrollReveal={{ distance: 20 }}>
        <p class="eyebrow">{copy.faqEyebrow}</p>
        <h2 id="faq-title">{copy.faqTitle}</h2>
      </header>
      <div class="accordion-list">
        {#each copy.faqs as faq, index}
          <div use:scrollReveal={{ delay: Math.min(index * 60, 180), distance: 14 }}>
            <AccordionItem title={faq.title} open={index === 0}>
              <p>{faq.body}</p>
            </AccordionItem>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="gallery-section" aria-labelledby="gallery-title">
    <div class="section-shell">
      <header class="gallery-heading" use:scrollReveal={{ distance: 18 }}>
        <p class="eyebrow">{copy.galleryEyebrow}</p>
        <h2 id="gallery-title">{copy.galleryTitle}</h2>
        <p>{copy.galleryText}</p>
      </header>

      <div
        class="slideshow"
        use:scrollReveal={{ delay: 90, distance: 18, scale: 0.994 }}
        role="region"
        aria-roledescription={copy.carousel}
        aria-label={copy.galleryTitle}
      >
        <div class="slideshow-frame">
          {#key slides[currentSlide].id}
            {#if slides[currentSlide].type === 'video'}
              <!-- svelte-ignore a11y_media_has_caption: guest previews may not contain speech; production uploads require moderation/captioning -->
              <video
                src={slides[currentSlide].src}
                controls
                playsinline
                preload="metadata"
                aria-label={slides[currentSlide].alt}
              ></video>
            {:else}
              <img
                src={slides[currentSlide].src}
                alt={slides[currentSlide].alt}
                width="1536"
                height="1024"
                loading={currentSlide === 0 ? 'eager' : 'lazy'}
              />
            {/if}
          {/key}

          {#if slides[currentSlide].uploaded}
            <button
              class="remove-slide"
              type="button"
              onclick={() => removeUpload(slides[currentSlide].id)}>{copy.remove}</button
            >
          {/if}

          <div class="slideshow-controls">
            <button type="button" aria-label={copy.previous} onclick={previousSlide}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
            </button>
            <button
              type="button"
              class="play-button"
              aria-label={isPlaying ? copy.pause : copy.play}
              onclick={() => (isPlaying = !isPlaying)}
            >
              {#if isPlaying}
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>
              {:else}
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" /></svg>
              {/if}
            </button>
            <button type="button" aria-label={copy.next} onclick={nextSlide}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
          <p class="slide-counter">{currentSlide + 1} {copy.slideOf} {slides.length}</p>
        </div>

        <div class="slide-dots" aria-label={copy.galleryTitle}>
          {#each slides as slide, index}
            <button
              type="button"
              class:active={currentSlide === index}
              aria-label={`${index + 1} ${copy.slideOf} ${slides.length}`}
              aria-current={currentSlide === index ? 'true' : undefined}
              onclick={() => (currentSlide = index)}
            ></button>
          {/each}
        </div>
      </div>

      <div
        class="upload-zone"
        use:scrollReveal={{ delay: 140, distance: 16 }}
        class:error={uploadHasError}
        role="region"
        aria-label={copy.uploadTitle}
        ondragover={(event) => event.preventDefault()}
        ondrop={handleDrop}
      >
        <span class="upload-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 16V4m-5 5 5-5 5 5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />
          </svg>
        </span>
        <div class="upload-copy">
          <h3>{copy.uploadTitle}</h3>
          <p>{copy.uploadText}</p>
        </div>
        <input
          bind:this={fileInput}
          class="sr-only"
          type="file"
          tabindex="-1"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          onchange={(event) => addFiles(event.currentTarget.files)}
        />
        <Button onclick={() => fileInput?.click()} variant="light">{copy.uploadButton}</Button>
        <p class="upload-hint">{copy.uploadHint}</p>
        {#if uploadMessage}
          <p class:error-message={uploadHasError} class="upload-message" aria-live="polite">
            {uploadMessage}
          </p>
        {/if}
        <p class="moderation-note">{copy.moderation}</p>
      </div>
    </div>
  </section>
</main>

<footer>
  <p class="footer-monogram" aria-hidden="true">A <span>&</span> E</p>
  <p>{copy.footerDate}</p>
  <p>{copy.footerText}</p>
</footer>
