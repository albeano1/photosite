import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import './PhotoModal.css'

const PhotoModal = ({ photo, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="photo-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="photo-modal-content"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="photo-modal-close" onClick={onClose}>
            ×
          </button>
          <div className="photo-modal-image-container">
            <motion.img
              src={photo.src}
              alt={photo.title}
              className="photo-modal-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
          </div>
          <div className="photo-modal-info">
            <h2 className="photo-modal-title">{photo.title}</h2>
            <span className="photo-modal-category">{photo.category}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PhotoModal





