<script>
  import { onMount } from 'svelte'
  import CartDrawer from './lib/components/CartDrawer.svelte'
  import EditorShell from './lib/components/EditorShell.svelte'
  import PreviewModal from './lib/components/PreviewModal.svelte'
  import Storefront from './lib/components/Storefront.svelte'
  import { cartTotal, createCartItem, createDraft, adaptDraftToOccasion, addOrReplaceCartItem } from './lib/draft.js'

  let screen = $state('home')
  let selectedOccasionId = $state('wedding')
  let draft = $state(createDraft('wedding', 'classic'))
  let previewDraft = $state(null)
  let cartItems = $state([])
  let cartOpen = $state(false)
  let toast = $state('')
  let toastTimer
  let hydrated = $state(false)

  let total = $derived(cartTotal(cartItems))

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ourmoments-cart') ?? '[]')
      if (Array.isArray(saved)) cartItems = saved
    } catch {
      cartItems = []
    }
    applyLocation()
    window.addEventListener('popstate', applyLocation)
    hydrated = true

    return () => window.removeEventListener('popstate', applyLocation)
  })

  $effect(() => {
    if (hydrated) localStorage.setItem('ourmoments-cart', JSON.stringify(cartItems))
  })

  function notify(message) {
    toast = message
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      toast = ''
    }, 2600)
  }

  function applyLocation() {
    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('editor')

    if (templateId) {
      selectedOccasionId = params.get('occasion') ?? selectedOccasionId
      draft = createDraft(selectedOccasionId, templateId)
      screen = 'editor'
      window.scrollTo({ top: 0 })
      return
    }

    screen = 'home'
  }

  function openEditor(templateId, updateHistory = true) {
    draft = createDraft(selectedOccasionId, templateId)
    previewDraft = null
    screen = 'editor'
    if (updateHistory) {
      window.history.pushState({}, '', `?editor=${draft.templateId}&occasion=${draft.occasionId}`)
    }
    window.scrollTo({ top: 0 })
  }

  function returnHome() {
    selectedOccasionId = draft.occasionId
    screen = 'home'
    window.history.pushState({}, '', window.location.pathname)
    window.scrollTo({ top: 0 })
  }

  function previewTemplate(templateId) {
    previewDraft = createDraft(selectedOccasionId, templateId)
  }

  function addTemplateToCart(templateId) {
    const candidate = createDraft(selectedOccasionId, templateId)
    const existing = cartItems.find(
      (item) => item.templateId === templateId && item.occasionId === selectedOccasionId,
    )
    if (existing) candidate.id = existing.id

    cartItems = addOrReplaceCartItem(cartItems, createCartItem(candidate))
    notify(existing ? 'That design was updated in your cart.' : 'Template added to your cart.')
    cartOpen = true
  }

  function addDraftToCart() {
    const alreadyThere = cartItems.some((item) => item.id === draft.id)
    cartItems = addOrReplaceCartItem(cartItems, createCartItem(draft))
    notify(alreadyThere ? 'Your latest changes are saved in the cart.' : 'Your invitation is in the cart.')
    cartOpen = true
  }

  function changeEditorOccasion(occasionId) {
    if (occasionId === draft.occasionId) return
    draft = adaptDraftToOccasion(draft, occasionId)
    selectedOccasionId = occasionId
    window.history.replaceState({}, '', `?editor=${draft.templateId}&occasion=${draft.occasionId}`)
    notify('Occasion copy updated. Your date and place were kept.')
  }

  function changeEditorTemplate(templateId) {
    window.history.replaceState({}, '', `?editor=${templateId}&occasion=${draft.occasionId}`)
  }

  function removeCartItem(id) {
    cartItems = cartItems.filter((item) => item.id !== id)
    notify('Design removed from your cart.')
  }

  function editCartItem(item) {
    draft = JSON.parse(JSON.stringify(item.draft))
    selectedOccasionId = draft.occasionId
    cartOpen = false
    screen = 'editor'
    window.history.pushState({}, '', `?editor=${draft.templateId}&occasion=${draft.occasionId}`)
    window.scrollTo({ top: 0 })
  }
</script>

<svelte:head>
  <title>{screen === 'home' ? 'ourmoments.io — The art of the digital invitation' : `Edit ${draft.title} — ourmoments.io`}</title>
  <meta
    name="description"
    content="Considered digital invitations for weddings, birthdays and every gathering worth remembering."
  />
</svelte:head>

{#if screen === 'home'}
  <Storefront
    {selectedOccasionId}
    cartCount={cartItems.length}
    onCustomize={openEditor}
    onPreview={previewTemplate}
    onAddToCart={addTemplateToCart}
    onOpenCart={() => (cartOpen = true)}
  />
{:else}
  <EditorShell
    bind:draft
    cartCount={cartItems.length}
    onBack={returnHome}
    onOccasionChange={changeEditorOccasion}
    onTemplateChange={changeEditorTemplate}
    onAddToCart={addDraftToCart}
    onOpenCart={() => (cartOpen = true)}
  />
{/if}

{#if previewDraft}
  <PreviewModal
    draft={previewDraft}
    onClose={() => (previewDraft = null)}
    onCustomize={() => openEditor(previewDraft.templateId)}
  />
{/if}

{#if cartOpen}
  <CartDrawer
    items={cartItems}
    {total}
    onClose={() => (cartOpen = false)}
    onRemove={removeCartItem}
    onEdit={editCartItem}
  />
{/if}

{#if toast}
  <div class="toast" role="status">
    <span>✓</span>
    {toast}
  </div>
{/if}
