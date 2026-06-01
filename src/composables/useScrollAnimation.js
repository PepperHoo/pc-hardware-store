import { onMounted, onBeforeUnmount } from 'vue'

const SELECTOR = '.reveal, .reveal-left, .reveal-right, .reveal-scale'

export function useScrollAnimation() {
  let intersectionObs = null
  let mutationObs     = null

  function observeEl(el) {
    if (!el || el._scrollObserved) return
    el._scrollObserved = true
    intersectionObs.observe(el)
  }

  function init() {
    // IntersectionObserver – adds .is-visible when element enters viewport
    intersectionObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          intersectionObs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' })

    // Observe elements already in the DOM
    document.querySelectorAll(SELECTOR).forEach(observeEl)

    // MutationObserver – catches elements added AFTER mount (v-if / async data)
    mutationObs = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return
          if (node.matches?.(SELECTOR))            observeEl(node)
          node.querySelectorAll?.(SELECTOR).forEach(observeEl)
        })
      })
    })

    mutationObs.observe(document.body, { childList: true, subtree: true })
  }

  onMounted(() => setTimeout(init, 50))
  onBeforeUnmount(() => {
    intersectionObs?.disconnect()
    mutationObs?.disconnect()
  })
}
