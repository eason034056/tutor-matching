import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-16">
      <div className="container px-6 mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              青椒老師家教中心
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md">
              由清華大學、交通大學畢業生創建的家教平台，致力於為每個孩子找到最適合的學習夥伴。
            </p>
            <div className="flex space-x-4">
              <Link href="/case-upload" className="bg-brand-500 text-white px-6 py-3 rounded-full hover:bg-brand-600 transition-colors">
                立即諮詢
              </Link>
              <Link href="/solver" className="border border-brand-300 text-brand-700 px-6 py-3 rounded-full hover:bg-brand-50 transition-colors">
                AI解題
              </Link>
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="text-lg font-medium text-neutral-900 mb-4">服務</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/tutor-cases" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  案件專區
                </Link>
              </li>
              <li>
                <Link href="/tutors" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  家教老師
                </Link>
              </li>
              <li>
                <Link href="/solver" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  AI解題機器人
                </Link>
              </li>
              <li>
                <Link href="/case-upload" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  家教諮詢
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-medium text-neutral-900 mb-4">支援</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/tutor-registration" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  教師登錄
                </Link>
              </li>
              <li>
                <Link href="/process" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  接案流程
                </Link>
              </li>
              <li>
                <Link href="/notice" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  注意事項
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  費用參考
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-neutral-600 hover:text-brand-700 transition-colors">
                  服務條款
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-center items-center pt-8 border-t border-neutral-200">
          <p className="text-neutral-600 text-sm">
            © 2025 青椒老師家教中心. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

