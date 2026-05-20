/**
 * Portfolio image categories
 *
 * HOW TO ORGANIZE YOUR PHOTOS
 * ---------------------------
 * 1. Add images to: src/images/portfolio/
 * 2. Add each filename below with: 'grad' | 'events' | 'misc'
 *
 * Photos NOT listed here appear only under "All" (not Misc).
 */

export const GALLERY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'grad', label: 'Grad' },
  { id: 'events', label: 'Events' },
  { id: 'misc', label: 'Misc' },
]

/** @type {Record<string, 'grad' | 'events' | 'misc'>} */
export const imageCategories = {
  '_STN6761.jpg': 'events',
  '_STN6766.jpg': 'events',
  '_STN6813.jpg': 'events',
  '_STN7192.jpg': 'events',
  '_STN7227.jpg': 'events',
  '_STN7922.jpg': 'grad',
  '_STN9076.jpg': 'grad',
  'DSC04937.jpg': 'misc',
  'DSC05047.jpg': 'grad',
  'DSC05643': 'grad',
  'DSC07050-Edit.jpg': 'misc',
  'DSC07748.jpg': 'misc',
  'DSC07838.jpg': 'misc',
  'DSC07845.jpg': 'misc',
  'STN00272.jpg': 'events',
  'STN01229.jpg': 'misc',
  'STN02279.jpg': 'misc',
  'STN06597.jpg': 'misc',
  'STN09120.jpg': 'events',
}

export function getImageCategory(filename) {
  return imageCategories[filename] ?? null
}
