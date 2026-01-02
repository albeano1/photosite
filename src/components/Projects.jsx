import { motion } from 'framer-motion'
import './Projects.css'

const Projects = () => {
  const projects = [
    {
      title: 'Project Andile',
      description: 'A secrete project with a roatating password, and biometric authentication ',
      tech: ['React', 'Node.js', 'TypeScript'],
      link: 'https://albeano1.github.io/ven/?access=',
      image: null
    },
    {
      title: 'True Reasoning for LLMS',
      description: 'A project to obtain true reasoning capabilities for LLMs base on propositioanal and formal logic. Providing consistent answers for questions based on the given context.',
      tech: ['React', 'CSS', 'Python',],
      link: null,
      image: null
    },
    {
      title: 'JJ Optimization',
      description: 'A tool optimized for making the best most optimal jj recipe .',

      link: '',
      image: null
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
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
    <section id="projects" className="projects-section">
      <div className="projects-container">
        <motion.h2
          className="projects-title"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          Projects
        </motion.h2>

        <motion.div
          className="projects-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className="project-card"
              variants={itemVariants}
              whileHover={{ y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="project-content">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-tech">
                  {project.tech.map((tech, techIndex) => (
                    <span key={techIndex} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    View Project →
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Projects

