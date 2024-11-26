export default function NoticePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">注意事項</h1>
      
      <div className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        {[
          "本公司遵守《個人資料保護法》的相關規定，確保您的個人資料絕不外洩，謹此聲明。",
          "為保障安全，本中心建議家長先行查驗教師的「學生證」及「身份證」以確認其身分。",
          "家教費用採取「每次課程結束後支付」的原則，便利且透明。",
          "本中心師資力量雄厚，涵蓋全國各大專院校優秀教師，為您提供專業服務。",
          "家長完成登記後，本中心將於 24 小時內主動與您聯繫，確保服務迅速。",
          "本中心依據家長的具體需求，精心挑選最適合的教師，務求匹配度最佳。",
          "為提升體驗，本中心提供免費試教 1 小時服務；若超過 1 小時，將另行計費，敬請見諒。",
          "本中心全年無休，隨時為家長提供協助，竭誠服務。",
          "如試教後不滿意，本中心將根據您的意見，安排更合適的教師，確保您的需求獲得滿足。"
        ].map((text, index) => (
          <p key={index} className="text-gray-700 leading-relaxed">
            {index + 1}. {text}
          </p>
        ))}
      </div>
    </div>
  )
} 