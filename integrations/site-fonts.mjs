import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import subsetFont from 'subset-font'

const require = createRequire(import.meta.url)
const fontSources = [
  require.resolve('@fontsource-variable/inter/wght.css'),
  require.resolve('@fontsource-variable/noto-serif-sc/index.css'),
]
const textExtensions = new Set(['.astro', '.css', '.js', '.mjs', '.ts', '.md', '.mdx', '.json', '.svg'])
const optimizerVersion = `site-fonts-v1/subset-font-${require('subset-font/package.json').version}`
const hash = value => createHash('sha256').update(value).digest('hex')

export function parseUnicodeRanges(value) {
  return value.split(',').map(part => {
    const match = part.trim().match(/^U\+([\da-f?]+)(?:-([\da-f]+))?$/i)
    if (!match) throw new Error(`Invalid font Unicode range: ${part}`)
    return [parseInt(match[1].replaceAll('?', '0'), 16), parseInt(match[2] ?? match[1].replaceAll('?', 'F'), 16)]
  })
}

export function toUnicodeRange(characters) {
  const points = [...new Set(Array.from(characters, character => character.codePointAt(0)))].sort((a, b) => a - b)
  const groups = []
  for (const point of points) {
    const last = groups.at(-1)
    if (last && last[1] + 1 === point) last[1] = point
    else groups.push([point, point])
  }
  return groups.map(([start, end]) => `U+${start.toString(16)}${end === start ? '' : `-${end.toString(16)}`}`).join(',')
}

export function readFontFaces(css, file) {
  return [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(([, body]) => {
    const property = name => body.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim()
    const source = body.match(/url\(['"]?([^'"\)]+)['"]?\)/)?.[1]
    const family = property('font-family')?.replace(/^['"]|['"]$/g, '')
    if (!family || !source || !property('unicode-range')) throw new Error(`Unsupported font declaration in ${file}`)
    return { family, source: resolve(dirname(file), source), weight: property('font-weight'), style: property('font-style'), ranges: parseUnicodeRanges(property('unicode-range')) }
  })
}

async function sourceText(directory) {
  const files = []
  let entries
  try { entries = await readdir(directory, { withFileTypes: true }) }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) files.push(await sourceText(file))
    else if (textExtensions.has(extname(file))) files.push(await readFile(file, 'utf8'))
  }
  return files.join('\n')
}

async function writeIfChanged(file, value) {
  try { if ((await readFile(file, 'utf8')) === value) return false }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, value)
  await rename(temporary, file)
  return true
}

export async function prepareFontAssets(root, options = {}) {
  const output = join(root, '.cache', 'site-fonts')
  await mkdir(output, { recursive: true })
  let metadata = ''
  try { metadata = await readFile(join(root, '.cache', 'music-metadata.json'), 'utf8') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  // Include runtime copy and source text so newly added articles and labels are
  // covered automatically. Printable ASCII also covers dates and numeric counts.
  const ascii = Array.from({ length: 95 }, (_, index) => String.fromCodePoint(index + 32)).join('')
  const characters = [...new Set(Array.from(ascii + '…·—–‘’“”《》「」【】（）！？：；，。、←→↑↓↗＋−×©' + metadata + (options.extraText ?? '') + await sourceText(join(root, 'src')) + await sourceText(join(root, 'public', 'js'))))]
    .filter(character => character.codePointAt(0) >= 32)
    .sort((a, b) => a.codePointAt(0) - b.codePointAt(0))
  const faces = []
  for (const file of options.sources ?? fontSources) faces.push(...readFontFaces(await readFile(file, 'utf8'), file))
  const generated = []
  const rules = ['/*! Site-specific font subsets. OFL licenses: public/fonts/. */']
  for (const face of faces) {
    const text = characters.filter(character => {
      const point = character.codePointAt(0)
      return face.ranges.some(([start, end]) => point >= start && point <= end)
    }).join('')
    if (!text) continue
    const input = await readFile(face.source)
    const id = hash(Buffer.concat([Buffer.from(optimizerVersion + text), input])).slice(0, 16)
    const file = `${face.family.toLowerCase().replaceAll(' ', '-')}-${id}.woff2`
    const target = join(output, file)
    let bytes
    try {
      const cached = await readFile(target)
      if (cached.subarray(0, 4).toString() === 'wOF2') bytes = cached.length
    } catch (error) { if (error.code !== 'ENOENT') throw error }
    if (!bytes) {
      const subset = await subsetFont(input, text, { targetFormat: 'woff2', preserveNameIds: [0, 13, 14] })
      await writeFile(target, subset)
      bytes = subset.length
    }
    const range = toUnicodeRange(text)
    rules.push(`@font-face { font-family: '${face.family}'; font-style: ${face.style}; font-weight: ${face.weight}; font-display: swap; src: url('./${file}') format('woff2'); unicode-range: ${range}; }`)
    generated.push({ family: face.family, file, range, characters: Array.from(text).length, originalBytes: input.length, bytes })
  }
  if (!generated.length) throw new Error('No usable site font subsets were generated')
  const manifest = { version: optimizerVersion, characters: characters.join(''), faces: generated, originalBytes: generated.reduce((total, face) => total + face.originalBytes, 0), bytes: generated.reduce((total, face) => total + face.bytes, 0) }
  const changed = await writeIfChanged(join(output, 'index.css'), rules.join('\n') + '\n')
  await writeIfChanged(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  return { ...manifest, changed }
}

export async function prepareSiteAssets(root, options = {}) {
  const metadata = await options.prepareMetadata?.(root)
  return prepareFontAssets(root, { ...options, extraText: metadata ? JSON.stringify(metadata) : '' })
}

/**
 * @param {{ prepareMetadata?: (root: string) => Promise<unknown> }} options
 * @returns {import('astro').AstroIntegration}
 */
export default function siteFonts(options = {}) {
  let root
  let timer
  let pending = Promise.resolve()
  return {
    name: 'site-fonts',
    hooks: {
      'astro:config:setup': async ({ config, command, logger }) => {
        root = fileURLToPath(config.root)
        if (command === 'preview') return
        const result = await prepareSiteAssets(root, options)
        logger.info(`${result.faces.length} font subsets: ${(result.bytes / 1024).toFixed(0)} KiB (source ${(result.originalBytes / 1024).toFixed(0)} KiB)`)
      },
      'astro:server:setup': ({ server, logger }) => {
        server.watcher.add(join(root, '.cache', 'music-metadata.json'))
        const onChange = (event, file) => {
          if (!['add', 'change', 'unlink'].includes(event)) return
          const path = relative(root, resolve(file))
          if (!(path.startsWith(`src${sep}`) && textExtensions.has(extname(file))) && path !== join('.cache', 'music-metadata.json') && !path.startsWith(join('public', 'js') + sep)) return
          clearTimeout(timer)
          timer = setTimeout(() => {
            pending = pending.then(async () => {
              const result = await prepareSiteAssets(root, options)
              if (result.changed) server.ws.send({ type: 'full-reload' })
            }).catch(error => logger.error(`Font subsets could not be refreshed: ${error.message}`))
          }, 200)
        }
        server.watcher.on('all', onChange)
        server.httpServer?.once('close', () => { clearTimeout(timer); server.watcher.off('all', onChange) })
      },
    },
  }
}
