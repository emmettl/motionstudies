const year = document.querySelector('[data-year]')
if (year) year.textContent = String(new Date().getFullYear())

const teaser = document.querySelector('[data-motion-teaser]')
const toggle = document.querySelector('.teaser-toggle')
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
let paused = false

function updateMotion() {
  if (!teaser || !toggle) return
  teaser.setAttribute('data-motion-ready', '')
  teaser.toggleAttribute('data-paused', paused || document.hidden || reducedMotion.matches)
  toggle.hidden = reducedMotion.matches
  toggle.textContent = paused ? 'Play animation' : 'Pause animation'
}

toggle?.addEventListener('click', () => {
  paused = !paused
  updateMotion()
})
reducedMotion.addEventListener('change', updateMotion)
document.addEventListener('visibilitychange', updateMotion)
updateMotion()
