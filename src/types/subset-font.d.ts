declare module 'subset-font' {
  export default function subsetFont(input: Buffer, text: string | undefined, options: {
    targetFormat: 'sfnt' | 'woff' | 'woff2'
    keepAllGlyphs?: boolean
    variationAxes?: Record<string, number>
    preserveNameIds?: number[]
  }): Promise<Buffer>
}
