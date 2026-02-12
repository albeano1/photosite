import { useEffect, useRef, useState } from 'react'
import AnimatedSignature from './AnimatedSignature'
import BackgroundWords from './BackgroundWords'
import HeroDepthCanvas from './HeroDepthCanvas'
import './Hero.css'

const Hero = ({ heroImage, heroBackgroundImage, heroSubjectImage, depthMapImage }) => {
  const useDepthMap = Boolean(heroImage && depthMapImage)
  const useTwoLayers = !useDepthMap && Boolean(heroBackgroundImage && heroSubjectImage)
  const heroRef = useRef(null)
  const wrapperRef = useRef(null)
  // Detect touch device first
  const isTouchDevice = useRef('ontouchstart' in window || navigator.maxTouchPoints > 0)
  
  const [animationProgress, setAnimationProgress] = useState(0)
  const [signatureComplete, setSignatureComplete] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [isScrollLocked, setIsScrollLocked] = useState(true)
  const rafId = useRef(null)
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)
  const hasScrolledPast = useRef(false)
  const isLockingRef = useRef(false)
  const isLockedRef = useRef(true)
  const lastTouchY = useRef(0)
  const savedScrollY = useRef(0)
  const targetMouse = useRef({ x: 0, y: 0 })
  const currentMouse = useRef({ x: 0, y: 0 })
  const cursorPosition = useRef({ x: 0, y: 0 })
  const lastMouseMoveTime = useRef(-1)
  const lastClientX = useRef(-9999)
  const lastClientY = useRef(-9999)
  const driftStartTime = useRef(typeof performance !== 'undefined' ? performance.now() : 0)
  const heroBackgroundRef = useRef(null)
  const heroSubjectRef = useRef(null)
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 })

  // Smooth interpolation
  const lerp = (start, end, factor) => {
    return start + (end - start) * factor
  }

  // Unified wheel handler - handles both forward and reverse immediately
  // Uses ref to track locked state synchronously, eliminating delay
  useEffect(() => {
    // Keep locked state in sync with ref
    isLockedRef.current = isScrollLocked

    const handleWheel = (e) => {
      const scrollY = window.scrollY || window.pageYOffset
      const windowHeight = window.innerHeight
      const scrollingUp = e.deltaY < 0
      const scrollSensitivity = 0.0014
      const reverseZone = windowHeight < 700 ? 0.1 : 0.2
      const reverseStartPoint = windowHeight * reverseZone

      // If locked, handle wheel events for animation control (forward or reverse)
      if (isLockedRef.current) {
        const newProgress = targetProgress.current + (e.deltaY * scrollSensitivity)
        
        // If we've reached 1.0 and are scrolling down, unlock; let lerp finish so no snap
        if (newProgress >= 1.0 && e.deltaY > 0) {
          targetProgress.current = 1
          hasScrolledPast.current = true
          isLockedRef.current = false
          isLockingRef.current = false
          setIsScrollLocked(false)
          return
        }
        
        // Clamp to 0-1 range
        targetProgress.current = Math.max(0, Math.min(1, newProgress))
        
        // Prevent default to control animation
        e.preventDefault()
        return
      }

      // If unlocked but scrolling up near hero, start reverse animation ONLY when centered
      // Wait until hero is actually centered to avoid early snapping
      const isHeroCentered = scrollY <= reverseStartPoint
      
      if (scrollingUp && isHeroCentered && hasScrolledPast.current) {
        e.preventDefault()
        isLockedRef.current = true
        window.scrollTo({ top: 0, behavior: 'auto' })

        // Map scroll position to progress - hero is centered, so map directly
        // When scrollY is 0, progress is 0 (fullscreen)
        // When scrollY is reverseStartPoint, progress is 1 (50% size)
        let mappedProgress = Math.max(0, Math.min(1, scrollY / reverseStartPoint))
        
        // Always use current progress as minimum to avoid snapping backward
        // This ensures we never go backward, only forward (toward fullscreen)
        mappedProgress = Math.max(currentProgress.current, mappedProgress)
        
        targetProgress.current = mappedProgress
        
        // Apply current wheel delta immediately
        targetProgress.current = Math.max(0, Math.min(1, targetProgress.current + (e.deltaY * scrollSensitivity)))
        
        // Update state (async, but we've already handled everything synchronously)
        setIsScrollLocked(true)
      }
    }

    const handleScroll = () => {
      if (isLockedRef.current && window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    }

    if (!isTouchDevice.current) {
      window.addEventListener('wheel', handleWheel, { passive: false })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (!isTouchDevice.current) {
        window.removeEventListener('wheel', handleWheel)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isScrollLocked])

  // Touch: drive progress like wheel so hero stays centered until small state
  const touchScrollSensitivity = 0.01
  useEffect(() => {
    if (!isTouchDevice.current) return
    const el = wrapperRef.current
    if (!el) return

    const handleTouchStart = (e) => {
      if (e.touches.length) lastTouchY.current = e.touches[0].clientY
    }
    const handleTouchMove = (e) => {
      if (!isLockedRef.current || !e.touches.length) return
      const clientY = e.touches[0].clientY
      const deltaY = lastTouchY.current - clientY
      lastTouchY.current = clientY
      const newProgress = targetProgress.current + (deltaY * touchScrollSensitivity)
      if (newProgress >= 1.0 && deltaY > 0) {
        targetProgress.current = 1
        hasScrolledPast.current = true
        isLockedRef.current = false
        isLockingRef.current = false
        setIsScrollLocked(false)
        e.preventDefault()
        return
      }
      targetProgress.current = Math.max(0, Math.min(1, newProgress))
      e.preventDefault()
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // Sync scroll lock state with DOM; preserve scroll position to avoid snap/jump
  useEffect(() => {
    if (isScrollLocked) {
      savedScrollY.current = window.scrollY || window.pageYOffset
      document.body.style.top = `-${savedScrollY.current}px`
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.left = '0'
      document.body.style.right = '0'
      isLockedRef.current = true
    } else {
      const restore = savedScrollY.current
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      isLockedRef.current = false
      requestAnimationFrame(() => {
        window.scrollTo(0, restore)
      })
    }
  }, [isScrollLocked])

  // Smooth progress: lerp only, no snap threshold (avoids visible jump)
  useEffect(() => {
    const updateProgress = () => {
      const target = Math.max(0, Math.min(1, targetProgress.current))
      targetProgress.current = target
      const cur = currentProgress.current
      const diff = target - cur
      const factor = 0.12
      if (Math.abs(diff) < 1e-5) {
        currentProgress.current = target
      } else {
        currentProgress.current = Math.max(0, Math.min(1, cur + diff * factor))
      }
      setAnimationProgress(currentProgress.current)

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const timeSinceMove = lastMouseMoveTime.current < 0 ? 1e9 : now - lastMouseMoveTime.current
      const cursorInfluence = isTouchDevice.current
        ? 0
        : lastMouseMoveTime.current < 0
          ? 0
          : timeSinceMove < 1200
            ? 1
            : timeSinceMove < 2800
              ? 1 - (timeSinceMove - 1200) / 1600
              : 0
      const t = (now - driftStartTime.current) / 1000
      const mainRadius = 0.12
      const mainSpeed = 0.5
      const subRadius = 0.05
      const autoDriftX = mainRadius * Math.cos(t * mainSpeed) + subRadius * Math.sin(t * 1.1)
      const autoDriftY = mainRadius * Math.sin(t * mainSpeed) + subRadius * Math.cos(t * 0.95)
      const ax = Math.max(-1, Math.min(1, autoDriftX))
      const ay = Math.max(-1, Math.min(1, autoDriftY))
      targetMouse.current.x = cursorPosition.current.x * cursorInfluence + ax * (1 - cursorInfluence)
      targetMouse.current.y = cursorPosition.current.y * cursorInfluence + ay * (1 - cursorInfluence)

      const mouseFactor = cursorInfluence > 0.5 ? 0.05 : 0.22
      currentMouse.current.x = lerp(currentMouse.current.x, targetMouse.current.x, mouseFactor)
      currentMouse.current.y = lerp(currentMouse.current.y, targetMouse.current.y, mouseFactor)
      setMouseTilt({ x: currentMouse.current.x, y: currentMouse.current.y })

      const mx = currentMouse.current.x
      const my = currentMouse.current.y
      const tiltStr = Math.max(0, 1 - currentProgress.current)
      const layerScale = 1.08
      if (heroBackgroundRef.current) {
        const pm = 14 * tiltStr
        heroBackgroundRef.current.style.transform = `scale(${layerScale}) translate(${-mx * pm}px, ${-my * pm}px)`
      }
      if (heroSubjectRef.current) {
        const tx = my * -4 * tiltStr
        const ty = mx * 4 * tiltStr
        heroSubjectRef.current.style.transform = `scale(${layerScale}) rotateX(${tx}deg) rotateY(${ty}deg)`
      }

      rafId.current = requestAnimationFrame(updateProgress)
    }
    rafId.current = requestAnimationFrame(updateProgress)
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  // Unlock when target reaches end; don't set current=1 so lerp finishes smoothly (no snap)
  useEffect(() => {
    const targetAtEnd = targetProgress.current >= 0.995
    if (targetAtEnd && isScrollLocked) {
      targetProgress.current = 1
      hasScrolledPast.current = true
      isLockedRef.current = false
      isLockingRef.current = false
      setIsScrollLocked(false)
    }
  }, [animationProgress, isScrollLocked])

  // Cursor-based 3D tilt: track mouse (and touch) on hero, normalized -1..1 from center
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const MOVE_THRESHOLD_PX = 18
    const updateTarget = (clientX, clientY) => {
      const isFirst = lastClientX.current === -9999
      const dx = clientX - lastClientX.current
      const dy = clientY - lastClientY.current
      const moved = !isFirst && Math.sqrt(dx * dx + dy * dy) >= MOVE_THRESHOLD_PX
      lastClientX.current = clientX
      lastClientY.current = clientY
      const rect = el.getBoundingClientRect()
      const x = (clientX - rect.left - rect.width / 2) / (rect.width / 2)
      const y = (clientY - rect.top - rect.height / 2) / (rect.height / 2)
      cursorPosition.current.x = Math.max(-1, Math.min(1, x))
      cursorPosition.current.y = Math.max(-1, Math.min(1, y))
      if (moved) lastMouseMoveTime.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
    }

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      updateTarget(clientX, clientY)
    }
    const handleLeave = () => {
      cursorPosition.current.x = 0
      cursorPosition.current.y = 0
      lastMouseMoveTime.current = -1
      lastClientX.current = -9999
      lastClientY.current = -9999
    }

    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    el.addEventListener('touchmove', handleMove, { passive: true })
    return () => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
      el.removeEventListener('touchmove', handleMove)
    }
  }, [])

  // Track scroll position for indicator fade
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset
      setScrollY(currentScrollY)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Handle scroll-based animation for touch devices (both directions)
  useEffect(() => {
    if (isScrollLocked && !isTouchDevice.current) return // Skip on desktop when locked (wheel handler handles it)

    let lastScrollY = window.scrollY || window.pageYOffset

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const windowHeight = window.innerHeight
      const scrollingUp = scrollY < lastScrollY
      const scrollingDown = scrollY > lastScrollY

      // Track if we've scrolled past the hero
      if (scrollY > windowHeight * 0.5) {
        hasScrolledPast.current = true
      }

      const reverseZone = windowHeight < 700 ? 0.1 : 0.2
      const reverseStartPoint = windowHeight * reverseZone
      const isHeroCentered = scrollY <= reverseStartPoint
      const nearTop = scrollY <= 30

      // If near top and scrolling up, lock and start reverse (touch often doesn't land on exact 0)
      if (nearTop && scrollingUp && hasScrolledPast.current) {
        targetProgress.current = 0
        savedScrollY.current = 0
        isLockedRef.current = true
        setIsScrollLocked(true)
        setSignatureComplete(false)
        hasScrolledPast.current = false
        if (scrollY > 0) {
          window.scrollTo({ top: 0, behavior: 'auto' })
        }
        return
      }

      // If scrolling up and hero is centered, lock and allow reverse. On touch: allow without having scrolled past (one swipe at hero triggers grow)
      const canReverse = hasScrolledPast.current || isTouchDevice.current
      if (scrollingUp && isHeroCentered && canReverse && !isLockingRef.current && !isLockedRef.current) {
        isLockingRef.current = true
        isLockedRef.current = true
        setIsScrollLocked(true)

        let reverseProgress = Math.max(0, Math.min(1, scrollY / reverseStartPoint))
        reverseProgress = Math.max(currentProgress.current, reverseProgress)
        targetProgress.current = reverseProgress
      }

      lastScrollY = scrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      isLockingRef.current = false
    }
  }, [isScrollLocked])

  // Track signature completion
  useEffect(() => {
    if (animationProgress >= 1) {
      setSignatureComplete(true)
    } else {
      setSignatureComplete(false)
    }
  }, [animationProgress])

  const imageScale = Math.max(0.5, 1 - (animationProgress * 0.5))
  const imageSaturation = Math.max(0, 1 - animationProgress)
  const signatureOpacity = animationProgress >= 0.56 ? 1 : 0
  const indicatorOpacity = Math.max(0, 1 - (scrollY / 200))
  const tiltStrength = Math.max(0, 1 - animationProgress)
  const tiltX = mouseTilt.y * -4 * tiltStrength
  const tiltY = mouseTilt.x * 4 * tiltStrength
  const parallaxMove = 14 * tiltStrength
  const bgTranslateX = -mouseTilt.x * parallaxMove
  const bgTranslateY = -mouseTilt.y * parallaxMove
  const layerScale = 1.08

  const containerTransform = useTwoLayers
    ? `perspective(1200px) scale(${imageScale})`
    : `perspective(1200px) scale(${imageScale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`

  return (
    <div ref={wrapperRef} className="hero-wrapper" id="home">
      <section ref={heroRef} className="hero">
        <BackgroundWords />
        <div 
          className={`hero-image-container${useDepthMap ? ' hero-image-container--depth' : ''}`}
          style={{
            transform: containerTransform,
            filter: useDepthMap ? 'none' : `saturate(${imageSaturation})`,
          }}
        >
          {useDepthMap ? (
            <>
              <img
                src={heroImage}
                alt=""
                className="hero-image hero-depth-fallback"
                fetchPriority="high"
                decoding="async"
                loading="eager"
                aria-hidden
              />
              <HeroDepthCanvas
                photoUrl={heroImage}
                depthUrl={depthMapImage}
                parallaxX={mouseTilt.x}
                parallaxY={mouseTilt.y}
                saturation={imageSaturation}
                scale={imageScale}
              />
            </>
          ) : useTwoLayers ? (
            <>
              <div
                ref={heroBackgroundRef}
                className="hero-background-layer"
                style={{ transform: 'scale(1.08) translate(0px, 0px)' }}
              >
                <img
                  src={heroBackgroundImage}
                  alt=""
                  className="hero-image"
                  fetchPriority="high"
                  decoding="async"
                  loading="eager"
                  aria-hidden
                />
              </div>
              <div
                ref={heroSubjectRef}
                className="hero-subject-layer"
                style={{ transform: 'scale(1.08) rotateX(0deg) rotateY(0deg)' }}
              >
                <img
                  src={heroSubjectImage}
                  alt="Hero"
                  className="hero-image"
                  fetchPriority="high"
                  decoding="async"
                  loading="eager"
                />
              </div>
            </>
          ) : (
            <img 
              src={heroImage || 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=2000'} 
              alt="Hero" 
              className="hero-image"
              fetchPriority="high"
              decoding="async"
              loading="eager"
            />
          )}
          <div 
            className="hero-signature-overlay"
            style={{
              opacity: signatureOpacity,
            }}
          >
            <AnimatedSignature 
              progress={animationProgress}
              onAnimationComplete={() => {
                if (animationProgress >= 1) {
                  setSignatureComplete(true)
                }
              }}
            />
          </div>
        </div>
        <div 
          className="hero-scroll-indicator"
          style={{ opacity: indicatorOpacity }}
        >
          ↓
        </div>
      </section>
    </div>
  )
}

export default Hero
