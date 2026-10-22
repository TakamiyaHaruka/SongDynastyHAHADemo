import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const script = readFileSync(new URL('../public/js/home-music-switcher.js', import.meta.url), 'utf8')

// Exercise the shipped click handlers with controllable media and timers.
// Playback time is advanced explicitly so these checks need no network or sound.
function createPlayer() {
  class Element {
    dataset = {}
    listeners = new Map()
    attributes = new Map()
    classes = new Set()
    style = { setProperty() {} }
    classList = {
      contains: (name) => this.classes.has(name),
      toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name),
    }

    addEventListener(name, handler, { signal } = {}) {
      this.listeners.set(name, handler)
      signal?.addEventListener('abort', () => this.listeners.delete(name), { once: true })
    }
    setAttribute(name, value) { this.attributes.set(name, value) }
    removeAttribute(name) { this.attributes.delete(name) }
    querySelector() { return null }
    querySelectorAll() { return [] }
    closest() { return this.parent }
    scrollIntoView() {}
    focus() {}
    click() { this.listeners.get('click')?.({ stopPropagation() {} }) }
    emit(name, event = {}) { this.listeners.get(name)?.(event) }
  }
  class Button extends Element {}
  class Image extends Element {}
  class Audio extends Element {
    paused = true
    currentTime = 0
    volume = 1
    playStarts = []

    set src(value) { this.source = value; this.currentTime = 0 }
    get src() { return this.source }
    async play() {
      this.playStarts.push(this.currentTime)
      if (this.playMode === 'reject') throw new Error('Preview unavailable')
      this.paused = false
      if (this.playMode === 'pending') await new Promise(resolve => { this.resolvePlay = resolve })
    }
    pause() { this.paused = true }
    removeAttribute() { this.source = '' }
    load() { this.currentTime = 0 }
  }

  const root = new Element()
  const buttons = [new Button(), new Button()]
  const selects = [new Button(), new Button()]
  const status = new Element()
  const original = new Element()
  const images = [new Image(), new Image()]
  images[0].src = 'https://example.test/cover-0.jpg'
  images[1].dataset = { src: 'https://example.test/cover-1.jpg', srcset: 'https://example.test/cover-1.jpg 180w' }
  const items = buttons.map((button, index) => {
    const item = new Element()
    item.dataset = { title: `Track ${index + 1}`, previewUrl: `https://example.test/${index}.m4a`, link: `https://music.apple.com/cn/song/example/${index}` }
    item.querySelector = (selector) => selector === '[data-music-play-toggle]' ? button
      : selector === '[data-music-select]' ? selects[index]
      : selector === '.home-music-item-artwork-img' ? images[index] : null
    button.parent = item
    selects[index].parent = item
    return item
  })
  items[0].classes.add('is-active')
  root.querySelectorAll = (selector) => selector === '[data-music-item]' ? items : buttons
  root.querySelector = (selector) => selector === '[data-music-status]' ? status : selector === '[data-music-original]' ? original : null

  const timers = new Map()
  const timeouts = new Map()
  let timerId = 0
  const window = {}
  const documentListeners = new Map()
  runInNewContext(script, {
    window,
    document: { querySelectorAll: () => [root], addEventListener(name, handler) { documentListeners.set(name, handler) } },
    HTMLElement: Element,
    HTMLButtonElement: Button,
    HTMLImageElement: Image,
    Audio,
    AbortController,
    setInterval(callback) { timers.set(++timerId, callback); return timerId },
    clearInterval(id) { timers.delete(id) },
    setTimeout(callback) { timeouts.set(++timerId, callback); return timerId },
    clearTimeout(id) { timeouts.delete(id) },
  })
  const [graph] = window.cynosura.homeMusicSwitcherLifecycle.audioGraphs

  return {
    audio: graph.audio,
    buttons,
    selects,
    status,
    original,
    items,
    images,
    root,
    graphs: window.cynosura.homeMusicSwitcherLifecycle.audioGraphs,
    leavePage() { documentListeners.get('astro:before-swap')() },
    loadPage() { documentListeners.get('astro:page-load')() },
    activeTimers: () => timers.size + timeouts.size,
    expire() { for (const callback of [...timeouts.values()]) callback() },
    async settle() {
      for (let tick = 0; tick < 100; tick++) {
        await Promise.resolve()
        for (const callback of [...timers.values()]) callback()
      }
    },
  }
}

test('pausing retains playback time and resumes from the same point', async () => {
  const player = createPlayer()
  player.buttons[0].click()
  await player.settle()
  player.audio.currentTime = 8.25
  player.buttons[0].click()
  await player.settle()
  assert.equal(player.audio.paused, true)
  assert.equal(player.audio.currentTime, 8.25)
  assert.equal(player.root.dataset.musicPlaying, 'false')
  assert.equal(player.buttons[0].attributes.get('aria-pressed'), 'false')

  player.buttons[0].click()
  await player.settle()
  assert.equal(player.audio.paused, false)
  assert.equal(player.audio.playStarts.at(-1), 8.25)
  assert.equal(player.buttons[0].attributes.get('aria-pressed'), 'true')
})

test('switching tracks resets time and starts the new preview', async () => {
  const player = createPlayer()
  player.buttons[0].click()
  await player.settle()
  player.audio.currentTime = 12
  player.buttons[1].click()
  await player.settle()
  assert.equal(player.audio.src, player.items[1].dataset.previewUrl)
  assert.equal(player.audio.playStarts.at(-1), 0)
  assert.equal(player.buttons[0].attributes.get('aria-pressed'), 'false')
  assert.equal(player.buttons[1].attributes.get('aria-pressed'), 'true')
})

test('clicking the selected row keeps its playback state', async () => {
  const player = createPlayer()
  player.buttons[0].click()
  await player.settle()
  player.audio.currentTime = 6
  player.selects[0].click()
  await player.settle()
  assert.equal(player.audio.paused, false)
  assert.equal(player.audio.currentTime, 6)
  assert.equal(player.buttons[0].attributes.get('aria-pressed'), 'true')
})

test('rapid pause and resume clicks finish without resetting or hanging', async () => {
  const player = createPlayer()
  player.buttons[0].click()
  await player.settle()
  player.audio.currentTime = 9
  player.buttons[0].click()
  player.buttons[0].click()
  player.buttons[0].click()
  player.buttons[0].click()
  await player.settle()
  assert.equal(player.audio.paused, false)
  assert.equal(player.audio.currentTime, 9)
  assert.equal(player.root.dataset.musicPlaying, 'true')
})

test('inactive covers load only when their row is selected', async () => {
  const player = createPlayer()
  assert.equal(player.images[1].src, undefined)
  player.selects[1].click()
  await player.settle()
  assert.equal(player.images[1].src, 'https://example.test/cover-1.jpg')
  assert.equal(player.images[1].srcset, 'https://example.test/cover-1.jpg 180w')
  assert.equal(player.images[1].loading, 'eager')
  assert.equal(player.selects[1].attributes.get('aria-pressed'), 'true')
  assert.equal(player.selects[0].attributes.get('aria-pressed'), 'false')
})

test('leaving during a fade releases audio and cancels queued playback', async () => {
  const player = createPlayer()
  player.buttons[0].click()
  await player.settle()
  player.buttons[1].click()
  player.buttons[0].click()
  for (let tick = 0; tick < 5; tick++) await Promise.resolve()
  assert.ok(player.activeTimers() > 0)
  player.leavePage()
  await player.settle()
  assert.equal(player.audio.paused, true)
  assert.equal(player.audio.src, '')
  assert.equal(player.activeTimers(), 0)
  assert.equal(player.graphs.size, 0)
  assert.equal(player.root.dataset.musicPlaying, 'false')
})

test('page-load does not bind a second player to the same container', async () => {
  const player = createPlayer()
  player.loadPage()
  player.loadPage()
  assert.equal(player.graphs.size, 1)
})

test('failed playback announces an error and the same button retries successfully', async () => {
  const player = createPlayer()
  player.audio.playMode = 'reject'
  player.buttons[0].click()
  await player.settle()
  assert.equal(player.root.dataset.musicState, 'error')
  assert.match(player.status.textContent, /加载失败/)
  assert.match(player.buttons[0].attributes.get('aria-label'), /^重试/)
  assert.equal(player.buttons[0].attributes.get('aria-pressed'), 'false')
  player.audio.playMode = 'normal'
  player.buttons[0].click()
  await player.settle()
  assert.equal(player.root.dataset.musicState, 'playing')
  assert.equal(player.buttons[0].attributes.get('aria-busy'), 'false')
})

test('pending playback can be cancelled without blocking subsequent selection', async () => {
  const player = createPlayer()
  player.audio.playMode = 'pending'
  player.buttons[0].click()
  await player.settle()
  assert.equal(player.root.dataset.musicState, 'loading')
  assert.match(player.buttons[0].attributes.get('aria-label'), /^取消加载/)
  player.buttons[0].click()
  await player.settle()
  assert.equal(player.root.dataset.musicState, 'paused')
  assert.equal(player.audio.paused, true)
  player.audio.playMode = 'normal'
  player.buttons[1].click()
  await player.settle()
  assert.equal(player.audio.src, player.items[1].dataset.previewUrl)
  assert.equal(player.root.dataset.musicState, 'playing')
})

test('changing selection interrupts a stalled request; unavailable tracks keep the original link', async () => {
  const player = createPlayer()
  player.audio.playMode = 'pending'
  player.buttons[0].click()
  await player.settle()
  player.items[1].dataset.previewUrl = ''
  player.selects[1].click()
  await player.settle()
  assert.equal(player.root.dataset.musicState, 'unavailable')
  assert.match(player.status.textContent, /暂无试听/)
  assert.equal(player.buttons[1].disabled, true)
  assert.equal(player.original.attributes.get('href'), player.items[1].dataset.link)
  assert.equal(player.audio.paused, true)
  assert.equal(player.activeTimers(), 0)
})

test('a preview timeout is visible and releases the playback queue', async () => {
  const player = createPlayer()
  player.audio.playMode = 'pending'
  player.buttons[0].click()
  await player.settle()
  player.expire()
  await player.settle()
  assert.equal(player.root.dataset.musicState, 'error')
  assert.equal(player.audio.paused, true)
  player.audio.playMode = 'normal'
  player.selects[1].click()
  await player.settle()
  assert.equal(player.root.dataset.musicState, 'idle')
})

test('buffering, ended, and media errors keep status and playback controls in sync', async () => {
  const player = createPlayer()
  player.buttons[0].click()
  await player.settle()
  player.audio.emit('waiting')
  assert.equal(player.root.dataset.musicState, 'loading')
  player.audio.emit('playing')
  assert.equal(player.root.dataset.musicState, 'playing')
  player.audio.emit('ended')
  assert.equal(player.root.dataset.musicState, 'ended')
  player.audio.emit('error')
  assert.equal(player.root.dataset.musicState, 'error')
  assert.equal(player.buttons[0].attributes.get('aria-pressed'), 'false')
  assert.equal(player.audio.paused, true)
})

test('leaving during a pending request detaches controls and prevents late playback', async () => {
  const player = createPlayer()
  player.audio.playMode = 'pending'
  player.buttons[0].click()
  await player.settle()
  player.leavePage()
  player.audio.resolvePlay()
  await player.settle()
  player.buttons[1].click()
  await player.settle()
  assert.equal(player.audio.paused, true)
  assert.equal(player.audio.src, '')
  assert.equal(player.graphs.size, 0)
  assert.equal(player.activeTimers(), 0)
})
