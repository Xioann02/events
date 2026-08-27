<script>
  import { scrollReveal } from '../../actions/scrollReveal.js'
  import AccordionItem from '../ui/AccordionItem.svelte'

  let { copy } = $props()
</script>

<section class="faq-section" aria-labelledby="faq-title">
  <div class="section-shell faq-layout">
    <header class="faq-heading" use:scrollReveal={{ distance: 20 }}>
      <p class="eyebrow">{copy.faqEyebrow}</p>
      <h2 id="faq-title">{copy.faqTitle}</h2>
    </header>
    <div class="accordion-list">
      {#each copy.faqs as faq, index}
        <div use:scrollReveal={{ delay: Math.min(index * 60, 180), distance: 14 }}>
          <AccordionItem title={faq.title} open={index === 0}>
            <p>{faq.body}</p>
          </AccordionItem>
        </div>
      {/each}
    </div>
  </div>
</section>
