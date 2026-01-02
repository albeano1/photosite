import { useMemo } from 'react'
import './BackgroundWords.css'

const BackgroundWords = () => {
  const words = [
    'PHOTOGRAPHY', 'MOMENTS', 'MEMORIES', 'LIGHT', 'SHADOW',
    'COMPOSITION', 'BEAUTY', 'ART', 'VISION', 'CREATIVE',
    'STORYTELLING', 'EMOTION', 'DEPTH', 'PERSPECTIVE', 'FRAME',
    'CAPTURE', 'INSPIRE', 'CREATE', 'EXPLORE', 'DISCOVER'
  ]

  // Duplicate words for seamless scrolling
  const duplicatedWords = [...words, ...words]

  // Generate stable font sizes - only calculate once, independent of scroll
  const wordSizes = useMemo(() => {
    return duplicatedWords.map(() => Math.random() * 15 + 25)
  }, [])

  return (
    <div className="background-words">
      <div className="background-words-track">
        {duplicatedWords.map((word, index) => (
          <div
            key={index}
            className="background-word"
            style={{
              fontSize: `${wordSizes[index]}px`
            }}
          >
            {word}
          </div>
        ))}
      </div>
      <div className="background-words-track background-words-track-reverse">
        {duplicatedWords.map((word, index) => (
          <div
            key={`reverse-${index}`}
            className="background-word"
            style={{
              fontSize: `${wordSizes[index]}px`
            }}
          >
            {word}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BackgroundWords

