import { useMemo } from 'react'
import { motion } from 'framer-motion'
import './Gallery.css'

const imageModules = import.meta.glob('../images/portfolio/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { 
  eager: true, 
  import: 'default' 
})

const images = Object.values(imageModules)

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const Gallery = () => {
  const gridColumns = useMemo(() => {
    const shuffledImages = shuffleArray(images)
    const numColumns = Math.min(4, shuffledImages.length > 0 ? 4 : 0)
    const cols = Array.from({ length: numColumns }, () => [])
    shuffledImages.forEach((image, index) => {
      cols[index % numColumns].push(image)
    })
    return cols.filter(col => col.length > 0)
  }, [])

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
                {column.map((image, index) => (
                  <div
                    key={`${colIndex}-${index}`}
                    className="gallery-item"
                  >
                    <img
                      src={image}
                      alt={`Gallery image ${colIndex * gridColumns.length + index + 1}`}
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
    </section>
  )
}

export default Gallery
