import { useEffect } from 'react'
import {
  isContactBlanketScrollActive,
  registerLenisVirtualScrollHandler,
} from '../utils/lenisVirtualScrollChain'

/** Soft scroll brake just after leaving the hero so the signature finish is readable */
const HERO_EXIT_WHEEL_DAMPING = 0.62
const HERO_EXIT_TOUCH_DAMPING = 0.66
const HERO_EXIT_ZONE_VH = 0.1

function isGalleryActive() {
  const zone = document.querySelector('.gallery-scroll-zone')
  if (!zone) return false
  const vh = window.innerHeight
  const rect = zone.getBoundingClientRect()
  return rect.top < vh * 0.55 && rect.bottom > 0
}

function isHeroExitMoment() {
  if (isGalleryActive()) return false

  const scrollY = window.scrollY || window.pageYOffset
  const vh = window.innerHeight
  if (scrollY <= 0 || scrollY >= vh * 0.32) return false

  const hero = document.querySelector('.hero-wrapper')
  if (!hero) return scrollY < vh * HERO_EXIT_ZONE_VH

  const heroBottom = hero.getBoundingClientRect().bottom
  return heroBottom < vh * 1.02 && heroBottom > vh * 0.68
}

export function useHeroExitScrollDampening() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    return registerLenisVirtualScrollHandler({
      id: 'hero-exit-dampening',
      priority: 10,
      when: () => !isContactBlanketScrollActive(),
      handler: (data) => {
        if (!isHeroExitMoment()) return
        const type = data.event?.type ?? ''
        const dampening = type.includes('touch')
          ? HERO_EXIT_TOUCH_DAMPING
          : HERO_EXIT_WHEEL_DAMPING
        if (type.includes('wheel') || type.includes('touch')) {
          data.deltaY *= dampening
          data.deltaX *= dampening
        }
      },
    })
  }, [])
}
