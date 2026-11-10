// An adoption baseline, not a claim that these are the latest registry versions.
export const stack = Object.freeze({
  nodeMajor: 24,
  packageManager: 'npm@11.21.1',
  dependencies: Object.freeze({
    '@motionstudies/core': '0.1.0-alpha.44',
    '@motionstudies/data': '0.1.0-alpha.44',
    '@motionstudies/three': '0.1.0-alpha.44',
    '@motionstudies/web': '0.1.0-alpha.44',
    '@react-three/fiber': '9.8.2',
    react: '19.3.1',
    'react-dom': '19.3.1',
    three: '0.186.1',
    '@axe-core/playwright': '4.14.0',
    '@playwright/test': '1.64.1',
    '@types/node': '24.19.2',
    '@types/react': '19.3.0',
    '@types/react-dom': '19.3.0',
    '@types/three': '0.186.0',
    '@vitejs/plugin-react': '6.1.2',
    oxlint: '1.88.0',
    typescript: '7.0.2',
    vite: '8.3.5',
    vitest: '5.0.5',
  }),
})

export function checkStack(manifest) {
  const failures = []
  if (manifest.packageManager && manifest.packageManager !== stack.packageManager) failures.push(`Expected packageManager ${stack.packageManager}`)
  for (const [name, version] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
    if (Object.hasOwn(stack.dependencies, name) && version !== stack.dependencies[name]) failures.push(`Expected ${name}@${stack.dependencies[name]}, found ${version}`)
  }
  return failures
}
