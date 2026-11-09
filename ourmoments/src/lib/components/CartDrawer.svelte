<script>
  import { onMount } from 'svelte'
  import { formatEventDate, getTemplate } from '../catalog.js'
  import { getPlan } from '../plans.js'
  import LogoMark from './LogoMark.svelte'

  let { items = [], total = 0, onClose, onRemove, onEdit, onCheckout, onBrowsePlans } = $props()
  let closeButton
  let dialog

  onMount(() => {
    const returnFocusTo = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      returnFocusTo?.focus?.()
    }
  })

  function handleKeydown(event) {
    if (event.key === 'Escape') onClose()
    if (event.key !== 'Tab') return

    const focusable = [...dialog.querySelectorAll('button:not(:disabled), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable.at(-1)

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="drawer-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onClose()}>
  <div class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" bind:this={dialog}>
    <header class="cart-drawer__header">
      <div>
        <span>Your designs</span>
        <h2 id="cart-title">Cart <i>{items.length}</i></h2>
      </div>
      <button class="modal-close" type="button" onclick={onClose} bind:this={closeButton} aria-label="Close cart">×</button>
    </header>

    <div class="cart-drawer__content">
      {#if items.length === 0}
        <div class="empty-cart">
          <LogoMark />
          <h3>Your plan selection is waiting.</h3>
          <p>Choose a plan to continue to checkout.</p>
          <button class="button button--dark" type="button" onclick={onBrowsePlans}>Browse plans <span aria-hidden="true">→</span></button>
        </div>
      {:else}
        <div class="cart-items">
          {#each items as item}
            {@const template = getTemplate(item.templateId)}
            {@const plan = item.planId ? getPlan(item.planId) : null}
            <article class="cart-item">
              <div class={`cart-item__art cart-item__art--${template.id}`} aria-hidden="true">
                <span>{plan ? plan.name : item.title}</span><i>{plan ? 'ourmoments.io' : item.occasionName}</i>
              </div>
              <div class="cart-item__copy">
                <span>{plan ? 'Selected plan' : item.occasionName}</span>
                <h3>{plan ? plan.name : item.templateName}</h3>
                <p>{plan ? 'One-time digital invitation plan' : `${item.title}\n${formatEventDate(item.date)}`}</p>
                <div>
                  {#if !plan}<button type="button" onclick={() => onEdit(item)}>Edit</button>{/if}
                  <button type="button" onclick={() => onRemove(item.id)}>Remove</button>
                </div>
              </div>
              <strong>€{item.price}</strong>
            </article>
          {/each}
        </div>
      {/if}
    </div>

    {#if items.length > 0}
      <footer class="cart-drawer__footer">
        <div class="cart-total"><span>Subtotal</span><strong>€{total}</strong></div>
        <p>One-time purchase · Website and private planning dashboard included</p>
        <button class="checkout-button" type="button" onclick={onCheckout}>
          Checkout
          <span aria-hidden="true">→</span>
        </button>
        <button class="continue-button" type="button" onclick={onClose}>Continue designing</button>
      </footer>
    {/if}
  </div>
</div>
