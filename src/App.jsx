import { useState, useEffect } from "react"
import Hero from "./components/Hero"
import About from "./components/About"
import Gallery from "./components/Gallery"
import Projects from "./components/Projects"
import Contact from "./components/Contact"
import Loading from "./components/Loading"
import "./App.css"

import heroBackground from "./images/bghero.jpg"
import heroSubject from "./images/subjecthero.png"

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let loaded = 0
    const maybeDone = () => {
      loaded++
      if (loaded >= 2) {
        setTimeout(() => setIsLoading(false), 500)
      }
    }
    const imgBg = new Image()
    imgBg.src = heroBackground
    imgBg.onload = maybeDone
    imgBg.onerror = maybeDone
    const imgSub = new Image()
    imgSub.src = heroSubject
    imgSub.onload = maybeDone
    imgSub.onerror = maybeDone

    const timeout = setTimeout(() => setIsLoading(false), 3000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="app">
      <Loading show={isLoading} />
      <Hero
        heroImage={heroBackground}
        heroBackgroundImage={heroBackground}
        heroSubjectImage={heroSubject}
      />
      <div className="app-content">
        <About />
        <Gallery />
        <Projects />
        <Contact />
      </div>
    </div>
  )
}

export default App
