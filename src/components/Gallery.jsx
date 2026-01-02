import { useMemo } from 'react'
import { motion } from 'framer-motion'
import './Gallery.css'

const imageModules = import.meta.glob('../images/portfolio/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { 
  eager: true, 
  import: 'default' 
})

const images = Object.values(imageModules)

const Gallery = () => {
  const gridColumns = useMemo(() => {
    const numColumns = Math.min(4, images.length > 0 ? 4 : 0)
    const cols = Array.from({ length: numColumns }, () => [])
    images.forEach((image, index) => {
      cols[index % numColumns].push(image)
    })
    return cols.filter(col => col.length > 0)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  }

  return (
    <section id="gallery" className="gallery-section">
      <motion.h2 
        className="gallery-title"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        Photography
      </motion.h2>
      
      <div className="gallery-wrapper">
        <motion.div 
          className="gallery-grid-container"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="gallery-grid">
            {gridColumns.map((column, colIndex) => (
              <div key={colIndex} className="gallery-column">
                {column.map((image, index) => (
                  <motion.div
                    key={`${colIndex}-${index}`}
                    className="gallery-item"
                    variants={itemVariants}
                  >
                    <img
                      src={image}
                      alt={`Gallery image ${colIndex * gridColumns.length + index + 1}`}
                      className="gallery-item-image"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Gallery
