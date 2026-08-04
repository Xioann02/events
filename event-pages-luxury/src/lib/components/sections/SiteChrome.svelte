<script>
  let { copy, language, onLanguageChange } = $props()
</script>

<a class="skip-link" href="#main-content">{copy.skip}</a>

<a class="luxury-brand" href="#main-content" aria-label={copy.names}>
  <span>A <i>&</i> E</span>
  <small>CYPRUS · 19.09.26</small>
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
