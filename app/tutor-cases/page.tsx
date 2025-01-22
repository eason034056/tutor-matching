import { Metadata } from 'next'
import TutorCasesClient from './client'

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: '新竹台北地區家教案件 | 優學家教媒合平台 | 最專業最快速的家教媒合平台',
    description: '瀏覽最新家教案件，包含新竹、台北地區的國小、國中、高中各科目家教需求。優質家教案件，即時更新，快速媒合。',
    keywords: ['家教案件', '家教工作', '家教職缺', '新竹家教', '新竹找家教', '台北家教', '台北找家教', '家教媒合', '家教怎麼找']
  }
}

export default function TutorCasesPage() {
  return <TutorCasesClient />
}
