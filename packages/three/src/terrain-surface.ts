import { BufferGeometry, Float32BufferAttribute, GLSL3, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector4, type Texture } from 'three'
import type { TerrainGrid } from '@motionstudies/core/terrain'

export interface TerrainTransform {
  metresPerUnit?: number
  verticalExaggeration?: number
  /** Subtracted before conversion to scene units. Does not alter source elevations. */
  elevationDatum?: number
}

function transform(options: TerrainTransform) {
  const scale = options.metresPerUnit ?? 1, exaggeration = options.verticalExaggeration ?? 1, datum = options.elevationDatum ?? 0
  if (![scale, exaggeration, datum].every(Number.isFinite) || scale <= 0 || exaggeration <= 0) throw new Error('Invalid terrain transform')
  return { scale, exaggeration, datum }
}

function checkGrid(grid: Pick<TerrainGrid, 'rows' | 'columns' | 'widthMetres' | 'depthMetres'>) {
  if (!Number.isInteger(grid.rows) || !Number.isInteger(grid.columns) || grid.rows < 2 || grid.columns < 2 || ![grid.widthMetres, grid.depthMetres].every(Number.isFinite) || grid.widthMetres <= 0 || grid.depthMetres <= 0) throw new Error('Invalid terrain surface grid')
}

/** Y-up, centred X/Z geometry. Row zero is the northern (negative Z) edge. */
export function createTerrainGeometry(grid: TerrainGrid, options: TerrainTransform = {}): BufferGeometry {
  checkGrid(grid)
  const { scale, exaggeration, datum } = transform(options)
  if (grid.elevations.length !== grid.rows * grid.columns) throw new Error('Terrain elevation count does not match grid')
  const vertices: number[] = [], indices: number[] = []
  for (let y = 0; y < grid.rows; y++) for (let x = 0; x < grid.columns; x++) {
    const height = grid.elevations[y * grid.columns + x]
    if (!Number.isFinite(height)) throw new Error('Invalid terrain elevation')
    vertices.push((x / (grid.columns - 1) - .5) * grid.widthMetres / scale, (height - datum) * exaggeration / scale, (y / (grid.rows - 1) - .5) * grid.depthMetres / scale)
    if (x < grid.columns - 1 && y < grid.rows - 1) { const i = y * grid.columns + x; indices.push(i, i + grid.columns, i + 1, i + 1, i + grid.columns, i + grid.columns + 1) }
  }
  const mesh = new BufferGeometry()
  mesh.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  mesh.setIndex(indices)
  mesh.computeVertexNormals()
  return mesh
}

const vertexShader = /* glsl */ `
uniform highp sampler2D uHeight;
uniform ivec2 uSize;
uniform vec4 uHeightChannel;
uniform vec2 uSpacing;
uniform float uScale;
uniform float uExaggeration;
uniform float uDatum;
uniform float uRowDirection;
out float vBed;
out vec3 vNormal_;
float heightAt(ivec2 p) { return dot(texelFetch(uHeight, clamp(p, ivec2(0), uSize - 1), 0), uHeightChannel); }
void main() {
  float row = uRowDirection > 0.0 ? 1.0 - uv.y : uv.y;
  ivec2 p = ivec2(round(vec2(uv.x, row) * vec2(uSize - 1)));
  float h = heightAt(p);
  float bx = (heightAt(p + ivec2(1, 0)) - heightAt(p - ivec2(1, 0))) / (p.x == 0 || p.x == uSize.x - 1 ? uSpacing.x : 2.0 * uSpacing.x);
  float bz = (heightAt(p + ivec2(0, 1)) - heightAt(p - ivec2(0, 1))) / (p.y == 0 || p.y == uSize.y - 1 ? uSpacing.y : 2.0 * uSpacing.y);
  vBed = h;
  vNormal_ = normalize(vec3(-bx * uExaggeration, 1.0, -bz * uExaggeration * uRowDirection));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, (h - uDatum) * uExaggeration / uScale, position.z, 1.0);
}`
const fragmentShader = /* glsl */ `
in float vBed;
in vec3 vNormal_;
out vec4 fragColor;
void main() {
  float light = 0.35 + 0.65 * max(dot(normalize(vNormal_), normalize(vec3(-0.4, 0.75, -0.5))), 0.0);
  fragColor = vec4(vec3(0.18, 0.23, 0.28) * light, 1.0);
}`

export interface HeightfieldSurfaceOptions extends TerrainTransform {
  /** Texture row zero is north; one texel per vertex. Default height channel is R. */
  channel?: 0 | 1 | 2 | 3
  /** Adapt texture orientation explicitly; defaults to north-to-south. */
  rowOrder?: 'north-to-south' | 'south-to-north'
  /** Optional GLSL3 fragment shader receiving vBed (metres) and vNormal_ (local Y-up). */
  fragmentShader?: string
  wireframe?: boolean
}

/** GPU height displacement with no readback, independent of any solver texture layout. */
export function createHeightfieldSurface(grid: Pick<TerrainGrid, 'rows' | 'columns' | 'widthMetres' | 'depthMetres'>, height: () => Texture, options: HeightfieldSurfaceOptions = {}) {
  checkGrid(grid)
  const { scale, exaggeration, datum } = transform(options)
  const channel = options.channel ?? 0
  if (![0, 1, 2, 3].includes(channel)) throw new Error('Invalid terrain height channel')
  const geometry = new PlaneGeometry(grid.widthMetres / scale, grid.depthMetres / scale, grid.columns - 1, grid.rows - 1)
  geometry.rotateX(-Math.PI / 2)
  const material = new ShaderMaterial({
    glslVersion: GLSL3, vertexShader, fragmentShader: options.fragmentShader ?? fragmentShader, wireframe: options.wireframe,
    uniforms: {
      uHeight: { value: height() }, uSize: { value: [grid.columns, grid.rows] },
      uHeightChannel: { value: new Vector4(...[0, 1, 2, 3].map(i => i === channel ? 1 : 0) as [number, number, number, number]) },
      uSpacing: { value: new Vector2(grid.widthMetres / (grid.columns - 1), grid.depthMetres / (grid.rows - 1)) },
      uScale: { value: scale }, uExaggeration: { value: exaggeration }, uDatum: { value: datum },
      uRowDirection: { value: options.rowOrder === 'south-to-north' ? -1 : 1 },
    },
  })
  const mesh = new Mesh(geometry, material)
  // The undisplaced plane cannot bound texture heights. Callers can supply bounds later.
  mesh.frustumCulled = false
  return { mesh, update: () => { material.uniforms.uHeight.value = height() }, dispose: () => { geometry.dispose(); material.dispose() } }
}
