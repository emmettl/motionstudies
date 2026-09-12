import type { RailDeparture, RailStationHeroCardProps } from '@motionstudies/web/components/RailStationHeroCard'

export const sbbDepartures: readonly RailDeparture[] = [
  { id: 'sbb-1', service: 'IC 1', serviceCategory: 'intercity', time: '09:02', destination: 'Genève-Aéroport', via: 'Bern · Fribourg/Freiburg · Lausanne', platform: '32', platformSector: 'ABCD' },
  { id: 'sbb-2', service: 'IR 13', serviceCategory: 'regional', time: '09:07', destination: 'Chur', via: 'St. Gallen · Sargans', platform: '10' },
  { id: 'sbb-3', service: 'S 12', serviceCategory: 'suburban', time: '09:09', destination: 'Schaffhausen', via: 'Winterthur', platform: '41', platformSector: 'AB' },
  { id: 'sbb-4', service: 'IC 8', serviceCategory: 'intercity', time: '09:16', destination: 'Brig', via: 'Bern · Thun · Spiez · Visp', platform: '31', expected: '+5 min', tone: 'warning' },
  { id: 'sbb-5', service: 'EC', serviceCategory: 'international', time: '09:33', destination: 'Milano Centrale', via: 'Zug · Arth-Goldau · Lugano', platform: '7' },
  { id: 'sbb-6', service: 'IR 36', serviceCategory: 'regional', time: '09:36', destination: 'Basel SBB', via: 'Baden · Brugg AG · Frick' },
]

export const sbbLabels = {
  de: { station: 'Bahnhof', departures: 'Abfahrt', service: 'Zug', time: 'Zeit', destination: 'Nach', platform: 'Gleis', via: 'via', loading: 'Abfahrten werden geladen…', empty: 'Keine Abfahrten in diesem Zeitraum.', retry: 'Erneut versuchen', detail: 'Information' },
  fr: { station: 'Gare', departures: 'Départ', service: 'Train', time: 'Heure', destination: 'Destination', platform: 'Voie', via: 'via', loading: 'Chargement des départs…', empty: 'Aucun départ dans cette période.', retry: 'Réessayer', detail: 'Informations' },
  it: { station: 'Stazione', departures: 'Partenza', service: 'Treno', time: 'Ora', destination: 'Destinazione', platform: 'Binario', via: 'via', loading: 'Caricamento delle partenze…', empty: 'Nessuna partenza in questo periodo.', retry: 'Riprova', detail: 'Informazioni' },
  en: { station: 'Rail station', departures: 'Departures', service: 'Train', time: 'Time', destination: 'Destination', platform: 'Platform', via: 'via', loading: 'Loading departures…', empty: 'No departures in this window.', retry: 'Retry', detail: 'Information' },
} satisfies Record<string, RailStationHeroCardProps['labels']>
