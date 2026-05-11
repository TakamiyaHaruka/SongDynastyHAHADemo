// Show skeleton shimmer during slow page transitions
let skeletonTimer = null

document.addEventListener('astro:before-preparation', () => {
  skeletonTimer = setTimeout(() => {
    const main = document.querySelector('main')
    if (main) {
      main.style.opacity = '0.3'
      main.style.transition = 'opacity 0.2s ease'
    }
  }, 280)
})

document.addEventListener('astro:page-load', () => {
  if (skeletonTimer) {
    clearTimeout(skeletonTimer)
    skeletonTimer = null
  }
  const main = document.querySelector('main')
  if (main) {
    main.style.opacity = ''
    main.style.transition = ''
  }
})
