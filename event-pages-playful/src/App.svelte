<script>
  import {
    FaqSection,
    GallerySection,
    HeroSection,
    InvitationSection,
    RsvpSection,
    SiteChrome,
    SiteFooter,
    TimelineSection,
  } from './lib/components/sections/index.js'
  import { translations } from './lib/wedding-data.js'

  let language = $state('en')
  let copy = $derived(translations[language])

  $effect(() => {
    document.documentElement.lang = language
  })

  function setLanguage(nextLanguage) {
    language = nextLanguage
  }
</script>

<svelte:head>
  <title>{copy.pageTitle}</title>
  <meta name="description" content={copy.pageDescription} />
</svelte:head>

<SiteChrome {copy} {language} onLanguageChange={setLanguage} />

<main id="main-content" tabindex="-1">
  <HeroSection {copy} />
  <InvitationSection {copy} />
  <TimelineSection {copy} />
  <RsvpSection {copy} {language} />
  <FaqSection {copy} />
  <GallerySection {copy} {language} />
</main>

<SiteFooter {copy} />
