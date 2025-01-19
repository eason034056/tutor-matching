import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/header'
import Footer from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '優學家教媒合 | 新竹台北地區免費家教媒合平台',
  description: '由清華、交大畢業生創建的免費家教媒合平台，專注新竹台北地區家教媒合。幫助家教老師以及家長輕鬆媒合，無須支付任何費用！提供一對一客製化教學服務。',
  keywords: ['家教', '家教媒合', '新竹家教', '台北家教', '一對一教學', '免費家教', '清華大學家教', '交通大學家教', '台灣大學家教', '台師大家教', '台師大家教', '清華大學家教', '交通大學家教', '台灣大學家教', '台師大家教', '台師大家教'],
  authors: [{ name: '優學家教媒合' }],
  openGraph: {
    title: '優學家教媒合 | 新竹台北地區免費家教媒合平台',
    description: '由清華、交大畢業生創建的免費家教媒合平台，專注新竹台北地區家教媒合。幫助家教老師以及家長輕鬆媒合，無須支付任何費用！',
    url: 'https://tutor-matching.tw',
    siteName: '優學家教媒合',
    images: [
      {
        url: '/cover.png',
        width: 600,
        height: 300,
        alt: '優學家教媒合封面圖',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
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
        <Header />
        <main className="min-h-screen p-4 md:p-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

