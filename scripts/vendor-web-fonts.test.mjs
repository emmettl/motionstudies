import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { checkVendoredFonts, parseGoogleFaces, renderStylesheet, stylesheet } from './vendor-web-fonts.mjs'

const face = (subset, family, weight, file, range = 'U+0000-00FF') => `/* ${subset} */
@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/${file}.woff2) format('woff2');
  unicode-range: ${range};
}`

describe('vendored web fonts', () => {
  it('merges weights served by one variable file and keeps static weights apart', () => {
    const faces = parseGoogleFaces([
      face('latin', 'DM Mono', 300, 'dmmono/light'),
      face('latin', 'DM Mono', 400, 'dmmono/regular'),
      face('latin', 'Inter', 400, 'inter/latin'),
      face('latin', 'Inter', 600, 'inter/latin'),
      face('latin', 'Inter', 500, 'inter/latin'),
    ].join('\n'))
    expect(faces.map(({ file, weight }) => [file, weight])).toEqual([
      ['dm-mono-latin-300.woff2', '300'],
      ['dm-mono-latin-400.woff2', '400'],
      ['inter-latin-400-600.woff2', '400 600'],
    ])
    expect(renderStylesheet(faces)).toContain("src: url('./fonts/inter-latin-400-600.woff2') format('woff2');")
  })

  it('rejects faces it cannot license or reproduce', () => {
    expect(() => parseGoogleFaces(face('latin', 'Roboto', 400, 'roboto/latin'))).toThrow('No licence recorded for Roboto')
    expect(() => parseGoogleFaces([face('latin', 'Inter', 400, 'inter/shared'), face('latin-ext', 'Inter', 500, 'inter/shared', 'U+0100-02BA')].join('\n'))).toThrow('One file serves different faces')
    expect(() => parseGoogleFaces('')).toThrow('Google Fonts returned no WOFF2 faces')
  })

  it('ships files matching their manifest, licences and the families the shared CSS names', async () => {
    expect(await checkVendoredFonts()).toEqual([])
    const css = await readFile(stylesheet, 'utf8')
    const rules = css.split('@font-face').slice(1)
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      expect(rule).toContain('font-display: swap;')
      expect(rule).toMatch(/src: url\('\.\/fonts\/[a-z0-9-]+\.woff2'\) format\('woff2'\);/)
      expect(rule).toMatch(/unicode-range: U\+/)
    }
    const weights = (family) => new Set(rules.filter((rule) => rule.includes(`font-family: '${family}'`)).map((rule) => rule.match(/font-weight: ([^;]+);/)[1]))
    expect(weights('DM Mono')).toEqual(new Set(['300', '400', '500']))
    expect(weights('Inter')).toEqual(new Set(['400 600']))
    expect(css).not.toContain('googleapis')
  })
})
