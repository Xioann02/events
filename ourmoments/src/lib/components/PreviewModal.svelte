<script>
  import { onMount } from 'svelte'
  import { getOccasion, getTemplate } from '../catalog.js'
  import PreviewFrame from './PreviewFrame.svelte'

  let { draft, onClose, onCustomize } = $props()
  let closeButton
  let dialog
  let mode = $state('desktop')
  let occasion = $derived(getOccasion(draft.occasionId))
  let template = $derived(getTemplate(draft.templateId))

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

<div class="modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onClose()}>
  <div class="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title" bind:this={dialog}>
    <header class="preview-modal__header">
      <div>
        <span>{occasion.label} template</span>
        <h2 id="preview-modal-title">{template.name}</h2>
      </div>
      <div class="preview-modal__actions">
        <div class="device-toggle" aria-label="Preview size">
          <button class:active={mode === 'desktop'} type="button" onclick={() => (mode = 'desktop')} aria-label="Desktop preview">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M9 21h6m-3-4v4" /></svg>
          </button>
          <button class:active={mode === 'mobile'} type="button" onclick={() => (mode = 'mobile')} aria-label="Mobile preview">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M10 5h4m-2 13.5v.5" /></svg>
          </button>
        </div>
        <button class="modal-close" type="button" onclick={onClose} bind:this={closeButton} aria-label="Close preview">×</button>
      </div>
    </header>

    <div class="preview-modal__stage">
      <PreviewFrame {draft} {mode} />
    </div>

    <footer class="preview-modal__footer">
      <p><strong>{template.name}</strong><span>{template.personality} · €{template.price}</span></p>
      <button class="button button--dark" type="button" onclick={onCustomize}>Customize this template <span aria-hidden="true">→</span></button>
    </footer>
  </div>
</div>
