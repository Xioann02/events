<script>
  import { onMount } from 'svelte'
  import { getTemplate } from '../catalog.js'
  import LogoMark from './LogoMark.svelte'

  let { items = [], total = 0, existingAccount = null, onClose, onComplete } = $props()

  let step = $state(1)
  let processing = $state(false)
  let error = $state('')
  let accountMode = $state('create')
  let dialog
  let firstInput = $state()
  let account = $state({ firstName: '', lastName: '', email: '', password: '', updates: true })
  let payment = $state({ cardName: '', cardNumber: '4242 4242 4242 4242', expiry: '12/30', cvc: '123', country: 'Cyprus' })

  onMount(() => {
    if (existingAccount) {
      accountMode = 'login'
      account.firstName = existingAccount.firstName ?? ''
      account.lastName = existingAccount.lastName ?? ''
      account.email = existingAccount.email ?? ''
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => dialog?.querySelector('input')?.focus(), 0)
    return () => (document.body.style.overflow = previousOverflow)
  })

  function continueToPayment(event) {
    event.preventDefault()
    error = ''
    if (account.password.length < 6) {
      error = 'Use at least 6 characters for your password.'
      return
    }
    if (accountMode === 'login' && !account.firstName) {
      account.firstName = existingAccount?.firstName || account.email.split('@')[0] || 'Guest'
      account.lastName = existingAccount?.lastName || ''
    }
    step = 2
    window.setTimeout(() => dialog?.querySelector('input')?.focus(), 0)
  }

  function finishPurchase(event) {
    event.preventDefault()
    error = ''
    if (payment.cardNumber.replace(/\s/g, '').length < 12) {
      error = 'Enter a valid demo card number.'
      return
    }
    processing = true
    window.setTimeout(() => {
      onComplete({ ...account, id: crypto.randomUUID?.() ?? String(Date.now()), createdAt: new Date().toISOString() })
    }, 700)
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && !processing) onClose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="checkout-backdrop" role="presentation">
  <div class="checkout-shell" role="dialog" aria-modal="true" aria-labelledby="checkout-title" bind:this={dialog}>
    <header class="checkout-header">
      <button class="checkout-brand" type="button" onclick={onClose} aria-label="Back to ourmoments.io">
        <LogoMark /><span>ourmoments<span>.io</span></span>
      </button>
      <div class="checkout-progress" aria-label={`Checkout step ${step} of 2`}><i class:active={step >= 1}></i><i class:active={step >= 2}></i><span>Step {step} of 2</span></div>
      <button class="checkout-close" type="button" onclick={onClose} disabled={processing} aria-label="Close checkout">×</button>
    </header>

    <div class="checkout-layout">
      <main class="checkout-main">
        {#if step === 1}
          <div class="checkout-copy"><span>Account access</span><h1 id="checkout-title">Continue to checkout.</h1><p>Log in to an existing account or create one now. Your website and planning dashboard will stay together in this account.</p></div>
          <div class="checkout-account-tabs" aria-label="Choose account access">
            <button class:active={accountMode === 'login'} type="button" onclick={() => { accountMode = 'login'; error = '' }}>Log in</button>
            <button class:active={accountMode === 'create'} type="button" onclick={() => { accountMode = 'create'; error = '' }}>Create account</button>
          </div>
          <form class="checkout-form" onsubmit={continueToPayment}>
            {#if accountMode === 'create'}
              <div class="checkout-form-row"><label><span>First name</span><input bind:this={firstInput} bind:value={account.firstName} autocomplete="given-name" required /></label><label><span>Last name</span><input bind:value={account.lastName} autocomplete="family-name" required /></label></div>
            {/if}
            <label><span>Email address</span><input bind:value={account.email} type="email" autocomplete="email" required /><small>{accountMode === 'login' ? 'Use the email connected to your account.' : 'You will use this to sign in to your dashboard.'}</small></label>
            <label><span>{accountMode === 'login' ? 'Password' : 'Create a password'}</span><input bind:value={account.password} type="password" autocomplete={accountMode === 'login' ? 'current-password' : 'new-password'} required minlength="6" /><small>At least 6 characters for this demo.</small></label>
            {#if accountMode === 'create'}<label class="checkout-checkbox"><input bind:checked={account.updates} type="checkbox" /><span><i>✓</i><b>Send me useful event-planning updates</b></span></label>{/if}
            {#if error}<p class="checkout-error" role="alert">{error}</p>{/if}
            <button class="checkout-submit" type="submit">{accountMode === 'login' ? 'Log in & continue' : 'Create account & continue'} <span>→</span></button>
            <p class="checkout-demo-note"><i>i</i> Demo mode: account and event data are stored only in this browser.</p>
          </form>
        {:else}
          <button class="checkout-back" type="button" onclick={() => (step = 1)}>← Account details</button>
          <div class="checkout-copy"><span>Secure checkout</span><h1 id="checkout-title">Complete your order.</h1><p>This is a working demo flow. No payment will be charged and the supplied card details are not sent anywhere.</p></div>
          <form class="checkout-form" onsubmit={finishPurchase}>
            <label><span>Name on card</span><input bind:this={firstInput} bind:value={payment.cardName} autocomplete="cc-name" required /></label>
            <label><span>Card number</span><input bind:value={payment.cardNumber} inputmode="numeric" autocomplete="cc-number" required /></label>
            <div class="checkout-form-row"><label><span>Expiry</span><input bind:value={payment.expiry} inputmode="numeric" autocomplete="cc-exp" required /></label><label><span>CVC</span><input bind:value={payment.cvc} inputmode="numeric" autocomplete="cc-csc" required /></label></div>
            <label><span>Country or region</span><select bind:value={payment.country}><option>Cyprus</option><option>Greece</option><option>United Kingdom</option><option>United States</option><option>Other</option></select></label>
            {#if error}<p class="checkout-error" role="alert">{error}</p>{/if}
            <button class="checkout-submit" type="submit" disabled={processing}>{processing ? 'Creating your dashboard…' : `Pay €${total} & create dashboard`}<span>{processing ? '·' : '→'}</span></button>
            <p class="checkout-terms">By completing this order, you agree to the demo terms and privacy notice.</p>
          </form>
        {/if}
      </main>

      <aside class="checkout-summary">
        <span>Your order</span>
        <div class="checkout-items">
          {#each items as item}
            {@const template = getTemplate(item.templateId)}
            <article><div class={`cart-item__art cart-item__art--${template.id}`}><span>{item.title}</span><i>{item.occasionName}</i></div><p><strong>{template.name}</strong><span>{item.occasionName} website</span><small>Dashboard included</small></p><b>€{item.price}</b></article>
          {/each}
        </div>
        <div class="checkout-included"><span>Included</span><ul><li><i>✓</i> Digital invitation website</li><li><i>✓</i> RSVP & guest management</li><li><i>✓</i> Seating planner</li><li><i>✓</i> Photo & gift tracking</li><li><i>✓</i> Shareable QR code</li></ul></div>
        <div class="checkout-total"><span>Total <small>One-time purchase</small></span><strong>€{total}</strong></div>
      </aside>
    </div>
  </div>
</div>
