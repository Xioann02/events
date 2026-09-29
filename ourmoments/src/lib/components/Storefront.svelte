<script>
  import { getOccasion, templates } from '../catalog.js'
  import editorialHero from '../../assets/editorial-hero-collage-v3.jpg'
  import LogoMark from './LogoMark.svelte'
  import ExactTemplateFrame from './ExactTemplateFrame.svelte'

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
    cartCount = 0,
    onCustomize,
    onPreview,
    onAddToCart,
    onOpenCart,
  } = $props()

  let selectedOccasion = $derived(getOccasion(selectedOccasionId))

  function scrollToTemplates() {
    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })
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
    <a href="#website-includes">Website</a>
    <a href="#dashboard-includes">Dashboard</a>
    <a href="#templates">Templates</a>
  </nav>

  <div class="header-actions">
    <button class="cart-button" type="button" onclick={onOpenCart} aria-label={`Open cart, ${cartCount} items`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 8.5h11l-.6 11h-9.8l-.6-11Z" />
        <path d="M9 9V7a3 3 0 0 1 6 0v2" />
      </svg>
      <span>Cart</span>
      <i>{cartCount}</i>
    </button>
    <button class="header-cta" type="button" onclick={scrollToTemplates}>Create your invitation</button>
  </div>
</header>

<main id="main-content">
  <section class="home-hero" id="top">
    <div class="hero-copy">
      <p class="overline"><span></span> Digital invitations, made personal</p>
      <div class="hero-heading-row">
        <h1>Your moment,<br /><em>beautifully told.</em></h1>
        <div class="hero-actions">
          <button class="button button--dark button--large" type="button" onclick={scrollToTemplates}>
            Create your invitation
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </div>

    <div class="hero-art">
      <img
        src={editorialHero}
        alt="Editorial collage of birthday, baby shower and graduation invitation templates"
      />
    </div>

  </section>

  <section class="feature-section feature-section--website" id="website-includes" aria-labelledby="website-includes-heading">
    <div class="section-shell feature-layout">
      <header class="feature-intro">
        <p class="overline"><span></span> What your website includes</p>
        <h2 id="website-includes-heading">Everything guests need,<br /><em>in one place.</em></h2>
        <p>
          A beautiful, shareable home for your celebration—easy for you to update and effortless for every guest to use.
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
        <h2 id="dashboard-includes-heading">Your celebration,<br /><em>beautifully organised.</em></h2>
        <p>One clear dashboard for the practical details, from the first reply to the final photo.</p>
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
        <div class="collection-note">
          <span>Personalise inside the editor</span>
          <strong>Occasion, copy & details</strong>
          <small>All included</small>
        </div>
      </div>

      <div class="template-grid">
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
                <strong>€{template.price}</strong>
              </div>
              <p class="template-description">{template.description}</p>
              <div class="template-actions">
                <button class="button button--cream" type="button" onclick={() => onCustomize(template.id)}>
                  Create your invitation <span aria-hidden="true">→</span>
                </button>
                <button
                  class="icon-button icon-button--light"
                  type="button"
                  onclick={() => onAddToCart(template.id)}
                  aria-label={`Add ${template.name} template to cart`}
                  title="Add to cart"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.5 8.5h11l-.6 11h-9.8l-.6-11Z" />
                    <path d="M9 9V7a3 3 0 0 1 6 0v2" />
                    <path d="M12 11v5m-2.5-2.5h5" />
                  </svg>
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
        <p>No design degree. No endless settings. Just the useful things, exactly where you expect them.</p>
        <button class="button button--dark" type="button" onclick={scrollToTemplates}>
          Create your invitation <span aria-hidden="true">↗</span>
        </button>
      </div>

      <ol class="steps-list">
        <li>
          <span>01</span>
          <div><strong>Choose your design</strong><p>Start with the visual style that feels most like your celebration.</p></div>
          <i aria-hidden="true">✦</i>
        </li>
        <li>
          <span>02</span>
          <div><strong>Set the occasion & details</strong><p>Choose your occasion in the editor, then add the details while the page updates beside you.</p></div>
          <i aria-hidden="true">⌁</i>
        </li>
        <li>
          <span>03</span>
          <div><strong>Add it to your cart</strong><p>Review your finished design. Secure checkout and publishing are coming next.</p></div>
          <i aria-hidden="true">↗</i>
        </li>
      </ol>
    </div>
  </section>

  <section class="closing-banner">
    <div class="closing-shape closing-shape--one" aria-hidden="true"></div>
    <div class="closing-shape closing-shape--two" aria-hidden="true"></div>
    <p class="overline"><span></span> A little corner of the internet, just for you</p>
    <h2>Some moments are too special<br /><em>not to share.</em></h2>
    <button class="button button--dark button--large" type="button" onclick={scrollToTemplates}>
      Create your invitation <span aria-hidden="true">↗</span>
    </button>
  </section>
</main>

<footer class="site-footer">
  <div class="brand brand--footer">
    <LogoMark />
    <span>ourmoments<span>.io</span></span>
  </div>
  <p>Beautifully simple invitations for the days worth remembering.</p>
  <div class="footer-links"><a href="#website-includes">Website</a><a href="#dashboard-includes">Dashboard</a><a href="#templates">Templates</a><span>© 2026</span></div>
</footer>
