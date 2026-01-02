import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import './AnimatedSignature.css'

const AnimatedSignature = ({ progress, onAnimationComplete }) => {
  const [hasCompleted, setHasCompleted] = useState(false)
  const controls = useAnimation()

  useEffect(() => {
    // Animate based on progress (0 to 1)
    if (progress > 0.1) {
      controls.start({
        pathLength: progress,
        opacity: progress,
        transition: {
          pathLength: { duration: 0 },
          opacity: { duration: 0 }
        }
      })
    } else {
      controls.start({
        pathLength: 0,
        opacity: 0
      })
    }

    // Check if animation is complete
    if (progress >= 1 && !hasCompleted) {
      setHasCompleted(true)
      // Small delay to ensure animation is fully visible
      setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete()
        }
      }, 100)
    } else if (progress < 1) {
      setHasCompleted(false)
    }
  }, [progress, controls, hasCompleted, onAnimationComplete])

  return (
    <div className="signature-container">
      <motion.svg
        width="400"
        height="150"
        viewBox="0 0 400 150"
        className="signature-svg"
        initial={{ pathLength: 0, opacity: 0 }}
      >
        {/* Replace these paths with your own signature paths */}
        <motion.path
          d="M 30 75 Q 50 40, 70 75 T 110 75 T 150 75"
          stroke="#00ff88"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          animate={controls}
        />
        <motion.path
          d="M 150 75 Q 170 40, 190 75 T 230 75"
          stroke="#00ff88"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          animate={controls}
        />
        <motion.path
          d="M 230 75 L 280 75"
          stroke="#00ff88"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          animate={controls}
        />
        <motion.circle
          cx="310"
          cy="75"
          r="10"
          fill="#00ff88"
          animate={{
            scale: progress > 0.8 ? 1 : 0,
            opacity: progress > 0.8 ? progress : 0
          }}
          transition={{ duration: 0 }}
        />
      </motion.svg>
    </div>
  )
}

export default AnimatedSignature

