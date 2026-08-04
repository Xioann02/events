export function scrollReveal(node, options = {}) {
  const { delay = 0, distance = 18, scale = 1 } = options

  node.classList.add('scroll-reveal')
  node.style.setProperty('--reveal-delay', `${delay}ms`)
  node.style.setProperty('--reveal-distance', `${distance}px`)
  node.style.setProperty('--reveal-scale', scale)

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion || !('IntersectionObserver' in window)) {
    node.classList.add('is-visible')
    return
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      node.classList.add('is-visible')
      observer.unobserve(node)
    },
    { threshold: 0.12, rootMargin: '0px 0px -7% 0px' },
  )

  observer.observe(node)

  return {
    destroy() {
      observer.disconnect()
    },
  }
}
