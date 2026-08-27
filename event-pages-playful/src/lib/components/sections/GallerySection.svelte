<script>
  import { onMount } from 'svelte'
  import coupleWalk from '../../../assets/couple-walk.jpg'
  import receptionTable from '../../../assets/reception-table.jpg'
  import weddingRings from '../../../assets/wedding-rings.jpg'
  import { scrollReveal } from '../../actions/scrollReveal.js'
  import {
    ACCEPTED_MEDIA_TYPES,
    createUploadSlide,
    isSupportedMedia,
  } from '../../utils/media.js'
  import Button from '../ui/Button.svelte'

  let { copy, language } = $props()

  const baseGallery = [coupleWalk, receptionTable, weddingRings]

  let currentSlide = $state(0)
  let isPlaying = $state(false)
  let uploads = $state([])
  let fileInput = $state()
  let uploadMessage = $state('')
  let uploadHasError = $state(false)

  let slides = $derived([
    ...baseGallery.map((src, index) => ({
      id: `editorial-${index}`,
      src,
      type: 'image',
      alt: copy.galleryAlt[index],
      uploaded: false,
    })),
    ...uploads,
  ])

  $effect(() => {
    language
    uploadMessage = ''
    uploadHasError = false
  })

  onMount(() => {
    const slideshowTimer = window.setInterval(() => {
      if (isPlaying && slides.length > 1 && slides[currentSlide]?.type !== 'video') {
        currentSlide = (currentSlide + 1) % slides.length
      }
    }, 5000)

    return () => {
      window.clearInterval(slideshowTimer)
      uploads.forEach((item) => URL.revokeObjectURL(item.src))
    }
  })

  function previousSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length
  }

  function handleDrop(event) {
    event.preventDefault()
    addFiles(event.dataTransfer?.files)
  }

  function addFiles(fileList) {
    const validFiles = Array.from(fileList || []).filter(isSupportedMedia)

    if (!validFiles.length) {
      uploadHasError = true
      uploadMessage = copy.uploadError
      return
    }

    const firstNewSlide = slides.length
    uploads = [...uploads, ...validFiles.map(createUploadSlide)]
    currentSlide = firstNewSlide
    uploadHasError = false
    uploadMessage = copy.uploadAdded

    if (fileInput) fileInput.value = ''
  }

  function removeUpload(id) {
    const item = uploads.find((upload) => upload.id === id)
    if (item) URL.revokeObjectURL(item.src)

    const remainingSlideCount = slides.length - 1
    uploads = uploads.filter((upload) => upload.id !== id)
    currentSlide = Math.min(currentSlide, remainingSlideCount - 1)
  }
</script>

<section class="gallery-section" aria-labelledby="gallery-title">
  <div class="section-shell">
    <header class="gallery-heading" use:scrollReveal={{ distance: 18 }}>
      <p class="eyebrow">{copy.galleryEyebrow}</p>
      <h2 id="gallery-title">{copy.galleryTitle}</h2>
      <p>{copy.galleryText}</p>
    </header>

    <div
      class="slideshow"
      use:scrollReveal={{ delay: 90, distance: 18, scale: 0.994 }}
      role="region"
      aria-roledescription={copy.carousel}
      aria-label={copy.galleryTitle}
    >
      <div class="slideshow-frame">
        {#key slides[currentSlide].id}
          {#if slides[currentSlide].type === 'video'}
            <!-- svelte-ignore a11y_media_has_caption: guest previews may not contain speech; production uploads require moderation/captioning -->
            <video
              src={slides[currentSlide].src}
              controls
              playsinline
              preload="metadata"
              aria-label={slides[currentSlide].alt}
            ></video>
          {:else}
            <img
              src={slides[currentSlide].src}
              alt={slides[currentSlide].alt}
              class:editorial-media={!slides[currentSlide].uploaded}
              width="1536"
              height="1024"
              loading={currentSlide === 0 ? 'eager' : 'lazy'}
            />
          {/if}
        {/key}

        {#if slides[currentSlide].uploaded}
          <button
            class="remove-slide"
            type="button"
            onclick={() => removeUpload(slides[currentSlide].id)}>{copy.remove}</button
          >
        {/if}

        <div class="slideshow-controls">
          <button type="button" aria-label={copy.previous} onclick={previousSlide}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
          </button>
          <button
            type="button"
            class="play-button"
            aria-label={isPlaying ? copy.pause : copy.play}
            onclick={() => (isPlaying = !isPlaying)}
          >
            {#if isPlaying}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" /></svg>
            {/if}
          </button>
          <button type="button" aria-label={copy.next} onclick={nextSlide}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>
        <p class="slide-counter">{currentSlide + 1} {copy.slideOf} {slides.length}</p>
      </div>

      <div class="slide-dots" aria-label={copy.galleryTitle}>
        {#each slides as slide, index}
          <button
            type="button"
            class:active={currentSlide === index}
            aria-label={`${index + 1} ${copy.slideOf} ${slides.length}`}
            aria-current={currentSlide === index ? 'true' : undefined}
            onclick={() => (currentSlide = index)}
          ></button>
        {/each}
      </div>
    </div>

    <div
      class="upload-zone"
      use:scrollReveal={{ delay: 140, distance: 16 }}
      class:error={uploadHasError}
      role="region"
      aria-label={copy.uploadTitle}
      ondragover={(event) => event.preventDefault()}
      ondrop={handleDrop}
    >
      <span class="upload-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 16V4m-5 5 5-5 5 5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />
        </svg>
      </span>
      <div class="upload-copy">
        <h3>{copy.uploadTitle}</h3>
        <p>{copy.uploadText}</p>
      </div>
      <input
        bind:this={fileInput}
        class="sr-only"
        type="file"
        tabindex="-1"
        multiple
        accept={ACCEPTED_MEDIA_TYPES}
        onchange={(event) => addFiles(event.currentTarget.files)}
      />
      <Button onclick={() => fileInput?.click()} variant="light">{copy.uploadButton}</Button>
      <p class="upload-hint">{copy.uploadHint}</p>
      {#if uploadMessage}
        <p class="upload-message" aria-live="polite">{uploadMessage}</p>
      {/if}
      <p class="moderation-note">{copy.moderation}</p>
    </div>
  </div>
</section>
