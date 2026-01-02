import { useState, useEffect } from "react"
import Hero from "./components/Hero"
import About from "./components/About"
import Gallery from "./components/Gallery"
import Projects from "./components/Projects"
import Contact from "./components/Contact"
import Loading from "./components/Loading"
import "./App.css"

import heroImage from "./images/DSC04937.jpg"

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Preload hero image
    const img = new Image()
    img.src = heroImage
    img.onload = () => {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    }
    img.onerror = () => {
      // Still hide loading even if image fails
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    }
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="app">
      <Loading show={isLoading} />
      <Hero heroImage={heroImage} />
      <About />
      <Gallery />
      <Projects />
      <Contact />
    </div>
  )
}

export default App
