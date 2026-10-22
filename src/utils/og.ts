import sharp from 'sharp'

const OG_WIDTH = 1200
const OG_HEIGHT = 630

function wrapText(text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = []
  let line = ''
  let width = 0
  for (const character of text) {
    const nextWidth = /[\u0000-\u007f]/.test(character) ? 0.6 : 1
    if (width + nextWidth > maxWidth && line) {
      lines.push(line)
      if (lines.length === maxLines) {
        lines[maxLines - 1] = Array.from(lines[maxLines - 1]).slice(0, -1).join('') + '…'
        return lines
      }
      line = ''
      width = 0
    }
    line += character
    width += nextWidth
  }
  if (line) lines.push(line)
  return lines
}

export async function generateOgImage(title: string, subtitle?: string, description?: string): Promise<Buffer> {
  const titleLines = wrapText(title, 17, 2)
  const descriptionLines = description ? wrapText(description, 39, 2) : []
  const titleBlock = titleLines.map((line, index) => `<text x="84" y="${258 + index * 78}" font-size="54" fill="#302f2a">${escapeXml(line)}</text>`).join('')
  const descriptionBlock = descriptionLines.map((line, index) => `<text x="86" y="${418 + index * 36}" font-size="23" fill="#716b60">${escapeXml(line)}</text>`).join('')
  const subtitleText = subtitle ? wrapText(subtitle, 40, 1)[0] : '翰墨丹青 · 四时清趣'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
    <rect width="1200" height="630" fill="#faf7f2"/>
    <path d="M700 630L868 451L984 527L1096 408L1200 482V630Z" fill="#dfe2d6"/>
    <path d="M789 630L954 552L1040 578L1200 490V630Z" fill="#c7cfbd" opacity="0.7"/>
    <g font-family="Noto Serif CJK SC, Noto Serif SC, serif">
      <text x="84" y="105" font-size="20" fill="#a43f30" letter-spacing="3">大宋王朝 ／ 宋代手札</text>
      <text x="86" y="174" font-size="19" fill="#716b60">${escapeXml(subtitleText)}</text>
      ${titleBlock}
      ${descriptionBlock}
      <rect x="1034" y="77" width="62" height="76" fill="#a43f30"/>
      <rect x="1039" y="82" width="52" height="66" fill="none" stroke="#fff9ee"/>
      <text x="1065" y="110" font-size="23" fill="#fff9ee" text-anchor="middle">赵</text>
      <text x="1065" y="138" font-size="23" fill="#fff9ee" text-anchor="middle">佶</text>
      <path d="M84 527H720" stroke="#ded7ca"/>
      <text x="84" y="566" font-size="18" fill="#716b60">书画 · 茶事 · 园林 · 案头闲情</text>
    </g>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
