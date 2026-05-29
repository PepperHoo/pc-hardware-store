import { onMounted, onBeforeUnmount } from 'vue'

/**
 * Observes all elements with reveal classes and adds .is-visible
 * when they enter the viewport, triggering the CSS 3D animations.
 *
 * Classes supported:
 *   .reveal        — rotates up from below
 *   .reveal-left   — swings in from left
 *   .reveal-right  — swings in from right
 *   .reveal-scale  — scales up from small
 *
 * Stagger delays:
 *   .stagger-1 through .stagger-6
 */
export function useScrollAnimation () {
  let observer = null

  function init () {
    const targets = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    )

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.07, rootMargin: '0px 0px -48px 0px' }
    )

    targets.forEach((el) => observer.observe(el))
  }

  onMounted(() => setTimeout(init, 80))
  onBeforeUnmount(() => observer?.disconnect())
}
