import { useRef } from 'react'
import Contact from './Contact'
import hero2Image from '../images/hero/hero2.jpg'
import { useContactBlanketScroll } from '../hooks/useContactBlanketScroll'
import './ContactBlanket.css'

const ContactBlanket = () => {
  const zoneRef = useRef(null)
  const panelRef = useRef(null)
  const imageRef = useRef(null)

  useContactBlanketScroll(zoneRef, panelRef, imageRef)

  return (
    <section ref={zoneRef} className="contact-blanket-zone" aria-label="Contact">
      <div ref={panelRef} className="contact-blanket-panel">
        <div className="contact-blanket-image">
          <img ref={imageRef} src={hero2Image} alt="" decoding="async" />
        </div>
        <p className="contact-blanket-caption">Banff National Park</p>
        <Contact variant="blanket" />
      </div>
    </section>
  )
}

export default ContactBlanket
