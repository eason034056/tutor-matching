import { Metadata } from 'next'
import TutorsClient from './client'

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: '新竹台北地區家教老師群 | 優學家教媒合平台 | 最專業最快速的家教媒合平台',
    description: '認識我們的優質家教老師，包含清大、交大、台大等頂尖大學在校生與畢業生。提供專業一對一教學服務，經驗豐富且教學認真。',
    keywords: ['家教老師', '優質家教', '大學生家教', '研究生家教', '新竹家教老師', '台北家教老師', '新竹家教', '新竹找家教', '台北家教', '台北找家教', '家教媒合', '家教怎麼找', '新竹找家教推薦', '台北找家教推薦']
  }
}

export default function TutorsPage() {
  return <TutorsClient />
}
