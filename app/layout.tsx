import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/header'
import Footer from '@/components/footer'
import SchemaOrg from '@/components/schema-org'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '優學家教媒合 | 新竹台北免費家教媒合平台 | 清大交大台大等國立大學家教',
  description: '由清華、交大畢業生創建的免費家教媒合平台，專注新竹台北地區家教媒合。提供一對一客製化教學，免費媒合優質家教老師。快速配對、免仲介費、有保障、專業師資。',
  keywords: ['家教', '家教媒合', '新竹家教', '新竹找家教', '台北找家教', '台北家教', '一對一教學', '免費家教', 
    '清華大學家教', '交通大學家教', '台灣大學家教', '台師大家教', '新竹補習', '台北補習', 
    '國小家教', '國中家教', '高中家教', '數學家教', '英文家教', '理化家教'],
  authors: [{ name: '優學家教媒合' }],
  openGraph: {
    title: '優學家教媒合 | 新竹台北免費家教媒合平台 | 清大交大台大等國立大學家教',
    description: '由清華、交大畢業生創建的免費家教媒合平台，專注新竹台北地區家教媒合。提供一對一客製化教學，免費媒合優質家教老師。快速配對、免仲介費、有保障、專業師資。',
    url: 'https://tutor-matching.tw',
    siteName: '優學家教媒合',
    images: [
      {
        url: 'https://tutor-matching.tw/cover.png',
        width: 600,
        height: 300,
        alt: '優學家教媒合平台 - 新竹台北地區免費家教媒合服務',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '優學家教媒合 | 新竹台北免費家教媒合平台',
    description: '由清華、交大畢業生創建的免費家教媒合平台，專注新竹台北地區家教媒合。提供一對一客製化教學，免費媒合優質家教老師。',
    images: ['https://tutor-matching.tw/cover.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '3XmDJwGHzAbasi6GpzAS4CnVNfeiQYgkzsqOOLX27oc',
  },
  alternates: {
    canonical: 'https://tutor-matching.tw',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <SchemaOrg />
        <Header />
        <main className="min-h-screen p-4 md:p-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

