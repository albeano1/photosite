import { useCallback, useState } from 'react'
import { pickRandomProject } from '../data/projects'
import './HeroRandomProject.css'

const getLenis = () => window.lenis

const TECH_ABBREV = {
  TypeScript: 'TS',
  JavaScript: 'JS',
}

const displayTech = (name) => TECH_ABBREV[name] ?? name

const DETAIL_LINE_CLASSES = [
  '',
  'hero-random-project-card-line--w90',
  'hero-random-project-card-line--w75',
  'hero-random-project-card-line--w60',
  'hero-random-project-card-line--w45',
]

const MiniProjectCardFace = ({ project, side }) => {
  const isBack = side === 'back'
  const techTags = project.tech.slice(0, 4)

  return (
    <div
      className={`hero-random-project-card-face hero-random-project-card-face--${side}`}
      aria-hidden={isBack}
    >
      <span className="hero-random-project-card-title">{project.title}</span>
      <div className="hero-random-project-card-lines">
        {DETAIL_LINE_CLASSES.map((widthClass, index) => (
          <span
            key={index}
            className={`hero-random-project-card-line${widthClass ? ` ${widthClass}` : ''}`}
          />
        ))}
      </div>
      <div
        className={`hero-random-project-card-tags${
          techTags.length === 1 ? ' hero-random-project-card-tags--single' : ''
        }`}
      >
        {techTags.map((tag) => (
          <span key={tag} className="hero-random-project-card-tag">
            {displayTech(tag)}
          </span>
        ))}
      </div>
    </div>
  )
}

const HeroRandomProject = ({ fade, fadeEdge }) => {
  const [previewProject, setPreviewProject] = useState(() => pickRandomProject())

  const openRandomProject = useCallback(() => {
    const project = pickRandomProject()
    setPreviewProject(project)
    const link = project.link?.trim()
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
      return
    }
    const projectsEl = document.getElementById('projects')
    if (!projectsEl) return
    const lenis = getLenis()
    if (lenis) {
      lenis.scrollTo(projectsEl, { offset: -48 })
    } else {
      projectsEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <button
      type="button"
      className="hero-random-project-btn"
      onClick={openRandomProject}
      aria-label={`Open a random project. Preview: ${previewProject.title}`}
      style={{ pointerEvents: fade >= 1 ? 'none' : 'auto' }}
    >
      <div
        className="hero-random-project-fade"
        style={{
          WebkitMaskImage: `linear-gradient(to top, transparent 0%, transparent ${fadeEdge}, black ${fadeEdge}, black 100%)`,
          maskImage: `linear-gradient(to top, transparent 0%, transparent ${fadeEdge}, black ${fadeEdge}, black 100%)`,
        }}
      >
        <div className="hero-random-project-stack">
          <span className="hero-random-project-label">Random Project</span>
          <div className="hero-random-project-scene">
            <div className="hero-random-project-card-3d">
              <MiniProjectCardFace project={previewProject} side="front" />
              <MiniProjectCardFace project={previewProject} side="back" />
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export default HeroRandomProject
