import { LocalBusiness, WithContext } from 'schema-dts'

export default function SchemaOrg() {
  const schema: WithContext<LocalBusiness> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: '優學家教媒合',
    description: '由清華、交大畢業生創建的免費家教媒合平台，專注新竹台北地區家教媒合。提供一對一客製化教學，免費媒合優質家教老師。',
    url: 'https://tutor-matching.tw',
    image: 'https://tutor-matching.tw/public/logo.png',
    telephone: '+886-3-1234567',
    email: 'contact@tutor-matching.tw',
    address: {
      '@type': 'PostalAddress',
      addressRegion: '新竹市',
      addressCountry: 'TW'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '24.7961',
      longitude: '120.9967'
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: '24.7961',
        longitude: '120.9967'
      },
      geoRadius: '50000'
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
} 