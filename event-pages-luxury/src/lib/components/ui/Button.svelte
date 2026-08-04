<script>
  let {
    href = undefined,
    variant = 'primary',
    size = 'default',
    type = 'button',
    class: className = '',
    children,
    ...rest
  } = $props()
</script>

{#if href}
  <a
    {href}
    class={`ui-button ui-button--${variant}${size === 'default' ? '' : ` ui-button--${size}`} ${className}`}
    {...rest}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    {type}
    class={`ui-button ui-button--${variant}${size === 'default' ? '' : ` ui-button--${size}`} ${className}`}
    {...rest}
  >
    {@render children?.()}
  </button>
{/if}
