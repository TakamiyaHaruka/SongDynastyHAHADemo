import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import satori from 'satori'
import sharp from 'sharp'
import subsetFont from 'subset-font'
import { readFontFaces } from '../../integrations/site-fonts.mjs'

const require = createRequire(import.meta.url)
const OG_WIDTH = 1200
const OG_HEIGHT = 630
type Font = Parameters<typeof satori>[1]['fonts'][number]
type Face = ReturnType<typeof readFontFaces>[number]

// Read the locked, locally installed font package, never the host's font list.
const fontFaces: Promise<Face[]> = (async () => {
  const css = require.resolve('@fontsource-variable/noto-serif-sc/index.css')
  return readFontFaces(await readFile(css, 'utf8'), css)
})()
const fontBuffers = new Map<string, Promise<Buffer>>()

async function fontsFor(text: string): Promise<Font[]> {
  const characters = [...new Set(Array.from(text).filter(character => !/\s/u.test(character)))]
  const faces = await fontFaces
  const covers = (face: Face, character: string) => face.ranges.some(([start, end]: number[]) => {
    const point = character.codePointAt(0)!
    return point >= start && point <= end
  })
  const missing = characters.filter(character => !faces.some(face => covers(face, character)))
  if (missing.length) throw new Error(`分享图字体缺少字符：${missing.join('')}。请补充项目字体后重新构建。`)
  return Promise.all(faces.flatMap((face, index) => {
    if (!characters.some(character => covers(face, character))) return []
    let buffer = fontBuffers.get(face.source)
    if (!buffer) {
      // Satori 0.12 needs SFNT/WOFF. Pin the variable weight before outlining.
      buffer = readFile(face.source).then(input => subsetFont(input, undefined, {
        keepAllGlyphs: true, targetFormat: 'sfnt', variationAxes: { wght: 400 },
        preserveNameIds: [0, 13, 14],
      }))
      fontBuffers.set(face.source, buffer)
    }
    return [buffer.then(data => ({ name: `SongSerif${index}`, data, weight: 400 as const, style: 'normal' as const }))]
  }))
}

export async function generateOgSvg(title: string, subtitle?: string, description?: string): Promise<string> {
  const heading = '大宋王朝 ／ 宋代手札'
  const footer = '书画 · 茶事 · 园林 · 案头闲情'
  const subtitleText = subtitle || '翰墨丹青 · 四时清趣'
  const fonts = await fontsFor([heading, title, subtitleText, description, footer, '赵佶…'].join(' '))
  const text = (value: string, left: number, top: number, width: number, fontSize: number, color: string, lines = 1) => ({
    type: 'div', props: { children: value, style: {
      display: 'block', position: 'absolute', left, top, width, fontSize, color,
      lineHeight: 1.4, lineClamp: lines, overflow: 'hidden', textOverflow: 'ellipsis',
    } },
  })
  // Outline every glyph so sharp never resolves text through host Fontconfig.
  const outlinedText = await satori({
    type: 'div', props: {
      style: { display: 'flex', position: 'relative', width: OG_WIDTH, height: OG_HEIGHT, fontFamily: fonts.map(font => font.name).join(', '), fontWeight: 400 },
      children: [
        text(heading, 84, 77, 800, 20, '#a43f30'),
        text(subtitleText, 86, 145, 900, 19, '#716b60'),
        text(title, 84, 207, 920, 54, '#302f2a', 2),
        ...(description ? [text(description, 86, 391, 920, 23, '#716b60', 2)] : []),
        text('赵', 1053, 87, 30, 23, '#fff9ee'),
        text('佶', 1053, 115, 30, 23, '#fff9ee'),
        text(footer, 84, 541, 800, 18, '#716b60'),
      ],
    },
  }, { width: OG_WIDTH, height: OG_HEIGHT, fonts, embedFont: true })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
    <rect width="1200" height="630" fill="#faf7f2"/>
    <path d="M700 630L868 451L984 527L1096 408L1200 482V630Z" fill="#dfe2d6"/>
    <path d="M789 630L954 552L1040 578L1200 490V630Z" fill="#c7cfbd" opacity="0.7"/>
    <rect x="1034" y="77" width="62" height="76" fill="#a43f30"/>
    <rect x="1039" y="82" width="52" height="66" fill="none" stroke="#fff9ee"/>
    <path d="M84 527H720" stroke="#ded7ca"/>
    ${outlinedText}
  </svg>`
}

export async function generateOgImage(title: string, subtitle?: string, description?: string): Promise<Buffer> {
  return sharp(Buffer.from(await generateOgSvg(title, subtitle, description))).png().toBuffer()
}
