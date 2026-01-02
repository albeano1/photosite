import { motion, AnimatePresence } from 'framer-motion'
import './Loading.css'

const Loading = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="loading-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="loading-content">
            <motion.div 
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="loading-text">Loading...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Loading

