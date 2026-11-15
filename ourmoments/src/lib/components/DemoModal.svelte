<script>
  import { onMount } from 'svelte'

  let { onClose, websiteVideoUrl = '', dashboardVideoUrl = '' } = $props()
  let dialog
  let activeVideo = $state('website')
  let videoUrl = $derived(activeVideo === 'website' ? websiteVideoUrl : dashboardVideoUrl)

  onMount(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => dialog?.focus(), 0)
    return () => (document.body.style.overflow = previousOverflow)
  })

  function handleKeydown(event) {
    if (event.key === 'Escape') onClose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="demo-modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onClose()}>
  <div class="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-modal-title" tabindex="-1" bind:this={dialog}>
    <header>
      <div><p class="overline"><span></span> Product demo</p><h2 id="demo-modal-title">See how it all comes together.</h2></div>
      <button type="button" onclick={onClose} aria-label="Close demo video">×</button>
    </header>
    <div class="demo-video-tabs" role="tablist" aria-label="Demo videos">
      <button class:active={activeVideo === 'website'} type="button" role="tab" aria-selected={activeVideo === 'website'} onclick={() => (activeVideo = 'website')}>Website</button>
      <button class:active={activeVideo === 'dashboard'} type="button" role="tab" aria-selected={activeVideo === 'dashboard'} onclick={() => (activeVideo = 'dashboard')}>Admin dashboard</button>
    </div>
    <div class="demo-video-frame" role="tabpanel" aria-label={`${activeVideo === 'website' ? 'Website' : 'Admin dashboard'} demo video`}>
      {#if videoUrl}
        <video src={videoUrl} controls preload="metadata"><track kind="captions" /></video>
      {:else}
        <div class="demo-video-placeholder"><span aria-hidden="true">▶</span><strong>{activeVideo === 'website' ? 'Website' : 'Admin dashboard'} demo coming soon</strong><small>Add this video URL in Storefront.svelte when it is ready.</small></div>
      {/if}
    </div>
  </div>
</div>
