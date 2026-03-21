import addressDataset from '@/lib/data/taiwan-addresses.json'

export type LessonMode = 'in_person' | 'online'

export interface AddressDistrict {
  name: string
  roads: string[]
}

export interface AddressCity {
  name: string
  districts: AddressDistrict[]
}

interface AddressDataset {
  generatedAt: string
  sourceYear: number
  totalRoads: number
  cities: AddressCity[]
}

const locale = 'zh-Hant-TW'

const lienchiangFallback: AddressCity = {
  name: '連江縣',
  districts: [
    { name: '南竿鄉', roads: [] },
    { name: '北竿鄉', roads: [] },
    { name: '莒光鄉', roads: [] },
    { name: '東引鄉', roads: [] },
  ],
}

const normalizeTaiwanText = (value: string) => value.replace(/台/g, '臺').trim()

const mergeCities = (cities: AddressCity[]) => {
  const cityMap = new Map<string, AddressCity>()

  for (const city of [...cities, lienchiangFallback]) {
    const normalizedCityName = normalizeTaiwanText(city.name)
    const existingCity = cityMap.get(normalizedCityName)

    if (!existingCity) {
      cityMap.set(normalizedCityName, {
        name: normalizedCityName,
        districts: city.districts.map((district) => ({
          name: district.name,
          roads: [...district.roads],
        })),
      })
      continue
    }

    const districtMap = new Map(existingCity.districts.map((district) => [district.name, new Set(district.roads)]))

    for (const district of city.districts) {
      const current = districtMap.get(district.name)
      if (!current) {
        districtMap.set(district.name, new Set(district.roads))
        continue
      }

      for (const road of district.roads) {
        current.add(road)
      }
    }

    existingCity.districts = [...districtMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b, locale))
      .map(([name, roads]) => ({
        name,
        roads: [...roads].sort((a, b) => a.localeCompare(b, locale)),
      }))
  }

  return [...cityMap.values()].sort((a, b) => a.name.localeCompare(b.name, locale))
}

const dataset = addressDataset as AddressDataset
const mergedCities = mergeCities(dataset.cities)

const roadLikePattern = /(路|街|大道|道|巷|弄|段)$|(.+[路街道巷弄段])/u

export const getAddressCities = () => mergedCities.map((city) => city.name)

export const getAddressDistricts = (cityName: string) => {
  const normalizedCityName = normalizeTaiwanText(cityName)
  const city = mergedCities.find((item) => item.name === normalizedCityName)
  return city ? city.districts.map((district) => district.name) : []
}

export const getDistrictRoads = (cityName: string, districtName: string) => {
  const normalizedCityName = normalizeTaiwanText(cityName)
  const city = mergedCities.find((item) => item.name === normalizedCityName)
  const district = city?.districts.find((item) => item.name === districtName)
  return district?.roads ?? []
}

export const suggestRoads = (cityName: string, districtName: string, query: string, limit = 12) => {
  const keyword = query.trim()
  if (!keyword) {
    return getDistrictRoads(cityName, districtName).slice(0, limit)
  }

  return getDistrictRoads(cityName, districtName)
    .filter((road) => road.includes(keyword))
    .slice(0, limit)
}

export const isRoadNameValid = (roadName: string) => roadLikePattern.test(roadName.trim())

export const buildLocationSummary = ({
  city,
  district,
  roadName,
  landmark,
  lessonMode,
  onlineDetail,
}: {
  city?: string | null
  district?: string | null
  roadName?: string | null
  landmark?: string | null
  lessonMode?: LessonMode | null
  onlineDetail?: string | null
}) => {
  if (lessonMode === 'online') {
    return onlineDetail?.trim() || '線上上課'
  }

  const parts = [city?.trim(), district?.trim(), roadName?.trim()].filter(Boolean)
  const base = parts.join('')
  const trimmedLandmark = landmark?.trim()

  if (!base) {
    return trimmedLandmark || ''
  }

  return trimmedLandmark ? `${base}，近${trimmedLandmark}` : base
}

export const getAddressDatasetSummary = () => ({
  generatedAt: dataset.generatedAt,
  sourceYear: dataset.sourceYear,
  cityCount: mergedCities.length,
  totalRoads: dataset.totalRoads,
})

export const isStructuredAddressComplete = ({
  lessonMode,
  city,
  district,
  roadName,
  onlineDetail,
}: {
  lessonMode: LessonMode
  city: string
  district: string
  roadName: string
  onlineDetail?: string
}) => {
  if (lessonMode === 'online') {
    return Boolean(onlineDetail?.trim())
  }

  return Boolean(city.trim() && district.trim() && roadName.trim() && isRoadNameValid(roadName))
}
