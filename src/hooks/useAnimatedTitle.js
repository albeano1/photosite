import { useEffect } from 'react'

const BASE_TITLE = 'A little portfolio of everything'
const MARQUEE_PAD = '   ·   '
const MARQUEE_TEXT = `${BASE_TITLE}${MARQUEE_PAD}`

const ATTENTION_MESSAGES = [
  'Come back!',
]

/**
 * Scrolls the document title when the tab is active;
 * cycles attention messages when the user switches away.
 */
export function useAnimatedTitle(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return

    let intervalId = null
    let marqueeIndex = 0
    let attentionIndex = 0
    let attentionToggle = false

    const clearTimer = () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const runMarquee = () => {
      clearTimer()
      marqueeIndex = 0
      intervalId = setInterval(() => {
        document.title =
          MARQUEE_TEXT.slice(marqueeIndex) + MARQUEE_TEXT.slice(0, marqueeIndex)
        marqueeIndex = (marqueeIndex + 1) % MARQUEE_TEXT.length
      }, 280)
    }

    const runAttention = () => {
      clearTimer()
      attentionIndex = 0
      attentionToggle = false
      intervalId = setInterval(() => {
        if (attentionToggle) {
          document.title = BASE_TITLE
        } else {
          document.title = ATTENTION_MESSAGES[attentionIndex]
          attentionIndex = (attentionIndex + 1) % ATTENTION_MESSAGES.length
        }
        attentionToggle = !attentionToggle
      }, 1200)
    }

    const syncMode = () => {
      if (document.hidden) {
        runAttention()
      } else {
        runMarquee()
      }
    }

    syncMode()
    document.addEventListener('visibilitychange', syncMode)

    return () => {
      document.removeEventListener('visibilitychange', syncMode)
      clearTimer()
      document.title = BASE_TITLE
    }
  }, [enabled])
}
