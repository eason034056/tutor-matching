import { Service, WithContext } from 'schema-dts'

export default function SchemaOrg() {
  const schema: WithContext<Service> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: '優學家教媒合',
    description: '由清華、交大畢業生創建的免費家教媒合平台，專注新竹台北地區家教媒合。提供一對一客製化教學，免費媒合優質家教老師。',
    url: 'https://tutor-matching.tw',
    provider: {
      '@type': 'Organization',
      name: '優學家教媒合',
      logo: 'https://tutor-matching.tw/logo.png',
      sameAs: ['https://www.facebook.com/優學家教媒合'],
      address: {
        '@type': 'PostalAddress',
        addressRegion: '新竹市',
        addressCountry: 'TW'
      }
    },
    areaServed: ['新竹市', '新竹縣', '台北市', '新北市'],
    offers: {
      '@type': 'Offer',
      description: '免費家教媒合服務',
      price: '0',
      priceCurrency: 'TWD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150'
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
} 