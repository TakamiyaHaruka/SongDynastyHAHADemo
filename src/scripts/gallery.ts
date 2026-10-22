export {}

let cleanup: (() => void) | undefined

function initGallery() {
  cleanup?.()
  cleanup = undefined
  const gallery = document.getElementById('gallery')
  const dialog = gallery?.querySelector<HTMLDialogElement>('#gallery-viewer')
  if (!gallery || !dialog) return
  const image = dialog.querySelector<HTMLImageElement>('[data-gallery-image]')
  const stage = dialog.querySelector<HTMLElement>('[data-gallery-stage]')
  const title = dialog.querySelector<HTMLElement>('[data-gallery-title]')
  const count = dialog.querySelector<HTMLElement>('[data-gallery-count]')
  const loading = dialog.querySelector<HTMLElement>('[data-gallery-loading]')
  const error = dialog.querySelector<HTMLElement>('[data-gallery-error]')
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-gallery-close]')
  const previous = dialog.querySelector<HTMLButtonElement>('[data-gallery-previous]')
  const next = dialog.querySelector<HTMLButtonElement>('[data-gallery-next]')
  const items = Array.from(gallery.querySelectorAll<HTMLButtonElement>('[data-gallery-open]')).flatMap(button => {
    const thumbnail = button.querySelector('img')
    return thumbnail ? [{ button, thumbnail }] : []
  })
  if (!image || !stage || !title || !count || !loading || !error || !closeButton || !previous || !next || !items.length) return

  const controller = new AbortController()
  const { signal } = controller
  let index = 0
  let opener: HTMLButtonElement | undefined
  let scrollLock: { overflow: string; gutter: string; x: number; y: number } | undefined
  let startedOutside = false

  const setImageState = (state: 'loading' | 'ready' | 'error') => {
    stage.setAttribute('aria-busy', String(state === 'loading'))
    stage.toggleAttribute('data-error', state === 'error')
    loading.hidden = state !== 'loading'
    error.hidden = state !== 'error'
  }
  const show = (position: number) => {
    index = (position + items.length) % items.length
    const { thumbnail } = items[index]
    title.textContent = thumbnail.alt
    count.textContent = `${index + 1} / ${items.length}`
    image.alt = thumbnail.alt
    image.width = thumbnail.width
    image.height = thumbnail.height
    setImageState('loading')
    image.src = thumbnail.currentSrc || thumbnail.src
    if (image.complete && image.naturalWidth > 0) setImageState('ready')
  }
  const finishClose = (restoreFocus = true) => {
    if (scrollLock) {
      const root = document.documentElement
      root.style.overflow = scrollLock.overflow
      root.style.scrollbarGutter = scrollLock.gutter
      if (window.scrollX !== scrollLock.x || window.scrollY !== scrollLock.y) {
        window.scrollTo({ left: scrollLock.x, top: scrollLock.y, behavior: 'instant' })
      }
      scrollLock = undefined
    }
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true })
    opener = undefined
    image.removeAttribute('src')
    setImageState('ready')
  }
  const close = (restoreFocus = true) => {
    if (dialog.open) dialog.close()
    finishClose(restoreFocus)
  }
  const open = (position: number) => {
    opener = items[position].button
    if (!dialog.open) {
      const root = document.documentElement
      scrollLock = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter, x: window.scrollX, y: window.scrollY }
      root.style.scrollbarGutter = 'stable'
      root.style.overflow = 'hidden'
      show(position)
      dialog.showModal()
    } else show(position)
  }

  items.forEach(({ button }, position) => button.addEventListener('click', () => open(position), { signal }))
  closeButton.addEventListener('click', () => close(), { signal })
  previous.addEventListener('click', () => show(index - 1), { signal })
  next.addEventListener('click', () => show(index + 1), { signal })
  image.addEventListener('load', () => { if (dialog.open) setImageState('ready') }, { signal })
  image.addEventListener('error', () => { if (dialog.open) setImageState('error') }, { signal })
  dialog.addEventListener('cancel', event => { event.preventDefault(); close() }, { signal })
  dialog.addEventListener('close', () => { if (!dialog.open) finishClose() }, { signal })

  const isOutside = (event: MouseEvent) => {
    const bounds = dialog.getBoundingClientRect()
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom
  }
  dialog.addEventListener('pointerdown', event => { startedOutside = event.target === dialog && isOutside(event) }, { signal })
  dialog.addEventListener('click', event => {
    if (startedOutside && event.target === dialog && isOutside(event)) close()
    startedOutside = false
  }, { signal })
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      show(index + (event.key === 'ArrowLeft' ? -1 : 1))
    } else if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === closeButton) {
        event.preventDefault()
        next.focus()
      } else if (!event.shiftKey && document.activeElement === next) {
        event.preventDefault()
        closeButton.focus()
      }
    }
  }, { signal })

  // Release scroll and the modal before Astro snapshots and swaps the page.
  document.addEventListener('astro:before-preparation', () => close(false), { signal })
  cleanup = () => {
    close(false)
    controller.abort()
  }
}

initGallery()
document.addEventListener('astro:page-load', initGallery)
document.addEventListener('astro:before-swap', () => {
  cleanup?.()
  cleanup = undefined
})
