import { useEffect } from 'react'
import { motion } from 'framer-motion'
import './AnimatedSignature.css'

// From src/images/Signature.svg – viewBox and paths (two strokes)
const VIEW_BOX = '0 0 1421.7 1489.66'
const SVG_WIDTH = 1000
const SVG_HEIGHT = 1048

// Delay: signature starts drawing only after this much scroll progress (0–1). Higher = more desaturation first.
const START_DELAY = 0.56

// Artificial stroke weight (in viewBox units). Original SVG used 19px; bump for more presence.
const STROKE_WEIGHT = 22

const PATHS = [
  'M627.83,169.84S23.1,662.73,173.24,779.04c157.32,30.48,676.47-205.5,603.71-40.31C692.4,939.31,49.15,1487.03,11.99,1480.09S351.13,611.4,1314.25,176.65',
  'M601.41,466.14s82.93-25.3,102.34-81.27-62.1-137.47-109.96,130.32c-15.52,59.51,240.63-135.84,240.63-135.84,0,0,95.73-98.32,85.38-107.38s-116.43,73.74-56.92,97.03c27.17,9.06,128.08-163,134.54-128.08s-59.51,112.55-28.46,93.15,130.66-181.12,112.55-131.96,2.18,59.51,2.18,59.51c0,0,69.29-102.38,57.33-109.96s-1.29,67.27,15.52,59.51S1415.73,7.39,1415.73,7.39',
]

// Map scroll progress to signature progress with delayed start (0 until START_DELAY, then 0→1)
const delayedProgress = (p) =>
  p <= START_DELAY ? 0 : (p - START_DELAY) / (1 - START_DELAY)

// First path (S) draws 0→0.5; second path (e) draws 0.52→1 so one solid stroke (e starts right after S)
const pathProgress = (drawProgress, pathIndex) => {
  const start = pathIndex === 0 ? 0 : 0.52
  const end = pathIndex === 0 ? 0.5 : 1
  if (drawProgress <= start) return 0
  if (drawProgress >= end) return 1
  return (drawProgress - start) / (end - start)
}

const AnimatedSignature = ({ progress, onAnimationComplete }) => {
  const drawProgress = delayedProgress(progress)

  useEffect(() => {
    if (progress >= 1 && onAnimationComplete) {
      const t = setTimeout(onAnimationComplete, 50)
      return () => clearTimeout(t)
    }
  }, [progress, onAnimationComplete])

  return (
    <div className="signature-container">
      <motion.svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={VIEW_BOX}
        className="signature-svg"
        initial={false}
      >
        {PATHS.map((d, i) => {
          if (i === 1 && drawProgress < 0.5) return null
          const p = pathProgress(drawProgress, i)
          return (
            <motion.path
              key={i}
              d={d}
              stroke="#ffffff"
              strokeWidth={STROKE_WEIGHT}
              fill="none"
              strokeLinecap={i === 0 ? 'butt' : 'round'}
              strokeLinejoin="round"
              strokeDasharray="1 1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: p }}
              transition={{ duration: 0 }}
            />
          )
        })}
      </motion.svg>
    </div>
  )
}

export default AnimatedSignature

