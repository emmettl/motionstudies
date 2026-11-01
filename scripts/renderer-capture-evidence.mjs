import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { createHash } from 'node:crypto'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const bytes = async attachment => attachment.body !== undefined ? Buffer.from(attachment.body, 'base64') : readFile(attachment.path)

/** Extract each capture from its own successful strict-native test and report.
 * Equal pixels are permitted: this unlit, antialias:false fixture targets parity.
 * Backend identity comes from its paired runtime report, never the image hash. */
export async function writeRendererCaptures(rows, output, nativeReportSha256) {
  const captures = []
  const prefix = basename(output).replace(/(?:-validation)?\.json$/, '')
  for (const backend of ['legacy', 'webgl2', 'webgpu']) {
    const row = rows.find(row => row.status === 'passed' && row.project === 'desktop-chromium' && row.attachments.some(a => a.name === `${backend}-scene`))
    const image = row?.attachments.find(a => a.name === `${backend}-scene`)
    const paired = row?.attachments.find(a => a.name === `${backend}-report`)
    if (!image || !paired) throw Error(`Missing paired ${backend} capture/report`)
    const reportBytes = await bytes(paired), report = JSON.parse(reportBytes.toString('utf8'))
    if (report.backend !== backend || !report.pass || !report.frames?.some(frame => frame.visible && frame.energy > 0)) throw Error(`Capture ${backend} has no matching successful rendered-backend report`)
    const png = await bytes(image)
    if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || png.length < 33) throw Error(`Invalid ${backend} PNG`)
    const file = `${prefix}-${backend}-scene.png`, width = png.readUInt32BE(16), height = png.readUInt32BE(20)
    if (!width || !height) throw Error(`Empty ${backend} PNG`)
    await writeFile(join(dirname(output), file), png)
    captures.push({ backend, file, sha256: sha256(png), bytes: png.length, width, height,
      source: { nativeReportSha256, case: row.key, attachment: image.name, pairedReportSha256: sha256(reportBytes), generation: report.generation } })
  }
  const duplicateGroups = [...new Set(captures.map(c => c.sha256))].map(hash => captures.filter(c => c.sha256 === hash).map(c => c.backend)).filter(group => group.length > 1)
  return { captures, duplicateGroups, comparison: 'Automated footprint, tile and halo-energy gates; independently sourced captures may be pixel-identical. Hashes identify artifacts, not renderer identity.', visualReview: { status: 'pending', scope: 'Author review and physical-device acceptance are not attested by this recorder.' } }
}
