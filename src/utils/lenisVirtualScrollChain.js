/** Priority-ordered Lenis virtualScroll handlers (higher runs first). */
const handlers = []

let lenisRef = null
let installed = false

function runChain(data) {
  for (const entry of handlers) {
    if (entry.when && !entry.when()) continue
    if (entry.handler(data) === false) return false
  }
}

export function attachLenisVirtualScrollChain(lenis) {
  if (!lenis || installed) return
  lenisRef = lenis
  const legacy = lenis.options.virtualScroll
  lenis.options.virtualScroll = (data) => {
    const chainResult = runChain(data)
    if (chainResult === false) return false
    if (typeof legacy === 'function') return legacy(data)
  }
  installed = true
}

export function registerLenisVirtualScrollHandler({ id, priority, when, handler }) {
  const existing = handlers.findIndex((h) => h.id === id)
  if (existing >= 0) handlers.splice(existing, 1)
  handlers.push({ id, priority, when, handler })
  handlers.sort((a, b) => b.priority - a.priority)
  return () => {
    const idx = handlers.findIndex((h) => h.id === id)
    if (idx >= 0) handlers.splice(idx, 1)
  }
}

export function isContactBlanketScrollActive() {
  return document.body.dataset.contactBlanket === 'active'
}
