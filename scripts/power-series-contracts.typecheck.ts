import { readPowerSeries, powerIntervalAt, powerSeriesAt, sumPowerSeriesAt, integratePowerSeries, type PowerSeriesDataset } from '@motionstudies/core/domain/power-series'
import { compilePowerSeries, type PowerColumn } from '@motionstudies/data/power-series'
export const areaPowerContracts={readPowerSeries,powerIntervalAt,powerSeriesAt,sumPowerSeriesAt,integratePowerSeries,compilePowerSeries}
export const powerColumnContract=(column:PowerColumn):PowerColumn=>column
export const powerDatasetContract=(dataset:PowerSeriesDataset)=>integratePowerSeries(dataset,dataset.series[0].id)
