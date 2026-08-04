<script>
  import { scrollReveal } from '../../actions/scrollReveal.js'
  import Button from '../ui/Button.svelte'

  let { copy } = $props()
</script>

<section class="timeline-section" aria-labelledby="timeline-title">
  <div class="section-shell">
    <header class="section-header section-header--split" use:scrollReveal>
      <div>
        <p class="eyebrow">{copy.timelineEyebrow}</p>
        <h2 id="timeline-title">{copy.timelineTitle}</h2>
      </div>
      <p>{copy.timelineIntro}</p>
    </header>

    <ol class="timeline-list" use:scrollReveal={{ delay: 80, distance: 12 }}>
      {#each copy.timeline as event, index}
        <li
          class="timeline-item"
          use:scrollReveal={{ delay: Math.min(index * 65, 195), distance: 16 }}
        >
          <div class="timeline-time">{event.time}</div>
          <div class="timeline-marker" aria-hidden="true">
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
          <div class="timeline-content">
            <h3>{event.title}</h3>
            <p class="timeline-place">{event.place}</p>
            <p class="timeline-address">{event.address}</p>
            <Button
              href={event.map}
              target="_blank"
              rel="noreferrer"
              variant="link"
              aria-label={`${copy.map}: ${event.place}`}
            >
              {copy.map}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </Button>
          </div>
        </li>
      {/each}
    </ol>
  </div>
</section>
