import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground p-4">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link href="/" className="text-2xl font-bold">家教媒合</Link>
        <nav>
          <ul className="flex flex-wrap space-x-4">
            <li><Link href="/" className="hover:underline">首頁</Link></li>
            <li><Link href="/tutors" className="hover:underline">尋找家教</Link></li>
            <li><Link href="/tutor-cases" className="hover:underline">家教案件</Link></li>
            <li><Link href="/case-upload" className="hover:underline">刊登需求</Link></li>
            <li><Link href="/tutor-registration" className="hover:underline">成為家教</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
