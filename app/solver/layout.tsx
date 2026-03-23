import type { ReactNode } from 'react'
import { Noto_Serif_TC } from 'next/font/google'

const solverDisplayFont = Noto_Serif_TC({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-solver-display',
})

export default function SolverLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${solverDisplayFont.variable}`}>
      {children}
    </div>
  )
}
