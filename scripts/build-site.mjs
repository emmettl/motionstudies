import { cp, mkdir, rm } from 'node:fs/promises'
await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })
for (const name of ['index.html', 'styles.css', 'motion.js', 'favicon.svg', 'social-card.png']) {
  await cp(name, `dist/${name}`)
}
await cp('lab/dist', 'dist/lab', { recursive: true })
console.log('Built catalogue and widget lab; package sources and tooling stay outside the site.')
