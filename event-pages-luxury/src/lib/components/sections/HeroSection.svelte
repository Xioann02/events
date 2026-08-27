<script>
  import { onMount } from 'svelte'
  import modernCouple from '../../../assets/modern-couple.jpg'
  import { WEDDING_DATE, WEDDING_DISPLAY } from '../../wedding-config.js'
  import { downloadWeddingCalendar } from '../../utils/calendar.js'
  import { getCountdown, getCountdownLabel, padCountdown } from '../../utils/countdown.js'
  import Button from '../ui/Button.svelte'

  let { copy } = $props()

  const eventTime = new Date(WEDDING_DATE).getTime()
  let now = $state(Date.now())

  let countdown = $derived(getCountdown(eventTime, now))
  let countdownLabel = $derived(getCountdownLabel(copy, eventTime, now, countdown.remaining))

  onMount(() => {
    const timer = window.setInterval(() => {
      now = Date.now()
    }, 1000)

    return () => window.clearInterval(timer)
  })
</script>

<section class="hero-section" aria-labelledby="couple-names">
  <div class="hero-shell">
    <div class="hero-scene">
      <div class="stationery-backdrop" aria-hidden="true">
        <span class="backdrop-monogram">
          {WEDDING_DISPLAY.initials[0]} <i>&</i> {WEDDING_DISPLAY.initials[1]}
        </span>
        <span class="backdrop-line"></span>
        <small>{WEDDING_DISPLAY.city} · {WEDDING_DISPLAY.country}</small>
      </div>
      <div class="confetti confetti--one" aria-hidden="true"></div>
      <div class="confetti confetti--two" aria-hidden="true"></div>
      <div class="confetti confetti--three" aria-hidden="true"></div>
      <div class="pearl-chain" aria-hidden="true">
        {#each Array(11) as _}<i></i>{/each}
      </div>

      <div class="envelope-stage">
        <div class="envelope-back" aria-hidden="true"></div>

        <div class="invitation-card">
          <p class="invitation-card__label">
            {copy.invitationEyebrow} · {WEDDING_DISPLAY.shortDate}
          </p>
          <h1 id="couple-names" aria-label={copy.names}>
            {#each copy.names.split(' & ') as person, index}
              <span>{person}</span>
              {#if index === 0}<i aria-hidden="true">&</i>{/if}
            {/each}
          </h1>
          <time class="hero-date" datetime={WEDDING_DATE} aria-label={copy.date}>
            {#each copy.date.split(' · ') as detail, index}
              <span aria-hidden="true">{detail}</span>
              {#if index === 0}<i aria-hidden="true"></i>{/if}
            {/each}
          </time>
          <span class="wax-seal" aria-hidden="true">
            {WEDDING_DISPLAY.initials[0]} <i>&</i> {WEDDING_DISPLAY.initials[1]}
          </span>
        </div>

        <div class="envelope-flap" aria-hidden="true"></div>
        <div class="envelope-front" aria-hidden="true">
          <span class="envelope-front__left"></span>
          <span class="envelope-front__right"></span>
          <span class="envelope-front__bottom"></span>
        </div>
      </div>

      <figure class="hero-photo">
        <span class="photo-pearl" aria-hidden="true"></span>
        <img src={modernCouple} alt={copy.heroAlt} width="1536" height="1024" fetchpriority="high" />
        <figcaption>
          <span>{WEDDING_DISPLAY.initials.join(' & ')}</span>
          <span>{WEDDING_DISPLAY.country} · {WEDDING_DISPLAY.year}</span>
        </figcaption>
      </figure>

      <div class="date-medallion" aria-hidden="true">
        <span>{WEDDING_DISPLAY.month}</span>
        <strong>{WEDDING_DISPLAY.day}</strong>
        <small>{WEDDING_DISPLAY.year}</small>
      </div>
    </div>

    <div class="countdown-block">
      <p class="sr-only" aria-live="polite">{countdown.remaining === 0 ? countdownLabel : ''}</p>
      <p class="eyebrow">{countdownLabel}</p>
      <div class="countdown-grid" aria-label={copy.countdownEyebrow}>
        {#each countdown.values as value, index}
          <div class="countdown-unit">
            <strong>{padCountdown(value)}</strong>
            <span>{copy.units[index]}</span>
          </div>
        {/each}
      </div>
      <Button onclick={() => downloadWeddingCalendar(copy)} variant="primary" size="large">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
        {copy.calendar}
      </Button>
    </div>
  </div>
</section>
