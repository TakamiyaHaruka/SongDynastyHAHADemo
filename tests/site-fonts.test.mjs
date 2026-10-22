import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import test from 'node:test'
import { parseUnicodeRanges, prepareFontAssets, readFontFaces, toUnicodeRange } from '../integrations/site-fonts.mjs'

const require=createRequire(import.meta.url)
const includes=(ranges,character)=>ranges.some(([start,end])=>character.codePointAt(0)>=start&&character.codePointAt(0)<=end)

test('Unicode ranges preserve supplementary characters and wildcard coverage',()=>{
  const text='AABC龘𠀀…'
  const ranges=parseUnicodeRanges(toUnicodeRange(text))
  for(const character of text)assert.ok(includes(ranges,character))
  assert.equal(includes(ranges,'Z'),false)
  assert.deepEqual(parseUnicodeRanges('U+4??, U+20000-20002'),[[0x400,0x4ff],[0x20000,0x20002]])
  assert.throws(()=>parseUnicodeRanges('not-a-range'))
})

test('font declarations retain family, weight, and source paths',()=>{
  const [face]=readFontFaces("@font-face { font-family: 'Example'; font-style: normal; font-weight: 200 900; src: url('./a.woff2'); unicode-range: U+4E00-9FFF; }",join(tmpdir(),'font','index.css'))
  assert.equal(face.family,'Example')
  assert.equal(face.weight,'200 900')
  assert.ok(face.source.endsWith(join('font','a.woff2')))
  assert.ok(includes(face.ranges,'宋'))
  assert.throws(()=>readFontFaces('@font-face { font-family: Example; }','bad.css'))
})

test('font assets regenerate for new article characters and reuse stable cached subsets',async()=>{
  const root=await mkdtemp(join(tmpdir(),'haruka-fonts-'))
  try{
    await mkdir(join(root,'src','content'),{recursive:true})
    const article=join(root,'src','content','article.md')
    await writeFile(article,'# 宋代手札\n赵佶 ABC')
    const options={sources:[require.resolve('@fontsource-variable/noto-serif-sc/index.css')]}
    const first=await prepareFontAssets(root,options)
    assert.ok(first.faces.length>0)
    assert.ok(first.bytes<first.originalBytes)
    const cssFile=join(root,'.cache','site-fonts','index.css')
    const css=await readFile(cssFile,'utf8')
    for(const face of first.faces){
      const buffer=await readFile(join(root,'.cache','site-fonts',face.file))
      assert.equal(buffer.subarray(0,4).toString(),'wOF2')
    }
    const unchanged=await prepareFontAssets(root,options)
    assert.equal(unchanged.changed,false)
    assert.equal(await readFile(cssFile,'utf8'),css)
    await writeFile(article,'# 宋代手札\n赵佶 ABC 龘')
    const updated=await prepareFontAssets(root,options)
    assert.equal(updated.changed,true)
    assert.ok(updated.characters.includes('龘'))
    assert.ok(updated.faces.some(face=>includes(parseUnicodeRanges(face.range),'龘')))
    assert.notEqual(await readFile(cssFile,'utf8'),css)
    // All references are relative assets, so deployment base paths stay valid.
    assert.ok((await readFile(cssFile,'utf8')).includes("url('./"))
  }finally{
    // root is the concrete, newly created test directory returned by mkdtemp.
    await rm(root,{recursive:true,force:true})
  }
})
