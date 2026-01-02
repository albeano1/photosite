import { useEffect, useRef, useState } from 'react'
import AnimatedSignature from './AnimatedSignature'
import BackgroundWords from './BackgroundWords'
import './Hero.css'

const Hero = ({ heroImage }) => {
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
  const isLockedRef = useRef(!isTouchDevice.current) // Track locked state immediately with ref (no state delay)
  const completionFramesRef = useRef(0) // Track consecutive frames at 1.0

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
      const scrollSensitivity = 0.005 // Reduced sensitivity for smoother, slower animation
      const reverseStartPoint = windowHeight * 0.2

      // If locked, handle wheel events for animation control (forward or reverse)
      if (isLockedRef.current) {
        const newProgress = targetProgress.current + (e.deltaY * scrollSensitivity)
        
        // If we've reached 1.0 and are scrolling down, unlock BEFORE clamping for continuous scroll
        if (newProgress >= 1.0 && e.deltaY > 0) {
          // Unlock immediately - allow scroll to continue in the same motion
          targetProgress.current = 1
          isLockedRef.current = false
          setIsScrollLocked(false)
          // Don't prevent default - allow this scroll event to continue scrolling the page
          return // Let the event bubble to allow page scroll
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
        
        // Immediately lock using ref (no state delay)
        isLockedRef.current = true
        
        // Immediately lock scroll (synchronous, no waiting)
        window.scrollTo({ top: 0, behavior: 'auto' })
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
        
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

  // Sync scroll lock state with DOM
  useEffect(() => {
    // Only use isScrollLocked state - don't check progress here to avoid conflicts
    if (isScrollLocked && !isTouchDevice.current) {
      // Only lock scroll on desktop, not touch devices
      window.scrollTo({ top: 0, behavior: 'auto' })
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      // Use fixed positioning to completely prevent scroll (desktop only)
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      // Also update ref to match
      isLockedRef.current = true
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      isLockedRef.current = false
    }
  }, [isScrollLocked])

  // Smooth progress update using requestAnimationFrame
  // Same smooth interpolation for both forward and reverse
  useEffect(() => {
    const updateProgress = () => {
      // Clamp targetProgress to 1.0 max to prevent going beyond 50%
      if (targetProgress.current > 1) {
        targetProgress.current = 1
      }
      
      // Smooth interpolation - same for both directions
      const diff = Math.abs(targetProgress.current - currentProgress.current)
      
      if (diff > 0.001) {
        // Smooth factor - balanced for responsiveness without jitter
        const factor = 0.15
        currentProgress.current = lerp(currentProgress.current, targetProgress.current, factor)
        // Clamp to 1.0 max
        currentProgress.current = Math.min(1, currentProgress.current)
        setAnimationProgress(currentProgress.current)
      } else {
        currentProgress.current = Math.min(1, targetProgress.current)
        setAnimationProgress(currentProgress.current)
      }
      
      rafId.current = requestAnimationFrame(updateProgress)
    }

    rafId.current = requestAnimationFrame(updateProgress)

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  // Unlock scroll when animation completes - ensure it's truly at 50% (progress = 1)
  useEffect(() => {
    // Simplified unlock condition - just check if we're at or very close to 1.0
    const isAt50Percent = animationProgress >= 0.99 && currentProgress.current >= 0.99 && targetProgress.current >= 0.99
    
    // Unlock based on progress alone - unlock immediately when at 1.0
    if (isAt50Percent && isScrollLocked) {
      // Unlock immediately - no frame delay for smooth scrolling
      targetProgress.current = 1
      currentProgress.current = 1
      setAnimationProgress(1)
      
      // Unlock immediately - the sync effect will handle DOM cleanup
      isLockedRef.current = false
      setIsScrollLocked(false)
      completionFramesRef.current = 0 // Reset for next time
    }
  }, [animationProgress, isScrollLocked])

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

      // For touch devices: map scroll position to animation progress when scrolling down
      if (isTouchDevice.current && scrollY <= windowHeight && !isScrollLocked) {
        // Map scroll from 0 to windowHeight to progress 0 to 1
        const progress = Math.max(0, Math.min(1, scrollY / windowHeight))
        targetProgress.current = progress
        return
      }

      // If at top and scrolling up, lock and reset (desktop only, or touch when past)
      if (scrollY === 0 && scrollingUp && hasScrolledPast.current) {
        targetProgress.current = 0
        currentProgress.current = 0
        if (!isTouchDevice.current) {
          isLockedRef.current = true
          setIsScrollLocked(true)
        }
        setSignatureComplete(false)
        hasScrolledPast.current = false
        return
      }

      // Start reverse animation ONLY when hero is centered (not just visible)
      // Hero is centered when scrollY is below 20% of viewport height
      const reverseStartPoint = windowHeight * 0.2
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

  // Scale from 1 (100%) to 0.5 (50%)
  const imageScale = Math.max(0.5, 1 - (animationProgress * 0.5))
  // Saturation from 100% to 0%
  const imageSaturation = Math.max(0, 1 - animationProgress)
  // Signature opacity from 0 to 1
  const signatureOpacity = Math.min(1, animationProgress)
  // Indicator opacity: fade out as user scrolls (starts at scrollY=0, fully hidden at scrollY=200)
  const indicatorOpacity = Math.max(0, 1 - (scrollY / 200))

  return (
    <div ref={wrapperRef} className="hero-wrapper" id="home">
      <section ref={heroRef} className="hero">
        <BackgroundWords />
        <div 
          className="hero-image-container"
          style={{
            transform: `scale(${imageScale})`,
            filter: `saturate(${imageSaturation})`,
          }}
        >
          <img 
            src={heroImage || 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=2000'} 
            alt="Hero" 
            className="hero-image"
            fetchPriority="high"
            decoding="async"
            loading="eager"
          />
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
