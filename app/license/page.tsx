export const metadata = {
  title: '使用條款 | 青椒家教中心',
  description: '青椒家教中心使用條款與服務條件。請詳閱我們的使用規範，以保障您的權益。',
  keywords: ['家教使用條款', '家教服務條款', '家教平台規範', '家教媒合條款', '家教平台使用規則']
}

export default function LicensePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-center mb-8">使用條款 | 家教平台使用規範</h1>
      
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-700 leading-relaxed">
            1. 本中心依據就業服務法34條私立就服機構未經許可不得從事就業服務業務,本中心獲准通過,特此公告
            <br />
            <span className="font-semibold">高市就服字第004號</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-700 leading-relaxed">
            2. 經營業務項目: 依據就業服務法第35條第1項規定，本中心是仲介本國人在國內工作之就業服務業務
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-700 leading-relaxed">
            3. 本中心為政府立案,而非學校附屬家教中心
            <br />
            (根據法令規定學校內部不可成立家教中心),特此公告
          </p>
        </div>
      </div>
    </div>
  )
} 