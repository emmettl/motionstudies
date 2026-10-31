import { readFile, writeFile } from 'node:fs/promises'
const path = process.argv[2] ?? '/tmp/motion-react-compiler/results.json'
const results = JSON.parse(await readFile(path, 'utf8'))
const median = values => {
  const ordered = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (!ordered.length) return null
  return (ordered[Math.floor((ordered.length - 1) / 2)] + ordered[Math.floor(ordered.length / 2)]) / 2
}
const rows = results.map(entry => {
  const variants = Object.fromEntries(Object.entries(entry.variants).map(([name, variant]) => {
    const samples = variant.samples.filter(s => !s.error && !s.errors.length)
    const phase = key => ({
      samples: samples.filter(s => s[key]).length,
      scriptMs: median(samples.map(s => s[key]?.scriptMs)),
      taskMs: median(samples.map(s => s[key]?.taskMs)),
      renders: median(samples.map(s => s[key]?.renders)),
      commits: median(samples.map(s => s[key]?.commits)),
      rendersPerCommit: median(samples.map(s => s[key]?.commits ? s[key].renders / s[key].commits : NaN)),
      frameP95Ms: median(samples.map(s => {
        const frames = s[key]?.frames.toSorted((a, b) => a - b)
        return frames?.[Math.floor(frames.length * .95)]
      })),
    })
    return [name, { buildMs: variant.buildMs, gzipBytes: variant.gzipBytes, errors: variant.samples.flatMap(s => s.error ? [s.error] : s.errors), playback: phase('playback'), seek: phase('seek') }]
  }))
  return { target: entry.target, variants }
})
await writeFile(path.replace(/\.json$/, '-summary.json'), JSON.stringify(rows, null, 2) + '\n')
for (const row of rows) {
  const b = row.variants.baseline, c = row.variants.compiler
  const percent = (a, b) => a && b ? `${((b / a - 1) * 100).toFixed(1)}%` : 'n/a'
  console.log(`${row.target}: playback CPU ${percent(b.playback.scriptMs, c.playback.scriptMs)}, seek CPU ${percent(b.seek.scriptMs, c.seek.scriptMs)}, seek renders ${b.seek.renders} → ${c.seek.renders}, gzip ${percent(b.gzipBytes, c.gzipBytes)}, errors ${b.errors.length}/${c.errors.length}`)
}
