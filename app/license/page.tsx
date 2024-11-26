export default function LicensePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">政府立案證明</h1>
      
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