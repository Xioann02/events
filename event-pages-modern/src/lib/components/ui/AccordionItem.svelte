<script>
  let { title, open = false, children } = $props()
</script>

<details class="accordion-item" {open}>
  <summary>
    <span>{title}</span>
    <span class="accordion-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M12 5v14" />
      </svg>
    </span>
  </summary>
  <div class="accordion-content">
    <div class="accordion-content__inner">
      {@render children?.()}
    </div>
  </div>
</details>

