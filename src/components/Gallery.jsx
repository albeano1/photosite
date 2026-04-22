import { useMemo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import './Gallery.css'

const imageModules = import.meta.glob('../images/portfolio/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { 
  eager: true, 
  import: 'default' 
})

const images = Object.values(imageModules)

// Seeded shuffle: same order every time, but not by name/date (deterministic mix)
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

const Gallery = () => {
  const shuffledImages = useMemo(() => seededShuffle(images), [])
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const gridColumns = useMemo(() => {
    const numColumns = Math.min(4, shuffledImages.length > 0 ? 4 : 0)
    const cols = Array.from({ length: numColumns }, () => [])
    shuffledImages.forEach((image, index) => {
      cols[index % numColumns].push({ image, globalIndex: index })
    })
    return cols.filter(col => col.length > 0)
  }, [shuffledImages])

  const totalImages = shuffledImages.length

  const goNext = useCallback(() => {
    if (!totalImages) return
    setLightboxIndex(current =>
      current === null ? 0 : (current + 1) % totalImages
    )
  }, [totalImages])

  const goPrev = useCallback(() => {
    if (!totalImages) return
    setLightboxIndex(current =>
      current === null ? 0 : (current - 1 + totalImages) % totalImages
    )
  }, [totalImages])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        goNext()
      } else if (event.key === 'ArrowLeft') {
        goPrev()
      } else if (event.key === 'Escape') {
        closeLightbox()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, goNext, goPrev, closeLightbox])

  useEffect(() => {
    if (lightboxIndex === null) return
    const intervalId = setInterval(goNext, 10000)
    return () => clearInterval(intervalId)
  }, [lightboxIndex, goNext])

  useEffect(() => {
    if (lightboxIndex === null) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [lightboxIndex])

  return (
    <section id="gallery" className="gallery-section">
      <motion.h2 
        className="gallery-title"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.4 }}
      >
        Photography
      </motion.h2>
      
      <div className="gallery-wrapper">
        <div className="gallery-grid-container">
          <div className="gallery-grid">
            {gridColumns.map((column, colIndex) => (
              <div key={colIndex} className="gallery-column">
                {column.map(({ image, globalIndex }, index) => (
                  <div
                    key={`${colIndex}-${index}`}
                    className="gallery-item"
                    onClick={() => setLightboxIndex(globalIndex)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setLightboxIndex(globalIndex)
                      }
                    }}
                  >
                    <img
                      src={image}
                      alt={`Gallery image ${globalIndex + 1}`}
                      className="gallery-item-image"
                      loading="lazy"
                      decoding="async"
                      fetchPriority={index < 2 ? "high" : "low"}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {lightboxIndex !== null && totalImages > 0 && (
        <div
          className="gallery-lightbox"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="gallery-lightbox-close"
            onClick={(event) => {
              event.stopPropagation()
              closeLightbox()
            }}
            aria-label="Close preview"
          >
            ×
          </button>
          <div className="gallery-lightbox-carousel" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="gallery-lightbox-arrow gallery-lightbox-arrow--left"
              onClick={(event) => {
                event.stopPropagation()
                goPrev()
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <div className="gallery-lightbox-image-wrapper">
              <img
                src={shuffledImages[lightboxIndex]}
                alt={`Preview image ${lightboxIndex + 1} of ${totalImages}`}
                className="gallery-lightbox-image"
              />
            </div>
            <button
              type="button"
              className="gallery-lightbox-arrow gallery-lightbox-arrow--right"
              onClick={(event) => {
                event.stopPropagation()
                goNext()
              }}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Gallery
