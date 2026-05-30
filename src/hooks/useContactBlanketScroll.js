import { useEffect } from 'react'
import { registerLenisVirtualScrollHandler } from '../utils/lenisVirtualScrollChain'

const getLenis = () => window.lenis

const PROGRESS_LERP = 0.16
const WHEEL_SCALE = 1
const AT_BOTTOM_SLACK = 6

const clamp = (min, max, v) => Math.min(max, Math.max(min, v))

/**
 * Freeze-and-reveal contact blanket.
 *
 * A short scroll runway after Projects (see ContactBlanket.css) gives breathing
 * room before the blanket engages. When the user reaches the end of that runway
 * and keeps scrolling down, we consume
 * the scroll delta and use it to drive a smoothed progress 0..2 that translates
 * a fixed overlay panel up over the frozen page:
 *   0 -> panel below the viewport (Projects frozen, fully visible)
 *   1 -> hero image fills the viewport
 *   2 -> caption strip scrolls through, contact fills the viewport
 * Scrolling up reverses it; at 0 we release and normal scrolling resumes.
 */
export function useContactBlanketScroll(zoneRef, panelRef, imageRef) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const panel = panelRef.current
    const image = imageRef?.current
    if (!panel) return

    if (prefersReducedMotion) {
      panel.style.transform = 'none'
      if (image) image.style.transform = 'none'
      return
    }

    let locked = false
    let current = 0
    let target = 0
    let raf = 0
    let vh = window.innerHeight || 1
    let captionH = 0

    const measureCaption = () => {
      const caption = panel.querySelector('.contact-blanket-caption')
      captionH = caption?.offsetHeight ?? 0
    }

    const apply = (p) => {
      // Overshoot the closed position by a couple px so the panel's top edge
      // never lands exactly on the viewport bottom (a fixed + translate3d element
      // renders a 1px subpixel seam there). Ramp the overshoot out by p=1 so the
      // hero image still fills the viewport exactly when revealed.
      const hideBuffer = 2 * Math.max(0, Math.min(1, 1 - p))
      const translateY =
        p <= 1
          ? (1 - p) * vh + hideBuffer
          : -(p - 1) * (vh + captionH)
      panel.style.transform = `translate3d(0, ${translateY}px, 0)`

      // Image zoom while the blanket rises (progress 0..1): scales down from a
      // bottom-anchored crop so the frame stays filled — no black bar at the top.
      if (image) {
        const t = clamp(0, 1, p)
        const scale = 1 + (1 - t) * 0.18
        image.style.transform = `scale(${scale})`
      }
    }

    const setActive = (active) => {
      // Only promote layers while moving; idle again afterwards.
      panel.style.willChange = active ? 'transform' : 'auto'
      if (image) image.style.willChange = active ? 'transform' : 'auto'
    }

    const tick = () => {
      raf = 0
      let next =
        Math.abs(target - current) < 0.001
          ? target
          : current + (target - current) * PROGRESS_LERP
      // Snap fully closed when settling toward release so the panel hides
      // completely (otherwise it rests ~1px above the viewport bottom -> sliver).
      if (target <= 0 && next <= 0.001) next = 0
      current = next
      apply(next)

      if (locked && target <= 0 && current <= 0) {
        locked = false
        document.body.dataset.contactBlanket = ''
        setActive(false)
      }

      if (Math.abs(target - current) >= 0.001) ensureRaf()
    }

    const ensureRaf = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const isAtBottom = () => {
      const lenis = getLenis()
      const limit =
        lenis && typeof lenis.limit === 'number'
          ? lenis.limit
          : document.documentElement.scrollHeight - vh

      // Guard against a collapsed/short page (e.g. Hero's body position:fixed lock
      // zeroes the scroll limit). Only the real, tall document counts as "bottom".
      if (limit < vh) return false

      // Engage as soon as the user's scroll TARGET reaches the bottom, so a single
      // hard scroll flows straight into the blanket with no dead "extra scroll".
      // (We never freeze Lenis on engage: letting it ease its targetScroll to the
      // limit finishes the gallery runway underneath the rising blanket.)
      const animated =
        lenis && typeof lenis.scroll === 'number'
          ? lenis.scroll
          : window.scrollY || 0
      const targetScroll =
        lenis && typeof lenis.targetScroll === 'number'
          ? lenis.targetScroll
          : animated
      const scroll = Math.max(animated, targetScroll)

      return limit - scroll <= AT_BOTTOM_SLACK
    }

    apply(0)
    measureCaption()

    const unregister = registerLenisVirtualScrollHandler({
      id: 'contact-blanket',
      priority: 100,
      when: () => true,
      handler: (data) => {
        const dy = data.deltaY
        if (!dy) return

        if (locked) {
          // Consume the gesture. Returning false makes Lenis bail, but it bails
          // BEFORE calling preventDefault, so we must prevent native scroll here.
          target = clamp(0, 2, target + (dy * WHEEL_SCALE) / vh)
          ensureRaf()
          data.event?.preventDefault?.()
          return false
        }

        if (dy > 0 && isAtBottom()) {
          locked = true
          current = 0
          target = clamp(0, 2, (dy * WHEEL_SCALE) / vh)
          document.body.dataset.contactBlanket = 'active'
          setActive(true)
          ensureRaf()
          data.event?.preventDefault?.()
          return false
        }
      },
    })

    const onResize = () => {
      vh = window.innerHeight || 1
      measureCaption()
      apply(current)
    }
    window.addEventListener('resize', onResize)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      unregister()
      window.removeEventListener('resize', onResize)
      document.body.dataset.contactBlanket = ''
    }
  }, [zoneRef, panelRef, imageRef])
}
