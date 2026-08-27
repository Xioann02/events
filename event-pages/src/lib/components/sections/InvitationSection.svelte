<script>
  import { scrollReveal } from '../../actions/scrollReveal.js'

  let { copy } = $props()
</script>

<section class="invitation-section" aria-labelledby="invitation-title">
  <div class="section-shell invitation-copy" use:scrollReveal={{ distance: 18 }}>
    <p class="eyebrow">{copy.invitationEyebrow}</p>
    <h2 id="invitation-title">{copy.invitationTitle}</h2>
    <p class="large-copy">{copy.invitationText}</p>
    <div class="parents-block" aria-label={copy.parentsTitle}>
      <div class="parents-list">
        <div>
          <span>{copy.brideParentsLabel}</span>
          <strong>{copy.brideParents}</strong>
        </div>
        <i aria-hidden="true"></i>
        <div>
          <span>{copy.groomParentsLabel}</span>
          <strong>{copy.groomParents}</strong>
        </div>
      </div>
    </div>
  </div>
</section>
