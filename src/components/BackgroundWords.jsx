import './BackgroundWords.css'

const DEVELOPMENT_WORDS = [
  'Development',
  'React',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Python',
  'C++',
]

const PHOTOGRAPHY_WORDS = [
  'Photography',
  'Portrait Photography',
  'Landscape Photography',
  'Premiere',
  'Lightroom',
  'Photoshop',
]

function WordTrack({ words, reverse = false }) {
  const loop = [...words, ...words]

  return (
    <div className={`background-words-track${reverse ? ' background-words-track-reverse' : ''}`}>
      {loop.map((word, index) => (
        <div key={`${word}-${index}`} className="background-word">
          {word}
        </div>
      ))}
    </div>
  )
}

export default function BackgroundWords() {
  return (
    <div className="background-words">
      <WordTrack words={DEVELOPMENT_WORDS} />
      <WordTrack words={PHOTOGRAPHY_WORDS} reverse />
    </div>
  )
}
