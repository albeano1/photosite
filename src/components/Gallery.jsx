import { useMemo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import './Gallery.css'
import { GALLERY_FILTERS, getImageCategory } from '../data/portfolioCategories'

const imageModules = import.meta.glob('../images/portfolio/*.{jpg,jpeg,png,JPG,JPEG,PNG}', {
  eager: true,
  import: 'default',
})

const COLUMN_COUNT = 4
const FILTER_SEEDS = { all: 2847, grad: 3911, events: 4723, misc: 5839 }

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

const distributeToColumns = (images) => {
  const cols = Array.from({ length: COLUMN_COUNT }, () => [])
  images.forEach((image, index) => {
    cols[index % COLUMN_COUNT].push({ ...image, globalIndex: index })
  })
  return cols
}

const Gallery = () => {
  const allImages = useMemo(
    () =>
      Object.entries(imageModules).map(([path, src]) => {
        const filename = path.split('/').pop()
        return {
          id: filename,
          src,
          category: getImageCategory(filename),
        }
      }),
    []
  )

  const [activeFilter, setActiveFilter] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const filteredImages = useMemo(() => {
    if (activeFilter === 'all') return allImages
    return allImages.filter((img) => img.category === activeFilter)
  }, [allImages, activeFilter])

  const displayImages = useMemo(
    () => seededShuffle(filteredImages, FILTER_SEEDS[activeFilter] ?? 2847),
    [filteredImages, activeFilter]
  )

  const gridColumns = useMemo(
    () => distributeToColumns(displayImages),
    [displayImages]
  )

  const totalImages = displayImages.length

  const goNext = useCallback(() => {
    if (!totalImages) return
    setLightboxIndex((current) =>
      current === null ? 0 : (current + 1) % totalImages
    )
  }, [totalImages])

  const goPrev = useCallback(() => {
    if (!totalImages) return
    setLightboxIndex((current) =>
      current === null ? 0 : (current - 1 + totalImages) % totalImages
    )
  }, [totalImages])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId)
    setLightboxIndex(null)
  }

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') goNext()
      else if (event.key === 'ArrowLeft') goPrev()
      else if (event.key === 'Escape') closeLightbox()
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

  const counts = useMemo(() => {
    const c = { all: allImages.length, grad: 0, events: 0, misc: 0 }
    allImages.forEach((img) => {
      if (img.category) c[img.category] += 1
    })
    return c
  }, [allImages])

  return (
    <section id="gallery" className="gallery-section">
      <motion.h2
        className="gallery-title"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.4 }}
      >
        Photography
      </motion.h2>

      <motion.div
        className="gallery-wrapper"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="gallery-filters"
          role="tablist"
          aria-label="Filter portfolio by category"
        >
          {GALLERY_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id
            const count = counts[filter.id]
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`gallery-filter-btn${isActive ? ' gallery-filter-btn--active' : ''}`}
                onClick={() => handleFilterChange(filter.id)}
              >
                {isActive && (
                  <motion.span
                    layoutId="gallery-filter-pill"
                    className="gallery-filter-pill"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="gallery-filter-label">
                  {filter.label}
                  <span className="gallery-filter-count">{count}</span>
                </span>
              </button>
            )
          })}
        </motion.div>

        <motion.div
          key={activeFilter}
          className="gallery-grid-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {displayImages.length === 0 ? (
            <p className="gallery-empty">
              No photos in this category yet. Tag them in{' '}
              <code>src/data/portfolioCategories.js</code>.
            </p>
          ) : (
            <motion.div
              className="gallery-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {gridColumns.map((column, colIndex) => (
                <div key={colIndex} className="gallery-column">
                  {column.map(({ id, src, globalIndex }, index) => (
                    <motion.div
                      key={id}
                      className="gallery-item"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.12) }}
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
                        src={src}
                        alt={`Gallery image ${globalIndex + 1}`}
                        className="gallery-item-image"
                        loading="lazy"
                        decoding="async"
                        fetchPriority={index < 2 && colIndex === 0 ? 'high' : 'low'}
                      />
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

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
          <motion.div
            className="gallery-lightbox-carousel"
            onClick={(event) => event.stopPropagation()}
            key={displayImages[lightboxIndex]?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
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
                src={displayImages[lightboxIndex].src}
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
          </motion.div>
        </div>
      )}
    </section>
  )
}

export default Gallery
