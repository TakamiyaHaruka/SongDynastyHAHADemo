export {}

let cleanup: (() => void) | undefined

function initSwatches() {
  cleanup?.()
  const grid = document.querySelector('.color-grid')
  if (!grid) return
  const controller = new AbortController()
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>()
  const labels = new Map<HTMLElement, string>()

  grid.addEventListener('click', async event => {
    const swatch = event.target instanceof Element ? event.target.closest<HTMLElement>('.color-swatch') : null
    const hex = swatch?.dataset.hex
    const info = swatch?.querySelector<HTMLElement>('.color-hex')
    if (!hex || !info || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(hex)
      if (controller.signal.aborted) return
      if (!labels.has(info)) labels.set(info, info.textContent ?? hex)
      clearTimeout(timers.get(info))
      info.textContent = '已复制!'
      timers.set(info, setTimeout(() => {
        info.textContent = labels.get(info) ?? hex
        timers.delete(info)
      }, 1500))
    } catch {
      // Keep the original color visible when clipboard permission is unavailable.
    }
  }, { signal: controller.signal })

  cleanup = () => {
    controller.abort()
    timers.forEach(timer => clearTimeout(timer))
    labels.forEach((label, info) => { info.textContent = label })
  }
}

initSwatches()
document.addEventListener('astro:page-load', initSwatches)
document.addEventListener('astro:before-swap', () => {
  cleanup?.()
  cleanup = undefined
})
