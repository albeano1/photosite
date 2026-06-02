import { useMemo, useState, useEffect, useCallback } from 'react'
import './Gallery.css'
import { useGalleryHorizontalScroll } from '../hooks/useGalleryHorizontalScroll'
import { getCategoryLabel } from '../data/portfolioCategories'

const imageModules = import.meta.glob('../images/portfolio/*.{jpg,jpeg,png,JPG,JPEG,PNG}', {
  eager: true,
  import: 'default',
})

const seededShuffle = (array, seed = 2847) => {
  const shuffled = [...array]
  let s = seed
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const GALLERY_ROW_COUNT = 2
const LAYOUT_SEED = 2847

const seededUnit = (seed, index) => {
  let s = (seed + index * 7919) | 0
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

const buildItemLayout = (index) => {
  const next = seededUnit(LAYOUT_SEED, index)
  const heightVh = 28 + Math.floor(next() * 10)
  const maxWidthVw = 32 + next() * 14
  return {
    marginRight: `${(2 + next() * 3.5).toFixed(2)}rem`,
    imgHeight: `${heightVh}vh`,
    imgMaxWidth: `${maxWidthVw.toFixed(1)}vw`,
  }
}

const buildRowOffsets = () => {
  const next = seededUnit(LAYOUT_SEED, 9999)
  return {
    row0Pad: `${(4 + next() * 6).toFixed(2)}rem`,
    row1Pad: `${(8 + next() * 10).toFixed(2)}rem`,
    rowGap: `${(1.5 + next() * 2).toFixed(2)}rem`,
  }
}

const Gallery = () => {
  const images = useMemo(
    () =>
      seededShuffle(
        Object.entries(imageModules).map(([path, src]) => {
          const id = path.split('/').pop()
          return {
            id,
            src,
            label: getCategoryLabel(id),
          }
        })
      ),
    []
  )

  const itemLayouts = useMemo(
    () => images.map((_, index) => buildItemLayout(index)),
    [images]
  )

  const rowOffsets = useMemo(() => buildRowOffsets(), [])

  const imageRows = useMemo(() => {
    const rows = Array.from({ length: GALLERY_ROW_COUNT }, () => [])
    images.forEach((image, index) => {
      rows[index % GALLERY_ROW_COUNT].push({ image, index })
    })
    return rows
  }, [images])

  const { zoneRef, containerRef, trackRef, isApproaching, titleReveal, reducedMotion } =
    useGalleryHorizontalScroll(images.length)

  const [titleSettled, setTitleSettled] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  const titleActive = titleReveal || (reducedMotion && isApproaching)

  const handleTitleAnimationEnd = useCallback((event) => {
    if (event.animationName === 'gallery-title-block') {
      setTitleSettled(true)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion && isApproaching) {
      setTitleSettled(true)
    }
  }, [reducedMotion, isApproaching])

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const applyRatioClass = (img) => {
      const item = img.closest('.gallery-hscroll-item')
      if (!item) return false
      item.classList.remove('gallery-hscroll-item--vertical', 'gallery-hscroll-item--horizontal')
      let ratio = null
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        ratio = img.naturalWidth / img.naturalHeight
      } else {
        const rect = img.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          ratio = rect.width / rect.height
        }
      }
      if (!ratio) return false
      if (ratio > 1.2) {
        item.classList.add('gallery-hscroll-item--horizontal')
      } else if (ratio < 0.85) {
        item.classList.add('gallery-hscroll-item--vertical')
      }
      return true
    }

    const imgs = Array.from(document.querySelectorAll('.gallery-hscroll-item-image'))
    const listeners = []
    let rafId = 0
    let rafPasses = 0
    const MAX_RAF_PASSES = 120

    const classifyAll = () =>
      imgs.reduce((pending, img) => (applyRatioClass(img) ? pending : pending + 1), 0)

    const classifyUntilReady = () => {
      const pending = classifyAll()
      if (pending > 0 && rafPasses < MAX_RAF_PASSES) {
        rafPasses += 1
        rafId = requestAnimationFrame(classifyUntilReady)
      }
    }

    classifyUntilReady()

    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        applyRatioClass(img)
        return
      }
      const onLoad = () => applyRatioClass(img)
      img.addEventListener('load', onLoad, { once: true })
      listeners.push([img, onLoad])
    })

    const onResize = () => classifyAll()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)

    return () => {
      listeners.forEach(([img, onLoad]) => img.removeEventListener('load', onLoad))
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [images.length])

  const sectionClass = [
    'gallery-section',
    reducedMotion ? 'gallery-section--reduced-motion' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        ref={zoneRef}
        className={`gallery-scroll-zone${reducedMotion ? ' gallery-scroll-zone--static' : ''}`}
      >
        <header className="gallery-intro">
          <h2
            className={[
              'gallery-title',
              titleActive ? 'gallery-title--revealed' : '',
              titleSettled ? 'gallery-title--settled' : '',
              reducedMotion ? 'gallery-title--reduced-motion' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onAnimationEnd={handleTitleAnimationEnd}
          >
            <span className="gallery-title__text">Photography</span>
          </h2>
        </header>

        <section id="gallery" className={sectionClass} ref={containerRef}>
          <div
            className={`gallery-hscroll-pin${reducedMotion ? ' gallery-hscroll-pin--static' : ''}`}
          >
          <div className="gallery-enter">
            <div className="gallery-hscroll-stage">
              <div ref={trackRef} className="gallery-hscroll-track">
                {imageRows.map((row, rowIndex) => (
                  <div
                    key={`row-${rowIndex}`}
                    className="gallery-hscroll-row"
                    style={{
                      paddingLeft: rowIndex === 0 ? rowOffsets.row0Pad : rowOffsets.row1Pad,
                      marginBottom: rowIndex === 0 ? rowOffsets.rowGap : undefined,
                    }}
                  >
                    {row.map(({ image, index }) => {
                      const layout = itemLayouts[index]
                      return (
                        <figure
                          key={image.id}
                          className="gallery-hscroll-item"
                          data-gallery-index={index}
                          style={{
                            marginRight: layout.marginRight,
                            '--img-height': layout.imgHeight,
                            '--img-max-width': layout.imgMaxWidth,
                          }}
                        >
                          {image.label ? (
                            <span className="gallery-hscroll-item-label">{image.label}</span>
                          ) : null}
                          <div className="gallery-hscroll-item-media">
                            <img
                              src={image.src}
                              alt={
                                image.label
                                  ? `${image.label} — gallery image ${index + 1}`
                                  : `Gallery image ${index + 1}`
                              }
                              className="gallery-hscroll-item-image"
                              loading={isMobileViewport ? 'eager' : index < 8 ? 'eager' : 'lazy'}
                              decoding="async"
                              fetchPriority={index < 4 ? 'high' : 'low'}
                            />
                          </div>
                        </figure>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>
    </>
  )
}

export default Gallery
