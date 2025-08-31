export const metadata = {
  title: '家教老師接案流程 | 青椒老師家教中心 | 最專業最快速的家教媒合平台',
  description: '了解青椒老師家教中心的完整媒合流程。從刊登需求到成功媒合，我們提供專業、透明的家教媒合服務。',
  keywords: ['家教媒合流程', '家教媒合方式', '家教媒合說明', '家教媒合步驟', '家教媒合服務', '家教', '找家教', '家教媒合', '家教怎麼找']
}

export default function ProcessPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      
      {/* 接案流程 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 space-y-4">
        <h2 className="text-xl font-bold mb-4">接家教流程</h2>
        <div className="flex gap-4">
          <span className="font-bold">1.</span>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            <span>填寫<a href="/tutor-registration" className="text-blue-600 hover:underline">家教註冊表單</a></span>
          </p>
        </div>

        <div className="flex gap-4">
          <span className="font-bold">2.</span>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            等待身份審核，審核完畢後會收到email傳送教師編號(請記得您的教師編號)
          </p>
        </div>

        <div className="flex gap-4">
          <span className="font-bold">3.</span>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            在案件專區找尋想接的案件
          </p>
        </div>

        <div className="flex gap-4">
          <span className="font-bold">4.</span>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            點擊「應徵」按鈕後傳line給家教中心取得合約書以及同意書
          </p>
        </div>

        <div className="flex gap-4">
          <span className="font-bold">5.</span>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            聯繫家長並預約試教時間
          </p>
        </div>

        <div className="flex gap-4">
          <span className="font-bold">6.</span>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            取得家長聯絡資訊之後三天內要用line回報試教時間，否則案件會被重新開放應徵
          </p>
        </div>

        <div className="flex gap-4">
          <span className="font-bold">7.</span>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            試教完後記得利用email進行案件回報，回報需包含以下資訊：
            1. case編號
            2. 姓名
            3. 一星期上幾天
            4. 幾月幾日開課
            5. 星期幾上課
            6. 每次幾小時
            7. 時薪多少
            8. 有無特殊狀況
          </p>
        </div>

        <div className="flex gap-4">
          <span className="font-bold">8.</span>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            一個家教老師一次只能應徵一個案件，等一個案件回報完成後才能再接下一個
          </p>
        </div>
      </div>

      {/* 面談指南 */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-bold mb-4">面談指南（請務必攜帶身份證與學生證）</h2>
        {[
          {
            title: "準時到達",
            content: "時間觀念是家長對教師的第一印象，這直接影響您的專業評價。務必準時，因為一次遲到可能嚴重影響信任感。如果遇到不可抗力如突發狀況、交通延誤等，請提前通知並主動提出重新安排時間。"
          },
          {
            title: "衣著得體",
            content: "穿著應與應徵的家教類型相符：\n" +
            "• 幼兒家教：穿著年輕、活潑，符合孩子與家長的期待。\n" +
            "• 成人或專業科目家教：選擇專業且具時尚感的服飾，展現專業形象。\n" +
            "• 音樂家教：注重質感與氣質，穿著儀表要能凸顯藝術涵養。\n" +
            "切勿過於隆重或隨意，應在專業與親和之間取得平衡。"
          },
          {
            title: "準備完善的資料",
            content: "面談前應準備完整的履歷和相關教材，以備家長當場試教的需求。即使是經驗豐富的教師，攜帶一些特別的教具或小禮物（如趣味教材、學習工具）作為見面禮，不僅能展現用心，也有助於建立良好印象。"
          },
          {
            title: "展現專業形象",
            content: "在交談中融入科目的專業術語，展現教學深度與廣博的學識。平時應保持學術敏感度，熟悉相關教育理念（如108課綱、多元創意思考等），並善於以條理清晰的方式表達自己的專業能力。流利的口才與自信的形象是贏得家長認可的重要因素。"
          },
          {
            title: "爭取試教機會",
            content: "試教是展現實力的最佳時機。若面談順利，試教能進一步加強家長對您的信任；若面談表現稍顯不足，試教更是翻盤的最後機會。因此，務必以積極的態度爭取試教機會，並用心準備，確保教學表現脫穎而出。"
          }
        ].map((item, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">{index + 1}. {item.title}</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 