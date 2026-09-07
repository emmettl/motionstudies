import { useEffect } from 'react'

let nextTooltipId = 0

/** One delegated tooltip surface per application. Copy belongs to each edition.
 * data-tooltip supplies help; aria-label is the fallback for icon controls.
 * An empty data-tooltip opts a self-explanatory button out.
 */
export function ButtonTooltips() {
  useEffect(() => {
    const capability = window.matchMedia('(hover: hover) and (pointer: fine)')
    const tooltip = document.createElement('div')
    tooltip.id = `motion-study-tooltip-${++nextTooltipId}`
    tooltip.setAttribute('role', 'tooltip')
    Object.assign(tooltip.style, {
      position: 'fixed', zIndex: '2147483647', boxSizing: 'border-box',
      maxWidth: 'min(300px, calc(100vw - 16px))', padding: '9px 12px',
      border: '1px solid #73818d', borderRadius: '6px', background: '#101820',
      color: '#f5f7fa', font: '400 13px/1.45 system-ui, sans-serif',
      letterSpacing: 'normal', textTransform: 'none', textAlign: 'start',
      whiteSpace: 'normal', overflowWrap: 'anywhere',
      boxShadow: '0 4px 18px #0006', pointerEvents: 'auto',
    })
    let anchor: HTMLButtonElement | null = null
    let showTimer = 0
    let hideTimer = 0
    let touch = false
    const copy = (button: HTMLButtonElement) =>
      (button.getAttribute('data-tooltip') ?? button.getAttribute('aria-label') ?? '').trim()
    const buttonAt = (target: EventTarget | null) =>
      target instanceof Element ? target.closest('button') : null
    const hide = () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
      if (anchor) {
        const descriptions = (anchor.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== tooltip.id)
        if (descriptions.length) anchor.setAttribute('aria-describedby', descriptions.join(' '))
        else anchor.removeAttribute('aria-describedby')
      }
      anchor = null
      observer.disconnect()
      tooltip.remove()
    }
    const refresh = () => {
      if (!anchor) return
      if (!anchor.isConnected || !copy(anchor) || !anchor.getClientRects().length) { hide(); return }
      const text = copy(anchor)
      if (tooltip.textContent !== text) tooltip.textContent = text
      const lang = anchor.closest('[lang]')?.getAttribute('lang') ?? document.documentElement.lang
      if (tooltip.lang !== lang) tooltip.lang = lang
      const rect = anchor.getBoundingClientRect()
      const width = tooltip.offsetWidth
      const height = tooltip.offsetHeight
      const left = Math.max(8, Math.min(rect.left + (rect.width - width) / 2, window.innerWidth - width - 8))
      const below = rect.bottom + 8
      const top = below + height <= window.innerHeight - 8 ? below : Math.max(8, rect.top - height - 8)
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`
    }
    const show = (button: HTMLButtonElement, delay: number) => {
      if (!capability.matches || touch || !copy(button)) return
      if (anchor === button) { window.clearTimeout(hideTimer); return }
      hide()
      showTimer = window.setTimeout(() => {
        if (!button.isConnected || !capability.matches || touch) return
        anchor = button
        document.body.append(tooltip)
        const descriptions = (button.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
        button.setAttribute('aria-describedby', [...descriptions, tooltip.id].join(' '))
        refresh()
        observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-tooltip', 'aria-label', 'hidden', 'lang'] })
      }, delay)
    }
    const over = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      touch = false
      if (tooltip.contains(event.target as Node)) { window.clearTimeout(hideTimer); return }
      const button = buttonAt(event.target)
      if (button && !button.contains(event.relatedTarget as Node)) show(button, 400)
    }
    const out = (event: PointerEvent) => {
      const button = buttonAt(event.target)
      if (button?.contains(event.relatedTarget as Node) || tooltip.contains(event.relatedTarget as Node)) return
      window.clearTimeout(showTimer)
      if (anchor || tooltip.contains(event.target as Node)) {
        window.clearTimeout(hideTimer)
        hideTimer = window.setTimeout(hide, 160)
      }
    }
    const focus = (event: FocusEvent) => {
      const button = buttonAt(event.target)
      if (button) show(button, 0)
    }
    const down = (event: PointerEvent) => { touch = event.pointerType !== 'mouse'; hide() }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
      else if (event.key === 'Tab') touch = false
    }
    const observer = new MutationObserver(refresh)
    document.addEventListener('pointerover', over, true)
    document.addEventListener('pointerout', out, true)
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('focusin', focus)
    document.addEventListener('focusout', hide)
    document.addEventListener('keydown', key, true)
    document.addEventListener('click', hide, true)
    document.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    window.addEventListener('blur', hide)
    capability.addEventListener('change', hide)
    return () => {
      hide()
      observer.disconnect()
      document.removeEventListener('pointerover', over, true)
      document.removeEventListener('pointerout', out, true)
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('focusin', focus)
      document.removeEventListener('focusout', hide)
      document.removeEventListener('keydown', key, true)
      document.removeEventListener('click', hide, true)
      document.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
      window.removeEventListener('blur', hide)
      capability.removeEventListener('change', hide)
    }
  }, [])
  return null
}
