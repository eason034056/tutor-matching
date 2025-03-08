import { Metadata } from 'next'
import TutorCasesClient from './client'

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: '全台家教案件 | 青椒家教中心 | 最專業最快速的家教媒合平台',
    description: '瀏覽最新家教案件，包含全台地區的國小、國中、高中各科目家教需求。優質家教案件，即時更新，快速媒合。',
    keywords: ['家教案件', '家教工作', '家教職缺', '家教', '找家教', '家教媒合', '家教怎麼找']
  }
}

export default function TutorCasesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-8">全台家教案件媒合 | 即時家教需求配對</h1>
      <TutorCasesClient />
    </>
  )
}
