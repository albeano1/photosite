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

function WordTrack({ words, reverse = false, tone = 'thin' }) {
  const loop = [...words, ...words]
  const trackClass = [
    'background-words-track',
    reverse ? 'background-words-track-reverse' : '',
    tone === 'bold' ? 'background-words-track--bold' : 'background-words-track--thin',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={trackClass}>
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
      <WordTrack words={DEVELOPMENT_WORDS} tone="thin" />
      <WordTrack words={PHOTOGRAPHY_WORDS} reverse tone="bold" />
    </div>
  )
}
