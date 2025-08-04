import { FileText, Scale, Shield, Users, AlertTriangle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題區域 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full">
                <FileText className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">服務條款</h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              青椒老師家教中心網站服務條款與使用規範
            </p>
          </div>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* 生效日期提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-medium mb-2">生效日期：2025年8月</p>
              <p className="text-blue-700 text-sm leading-relaxed">
                青椒數位學習工作室（以下簡稱「本平台」、「平台方」、「我們」）歡迎您（以下可能指「使用者」、「教師會員」、「學生會員」、「家長」、「訪客」）使用由本平台提供的家教媒合服務系統、網站與相關功能。為保障雙方權益，確保法令遵循與交易秩序，請詳細閱讀以下條款內容，使用即表示您已閱讀、理解並接受本條款的所有約定。
              </p>
            </div>
          </div>
        </div>

        {/* 條款內容 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
          
          {/* 第一條 */}
          <section className="p-8">
            <div className="flex items-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-4">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">第一條【契約成立與適用對象】</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed ml-14">
              <p><strong>1.</strong> 本服務條款係平台方與所有使用者間所締結之定型化契約，對雙方具有法律拘束力。</p>
              <p><strong>2.</strong> 若使用者為未成年人，應由法定代理人閱讀並同意條款內容後始得註冊。</p>
              <p><strong>3.</strong> 本條款之最新版本將公布於平台首頁，並可能依實務運營需求不定期修改，修改後條款自公告日起生效，使用者持續使用視為同意。</p>
            </div>
          </section>

          {/* 第二條 */}
          <section className="p-8">
            <div className="flex items-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mr-4">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">第二條【平台角色說明與限制責任聲明】</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed ml-14">
              <p><strong>1.</strong> 本平台僅提供一數位化資訊媒合機制，包括但不限於教師履歷展示、學生需求刊登、雙方互動溝通工具，並不涉入授課契約之協商、簽署或履行行為。</p>
              <p><strong>2.</strong> 本平台非學校、非補習班，亦不構成任何形式之僱傭、承攬或代理關係。教師與學生間授課關係純屬私人契約，由雙方自行約定並承擔相關法律責任。</p>
              <p><strong>3.</strong> 使用本平台媒合成功之教學行為所衍生之任何民事、刑事或行政責任，概由雙方自行承擔，平台方不負擔連帶或替代責任。</p>
            </div>
          </section>

          {/* 第三條 */}
          <section className="p-8">
            <div className="flex items-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mr-4">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">第三條【會員帳號、資料保護與資訊真實性】</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed ml-14">
              <p><strong>1.</strong> 使用者於註冊時，應提供真實、完整且有效之資料，並應確保該資料於變更時即時更新。</p>
              <p><strong>2.</strong> 若平台方查證會員提供虛假資訊，或違反法令及本條款內容，有權單方面暫停、終止服務或刪除帳號而不另行通知，並保留法律追訴權利。</p>
              <p><strong>3.</strong> 所有會員資料均依據《個人資料保護法》及本平台「隱私政策」蒐集、處理與利用。</p>
            </div>
          </section>

          {/* 第四條 */}
          <section className="p-8">
            <div className="flex items-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mr-4">
                <Scale className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">第四條【教師媒合收費政策與費率約定】</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed ml-14">
              <div>
                <p className="mb-3"><strong>1.</strong> 教師會員於本平台成功媒合學生並開始授課後，應於媒合日起七日內依下列計算標準繳交一次性平台費：</p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 ml-6">
                  <ul className="space-y-2 text-sm">
                    <li><strong>(1)</strong> 前四週授課所得總額（不論課堂時數或堂數）之30%。</li>
                    <li><strong>(2)</strong> 若學生中途退課，平台費以實際授課週數所產生所得為基礎，按比例收取。</li>
                    <li><strong>(3)</strong> 所有費用均含稅並不得要求折扣、延期、分期或退費。</li>
                  </ul>
                </div>
              </div>
              <p><strong>2.</strong> 平台得開立發票、收據，並保有對收費結構、比例與繳費方式之調整權，惟應於修改前公告並通知教師會員。</p>
              <p><strong>3.</strong> 教師若有任何逃避繳費、私下重新簽約、於平台外另行媒合同一學生等行為，將視為重大違約，平台方有權立即停權。</p>
              <p><strong>4.</strong> 教師會員應配合平台提供一次免費試教機會予每位新媒合之學生，試教時間上限為一小時。該一小時之授課屬媒合體驗性質，教師不得就此向學生請求報酬，亦不得列入平台費用計算基礎。平台得視情況對試教安排提供建議，但不負責保證試教後一定媒合成功。教師若拒絕提供免費試教，平台有權不予進行該案媒合。</p>
            </div>
          </section>

          {/* 其他條款 */}
          <section className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">第五條【平台使用行為規範】</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p><strong>1.</strong> 所有使用者不得於平台內散播誹謗、騷擾、歧視、暴力、色情、詐騙或其他違法或不當內容。</p>
              <p><strong>2.</strong> 禁止以平台為手段從事與家教無關之商業行為，包含多層次傳銷、借貸廣告、其他平台招攬等。</p>
              <p><strong>3.</strong> 教師不得未經授權擅自使用學生聯絡資訊進行個人行銷，違者將依法追究。</p>
            </div>
          </section>

          <section className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">第六條【智慧財產權與內容授權】</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p><strong>1.</strong> 本平台之圖文內容、平台設計、演算法、介面、標誌等，皆屬青椒數位學習工作室所有，受《著作權法》、《商標法》及相關智慧財產權保護。</p>
              <p><strong>2.</strong> 教師於平台上上傳之個人履歷、影音簡介、教材片段等，視為授權平台於宣傳與媒合目的範圍內使用、改編、公開展示。</p>
            </div>
          </section>

          <section className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">第七條【契約終止與違約責任】</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p><strong>1.</strong> 使用者可隨時申請帳號刪除，但如有進行中之媒合案件，仍應履行平台費繳交與授課承諾。</p>
              <p><strong>2.</strong> 平台方如發現會員違反法令或本條款內容，有權於不經通知下停止其使用權，並保留法律訴追及損害賠償權利。</p>
              <p><strong>3.</strong> 如教師會員惡意違規（如私約逃避收費），平台方有權主張一次性違約金新台幣壹萬元以上，並得依法主張民刑事責任。</p>
            </div>
          </section>

          <section className="p-8 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">第八條【準據法與管轄法院】</h2>
            <div className="text-gray-700 leading-relaxed">
              <p>本條款之解釋與適用，以中華民國法令為準據法；如發生爭議，雙方同意以臺灣桃園地方法院為第一審管轄法院。</p>
            </div>
          </section>
        </div>

        {/* 底部聯絡資訊 */}
        <div className="mt-12 bg-gray-100 rounded-xl p-6 text-center">
          <p className="text-gray-600 text-sm">
            如對本服務條款有任何疑問，請聯絡青椒老師家教中心客服團隊
          </p>
        </div>
      </div>
    </div>
  )
} 