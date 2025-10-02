import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AAC Builder',
  description: 'Runtime e Builder AAC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="has-fixed-nav">{children}</body>
    </html>
  )
}