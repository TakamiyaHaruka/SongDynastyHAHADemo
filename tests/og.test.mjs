import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import test from 'node:test'
import sharp from 'sharp'
import { generateOgImage, generateOgSvg } from '../src/utils/og.ts'

test('share images outline local Chinese fonts, rare glyphs and punctuation without system fonts', async () => {
  const svg = await generateOgSvg('龘·赵佶《山水》', '宋代手札', '“春山如笑”，书画与园林。ABC 123 & < >')
  assert.doesNotMatch(svg, /<text\b|font-family=|<foreignObject\b/)
  assert.match(svg, /<path\b[^>]*d=/)
  assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org)/)
  assert.notEqual(await generateOgSvg('龘'), await generateOgSvg('龖'))
  const png = await generateOgImage('龘·赵佶《山水》', '宋代手札', '“春山如笑”，书画与园林。ABC 123 & < >')
  const metadata = await sharp(png).metadata()
  assert.equal(metadata.width, 1200)
  assert.equal(metadata.height, 630)
  assert.equal(metadata.format, 'png')
  await mkdir('.cache/og-review', { recursive: true })
  await writeFile('.cache/og-review/chinese.png', png)
})

test('share images constrain long mixed titles and reject unavailable glyphs explicitly', async () => {
  const title = '宋代山水与园林 WWW ABC 123《书画雅集》'.repeat(8)
  const svg = await generateOgSvg(title, '御笔手札'.repeat(30), '山水画记。'.repeat(80))
  assert.doesNotMatch(svg, /<text\b/)
  const png = await generateOgImage(title, '御笔手札'.repeat(30), '山水画记。'.repeat(80))
  await mkdir('.cache/og-review', { recursive: true })
  await writeFile('.cache/og-review/long-title.png', png)
  await assert.rejects(generateOgImage('未收录字符𠀀'), /分享图字体缺少字符/)
})
