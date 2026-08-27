<script>
  import { WEDDING_DISPLAY } from '../../wedding-config.js'

  let { copy, language, onLanguageChange } = $props()
</script>

<a class="skip-link" href="#main-content">{copy.skip}</a>

<a class="playful-brand" href="#main-content" aria-label={copy.names}>
  <span>{WEDDING_DISPLAY.initials[0]} <i>&</i> {WEDDING_DISPLAY.initials[1]}</span>
  <small>{WEDDING_DISPLAY.country} · {WEDDING_DISPLAY.shortDate}</small>
</a>

<div class="language-switch" role="group" aria-label={copy.language}>
  <button
    type="button"
    class:active={language === 'en'}
    aria-pressed={language === 'en'}
    onclick={() => onLanguageChange('en')}>EN</button
  >
  <span aria-hidden="true"></span>
  <button
    type="button"
    class:active={language === 'el'}
    aria-pressed={language === 'el'}
    onclick={() => onLanguageChange('el')}>ΕΛ</button
  >
</div>
