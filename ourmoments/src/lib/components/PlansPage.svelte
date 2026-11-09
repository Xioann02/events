<script>
  import { plans } from '../plans.js'

  let { onBuyPlan } = $props()
</script>

<section class="plans-page" id="plans" aria-labelledby="plans-heading">
  <header class="plans-intro">
    <p class="overline"><span></span> Plans</p>
    <h1 id="plans-heading">Choose your<br /><em>kind of celebration.</em></h1>
    <p>One clear purchase. The right tools for bringing your people together.</p>
  </header>

  <div class="plans-grid" aria-label="Available plans">
    {#each plans as plan}
      <article class:plan-card--featured={plan.featured} class="plan-card">
        <div class="plan-card__topline">
          {#if plan.featured}<span class="plan-card__mark">Multi-event</span>{:else}<span class="plan-card__mark-spacer" aria-hidden="true"></span>{/if}
        </div>
        <h2>{plan.name}</h2>
        <p class="plan-card__description">{plan.description}</p>
        <p class="plan-card__price"><strong>€{plan.price}</strong><span>one-time</span></p>
        <button class="button button--dark button--large" type="button" onclick={() => onBuyPlan(plan.id)}>
          Choose {plan.name}<span aria-hidden="true">↗</span>
        </button>
        <ul>
          {#each plan.features as feature}
            <li><span aria-hidden="true">+</span>{feature}</li>
          {/each}
        </ul>
      </article>
    {/each}
  </div>
  <p class="plans-note">Checkout is currently a demo. No payment will be charged.</p>
</section>

<style>
  .plans-page {
    position: relative;
    margin-top: clamp(36px, 5vw, 72px);
    padding: clamp(88px, 10vw, 144px) max(var(--page-gutter), calc((100vw - var(--shell)) / 2));
    border-block: 1px solid rgba(31, 45, 37, 0.24);
    scroll-margin-top: 88px;
  }

  .plans-intro {
    width: min(760px, 100%);
    margin: 0 auto 62px;
    text-align: center;
  }

  .plans-intro .overline {
    justify-content: center;
  }

  .plans-intro h1 {
    font-family: var(--display);
    font-size: clamp(3.2rem, 6vw, 5.8rem);
    font-weight: 400;
    line-height: 0.96;
  }

  .plans-intro h1 em {
    color: var(--terracotta-deep);
    font-weight: 400;
  }

  .plans-intro > p:last-child {
    max-width: 430px;
    margin: 20px auto 0;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.65;
  }

  .plans-grid {
    display: grid;
    width: min(940px, 100%);
    margin: 0 auto;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    gap: 18px;
  }

  .plan-card {
    display: flex;
    min-width: 0;
    padding: clamp(25px, 3.5vw, 38px);
    border: 1px solid rgba(11, 11, 11, 0.18);
    background: #fff;
    flex-direction: column;
  }

  .plan-card--featured {
    border-color: var(--line-strong);
    box-shadow: 0 12px 30px rgba(11, 11, 11, 0.06);
  }

  .plan-card__topline {
    display: flex;
    height: 28px;
    min-height: 28px;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: var(--muted);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .plan-card__mark {
    flex-shrink: 0;
    padding: 5px 8px;
    border-radius: 999px;
    color: #68151d;
    background: #f5e8e7;
    font-size: 0.7rem;
    text-align: right;
    white-space: nowrap;
  }

  .plan-card__mark-spacer {
    width: 1px;
    height: 1px;
  }

  .plan-card h2 {
    margin-top: 15px;
    font-family: var(--display);
    font-size: 3rem;
    font-weight: 400;
  }

  .plan-card__description {
    min-height: 52px;
    margin-top: 9px;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .plan-card__price {
    display: flex;
    margin: 22px 0 19px;
    align-items: baseline;
    gap: 10px;
  }

  .plan-card__price strong {
    color: var(--ink);
    font-family: 'Manrope', sans-serif;
    font-size: 3.1rem;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    line-height: 1.1;
  }

  .plan-card__price span {
    color: var(--muted);
    font-size: 0.82rem;
  }

  .plan-card .button {
    width: 100%;
    justify-content: space-between;
  }

  .plan-card ul {
    display: grid;
    padding: 19px 0 0;
    margin: 20px 0 0;
    border-top: 1px solid var(--line);
    gap: 14px;
    list-style: none;
  }

  .plan-card li {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .plan-card li > span {
    color: var(--terracotta-deep);
  }

  .plans-note {
    margin: 22px auto 0;
    color: var(--muted);
    font-size: 0.75rem;
    text-align: center;
  }

  @media (max-width: 680px) {
    .plans-page {
      margin-top: 34px;
      padding: 76px 20px;
    }

    .plans-intro {
      margin-bottom: 38px;
    }

    .plans-grid {
      max-width: 460px;
      grid-template-columns: 1fr;
      gap: 13px;
    }

    .plan-card__description {
      min-height: 0;
    }
  }
</style>