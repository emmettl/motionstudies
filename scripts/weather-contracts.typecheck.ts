import { readWeatherField, sampleWeather, weatherFramePair, windFromDirection, cloudCoveragePixels } from '@motionstudies/core/domain/weather-field'
import { compileOpenMeteoWeather, compileWeatherRaster, packCloudCoverage } from '@motionstudies/data/weather'
import { createGridTexturePair, scalarGridPixels, WEATHER_SAMPLE_GLSL } from '@motionstudies/three/weather-textures'
import { decodeWeatherBytes, decodeWeatherField } from '@motionstudies/web/weather-assets'
export const weatherContracts = { readWeatherField, sampleWeather, weatherFramePair, windFromDirection, cloudCoveragePixels, compileOpenMeteoWeather, compileWeatherRaster, packCloudCoverage, createGridTexturePair, scalarGridPixels, WEATHER_SAMPLE_GLSL, decodeWeatherBytes, decodeWeatherField }
