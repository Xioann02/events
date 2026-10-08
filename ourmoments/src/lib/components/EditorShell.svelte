<script>
  import { tick } from 'svelte'
  import { getOccasion, getTemplate, occasions, sectionOrder, templates } from '../catalog.js'
  import LogoMark from './LogoMark.svelte'
  import PreviewFrame from './PreviewFrame.svelte'

  let {
    draft = $bindable(),
    cartCount = 0,
    onBack,
    onOccasionChange,
    onTemplateChange,
    onAddToCart,
    onOpenCart,
    primaryActionLabel = '',
    showCart = true,
  } = $props()

  let previewMode = $state('desktop')
  let mobilePane = $state('edit')
  let statusMessage = $state('Your live preview is ready.')
  let statusTimer

  let occasion = $derived(getOccasion(draft.occasionId))
  let template = $derived(getTemplate(draft.templateId))
  let primaryLabel = $derived(primaryActionLabel || `Add to cart · €${template.price}`)
  let hiddenSections = $derived(sectionOrder.filter((sectionId) => !draft.sections[sectionId]))

  function announce(message) {
    statusMessage = message
    window.clearTimeout(statusTimer)
    statusTimer = window.setTimeout(() => {
      statusMessage = 'Changes appear in the preview as you type.'
    }, 2600)
  }

  async function removeSection(sectionId) {
    draft.sections[sectionId] = false
    announce(`${occasion.sectionLabels[sectionId]} section removed. You can restore it below.`)
    await tick()
    document.querySelector(`[data-restore-section="${sectionId}"]`)?.focus()
  }

  function restoreSection(sectionId) {
    draft.sections[sectionId] = true
    announce(`${occasion.sectionLabels[sectionId]} section restored.`)
  }

  function chooseTemplate(templateId) {
    draft.templateId = templateId
    onTemplateChange(templateId)
  }

  function addScheduleItem() {
    draft.scheduleItems.push({ time: '7:00 PM', title: 'New moment', detail: 'Add a detail' })
    announce('Schedule item added.')
  }

  function removeScheduleItem(index) {
    draft.scheduleItems.splice(index, 1)
    announce('Schedule item removed.')
  }

  function addFaqItem() {
    draft.faqItems.push({ question: 'A new question', answer: 'Add your answer here.' })
    announce('Question added.')
  }

  function removeFaqItem(index) {
    draft.faqItems.splice(index, 1)
    announce('Question removed.')
  }
</script>

<p class="sr-only" aria-live="polite">{statusMessage}</p>

<div class="editor-page">
  <header class="editor-topbar">
    <div class="editor-topbar__left">
      <button class="back-button" type="button" onclick={onBack} aria-label="Back to templates">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button class="editor-brand" type="button" onclick={onBack} aria-label="Back to ourmoments.io home">
        <LogoMark />
        <span>ourmoments<span>.io</span></span>
      </button>
      <div class="editor-title">
        <span>{template.name}</span>
        <p><i></i> Live preview</p>
      </div>
    </div>

    <div class="editor-topbar__center">
      <div class="device-toggle" aria-label="Preview size">
        <button class:active={previewMode === 'desktop'} type="button" onclick={() => (previewMode = 'desktop')} aria-label="Desktop preview">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M9 21h6m-3-4v4" /></svg>
        </button>
        <button class:active={previewMode === 'mobile'} type="button" onclick={() => (previewMode = 'mobile')} aria-label="Mobile preview">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M10 5h4m-2 13.5v.5" /></svg>
        </button>
      </div>
    </div>

    <div class="editor-topbar__actions">
      {#if showCart}
        <button class="editor-cart" type="button" onclick={onOpenCart} aria-label={`Open cart, ${cartCount} items`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5h11l-.6 11h-9.8l-.6-11Z" /><path d="M9 9V7a3 3 0 0 1 6 0v2" /></svg>
          <span>{cartCount}</span>
        </button>
      {/if}
      <button class="button button--dark add-cart-top" type="button" onclick={onAddToCart}>
        {primaryLabel}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  </header>

  <div class="mobile-pane-switch" role="tablist" aria-label="Editor view">
    <button class:active={mobilePane === 'edit'} role="tab" aria-selected={mobilePane === 'edit'} type="button" onclick={() => (mobilePane = 'edit')}>
      Edit details
    </button>
    <button class:active={mobilePane === 'preview'} role="tab" aria-selected={mobilePane === 'preview'} type="button" onclick={() => (mobilePane = 'preview')}>
      See preview
    </button>
  </div>

  <main class="editor-workspace">
    <aside class:mobile-hidden={mobilePane !== 'edit'} class="editor-panel" aria-label="Invitation editor">
      <div class="editor-panel__intro">
        <span class="editor-step">Your invitation</span>
        <h1>Make it yours.</h1>
        <p>We have kept this simple: add the details that matter and remove anything you do not need.</p>
      </div>

      <div class="editor-groups">
        <details class="editor-group" open>
          <summary>
            <span class="summary-icon" aria-hidden="true">01</span>
            <span><strong>The essentials</strong><small>Occasion, names & invitation copy</small></span>
            <i aria-hidden="true">+</i>
          </summary>
          <div class="editor-group__body">
            <div class="field-row field-row--two">
              <label>
                <span>Occasion</span>
                <select value={draft.occasionId} onchange={(event) => onOccasionChange(event.currentTarget.value)}>
                  {#each occasions as item}<option value={item.id}>{item.label}</option>{/each}
                </select>
              </label>
              <label>
                <span>Template</span>
                <select value={draft.templateId} onchange={(event) => chooseTemplate(event.currentTarget.value)}>
                  {#each templates as item}<option value={item.id}>{item.name}</option>{/each}
                </select>
              </label>
            </div>

            <div class="theme-choices" aria-label="Choose a visual style">
              {#each templates as item}
                <button
                  class:active={draft.templateId === item.id}
                  type="button"
                  onclick={() => chooseTemplate(item.id)}
                  aria-label={`Use ${item.name}`}
                  aria-pressed={draft.templateId === item.id}
                  title={item.name}
                >
                  {#each item.palette as colour}<i style={`background:${colour}`}></i>{/each}
                </button>
              {/each}
            </div>

            <label class="field">
              <span>{occasion.titleLabel}</span>
              <input bind:value={draft.title} placeholder={occasion.titlePlaceholder} maxlength="70" />
              <small>{draft.title.length}/70</small>
            </label>
            <label class="field">
              <span>Small introduction</span>
              <input bind:value={draft.eyebrow} maxlength="80" />
            </label>
          </div>
        </details>

        <details class="editor-group" open>
          <summary>
            <span class="summary-icon" aria-hidden="true">02</span>
            <span><strong>Date & place</strong><small>When and where it is happening</small></span>
            <i aria-hidden="true">+</i>
          </summary>
          <div class="editor-group__body">
            <div class="field-row field-row--two">
              <label><span>Date</span><input type="date" bind:value={draft.date} /></label>
              <label><span>Start time</span><input type="time" bind:value={draft.time} /></label>
            </div>
            <label class="field"><span>Venue</span><input bind:value={draft.venue} maxlength="80" /></label>
            <label class="field"><span>City or location</span><input bind:value={draft.location} maxlength="80" /></label>
          </div>
        </details>

        {#if draft.sections.story}
          <details class="editor-group">
            <summary>
              <span class="summary-icon" aria-hidden="true">03</span>
              <span><strong>{occasion.sectionLabels.story}</strong><small>A short personal introduction</small></span>
              <i aria-hidden="true">+</i>
            </summary>
            <div class="editor-group__body">
              <div class="section-action-row">
                <span>Visible on your invitation</span>
                <button class="remove-section" type="button" onclick={() => removeSection('story')}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg>
                  Remove section
                </button>
              </div>
              <label class="field"><span>Heading</span><input bind:value={draft.storyTitle} maxlength="90" /></label>
              <label class="field"><span>Your message</span><textarea bind:value={draft.storyBody} rows="5" maxlength="480"></textarea></label>
              {#if draft.occasionId === 'wedding'}
                <div class="field-row field-row--two">
                  <label><span>First family label</span><input bind:value={draft.hostOneLabel} maxlength="50" /></label>
                  <label><span>First family name</span><input bind:value={draft.hostOne} maxlength="70" /></label>
                </div>
                <div class="field-row field-row--two">
                  <label><span>Second family label</span><input bind:value={draft.hostTwoLabel} maxlength="50" /></label>
                  <label><span>Second family name</span><input bind:value={draft.hostTwo} maxlength="70" /></label>
                </div>
              {/if}
            </div>
          </details>
        {/if}

        {#if draft.sections.schedule}
          <details class="editor-group">
            <summary>
              <span class="summary-icon" aria-hidden="true">04</span>
              <span><strong>{occasion.sectionLabels.schedule}</strong><small>The flow of your celebration</small></span>
              <i aria-hidden="true">+</i>
            </summary>
            <div class="editor-group__body">
              <div class="section-action-row">
                <span>{draft.scheduleItems.length} moments</span>
                <button class="remove-section" type="button" onclick={() => removeSection('schedule')}>Remove section</button>
              </div>
              <label class="field"><span>Heading</span><input bind:value={draft.scheduleTitle} maxlength="100" /></label>
              <div class="repeat-list">
                {#each draft.scheduleItems as item, index}
                  <fieldset class="repeat-card">
                    <legend>Moment {index + 1}</legend>
                    {#if draft.scheduleItems.length > 1}
                      <button class="repeat-remove" type="button" onclick={() => removeScheduleItem(index)} aria-label={`Remove schedule item ${index + 1}`}>×</button>
                    {/if}
                    <label><span>Time</span><input bind:value={item.time} maxlength="20" /></label>
                    <label><span>What happens</span><input bind:value={item.title} maxlength="60" /></label>
                    <label><span>Little detail</span><input bind:value={item.detail} maxlength="60" /></label>
                  </fieldset>
                {/each}
              </div>
              {#if draft.scheduleItems.length < 5}
                <button class="add-row-button" type="button" onclick={addScheduleItem}><span>+</span> Add another moment</button>
              {/if}
            </div>
          </details>
        {/if}

        {#if draft.sections.rsvp}
          <details class="editor-group">
            <summary>
              <span class="summary-icon" aria-hidden="true">05</span>
              <span><strong>{occasion.sectionLabels.rsvp}</strong><small>Help guests reply</small></span>
              <i aria-hidden="true">+</i>
            </summary>
            <div class="editor-group__body">
              <div class="section-action-row"><span>Response form included</span><button class="remove-section" type="button" onclick={() => removeSection('rsvp')}>Remove section</button></div>
              <label class="field"><span>Heading</span><input bind:value={draft.rsvpTitle} maxlength="80" /></label>
              <label class="field"><span>Deadline or note</span><textarea bind:value={draft.rsvpBody} rows="3" maxlength="180"></textarea></label>
              <p class="editor-note"><span>i</span> Guest response collection will be connected when publishing is available.</p>
            </div>
          </details>
        {/if}

        {#if draft.sections.faq}
          <details class="editor-group">
            <summary>
              <span class="summary-icon" aria-hidden="true">06</span>
              <span><strong>{occasion.sectionLabels.faq}</strong><small>Answer common guest questions</small></span>
              <i aria-hidden="true">+</i>
            </summary>
            <div class="editor-group__body">
              <div class="section-action-row"><span>{draft.faqItems.length} questions</span><button class="remove-section" type="button" onclick={() => removeSection('faq')}>Remove section</button></div>
              <label class="field"><span>Heading</span><input bind:value={draft.faqTitle} maxlength="80" /></label>
              <div class="repeat-list">
                {#each draft.faqItems as item, index}
                  <fieldset class="repeat-card">
                    <legend>Question {index + 1}</legend>
                    {#if draft.faqItems.length > 1}<button class="repeat-remove" type="button" onclick={() => removeFaqItem(index)} aria-label={`Remove question ${index + 1}`}>×</button>{/if}
                    <label><span>Question</span><input bind:value={item.question} maxlength="90" /></label>
                    <label><span>Answer</span><textarea bind:value={item.answer} rows="3" maxlength="250"></textarea></label>
                  </fieldset>
                {/each}
              </div>
              {#if draft.faqItems.length < 5}<button class="add-row-button" type="button" onclick={addFaqItem}><span>+</span> Add a question</button>{/if}
            </div>
          </details>
        {/if}

        {#if draft.sections.gallery}
          <details class="editor-group">
            <summary>
              <span class="summary-icon" aria-hidden="true">07</span>
              <span><strong>{occasion.sectionLabels.gallery}</strong><small>A visual moment on the page</small></span>
              <i aria-hidden="true">+</i>
            </summary>
            <div class="editor-group__body">
              <div class="section-action-row"><span>Sample images for now</span><button class="remove-section" type="button" onclick={() => removeSection('gallery')}>Remove section</button></div>
              <label class="field"><span>Heading</span><input bind:value={draft.galleryTitle} maxlength="80" /></label>
              <label class="field"><span>Short introduction</span><textarea bind:value={draft.galleryBody} rows="3" maxlength="200"></textarea></label>
              <p class="editor-note"><span>i</span> Personal photo uploads will be part of the publishing step.</p>
            </div>
          </details>
        {/if}

        <details class="editor-group">
          <summary>
            <span class="summary-icon" aria-hidden="true">08</span>
            <span><strong>Closing note</strong><small>The final line on your page</small></span>
            <i aria-hidden="true">+</i>
          </summary>
          <div class="editor-group__body">
            <label class="field"><span>Footer note</span><input bind:value={draft.footerNote} maxlength="120" /></label>
          </div>
        </details>
      </div>

      {#if hiddenSections.length > 0}
        <section class="hidden-sections" aria-labelledby="hidden-sections-title">
          <div>
            <span>{hiddenSections.length}</span>
            <p><strong id="hidden-sections-title">Hidden sections</strong><small>Restore one whenever you like.</small></p>
          </div>
          <div class="hidden-section-list">
            {#each hiddenSections as sectionId}
              <button type="button" data-restore-section={sectionId} onclick={() => restoreSection(sectionId)}>
                <span>+</span> {occasion.sectionLabels[sectionId]}
              </button>
            {/each}
          </div>
        </section>
      {/if}

      <div class="editor-panel__end">
        <span>That is everything.</span>
        <p>Your invitation is ready when you are.</p>
      </div>
    </aside>

    <section class:mobile-hidden={mobilePane !== 'preview'} class="preview-workspace" aria-label="Live invitation preview">
      <div class="preview-workspace__header">
        <div>
          <span>Live result</span>
          <p>{template.name} · {occasion.label}</p>
        </div>
        <p class="preview-help"><span aria-hidden="true">↯</span> Changes appear here instantly</p>
      </div>
      <div class="preview-stage">
        <PreviewFrame {draft} mode={previewMode} />
      </div>
    </section>
  </main>

  <div class="mobile-editor-bar">
    <button type="button" onclick={() => (mobilePane = mobilePane === 'edit' ? 'preview' : 'edit')}>
      {mobilePane === 'edit' ? 'Preview' : 'Keep editing'}
    </button>
    <button type="button" onclick={onAddToCart}>{primaryLabel}</button>
  </div>
</div>
