"use client"
import { usePathname } from 'next/navigation'
import Header from './header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  if (pathname.startsWith('/solver')) return null
  return <Header />
} 