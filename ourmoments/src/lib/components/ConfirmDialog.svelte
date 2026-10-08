<script>
  import { onMount } from 'svelte'

  let {
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'danger',
    closeOnBackdrop = true,
    onConfirm,
    onCancel,
  } = $props()

  let dialogElement
  let cancelButton

  onMount(() => {
    dialogElement?.showModal()
    cancelButton?.focus()
  })

  function handleCancel(event) {
    event.preventDefault()
    dialogElement?.close()
    onCancel()
  }

  function handleConfirm() {
    dialogElement?.close()
    onConfirm()
  }

  function handleBackdrop(event) {
    if (closeOnBackdrop && event.target === dialogElement) handleCancel(event)
  }
</script>

<dialog
  bind:this={dialogElement}
  class="confirm-dialog"
  role="alertdialog"
  aria-modal="true"
  aria-labelledby="confirm-dialog-title"
  aria-describedby="confirm-dialog-message"
  oncancel={handleCancel}
  onclick={handleBackdrop}
>
  <section class="confirm-dialog__panel">
    <span class="confirm-dialog__eyebrow">Please confirm</span>
    <h2 id="confirm-dialog-title">{title}</h2>
    <p id="confirm-dialog-message">{message}</p>
    <footer class="confirm-dialog__actions">
      <button bind:this={cancelButton} class="confirm-dialog__cancel" type="button" onclick={handleCancel}>{cancelLabel}</button>
      <button class="confirm-dialog__confirm" class:confirm-dialog__confirm--danger={tone === 'danger'} type="button" onclick={handleConfirm}>{confirmLabel}</button>
    </footer>
  </section>
</dialog>

<style>
  .confirm-dialog {
    position: fixed;
    inset: 0;
    width: min(440px, calc(100% - 32px));
    max-width: none;
    max-height: calc(100% - 32px);
    margin: auto;
    padding: 0;
    overflow: visible;
    border: 0;
    background: transparent;
    color: var(--dash-ink, #171714);
  }

  .confirm-dialog::backdrop {
    background: rgba(17, 16, 14, .58);
    backdrop-filter: blur(7px);
  }

  .confirm-dialog__panel {
    padding: 34px;
    border-radius: 14px;
    background: var(--dash-paper, #fff);
    box-shadow: 0 28px 90px rgba(0, 0, 0, .2);
  }

  .confirm-dialog__eyebrow {
    color: var(--dash-accent, #76232a);
    font-size: .6rem;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .confirm-dialog h2 {
    margin: 9px 0 0;
    font-family: var(--display, Georgia, serif);
    font-size: 1.8rem;
    font-weight: 500;
    line-height: 1.15;
  }

  .confirm-dialog p {
    margin: 10px 0 24px;
    color: var(--dash-muted, #77746d);
    font-size: .72rem;
    line-height: 1.6;
  }

  .confirm-dialog__actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
  }

  .confirm-dialog__actions button {
    min-height: 40px;
    padding: 0 15px;
    border: 1px solid var(--dash-line, #deddd7);
    border-radius: 7px;
    font: inherit;
    font-size: .68rem;
    font-weight: 750;
  }

  .confirm-dialog__cancel {
    background: transparent;
    color: var(--dash-ink, #171714);
  }

  .confirm-dialog__confirm {
    border-color: var(--dash-ink, #171714) !important;
    background: var(--dash-ink, #171714);
    color: #fff;
  }

  .confirm-dialog__confirm--danger {
    border-color: var(--dash-accent, #76232a) !important;
    background: var(--dash-accent, #76232a);
  }

  @media (max-width: 520px) {
    .confirm-dialog__panel { padding: 28px 22px; }
    .confirm-dialog__actions button { flex: 1; }
  }
</style>
