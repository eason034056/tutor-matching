import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="container mx-auto text-center min-h-screen flex flex-col justify-center">
      <h1 className="text-4xl font-bold mb-6">歡迎來到家教媒合平台</h1>
      <p className="text-xl mb-8">為您找到最適合的家教老師</p>
      <Link href="/tutors">
        <Button size="lg">尋找家教</Button>
      </Link>
    </div>
  )
}
