<script>
  import { tick } from 'svelte'
  import { scrollReveal } from '../../actions/scrollReveal.js'
  import { isValidContact } from '../../utils/contact.js'
  import { COUPLE_CONTACTS } from '../../wedding-config.js'
  import Button from '../ui/Button.svelte'

  let { copy, language } = $props()

  let attendance = $state('yes')
  let fullName = $state('')
  let contactInfo = $state('')
  let guestCount = $state(1)
  let note = $state('')
  let formError = $state('')
  let rsvpSent = $state(false)
  let nameInput = $state()
  let contactInput = $state()
  let guestInput = $state()
  let successState = $state()

  $effect(() => {
    language
    formError = ''
  })

  function isValidGuestCount(value) {
    const count = Number(value)
    return Number.isInteger(count) && count >= 1 && count <= 12
  }

  async function submitRsvp(event) {
    event.preventDefault()
    formError = ''

    if (!fullName.trim() || !contactInfo.trim()) {
      formError = copy.requiredError
      await tick()
      if (!fullName.trim()) nameInput?.focus()
      else contactInput?.focus()
      return
    }

    if (!isValidContact(contactInfo)) {
      formError = copy.contactError
      await tick()
      contactInput?.focus()
      return
    }

    if (attendance === 'yes' && !isValidGuestCount(guestCount)) {
      formError = copy.guestError
      await tick()
      guestInput?.focus()
      return
    }

    rsvpSent = true
    await tick()
    successState?.focus()
  }

  async function editRsvp() {
    rsvpSent = false
    await tick()
    nameInput?.focus()
  }

  function updateGuestCount(change) {
    const current = Number.isFinite(Number(guestCount)) ? Number(guestCount) : 1
    guestCount = Math.min(12, Math.max(1, current + change))
  }
</script>

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
            {#each COUPLE_CONTACTS as contact}
              <a href={contact.href}>{contact.label}</a>
            {/each}
          </div>
        </div>
      </aside>
    </div>

    <div class="rsvp-card" use:scrollReveal={{ delay: 100, distance: 20, scale: 0.992 }}>
      {#if rsvpSent}
        <div class="success-state" bind:this={successState} tabindex="-1" aria-live="polite">
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
                <button type="button" aria-label={copy.decreaseGuests} onclick={() => updateGuestCount(-1)}
                  >−</button
                >
                <input
                  bind:this={guestInput}
                  type="number"
                  min="1"
                  max="12"
                  bind:value={guestCount}
                  inputmode="numeric"
                  required
                  aria-invalid={Boolean(
                    formError && attendance === 'yes' && !isValidGuestCount(guestCount),
                  )}
                  aria-describedby={formError ? 'rsvp-error' : undefined}
                />
                <button type="button" aria-label={copy.increaseGuests} onclick={() => updateGuestCount(1)}
                  >+</button
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
