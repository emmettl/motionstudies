import { lazy, createElement, type ComponentType } from 'react'

const entry = (id: string, label: string, load: () => Promise<{ default: ComponentType }>, expectations: string[]) => ({ id, label, View: lazy(load), expectations })
const legacy = (name: 'ControlStudy' | 'DataStudy') => () => import('./LegacyStudies.tsx').then(m => ({ default: m[name] }))
export const studies = [
  entry('controls', 'Controls', legacy('ControlStudy'), ['Picker selection is controlled; Escape dismisses its menu and restores focus.', 'Two mounted specimens retain independent selections.']),
  entry('network', 'Network', () => import('./LegacyStudies.tsx').then(m => ({ default: () => createElement(m.RenderingStudy, { kind: 'Network' }) })), ['Paused changes redraw immediately.', 'Unmounting stops scene callbacks; remounting uses the current controls.']),
  entry('hub', 'Hub', () => import('./LegacyStudies.tsx').then(m => ({ default: () => createElement(m.RenderingStudy, { kind: 'Hub' }) })), ['Sparse and empty calls remain renderable.']),
  entry('airports', 'Airports', () => import('./AirportStudy.tsx').then(m => ({ default: m.AirportStudy })), ['Loading and error states expose no stale selectable flights.']),
  entry('data', 'Data', legacy('DataStudy'), ['Disabling or unmounting cancels requests and polling.', 'Changing sources cannot show a late response from the previous source.']),
  entry('now', 'Now', () => import('./NowStudy.tsx').then(m => ({ default: m.NowStudy })), ['Location remains opt-in.', 'Now follows wall time; this is explicitly a live-clock specimen.']),
  entry('bus-boards', 'Bus boards', () => import('./BusBoardStudy.tsx').then(m => ({ default: m.BusBoardStudy })), ['Empty and loading rows cannot retain stale selection targets.']),
  entry('transport-heroes', 'Transport heroes', () => import('./TransportHeroStudy.tsx').then(m => ({ default: m.TransportHeroStudy })), ['Long names remain readable within the component container.']),
  entry('vehicle-heroes', 'Vehicle heroes', () => import('./VehicleHeroStudy.tsx').then(m => ({ default: m.VehicleHeroStudy })), ['Reordered calls preserve selected stop identity; missing evidence remains missing.']),
  entry('panel-layout', 'Panel layout', () => import('./PanelLayoutStudy.tsx').then(m => ({ default: m.PanelLayoutStudy })), ['Evidence stays reachable in short containers and with enlarged text.']),
  entry('fields', 'Fields', () => import('./FieldStudy.tsx').then(m => ({ default: m.FieldStudy })), ['Unsupported estimates stay absent; zero remains measured evidence.']),
  entry('published-day', 'Published day', () => import('./PublishedDayStudy.tsx').then(m => ({ default: m.PublishedDayStudy })), ['Cell membership and vehicle details come from the selected local slice.']),
  entry('timeline', 'Timeline', () => import('./TimelineStudy.tsx').then(m => ({ default: m.TimelineStudy })), ['Keyboard and pointer seeking share one controlled time value.', 'Measured zero and missing activity render differently.']),
  entry('terrain', 'Terrain', () => import('./TerrainStudy.tsx').then(m => ({ default: m.TerrainStudy })), ['CPU and GPU surfaces agree across row adapters and texture swaps.', 'Surface disposal leaves caller textures owned by the consumer.']),
  entry('power-days', 'Power days', () => import('./PowerDayStudy.tsx').then(m => ({ default: m.PowerDayStudy })), ['Signed MWh, zero and missing quantities remain distinct.', 'Civil-day periods respect clock changes and exclusive end bounds.']),
  entry('network-policies', 'Network policies', () => import('./NetworkPolicyStudy.tsx').then(m => ({ default: m.NetworkPolicyStudy })), ['A dwelling vehicle stays at its junction throughout the morph.', 'Disabling authored viewport framing restores default projection.']),
  entry('weather', 'Weather', () => import('./WeatherStudy.tsx').then(m => ({ default: m.WeatherStudy })), ['Instant samples interpolate; interval means retain their support window.', 'Coverage ends exclusively; unsupported values remain absent.']),
  entry('power-weather', 'Power + weather', () => import('./PowerWeatherStudy.tsx').then(m => ({ default: m.PowerWeatherStudy })), ['Power and weather share an absolute UTC clock while retaining native support.', 'GPU pixels clear outside coverage; source rows and missing duration remain inspectable.']),
]
export function findStudy(id: string | null) { return studies.find(s => s.id === id) ?? studies[0] }
