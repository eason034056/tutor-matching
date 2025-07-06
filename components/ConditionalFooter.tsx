"use client"
import { usePathname } from 'next/navigation'
import Footer from './footer'

export default function ConditionalFooter() {
  const pathname = usePathname()
  if (pathname.startsWith('/solver')) return null
  return <Footer />
} 