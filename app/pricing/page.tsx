export const metadata = {
  title: '家教費用參考表 | 青椒老師家教中心 | 最專業最快速的家教媒合平台',
  description: '家教費用因教學地區及家教老師的教學經驗而有所不同薪資差距，以下為大致的薪資表格：本平台提供最專業最快速的家教媒合服務，讓您輕鬆找到理想的家教。',
  keywords: ['家教收費', '家教費用', '家教價格', '家教薪資', '家教媒合費用', '家教', '找家教', '家教媒合', '家教怎麼找']
}

export default function PricingPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <p className="text-gray-700 leading-relaxed">
          家教費用因教學地區及家教老師的教學經驗而有所不同薪資差距，以下為大致的薪資表格：
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-4 px-6 text-left">教學對象或師資</th>
              <th className="py-4 px-6 text-left">1年以下</th>
              <th className="py-4 px-6 text-left">1-2年</th>
              <th className="py-4 px-6 text-left">2年以上</th>
            </tr>
          </thead>
          <tbody>
            {[
              { subject: "國小伴讀", base: 300, mid: 500, high: 800 },
              { subject: "國小全科", base: 350, mid: 550, high: 850 },
              { subject: "國一 (國中一年級)", base: 400, mid: 600, high: 900 },
              { subject: "國二 (國中二年級)", base: 450, mid: 650, high: 950 },
              { subject: "國三 (國中三年級)", base: 500, mid: 700, high: 1000 },
              { subject: "高一 (高中一年級)", base: 550, mid: 750, high: 1050 },
              { subject: "高二 (高中二年級)", base: 600, mid: 800, high: 1100 },
              { subject: "高三 (高中三年級)", base: 650, mid: 850, high: 1150 },
              { subject: "兒童美語", base: 500, mid: 700, high: 1000 },
              { subject: "日文或韓文", base: 600, mid: 800, high: 1100 },
              { subject: "成人美語", base: 600, mid: 800, high: 1100 },
              { subject: "電腦", base: 600, mid: 800, high: 1100 },
              { subject: "鋼琴", base: 600, mid: 800, high: 1100 },
              { subject: "大學或二技專業", base: 800, mid: 1000, high: 1300 },
              { subject: "小提琴或大提琴", base: 800, mid: 1000, high: 1300 },
              { subject: "其它音樂項目", base: 600, mid: 800, high: 1100 },
              { subject: "運動及其它技藝", base: 600, mid: 800, high: 1100 }
            ].map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-4 px-6 border-b border-gray-200 font-medium">{row.subject}</td>
                <td className="py-4 px-6 border-b border-gray-200">{row.base} /hr</td>
                <td className="py-4 px-6 border-b border-gray-200">{row.mid} /hr</td>
                <td className="py-4 px-6 border-b border-gray-200">{row.high} /hr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">注意事項：</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>以上費用僅供參考，實際費用可能因地區、教師資歷、課程難度等因素而有所調整</li>
          <li>特殊科目或進階課程可能會有額外的費用調整</li>
          <li>建議在與家教老師面談時，詳細討論課程內容與收費標準</li>
        </ul>
      </div>
    </div>
  )
} 