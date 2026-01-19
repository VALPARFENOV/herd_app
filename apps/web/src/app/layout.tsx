import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppLayout } from '@/components/layout/app-layout'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'HerdMaster Pro',
  description: 'Modern herd management system for dairy farms',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
