<script>
  import { onDestroy } from 'svelte'
  import { applyDraftToTemplate, templateUrl } from '../exact-template-bridge.js'

  let {
    draft,
    mode = 'desktop',
    showChrome = true,
    interactive = false,
    thumbnail = false,
    title = 'Invitation preview',
  } = $props()

  let frame = $state()
  let viewport = $state()
  let observer
  let resizeObserver
  let measuredWidth = 0
  let resizeFrame
  let loaded = $state(false)
  let previousTemplateId = $state('')
  let renderedTemplateId = $derived(draft.templateId)

  let sourceWidth = $derived(thumbnail ? 1440 : mode === 'mobile' ? 390 : 1440)
  let viewportHeight = $derived(thumbnail ? 1048 : mode === 'mobile' ? 844 : 1100)
  let accessibilityProps = $derived(interactive ? {} : { tabindex: '-1', 'aria-hidden': 'true' })

  $effect(() => {
    const nextTemplateId = renderedTemplateId
    if (previousTemplateId && previousTemplateId !== nextTemplateId) loaded = false
    previousTemplateId = nextTemplateId
  })

  $effect(() => {
    draft
    renderedTemplateId
    if (loaded) patchFrame()
  })

  function patchFrame() {
    try {
      applyDraftToTemplate(frame?.contentDocument, draft, renderedTemplateId)
    } catch {
      // The build is expected to be same-origin; leave its exact default rendering if it is not.
    }
  }

  function handleLoad() {
    loaded = true
    patchFrame()
    const root = frame?.contentDocument?.getElementById('app')
    if (root) {
      observer?.disconnect()
      observer = new MutationObserver(() => patchFrame())
      observer.observe(root, { childList: true, characterData: true, subtree: true })
    }
  }

  $effect(() => {
    if (!viewport) return
    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      if (Math.abs(width - measuredWidth) < 0.5) return
      measuredWidth = width
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => viewport?.style.setProperty('--frame-width', width))
    })
    resizeObserver.observe(viewport)
    return () => resizeObserver?.disconnect()
  })

  onDestroy(() => {
    observer?.disconnect()
    resizeObserver?.disconnect()
    cancelAnimationFrame(resizeFrame)
  })
</script>

<div class:exact-frame--mobile={mode === 'mobile'} class:exact-frame--thumbnail={thumbnail} class="exact-frame">
  {#if showChrome}
    <div class="browser-bar" aria-hidden="true">
      <div class="browser-dots"><i></i><i></i><i></i></div>
      <div class="browser-address"><span>⌁</span>preview.ourmoments.io</div>
      <span class="browser-open">↗</span>
    </div>
  {/if}
  <div bind:this={viewport} class="exact-frame__viewport" style={`--source-width:${sourceWidth};--viewport-height:${viewportHeight}`}>
    {#key renderedTemplateId}
      <iframe
        bind:this={frame}
        src={templateUrl(renderedTemplateId)}
        {title}
        {...accessibilityProps}
        loading={thumbnail ? 'lazy' : 'eager'}
        onload={handleLoad}
      ></iframe>
    {/key}
    {#if !loaded}<div class="exact-frame__loading" aria-hidden="true"><span></span></div>{/if}
  </div>
</div>

<style>
  .exact-frame {
    width: min(100%, 1080px);
    overflow: hidden;
    border: 1px solid rgba(11, 11, 11, 0.36);
    border-radius: 16px;
    background: #fff;
    box-shadow: 18px 18px 0 rgba(11, 11, 11, 0.08);
    transition: width 280ms cubic-bezier(0.2, 0.75, 0.25, 1);
  }

  .exact-frame--mobile {
    width: min(100%, 390px);
  }

  .exact-frame__viewport {
    position: relative;
    width: 100%;
    height: calc(var(--viewport-height) * 1px * (var(--frame-width, 1080) / var(--source-width)));
    min-height: 400px;
    overflow: hidden;
    container-type: inline-size;
    background: #dedbd5;
  }

  .exact-frame__viewport iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(var(--source-width) * 1px);
    height: calc(var(--viewport-height) * 1px);
    border: 0;
    transform: scale(calc(100cqw / var(--source-width)));
    transform-origin: top left;
  }

  .exact-frame--mobile .exact-frame__viewport iframe {
    width: 390px;
    height: 844px;
    transform: scale(calc(100cqw / 390));
  }

  .exact-frame--thumbnail {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .exact-frame--thumbnail .exact-frame__viewport {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .exact-frame--thumbnail iframe {
    pointer-events: none;
    user-select: none;
  }

  .exact-frame__loading {
    position: absolute;
    z-index: 2;
    inset: 0;
    display: grid;
    background: #dedbd5;
    place-items: center;
  }

  .exact-frame__loading span {
    width: 28px;
    height: 28px;
    border: 2px solid rgba(11, 11, 11, 0.16);
    border-top-color: #751d24;
    border-radius: 50%;
    animation: spin 700ms linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .exact-frame__loading span { animation: none; }
  }
</style>
