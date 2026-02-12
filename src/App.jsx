import { useState, useEffect } from "react"
import Hero from "./components/Hero"
import About from "./components/About"
import Gallery from "./components/Gallery"
import Projects from "./components/Projects"
import Contact from "./components/Contact"
import Loading from "./components/Loading"
import "./App.css"

import heroPhoto from "./images/hero/photo.jpg"
import heroDepth from "./images/hero/depth.png"

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
    const imgPhoto = new Image()
    imgPhoto.src = heroPhoto
    imgPhoto.onload = maybeDone
    imgPhoto.onerror = maybeDone
    const imgDepth = new Image()
    imgDepth.src = heroDepth
    imgDepth.onload = maybeDone
    imgDepth.onerror = maybeDone

    const timeout = setTimeout(() => setIsLoading(false), 3000)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="app">
      <Loading show={isLoading} />
      <Hero
        heroImage={heroPhoto}
        depthMapImage={heroDepth}
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
