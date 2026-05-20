import { motion } from 'framer-motion'
import './Projects.css'

const Projects = () => {
  const projects = [
    {
      title: 'Earnings Intel',
      description: 'LLM-based earnings intelligence from SEC filings and market data. Extracts structured signals (sentiment shift, uncertainty, guidance, tone), benchmarks them against forward returns and lexical baselines, and exports factor-lab CSVs with point-in-time panels, IC decay, and walk-forward validation.',
      tech: ['Python', 'Pandas', 'LLM'],
      link: 'https://github.com/albeano1/LLM-Based-Earnings-Call-Intelligence-System',
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
      title: 'Factor-investing tool',
      description: 'Python research pipeline that ingests public equity data, across multiple factors momentum, mean reversion, volatility, measures predictive power with IC and horizon decay, and backtests portfolios with turnover based costs, and walk forward splits',
      tech: ['Python'],
      link: 'https://github.com/albeano1/Factor-investing',
      image: null
    },
    {
      title: 'Limit Order Book',
      description: 'Python limit order book and market microstructure simulator with price-time priority, market and limit orders, stochastic latency, and taker/maker fees. Tracks spread and slippage, supports optional Numba acceleration, historical replay, and execution algos (TWAP / VWAP).',
      tech: ['Python', 'NumPy', 'Numba'],
      link: 'https://github.com/albeano1/Limit-Order-Book',
      image: null
    },
    {
      title: 'Risk Engine',
      description: 'Python library for portfolio risk analytics: covariance estimation (Ledoit-Wolf, factor models), historical and parametric VaR/CVaR, mean-variance and risk-parity optimization, Black-Litterman views, plus stress testing and scenario analysis.',
      tech: ['Python', 'Pandas', 'NumPy'],
      link: 'https://github.com/albeano1/Risk-engine-analytical-portfolio-',
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
                {project.link && project.link.trim() !== '' && (
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

