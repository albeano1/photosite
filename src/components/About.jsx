import { motion } from 'framer-motion'
import './About.css'

const About = () => {
  return (
    <section id="about" className="about-section">
      <div className="about-container">
        <motion.div
          className="about-content"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        >
          <h2 className="about-title">About</h2>
          <div className="about-text">
            <p>
              Hi I'm Sean, a developer and musician with a passion for photography.
            </p>
            <p>
                I bring ideas to life 
              through my technical skills and creativity.
            </p>
          </div>
          
          <div className="about-skills">
            <h3>Skills & Tools</h3>
            <div className="skills-grid">
              <div className="skill-category">
                <h4>Development</h4>
                <ul>
                  <li>React</li>
                  <li>JavaScript</li>
                  <li>TypeScript</li>
                  <li>Node.js</li>
                  <li>Python</li>
                  <li>C++</li>
                </ul>
              </div>
              <div className="skill-category">
                <h4>Photography</h4>
                <ul>
                  <li>Portrait Photography</li>
                  <li>Landscape Photography</li>
                  <li>Premiere</li>
                  <li>Lightroom</li>
                  <li>Photoshop</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About

