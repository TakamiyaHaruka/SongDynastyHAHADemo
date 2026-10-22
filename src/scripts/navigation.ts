export {}

let cleanup: (() => void) | undefined

function initNavigation() {
  cleanup?.()
  const nav = document.getElementById('nav-bar')
  const sentinel = document.getElementById('nav-sentinel')
  const hamburger = document.getElementById('nav-hamburger')
  const backdrop = document.getElementById('drawer-backdrop')
  const panel = document.getElementById('drawer-panel')
  const closeButton = document.getElementById('drawer-close')
  if (!nav || !sentinel || !hamburger || !backdrop || !panel || !closeButton) return

  const controller = new AbortController()
  const { signal } = controller
  const observer = new IntersectionObserver(([entry]) => {
    nav.classList.toggle('is-scrolled', !entry.isIntersecting)
  }, { threshold: 0, rootMargin: '-56px 0px 0px 0px' })
  nav.classList.toggle('is-scrolled', window.scrollY > 0)
  observer.observe(sentinel)

  const setOpen = (open: boolean) => {
    hamburger.classList.toggle('is-open', open)
    hamburger.setAttribute('aria-expanded', String(open))
    hamburger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单')
    backdrop.classList.toggle('is-open', open)
    panel.classList.toggle('is-open', open)
    panel.setAttribute('aria-hidden', String(!open))
    panel.inert = !open
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) closeButton.focus({ preventScroll: true })
  }
  const close = (restoreFocus = false) => {
    const wasOpen = hamburger.getAttribute('aria-expanded') === 'true'
    setOpen(false)
    if (restoreFocus && wasOpen) hamburger.focus({ preventScroll: true })
  }
  hamburger.addEventListener('click', () => setOpen(true), { signal })
  backdrop.addEventListener('click', () => close(true), { signal })
  closeButton.addEventListener('click', () => close(true), { signal })
  panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close(), { signal }))
  document.addEventListener('keydown', event => {
    if (hamburger.getAttribute('aria-expanded') !== 'true') return
    if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
    } else if (event.key === 'Tab') {
      const controls = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }, { signal })
  document.addEventListener('astro:before-preparation', () => close(), { signal })

  cleanup = () => {
    close()
    controller.abort()
    observer.disconnect()
  }
}

initNavigation()
document.addEventListener('astro:page-load', initNavigation)
document.addEventListener('astro:before-swap', () => {
  cleanup?.()
  cleanup = undefined
})
