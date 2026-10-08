<script>
  import { onMount } from 'svelte'
  import { formatEventDate, getTemplate } from '../catalog.js'
  import LogoMark from './LogoMark.svelte'

  let { items = [], total = 0, onClose, onRemove, onEdit, onCheckout } = $props()
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
          <h3>Your cart is waiting for a moment.</h3>
          <p>Choose a template, add your details and it will appear here.</p>
          <button class="button button--dark" type="button" onclick={onClose}>Browse templates <span aria-hidden="true">→</span></button>
        </div>
      {:else}
        <div class="cart-items">
          {#each items as item}
            {@const template = getTemplate(item.templateId)}
            <article class="cart-item">
              <div class={`cart-item__art cart-item__art--${template.id}`} aria-hidden="true">
                <span>{item.title}</span><i>{item.occasionName}</i>
              </div>
              <div class="cart-item__copy">
                <span>{item.occasionName}</span>
                <h3>{item.templateName}</h3>
                <p>{item.title}<br />{formatEventDate(item.date)}</p>
                <div>
                  <button type="button" onclick={() => onEdit(item)}>Edit</button>
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
