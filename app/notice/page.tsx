export const metadata = {
  title: '注意事項 | 優學家教媒合平台',
  description: '使用優學家教媒合平台前請詳閱注意事項。我們提供完整的平台使用說明，確保您的權益受到保障。',
  keywords: ['家教注意事項', '家教媒合須知', '家教服務說明', '家教平台規範', '家教媒合規則']
}

export default function NoticePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-4xl font-bold text-center mb-8">家教服務注意事項 | 權益保障與服務說明</h1>
      
      <div className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        {[
          "家教網嚴格遵守《個人資料保護法》的相關規定，承諾妥善保護您的個人資料，絕不外洩。",
          "為確保安全，建議家長核對教師的「學生證」及「身份證」以確認其真實身分。",
          "家教費用採「課程結束後支付」的模式，操作簡便且透明，為家長提供便利。",
          "家長完成登記後，家教網將於 24 小時內主動聯繫您，確保服務及時到位。",
          "根據家長的具體需求，家教網嚴選最符合條件的教師，以達到最佳匹配效果。",
          "為提升服務體驗，家教網提供免費 1 小時試教服務；若試教超過 1 小時，將另行計費，敬請諒解。",
          "家教網全年無休，隨時為家長提供專業協助，竭誠為您服務。", 
          "若試教後家長對教師不滿意，家教網將根據您的反饋，安排更適合的教師，務求滿足您的需求。"
        ].map((text, index) => (
          <p key={index} className="text-gray-700 leading-relaxed">
            {index + 1}. {text}
          </p>
        ))}
      </div>
    </div>
  )
} 