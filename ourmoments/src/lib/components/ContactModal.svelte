<script>
  import { onMount } from 'svelte'

  let { onClose } = $props()
  let email = $state('')
  let subject = $state('Question about ourmoments.io')
  let message = $state('')
  let dialog

  onMount(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => dialog?.querySelector('input')?.focus(), 0)
    return () => (document.body.style.overflow = previousOverflow)
  })

  function openEmail(event) {
    event.preventDefault()
    const body = `From: ${email}\n\n${message}`
    window.location.href = `mailto:hello@ourmoments.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') onClose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="contact-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onClose()}>
  <div class="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" bind:this={dialog}>
    <button class="contact-modal__close" type="button" onclick={onClose} aria-label="Close contact form">×</button>
    <p class="overline"><span></span> Contact</p>
    <h2 id="contact-modal-title">How can we help?</h2>
    <p class="contact-modal__intro">Write your message here and we’ll open it as an email addressed to our team.</p>

    <form onsubmit={openEmail}>
      <label>
        <span>Your email</span>
        <input bind:value={email} type="email" autocomplete="email" required placeholder="you@example.com" />
      </label>
      <label>
        <span>Subject</span>
        <input bind:value={subject} required maxlength="120" />
      </label>
      <label>
        <span>Message</span>
        <textarea bind:value={message} required rows="7" placeholder="Tell us what you would like help with…"></textarea>
      </label>
      <button class="button button--dark contact-modal__submit" type="submit">Open email app <span aria-hidden="true">↗</span></button>
    </form>
    <small>You’ll review and send the message from your email app.</small>
  </div>
</div>
