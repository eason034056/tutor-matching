export const metadata = {
  title: '家教與補習班之比較 | 青椒家教中心 | 最專業最快速的家教媒合平台',
  description: '了解家教與補習班之間的差異。我們提供最優質、最透明的家教媒合服務，讓您做出最佳選擇。',
  keywords: ['家教平台比較', '家教媒合平台', '家教平台推薦', '家教平台評價', '家教平台選擇', '家教', '找家教', '家教媒合', '家教怎麼找']
}

export default function ComparisonPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">與補習班比較</h1>
      
      {/* 比較表格 */}
      <div className="mb-12 overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-4 px-6 text-left w-1/4">比較項目</th>
              <th className="py-4 px-6 text-left w-2/5">補習班</th>
              <th className="py-4 px-6 text-left w-2/5">家教</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                item: "教學模式",
                cram: "集體教學，統一課程進度",
                tutor: "一對一個別教學"
              },
              {
                item: "學習進度",
                cram: "以班級為單位，按固定進度推進",
                tutor: "依學生需求調整，針對性輔導"
              },
              {
                item: "教學靈活性",
                cram: "教材與進度固定，缺乏彈性",
                tutor: "量身訂製課程與教材，具高度彈性"
              },
              {
                item: "環境干擾",
                cram: "學習環境容易受其他學生干擾",
                tutor: "提供專注且無干擾的學習環境"
              },
              {
                item: "學習效率",
                cram: "個別需求無法充分滿足，效率相對較低",
                tutor: "專注於個別需求，學習效率顯著提升"
              },
              {
                item: "費用效益",
                cram: "費用相對較低，但效果因人而異",
                tutor: "費用較高，但針對性教學效果更佳"
              }
            ].map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-4 px-6 border-b border-gray-200 font-medium">{row.item}</td>
                <td className="py-4 px-6 border-b border-gray-200">{row.cram}</td>
                <td className="py-4 px-6 border-b border-gray-200">{row.tutor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 說明文字 */}
      <div className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">為什麼家教的學習效果優於補習班？</h2>
        
        <div className="space-y-4">
          {[
            {
              title: "1. 個別化教學，針對性輔導",
              content: "家教的學習模式是一位教師專注輔導一位學生，能夠針對學生的學習進度與需求進行個別化教學。在學生不理解的地方，教師可以立即解釋與輔導，確保學習的連續性與效率。"
            },
            {
              title: "2. 學習計畫的靈活性",
              content: "家教能根據學生的學科弱點及學習目標，提供量身訂製的課程內容與教材，並靈活調整學習時間與進度，滿足學生的個性化需求，實現自由化的學習方式。"
            },
            {
              title: "3. 專注的學習環境",
              content: "家教提供一對一的專注教學環境，遠離補習班中可能出現的干擾因素，讓學生在舒適、安全的氛圍中學習，避免受到其他學生進度或行為的影響，有助於提升專注力和學習成效。"
            },
            {
              title: "4. 有效的學習時間投入",
              content: "家教模式下，學生的學習時間得以充分利用，每分鐘都集中於學生的需求點，與補習班中因統一進度可能浪費的學習時間相比，效果更顯著。"
            }
          ].map((item, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2 text-lg">{item.title}</h3>
              <p className="text-gray-700 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 