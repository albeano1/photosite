import Hero from "./components/Hero"
import About from "./components/About"
import Gallery from "./components/Gallery"
import Projects from "./components/Projects"
import Contact from "./components/Contact"
import "./App.css"

import heroImage from "./images/DSC04937.jpg"

function App() {
  return (
    <div className="app">
      <Hero heroImage={heroImage} />
      <About />
      <Gallery />
      <Projects />
      <Contact />
    </div>
  )
}

export default App
