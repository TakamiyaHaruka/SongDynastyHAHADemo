// Color swatch click-to-copy
document.addEventListener('DOMContentLoaded', initSwatches)
document.addEventListener('astro:page-load', initSwatches)

function initSwatches() {
  document.querySelectorAll('.color-swatch').forEach((el) => {
    el.removeEventListener('click', handleClick)
    el.addEventListener('click', handleClick)
  })
}

function handleClick(e) {
  const el = e.currentTarget
  const hex = el.getAttribute('data-hex')
  if (!hex) return
  navigator.clipboard.writeText(hex).then(() => {
    const info = el.querySelector('.color-hex')
    if (info) {
      const orig = info.textContent
      info.textContent = 'Copied!'
      setTimeout(() => { info.textContent = orig }, 1500)
    }
  })
}
