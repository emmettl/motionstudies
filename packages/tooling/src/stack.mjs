// An adoption baseline, not a claim that these are the latest registry versions.
export const stack = Object.freeze({
  nodeMajor: 26,
  packageManager: 'npm@12.2.2',
  dependencies: Object.freeze({
    '@motionstudies/core': '1.0.0',
    '@motionstudies/data': '1.0.0',
    '@motionstudies/three': '1.0.0',
    '@motionstudies/web': '1.0.0',
    '@react-three/fiber': '9.8.2',
    react: '19.3.1',
    'react-dom': '19.3.1',
    three: '0.187.0',
    '@axe-core/playwright': '4.14.0',
    '@playwright/test': '1.65.0',
    '@types/node': '26.6.6',
    '@types/react': '19.3.0',
    '@types/react-dom': '19.3.0',
    '@types/three': '0.187.0',
    '@vitejs/plugin-react': '6.3.0',
    oxlint: '1.93.0',
    oxfmt: '0.78.0',
    typescript: '7.0.2',
    vite: '8.3.7',
    vitest: '5.1.0',
  }),
})

export function checkStack(manifest) {
  const failures = []
  if (manifest.packageManager && manifest.packageManager !== stack.packageManager)
    failures.push(`Expected packageManager ${stack.packageManager}`)
  for (const [name, version] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })) {
    if (Object.hasOwn(stack.dependencies, name) && version !== stack.dependencies[name])
      failures.push(`Expected ${name}@${stack.dependencies[name]}, found ${version}`)
  }
  return failures
}
