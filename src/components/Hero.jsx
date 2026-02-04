import { useEffect, useRef, useState } from 'react'
import AnimatedSignature from './AnimatedSignature'
import BackgroundWords from './BackgroundWords'
import './Hero.css'

const Hero = ({ heroImage, heroBackgroundImage, heroSubjectImage }) => {
  const useTwoLayers = Boolean(heroBackgroundImage && heroSubjectImage)
  const heroRef = useRef(null)
  const wrapperRef = useRef(null)
  // Detect touch device first
  const isTouchDevice = useRef('ontouchstart' in window || navigator.maxTouchPoints > 0)
  
  const [animationProgress, setAnimationProgress] = useState(0)
  const [signatureComplete, setSignatureComplete] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  // Don't lock scroll on touch devices - they need normal scrolling
  const [isScrollLocked, setIsScrollLocked] = useState(!isTouchDevice.current)
  const rafId = useRef(null)
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)
  const hasScrolledPast = useRef(false)
  const isLockingRef = useRef(false)
  const isLockedRef = useRef(!isTouchDevice.current)
  const savedScrollY = useRef(0)
  const targetMouse = useRef({ x: 0, y: 0 })
  const currentMouse = useRef({ x: 0, y: 0 })
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
      const scrollSensitivity = 0.005
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
      // On touch devices, allow scrolling to unlock naturally
      if (isTouchDevice.current && isLockedRef.current) {
        const scrollY = window.scrollY || window.pageYOffset
        // If user scrolled down on touch device, unlock immediately
        if (scrollY > 50) {
          targetProgress.current = 1
          currentProgress.current = 1
          isLockedRef.current = false
          setIsScrollLocked(false)
          return
        }
      }
      // If locked, prevent any scrolling (desktop only)
      if (isLockedRef.current && window.scrollY > 0 && !isTouchDevice.current) {
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    }

    // Only use wheel handler on non-touch devices
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

  // Sync scroll lock state with DOM; preserve scroll position to avoid snap/jump
  useEffect(() => {
    if (isScrollLocked && !isTouchDevice.current) {
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

      const mouseFactor = 0.08
      currentMouse.current.x = lerp(currentMouse.current.x, targetMouse.current.x, mouseFactor)
      currentMouse.current.y = lerp(currentMouse.current.y, targetMouse.current.y, mouseFactor)
      setMouseTilt({ x: currentMouse.current.x, y: currentMouse.current.y })

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

    const updateTarget = (clientX, clientY) => {
      const rect = el.getBoundingClientRect()
      const x = (clientX - rect.left - rect.width / 2) / (rect.width / 2)
      const y = (clientY - rect.top - rect.height / 2) / (rect.height / 2)
      targetMouse.current.x = Math.max(-1, Math.min(1, x))
      targetMouse.current.y = Math.max(-1, Math.min(1, y))
    }

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      updateTarget(clientX, clientY)
    }
    const handleLeave = () => {
      targetMouse.current.x = 0
      targetMouse.current.y = 0
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

      // For touch devices: map scroll to progress 1:1 so hero doesn't lag
      if (isTouchDevice.current && scrollY <= windowHeight && !isScrollLocked) {
        const progress = Math.max(0, Math.min(1, scrollY / windowHeight))
        targetProgress.current = progress
        currentProgress.current = progress
        return
      }

      // If at top and scrolling up, lock and start reverse (don't set currentProgress - let lerp animate)
      if (scrollY === 0 && scrollingUp && hasScrolledPast.current) {
        targetProgress.current = 0
        if (!isTouchDevice.current) {
          isLockedRef.current = true
          setIsScrollLocked(true)
        }
        setSignatureComplete(false)
        hasScrolledPast.current = false
        return
      }

      const reverseZone = windowHeight < 700 ? 0.1 : 0.2
      const reverseStartPoint = windowHeight * reverseZone
      const isHeroCentered = scrollY <= reverseStartPoint

      // If scrolling up and hero is centered, lock scroll and allow reverse animation (desktop only)
      // Note: wheel handler will catch this immediately, but this is a backup
      if (!isTouchDevice.current && scrollingUp && isHeroCentered && hasScrolledPast.current && !isLockingRef.current && !isLockedRef.current) {
        // Lock immediately using ref (no delay)
        isLockingRef.current = true
        isLockedRef.current = true
        setIsScrollLocked(true)
        
        // Map scroll position to progress - hero is centered, so map directly
        let reverseProgress = Math.max(0, Math.min(1, scrollY / reverseStartPoint))
        
        // Always use current progress as minimum to avoid snapping backward
        reverseProgress = Math.max(currentProgress.current, reverseProgress)
        
        targetProgress.current = reverseProgress
      }
      // Don't interfere when hero is visible but not centered - let page scroll normally

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
  const tiltX = mouseTilt.y * -6 * tiltStrength
  const tiltY = mouseTilt.x * 6 * tiltStrength
  const parallaxMove = 22 * tiltStrength
  const bgTranslateX = -mouseTilt.x * parallaxMove
  const bgTranslateY = -mouseTilt.y * parallaxMove
  const layerScale = 1.04

  const containerTransform = useTwoLayers
    ? `perspective(1200px) scale(${imageScale})`
    : `perspective(1200px) scale(${imageScale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`

  return (
    <div ref={wrapperRef} className="hero-wrapper" id="home">
      <section ref={heroRef} className="hero">
        <BackgroundWords />
        <div 
          className="hero-image-container"
          style={{
            transform: containerTransform,
            filter: `saturate(${imageSaturation})`,
          }}
        >
          {useTwoLayers ? (
            <>
              <div
                className="hero-background-layer"
                style={{
                  transform: `scale(${layerScale}) translate(${bgTranslateX}px, ${bgTranslateY}px)`,
                }}
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
                className="hero-subject-layer"
                style={{
                  transform: `scale(${layerScale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                }}
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
        </div>
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
