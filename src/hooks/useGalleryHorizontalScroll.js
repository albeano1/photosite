import { useRef, useState, useEffect, useCallback } from 'react'

const HINT_START_VH_RATIO = 0.48
const HINT_MAX_PROGRESS = 0.085
const OUT_OF_VIEW_MARGIN = 120
/** Only soften wheel input during gallery approach — not during pinned horizontal scroll */
const GALLERY_APPROACH_WHEEL_DAMPING = 0.88
const GALLERY_APPROACH_TOUCH_DAMPING = 0.9

export function useGalleryHorizontalScroll(imageCount) {
  const zoneRef = useRef(null)
  const containerRef = useRef(null)
  const trackRef = useRef(null)
  const [isApproaching, setIsApproaching] = useState(false)
  const [titleReveal, setTitleReveal] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const progressRef = useRef(0)
  const maxScrollRef = useRef(0)
  const approachingRef = useRef(false)
  const titleRevealRef = useRef(false)
  const isNearZoneRef = useRef(false)
  const syncRafRef = useRef(0)
  const runwayLockedRef = useRef(false)
  const imagesReadyRef = useRef(false)

  const applyTransform = useCallback((x) => {
    const track = trackRef.current
    if (!track) return
    track.style.transform = `translate3d(${x}px, 0, 0)`
  }, [])

  const applyRunwayToZone = useCallback((zone, max) => {
    if (!zone || max <= 0) return
    zone.style.setProperty('--gallery-runway', `${max}px`)
    zone.style.height = `calc(100vh + ${max}px)`
    zone.style.minHeight = 'auto'
  }, [])

  const syncLeadInPadding = useCallback(() => {
    const track = trackRef.current
    const stage = track?.closest('.gallery-hscroll-stage')
    if (!track || !stage) return
    const stageRect = stage.getBoundingClientRect()
    const leadIn = Math.ceil(window.innerWidth - stageRect.left + 12)
    track.style.paddingLeft = `${leadIn}px`
  }, [])

  const getTrailingItemElement = useCallback(() => {
    const track = trackRef.current
    if (!track) return null
    let trailing = null
    let maxEnd = -1

    track.querySelectorAll('.gallery-hscroll-item').forEach((item) => {
      const row = item.closest('.gallery-hscroll-row')
      if (!row) return
      const rowStyle = window.getComputedStyle(row)
      const padL = parseFloat(rowStyle.paddingLeft) || 0
      const end = row.offsetLeft + padL + item.offsetLeft + item.offsetWidth
      if (end > maxEnd) {
        maxEnd = end
        trailing = item
      }
    })

    return trailing
  }, [])

  const getTrackTranslateX = useCallback((track) => {
    const transform = window.getComputedStyle(track).transform
    if (!transform || transform === 'none') return 0
    return new DOMMatrix(transform).m41
  }, [])

  const measure = useCallback(({ updateLeadIn = false, force = false } = {}) => {
    const track = trackRef.current
    const zone = zoneRef.current
    if (!track) return maxScrollRef.current || 0

    const savedProgress = progressRef.current
    const prevMax = maxScrollRef.current

    if (runwayLockedRef.current && !force) {
      return prevMax
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!prefersReduced && updateLeadIn) {
      syncLeadInPadding()
      track.style.paddingRight = '0px'
    }

    const stage = track.closest('.gallery-hscroll-stage')
    const trailing = getTrailingItemElement()
    if (!stage || !trailing) return prevMax

    const stageRect = stage.getBoundingClientRect()
    const stagePadR = parseFloat(window.getComputedStyle(stage).paddingRight) || 0
    const visibleRight = stageRect.right - stagePadR
    const trailingRect = trailing.getBoundingClientRect()
    const translateX = getTrackTranslateX(track)
    const max = Math.max(0, trailingRect.right - visibleRight - translateX)

    maxScrollRef.current = max
    if (zone && max > 0 && !prefersReduced) {
      applyRunwayToZone(zone, max)
    }

    if (savedProgress > 0 && max > 0) {
      applyTransform(-savedProgress * max)
    }

    return max
  }, [
    applyTransform,
    syncLeadInPadding,
    getTrailingItemElement,
    getTrackTranslateX,
    applyRunwayToZone,
  ])

  const runMeasure = useCallback(
    (options = {}) => {
      return measure(options)
    },
    [measure]
  )

  const lockRunway = useCallback(() => {
    if (runwayLockedRef.current) return maxScrollRef.current
    runwayLockedRef.current = true
    const max = runMeasure({ force: true })
    const zone = zoneRef.current
    if (zone && max > 0) {
      applyRunwayToZone(zone, max)
    }
    return max
  }, [runMeasure, applyRunwayToZone])

  const scheduleMeasure = useCallback(
    (options = {}) => {
      requestAnimationFrame(() => runMeasure(options))
    },
    [runMeasure]
  )

  const isInGalleryZone = useCallback((zoneRect, vh) => {
    return zoneRect.top < vh * HINT_START_VH_RATIO && zoneRect.bottom > 0
  }, [])

  const syncProgressFromScroll = useCallback(() => {
    if (reducedMotion) return

    const zone = zoneRef.current
    if (!zone) return

    const vh = window.innerHeight
    const zoneRect = zone.getBoundingClientRect()

    const outOfView =
      zoneRect.bottom < -OUT_OF_VIEW_MARGIN ||
      zoneRect.top > vh + OUT_OF_VIEW_MARGIN
    if (outOfView) {
      if (approachingRef.current) {
        approachingRef.current = false
        setIsApproaching(false)
      }
      return
    }

    const inZone = zoneRect.top < vh && zoneRect.bottom > 0

    if (inZone !== approachingRef.current) {
      approachingRef.current = inZone
      setIsApproaching(inZone)
    }

    const hintStart = vh * HINT_START_VH_RATIO
    const shouldRevealTitle =
      inZone && zoneRect.top <= hintStart && zoneRect.bottom > vh * 0.2
    if (shouldRevealTitle && !titleRevealRef.current) {
      titleRevealRef.current = true
      setTitleReveal(true)
    }

    let max = maxScrollRef.current
    if (max <= 0) {
      max = runMeasure({ force: false })
    }

    if (
      zoneRect.top <= 0 &&
      max > 0 &&
      imagesReadyRef.current &&
      !runwayLockedRef.current
    ) {
      lockRunway()
      max = maxScrollRef.current
    }

    const stickyOffset = Math.max(0, -zoneRect.top)
    let p = 0

    if (zoneRect.top > 0) {
      if (zoneRect.top < hintStart) {
        const hintT = 1 - zoneRect.top / hintStart
        p = hintT * HINT_MAX_PROGRESS
      }
    } else if (max > 0) {
      const mainT = Math.min(1, stickyOffset / Math.max(1, max))
      p = HINT_MAX_PROGRESS + mainT * (1 - HINT_MAX_PROGRESS)
    }

    p = Math.max(0, Math.min(1, p))
    progressRef.current = p

    if (max > 0) {
      applyTransform(-p * max)
    }
  }, [reducedMotion, runMeasure, applyTransform, lockRunway])

  const scheduleSync = useCallback(() => {
    if (syncRafRef.current) return
    syncRafRef.current = requestAnimationFrame(() => {
      syncRafRef.current = 0
      syncProgressFromScroll()
    })
  }, [syncProgressFromScroll])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const lenis = window.lenis
    if (!lenis || reducedMotion) return

    const previousVirtualScroll = lenis.options.virtualScroll

    lenis.options.virtualScroll = (data) => {
      const zone = zoneRef.current
      if (zone) {
        const vh = window.innerHeight
        const zoneRect = zone.getBoundingClientRect()
        const inApproach = zoneRect.top > 0 && isInGalleryZone(zoneRect, vh)
        if (inApproach) {
          const type = data.event?.type ?? ''
          if (type.includes('wheel')) {
            data.deltaY *= GALLERY_APPROACH_WHEEL_DAMPING
            data.deltaX *= GALLERY_APPROACH_WHEEL_DAMPING
          } else if (type.includes('touch')) {
            data.deltaY *= GALLERY_APPROACH_TOUCH_DAMPING
            data.deltaX *= GALLERY_APPROACH_TOUCH_DAMPING
          }
        }
      }

      if (typeof previousVirtualScroll === 'function') {
        return previousVirtualScroll(data)
      }
    }

    return () => {
      lenis.options.virtualScroll = previousVirtualScroll
    }
  }, [reducedMotion, isInGalleryZone])

  useEffect(() => {
    if (reducedMotion) return

    let cancelled = false
    let observer = null

    const onScroll = () => {
      const zone = zoneRef.current
      if (!zone) return
      const vh = window.innerHeight
      const zoneRect = zone.getBoundingClientRect()
      const inGallery = isInGalleryZone(zoneRect, vh)
      if (inGallery) {
        syncProgressFromScroll()
      } else {
        scheduleSync()
      }
    }

    const onResize = () => {
      runwayLockedRef.current = false
      const zone = zoneRef.current
      if (zone) {
        zone.style.height = ''
        zone.style.minHeight = ''
      }
      scheduleMeasure({ updateLeadIn: true, force: true })
      scheduleSync()
    }

    const setup = () => {
      const zone = zoneRef.current
      if (!zone || cancelled) {
        if (!cancelled) requestAnimationFrame(setup)
        return
      }

      const margin = `${Math.round(window.innerHeight)}px 0px`
      observer = new IntersectionObserver(
        ([entry]) => {
          isNearZoneRef.current = entry.isIntersecting
          if (entry.isIntersecting) scheduleSync()
        },
        { root: null, rootMargin: margin, threshold: 0 }
      )
      observer.observe(zone)

      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)

      const lenis = window.lenis
      if (lenis?.on) lenis.on('scroll', onScroll)

      scheduleMeasure({ updateLeadIn: true })
      requestAnimationFrame(() => {
        runMeasure({ updateLeadIn: true })
        scheduleSync()
      })
    }

    setup()

    return () => {
      cancelled = true
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      const lenis = window.lenis
      if (lenis?.off) lenis.off('scroll', onScroll)
      if (syncRafRef.current) cancelAnimationFrame(syncRafRef.current)
    }
  }, [
    reducedMotion,
    scheduleSync,
    scheduleMeasure,
    runMeasure,
    syncProgressFromScroll,
    isInGalleryZone,
  ])

  useEffect(() => {
    runwayLockedRef.current = false
    imagesReadyRef.current = false
    scheduleMeasure({ updateLeadIn: true })

    const track = trackRef.current
    if (!track) return

    const imgs = [...track.querySelectorAll('img')]
    let pending = imgs.filter((img) => !img.complete).length
    if (pending === 0) imagesReadyRef.current = true

    const onImgDone = () => {
      pending -= 1
      if (pending <= 0) {
        imagesReadyRef.current = true
        if (!runwayLockedRef.current) {
          runMeasure({ updateLeadIn: false })
          scheduleSync()
        }
      }
    }

    imgs.forEach((img) => {
      if (img.complete) return
      img.addEventListener('load', onImgDone, { once: true })
      img.addEventListener('error', onImgDone, { once: true })
    })
  }, [imageCount, scheduleMeasure, runMeasure, scheduleSync])

  return {
    zoneRef,
    containerRef,
    trackRef,
    isLocked: false,
    isApproaching,
    titleReveal,
    reducedMotion,
  }
}
