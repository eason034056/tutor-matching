import ConditionalHeader from '@/components/ConditionalHeader'
import ConditionalFooter from '@/components/ConditionalFooter'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '青椒老師家教中心 | 清大交大台大等國立大學家教',
  description: '由清華大學、交通大學畢業生創建的家教媒合平台。提供一對一客製化教學，免費媒合優質家教老師。快速配對、免仲介費、有保障、專業師資。',
  keywords: ['家教', '找家教', '一對一教學', '免費家教', 
    '清華大學家教', '交通大學家教', '台灣大學家教', '台師大家教', '家教媒合', '新竹家教',
    '國小家教', '國中家教', '高中家教', '數學家教', '英文家教', '理化家教', '國小伴讀', '國小全科', '國中全科', '高中全科', '國小數學', '國小英文', '國小理化', '國中數學', '國中英文', '國中理化', '高中數學', '高中英文', '高中理化'],
  authors: [{ name: '青椒老師家教中心' }],
  icons: {
    icon: [
      {
        url: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        url: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    shortcut: '/web-app-manifest-192x192.png',
    apple: '/web-app-manifest-192x192.png',
  },
  openGraph: {
    title: '青椒老師家教中心 | 清大交大台大等國立大學家教',
    description: '由清華大學、交通大學畢業生創建的家教媒合平台。提供一對一客製化教學，免費媒合優質家教老師。快速配對、免仲介費、有保障、專業師資。',
    url: 'https://tutor-matching.tw',
    siteName: '青椒老師家教中心',
    images: [
      {
        url: 'https://tutor-matching.tw/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: '青椒老師家教中心 - 免費家教媒合服務',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '青椒老師家教中心',
    description: '由清華大學、交通大學畢業生創建的家教媒合平台。提供一對一客製化教學，免費媒合優質家教老師。',
    images: ['https://tutor-matching.tw/web-app-manifest-512x512.png'],
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
    canonical: 'https://tutor-matching.tw/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="icon" type="image/png" sizes="192x192" href="/web-app-manifest-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/web-app-manifest-512x512.png" />
        <link rel="shortcut icon" type="image/png" href="/web-app-manifest-192x192.png" />
        <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
      </head>
      <body className={inter.className }>
        <ConditionalHeader />
        <main className="min-h-screen">
          {children}
        </main>
        <ConditionalFooter />
      </body>
    </html>
  )
}

