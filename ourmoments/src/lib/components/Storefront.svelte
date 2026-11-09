<script>
  import { getOccasion, templates } from '../catalog.js'
  import LogoMark from './LogoMark.svelte'
  import ExactTemplateFrame from './ExactTemplateFrame.svelte'
  import HeroFeatureScene from './HeroFeatureScene.svelte'
  import PlansPage from './PlansPage.svelte'

  const websiteFeatures = [
    { title: 'Event information', detail: 'Keep every date, time and venue detail together.' },
    { title: 'RSVP', detail: 'Collect guest replies in one simple place.' },
    { title: 'Countdown & calendar', detail: 'Build anticipation and let guests save the date.' },
    { title: 'Maps & directions', detail: 'Help everyone get exactly where they need to be.' },
    { title: 'Guest photo uploads', detail: 'Let guests add their favourite moments from any phone.' },
    { title: 'Multiple languages', detail: 'Welcome every guest in the language that suits them.' },
    { title: 'Easy group sharing', detail: 'Share one link with family, friends and group chats.' },
    { title: 'FAQs', detail: 'Answer the common questions before they are asked.' },
  ]

  const dashboardFeatures = [
    { title: 'Seating arrangement', detail: 'Arrange tables and place guests with ease.' },
    { title: 'Attendance', detail: 'See attending, declined and pending replies at a glance.' },
    { title: 'Gifts', detail: 'Keep gift details organised in one place.' },
    { title: 'Photos', detail: 'Review and manage guest uploads from your dashboard.' },
  ]

  let {
    selectedOccasionId,
    onCustomize,
    onPreview,
    onAccountAccess,
    onBuyPlan,
  } = $props()

  let selectedOccasion = $derived(getOccasion(selectedOccasionId))
  let templateTrack

  function scrollToTemplates() {
    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })
  }

  function scrollTemplates(direction) {
    if (!templateTrack) return
    templateTrack.scrollBy({
      left: direction * templateTrack.clientWidth * 0.82,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

</script>

<a class="skip-link" href="#main-content">Skip to content</a>

<aside class="edition-bar" aria-label="Site edition">
  <div class="edition-bar__inner">
    <span>Our Moments · Digital Invitations</span>
    <span>Edition No. 01 / 2026</span>
    <span>Designed for every gathering</span>
  </div>
</aside>

<header class="site-header">
  <a class="brand" href="#top" aria-label="ourmoments.io home">
    <LogoMark />
    <span>ourmoments<span>.io</span></span>
  </a>

  <nav class="desktop-nav" aria-label="Main navigation">
    <a href="#templates">Templates</a>
    <a href="#plans">Plans</a>
  </nav>

  <div class="header-actions">
    <button class="header-cta" type="button" onclick={onAccountAccess}>My account</button>
  </div>
</header>

<main id="main-content">
  <section class="home-hero" id="top">
    <div class="hero-copy">
      <p class="hero-overline"><span></span> Your event, beautifully together</p>
      <h1><span>Every detail,</span><br /><em>in one place</em></h1>
      <div class="hero-support">
        <p class="hero-lede">
          Your invitation, event details, and guest planning in one thoughtful place.
        </p>
        <div class="hero-actions">
          <button class="button button--dark button--large" type="button" onclick={scrollToTemplates}>
            Explore templates
            <span aria-hidden="true">↘</span>
          </button>
        </div>
      </div>
    </div>

    <div class="hero-art">
      <HeroFeatureScene />
    </div>

  </section>

  <section class="feature-section feature-section--website" id="website-includes" aria-labelledby="website-includes-heading">
    <div class="section-shell feature-layout">
      <header class="feature-intro">
        <p class="overline"><span></span> What your website includes</p>
        <h2 id="website-includes-heading">Your event website,<br /><em>all in one place.</em></h2>
        <p>
          A beautiful, shareable website with your invitation, schedule, RSVPs, and event details together in one link.
        </p>
      </header>

      <ol class="feature-index">
        {#each websiteFeatures as feature, index}
          <li>
            <span aria-hidden="true">0{index + 1}</span>
            <div><h3>{feature.title}</h3><p>{feature.detail}</p></div>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  <section class="feature-section feature-section--dashboard" id="dashboard-includes" aria-labelledby="dashboard-includes-heading">
    <div class="section-shell feature-layout feature-layout--dashboard">
      <header class="feature-intro">
        <p class="overline"><span></span> What your dashboard includes</p>
        <h2 id="dashboard-includes-heading">Your event planning platform,<br /><em>beautifully organised.</em></h2>
        <p>Manage RSVPs, guest lists, seating, gifts, and shared photos in one private planning space.</p>
      </header>

      <ol class="feature-index feature-index--compact">
        {#each dashboardFeatures as feature, index}
          <li>
            <span aria-hidden="true">0{index + 1}</span>
            <div><h3>{feature.title}</h3><p>{feature.detail}</p></div>
          </li>
        {/each}
      </ol>
    </div>
  </section>

  <section class="template-section" id="templates" aria-labelledby="template-heading">
    <div class="section-shell">
      <div class="section-intro template-intro">
        <div>
          <p class="overline overline--light"><span></span> The collection</p>
          <h2 id="template-heading">Find a look that<br /><em>feels like you.</em></h2>
        </div>
        <div class="template-carousel-controls" aria-label="Template carousel controls">
          <button type="button" onclick={() => scrollTemplates(-1)} aria-label="Show previous templates">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button type="button" onclick={() => scrollTemplates(1)} aria-label="Show more templates">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <div class="template-grid" bind:this={templateTrack} role="region" aria-label="Invitation templates">
        {#each templates as template, index}
          <article class="template-card">
            <div class="template-card__preview">
              <ExactTemplateFrame
                draft={{
                  occasionId: selectedOccasion.id,
                  templateId: template.id,
                  ...structuredClone(selectedOccasion.defaults),
                  sections: { story: true, schedule: true, rsvp: true, faq: true, gallery: true },
                }}
                showChrome={false}
                thumbnail={true}
                title={`${template.name} exact template thumbnail`}
              />
              <button class="preview-pill" type="button" onclick={() => onPreview(template.id)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
                Preview
              </button>
            </div>

            <div class="template-card__body">
              <div class="template-meta">
                <span>0{index + 1}</span>
                <div>
                  <h3>{template.name}</h3>
                  <p>{template.personality}</p>
                </div>
              </div>
              <p class="template-description">{template.description}</p>
              <div class="template-actions">
                <button class="button button--cream" type="button" onclick={() => onCustomize(template.id)}>
                  Use this design <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class="how-section section-shell" id="how-it-works" aria-labelledby="how-heading">
    <div class="how-layout">
      <div class="how-copy">
        <p class="overline"><span></span> Simple by design</p>
        <h2 id="how-heading">From idea to invite<br />in three easy steps.</h2>
        <p>Create your invitation, share it with your guests, then choose the plan that fits your event.</p>
        <button class="button button--dark" type="button" onclick={scrollToTemplates}>
          Create your invitation <span aria-hidden="true">↗</span>
        </button>
      </div>

      <ol class="steps-list">
        <li>
          <span>01</span>
          <div><strong>Create your invitation</strong><p>Choose a design, add your event details, and see your invitation take shape.</p></div>
          <i aria-hidden="true">✦</i>
        </li>
        <li>
          <span>02</span>
          <div><strong>Share</strong><p>Send your guests one simple link to your invitation and all the important event details.</p></div>
          <i aria-hidden="true">⌁</i>
        </li>
        <li>
          <span>03</span>
          <div><strong>Start planning your event</strong><p>Track RSVPs, organize your guest list, and arrange seating—all in one place.</p></div>
          <i aria-hidden="true">↗</i>
        </li>
      </ol>
    </div>
  </section>

  <PlansPage {onBuyPlan} />

  <!--<section class="closing-banner">
    <div class="closing-shape closing-shape--one" aria-hidden="true"></div>
    <div class="closing-shape closing-shape--two" aria-hidden="true"></div>
    <p class="overline"><span></span> A little corner of the internet, just for you</p>
    <h2>Some moments are too special<br /><em>not to share.</em></h2>
    <button class="button button--dark button--large" type="button" onclick={scrollToTemplates}>
      Create your invitation <span aria-hidden="true">↗</span>
    </button>
  </section>-->
</main>

<footer class="site-footer">
  <div class="brand brand--footer">
    <LogoMark />
    <span>ourmoments<span>.io</span></span>
  </div>
  <p>Beautifully simple invitations for the days worth remembering.</p>
  <div class="footer-links"><a href="#templates">Templates</a><a href="#plans">Plans</a><span>© 2026</span></div>
</footer>
