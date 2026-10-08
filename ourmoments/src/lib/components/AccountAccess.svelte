<script>
  import { onMount } from 'svelte'
  import LogoMark from './LogoMark.svelte'

  let { knownAccount = null, onClose, onLogin } = $props()
  let email = $state('')
  let password = $state('demo123')
  let error = $state('')
  let dialog

  onMount(() => {
    email = knownAccount?.email ?? 'demo@ourmoments.io'
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => dialog?.querySelector('input')?.focus(), 0)
    return () => (document.body.style.overflow = previousOverflow)
  })

  function submit(event) {
    event.preventDefault()
    if (password.length < 6) {
      error = 'Enter a password with at least 6 characters.'
      return
    }
    onLogin({
      id: knownAccount?.id ?? crypto.randomUUID?.() ?? String(Date.now()),
      firstName: knownAccount?.firstName ?? email.split('@')[0] ?? 'Guest',
      lastName: knownAccount?.lastName ?? '',
      email,
      createdAt: knownAccount?.createdAt ?? new Date().toISOString(),
    })
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') onClose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="account-access-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onClose()}>
  <div class="account-access" role="dialog" aria-modal="true" aria-labelledby="account-access-title" bind:this={dialog}>
    <button class="account-access__close" type="button" onclick={onClose} aria-label="Close login">×</button>
    <div class="account-access__brand"><LogoMark /><span>ourmoments<span>.io</span></span></div>
    <span class="account-access__eyebrow">Welcome back</span>
    <h2 id="account-access-title">Log in to your account.</h2>
    <p>Open your event dashboard, manage guests and continue editing your website.</p>
    <form onsubmit={submit}>
      <label><span>Email address</span><input bind:value={email} type="email" autocomplete="email" required placeholder="you@example.com" /></label>
      <label><span>Password</span><input bind:value={password} type="password" autocomplete="current-password" minlength="6" required /></label>
      {#if error}<p class="checkout-error" role="alert">{error}</p>{/if}
      <button class="checkout-submit" type="submit">Log in <span>→</span></button>
    </form>
    <small>Demo credentials are prefilled. Account and event data are stored only in this browser.</small>
  </div>
</div>
