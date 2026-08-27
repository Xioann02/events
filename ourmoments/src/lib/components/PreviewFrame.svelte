<script>
  import ExactTemplateFrame from './ExactTemplateFrame.svelte'

  let { draft, mode = 'desktop', showChrome = true } = $props()

  let subdomain = $derived(
    draft.title
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 26) || 'yourmoment',
  )
</script>

<ExactTemplateFrame {draft} {mode} {showChrome} interactive={true} title={`${draft.title} live invitation preview`} />
