<script>
  import { onMount } from 'svelte'
  import AccountAccess from './lib/components/AccountAccess.svelte'
  import CartDrawer from './lib/components/CartDrawer.svelte'
  import CheckoutAccount from './lib/components/CheckoutAccount.svelte'
  import DashboardShell from './lib/components/DashboardShell.svelte'
  import EditorShell from './lib/components/EditorShell.svelte'
  import PreviewModal from './lib/components/PreviewModal.svelte'
  import Storefront from './lib/components/Storefront.svelte'
  import { createDashboardData } from './lib/dashboard-data.js'
  import { cartTotal, createCartItem, createDraft, adaptDraftToOccasion, addOrReplaceCartItem } from './lib/draft.js'

  let screen = $state('home')
  let selectedOccasionId = $state('wedding')
  let draft = $state(createDraft('wedding', 'classic'))
  let previewDraft = $state(null)
  let cartItems = $state([])
  let cartOpen = $state(false)
  let checkoutOpen = $state(false)
  let accountAccessOpen = $state(false)
  let editingPurchased = $state(false)
  let account = $state(null)
  let purchasedSites = $state([])
  let dashboardData = $state(null)
  let toast = $state('')
  let toastTimer
  let hydrated = $state(false)

  let total = $derived(cartTotal(cartItems))
  let currentSite = $derived(purchasedSites[0] ?? null)
  let hasDashboard = $derived(Boolean(account && currentSite && dashboardData))

  onMount(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('ourmoments-cart') ?? '[]')
      const savedAccount = JSON.parse(localStorage.getItem('ourmoments-account') ?? 'null')
      const savedSites = JSON.parse(localStorage.getItem('ourmoments-sites') ?? '[]')
      const savedDashboard = JSON.parse(localStorage.getItem('ourmoments-dashboard') ?? 'null')
      if (Array.isArray(savedCart)) cartItems = savedCart
      if (savedAccount && typeof savedAccount === 'object') account = savedAccount
      if (Array.isArray(savedSites)) purchasedSites = savedSites
      if (savedDashboard && typeof savedDashboard === 'object') {
        const guests = (savedDashboard.guests ?? []).map((guest) => ({
          phone: '',
          note: '',
          attended: null,
          ...guest,
        }))
        dashboardData = {
          ...savedDashboard,
          guests,
          tables: (savedDashboard.tables ?? []).map((table, index) => ({ ...table, name: `Table ${index + 1}` })),
          gifts: (savedDashboard.gifts ?? []).map((gift) => {
            const isMoney = gift.type === 'money' || Boolean(gift.amount)
            return {
              guestId: gift.guestId || guests.find((guest) => guest.name === gift.guest)?.id || '',
              type: isMoney ? 'money' : 'item',
              amount: gift.amount ?? '',
              currency: gift.currency ?? 'EUR',
              ...gift,
            }
          }),
        }
      }
    } catch {
      cartItems = []
    }

    applyLocation()
    window.addEventListener('popstate', applyLocation)
    hydrated = true
    return () => window.removeEventListener('popstate', applyLocation)
  })

  $effect(() => {
    if (!hydrated) return
    localStorage.setItem('ourmoments-cart', JSON.stringify(cartItems))
    localStorage.setItem('ourmoments-account', JSON.stringify(account))
    localStorage.setItem('ourmoments-sites', JSON.stringify(purchasedSites))
    localStorage.setItem('ourmoments-dashboard', JSON.stringify(dashboardData))
  })

  function notify(message) {
    toast = message
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => (toast = ''), 2600)
  }

  function applyLocation() {
    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('editor')

    if (params.has('dashboard') && account && purchasedSites[0] && dashboardData) {
      editingPurchased = false
      screen = 'dashboard'
      window.scrollTo({ top: 0 })
      return
    }

    if (templateId) {
      const fromDashboard = params.get('source') === 'dashboard' && purchasedSites[0]
      selectedOccasionId = params.get('occasion') ?? selectedOccasionId
      draft = fromDashboard ? structuredClone(purchasedSites[0].draft) : createDraft(selectedOccasionId, templateId)
      editingPurchased = Boolean(fromDashboard)
      screen = 'editor'
      window.scrollTo({ top: 0 })
      return
    }

    editingPurchased = false
    screen = 'home'
  }

  function openEditor(templateId, updateHistory = true) {
    draft = createDraft(selectedOccasionId, templateId)
    previewDraft = null
    editingPurchased = false
    screen = 'editor'
    if (updateHistory) window.history.pushState({}, '', `?editor=${draft.templateId}&occasion=${draft.occasionId}`)
    window.scrollTo({ top: 0 })
  }

  function returnHome() {
    selectedOccasionId = draft.occasionId
    editingPurchased = false
    screen = 'home'
    window.history.pushState({}, '', window.location.pathname)
    window.scrollTo({ top: 0 })
  }

  function openDashboard() {
    if (!hasDashboard) return
    cartOpen = false
    checkoutOpen = false
    editingPurchased = false
    screen = 'dashboard'
    window.history.pushState({}, '', '?dashboard=overview')
    window.scrollTo({ top: 0 })
  }

  function requestDashboardAccess() {
    if (hasDashboard) {
      openDashboard()
      return
    }
    accountAccessOpen = true
  }

  function requestAccountAccess() {
    if (hasDashboard) {
      openDashboard()
      return
    }
    accountAccessOpen = true
  }

  function completeLogin(profile) {
    account = profile
    accountAccessOpen = false
    if (!purchasedSites[0] || !dashboardData) {
      const purchasedAt = new Date().toISOString()
      const demoSite = { ...createCartItem(createDraft('wedding', 'classic')), purchasedAt, updatedAt: purchasedAt }
      purchasedSites = [demoSite]
      dashboardData = createDashboardData(demoSite)
    }
    openDashboard()
  }

  function openPurchasedEditor() {
    if (!currentSite) return
    draft = structuredClone(currentSite.draft)
    selectedOccasionId = draft.occasionId
    editingPurchased = true
    screen = 'editor'
    window.history.pushState({}, '', `?editor=${draft.templateId}&occasion=${draft.occasionId}&source=dashboard`)
    window.scrollTo({ top: 0 })
  }

  function previewTemplate(templateId) {
    previewDraft = createDraft(selectedOccasionId, templateId)
  }

  function addTemplateToCart(templateId) {
    const candidate = createDraft(selectedOccasionId, templateId)
    const existing = cartItems.find((item) => item.templateId === templateId && item.occasionId === selectedOccasionId)
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

  function savePurchasedDraft() {
    const updated = { ...createCartItem(draft), purchasedAt: currentSite.purchasedAt, updatedAt: new Date().toISOString() }
    purchasedSites = purchasedSites.map((site, index) => (index === 0 ? updated : site))
    dashboardData = { ...dashboardData, eventName: updated.title }
    notify('Website changes saved.')
  }

  function changeEditorOccasion(occasionId) {
    if (occasionId === draft.occasionId) return
    draft = adaptDraftToOccasion(draft, occasionId)
    selectedOccasionId = occasionId
    const source = editingPurchased ? '&source=dashboard' : ''
    window.history.replaceState({}, '', `?editor=${draft.templateId}&occasion=${draft.occasionId}${source}`)
    notify('Occasion copy updated. Your date and place were kept.')
  }

  function changeEditorTemplate(templateId) {
    const source = editingPurchased ? '&source=dashboard' : ''
    window.history.replaceState({}, '', `?editor=${templateId}&occasion=${draft.occasionId}${source}`)
  }

  function removeCartItem(id) {
    cartItems = cartItems.filter((item) => item.id !== id)
    notify('Design removed from your cart.')
  }

  function editCartItem(item) {
    draft = structuredClone(item.draft)
    selectedOccasionId = draft.occasionId
    cartOpen = false
    editingPurchased = false
    screen = 'editor'
    window.history.pushState({}, '', `?editor=${draft.templateId}&occasion=${draft.occasionId}`)
    window.scrollTo({ top: 0 })
  }

  function beginCheckout() {
    cartOpen = false
    checkoutOpen = true
  }

  function completePurchase(newAccount) {
    const { password, ...safeAccount } = newAccount
    const purchasedAt = new Date().toISOString()
    const sites = cartItems.map((item) => ({ ...structuredClone(item), purchasedAt, updatedAt: purchasedAt }))
    account = safeAccount
    purchasedSites = sites
    dashboardData = createDashboardData(sites[0])
    cartItems = []
    checkoutOpen = false
    screen = 'dashboard'
    window.history.pushState({}, '', '?dashboard=overview')
    notify('Welcome — your dashboard is ready.')
    window.scrollTo({ top: 0 })
  }
</script>

<svelte:head>
  <title>{screen === 'home' ? 'ourmoments.io — The art of the digital invitation' : screen === 'dashboard' ? `${dashboardData?.eventName ?? 'Event'} dashboard — ourmoments.io` : `Edit ${draft.title} — ourmoments.io`}</title>
  <meta name="description" content="Considered digital invitations for weddings, birthdays and every gathering worth remembering." />
</svelte:head>

{#if screen === 'home'}
  <Storefront {selectedOccasionId} cartCount={cartItems.length} dashboardAvailable={hasDashboard} onCustomize={openEditor} onPreview={previewTemplate} onAddToCart={addTemplateToCart} onOpenCart={() => (cartOpen = true)} onDashboardAccess={requestDashboardAccess} onAccountAccess={requestAccountAccess} />
{:else if screen === 'dashboard' && account && currentSite && dashboardData}
  <DashboardShell {account} site={currentSite} bind:data={dashboardData} onHome={returnHome} onEditWebsite={openPurchasedEditor} onNotify={notify} />
{:else}
  <EditorShell bind:draft cartCount={cartItems.length} onBack={editingPurchased ? openDashboard : returnHome} onOccasionChange={changeEditorOccasion} onTemplateChange={changeEditorTemplate} onAddToCart={editingPurchased ? savePurchasedDraft : addDraftToCart} onOpenCart={() => (cartOpen = true)} primaryActionLabel={editingPurchased ? 'Save website' : ''} showCart={!editingPurchased} />
{/if}

{#if previewDraft}
  <PreviewModal draft={previewDraft} onClose={() => (previewDraft = null)} onCustomize={() => openEditor(previewDraft.templateId)} />
{/if}

{#if cartOpen}
  <CartDrawer items={cartItems} {total} onClose={() => (cartOpen = false)} onRemove={removeCartItem} onEdit={editCartItem} onCheckout={beginCheckout} />
{/if}

{#if checkoutOpen}
  <CheckoutAccount items={cartItems} {total} existingAccount={account} onClose={() => (checkoutOpen = false)} onComplete={completePurchase} />
{/if}

{#if accountAccessOpen}
  <AccountAccess knownAccount={account} onClose={() => (accountAccessOpen = false)} onLogin={completeLogin} />
{/if}

{#if toast}
  <div class="toast" role="status"><span>✓</span>{toast}</div>
{/if}
