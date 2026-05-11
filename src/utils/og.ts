import sharp from 'sharp'

const OG_WIDTH = 1200
const OG_HEIGHT = 630

export async function generateOgImage(
  title: string,
  subtitle?: string,
  description?: string,
): Promise<Buffer> {
  const truncatedTitle = title.length > 40 ? title.slice(0, 37) + '...' : title
  const truncatedDesc = description && description.length > 80 ? description.slice(0, 77) + '...' : description

  const subtitleBlock = subtitle
    ? `<text x="80" y="200" font-size="20" fill="rgba(255,255,255,0.75)" font-weight="600" letter-spacing="2">${escapeXml(subtitle)}</text>`
    : ''
  const descBlock = truncatedDesc
    ? `<text x="80" y="340" font-size="22" fill="rgba(255,255,255,0.65)">${escapeXml(truncatedDesc)}</text>`
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#c0392b"/>
      <stop offset="50%" style="stop-color:#e74c3c"/>
      <stop offset="100%" style="stop-color:#f39c12"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
  ${subtitleBlock}
  <text x="80" y="280" font-size="52" fill="white" font-weight="bold">${escapeXml(truncatedTitle)}</text>
  ${descBlock}
  <text x="80" y="${OG_HEIGHT - 50}" font-size="18" fill="rgba(255,255,255,0.5)" font-weight="600">宋徽宗</text>
</svg>`

  return sharp(Buffer.from(svg)).png().toBuffer()
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
