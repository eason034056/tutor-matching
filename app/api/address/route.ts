import { NextResponse } from 'next/server'

import { getAddressCities, getAddressDistricts, suggestRoads } from '@/lib/address-utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode')
  const city = searchParams.get('city') || ''
  const district = searchParams.get('district') || ''
  const query = searchParams.get('q') || ''

  switch (mode) {
    case 'districts':
      return NextResponse.json({ districts: getAddressDistricts(city) })
    case 'roads':
      return NextResponse.json({ roads: suggestRoads(city, district, query) })
    case 'cities':
    default:
      return NextResponse.json({ cities: getAddressCities() })
  }
}
