/**
 * useCardTilt — attaches mouse-tracking 3D tilt to card elements.
 *
 * Usage in template:
 *   <div class="tilt-card" @mousemove="tilt.onMove" @mouseleave="tilt.onLeave">
 *
 * Or use the directive-style helpers:
 *   v-bind="tiltHandlers"
 */
export function useCardTilt (maxDeg = 10) {
  function onMove (e) {
    const card = e.currentTarget
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5   // -0.5 → 0.5
    const y = (e.clientY - top) / height - 0.5

    card.style.transform =
      `perspective(700px) ` +
      `rotateY(${x * maxDeg * 2}deg) ` +
      `rotateX(${-y * maxDeg * 2}deg) ` +
      `translateZ(12px) ` +
      `scale(1.02)`

    // Subtle inner shine based on mouse position
    const shine = card.querySelector('.card-shine')
    if (shine) {
      shine.style.background =
        `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, ` +
        `rgba(255,255,255,0.12) 0%, transparent 65%)`
    }
  }

  function onLeave (e) {
    const card = e.currentTarget
    card.style.transform = ''
    const shine = card.querySelector('.card-shine')
    if (shine) shine.style.background = ''
  }

  return { onMove, onLeave }
}
