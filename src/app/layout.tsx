import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Odeez - Personal Life Dashboard',
  description: 'Your all-in-one personal productivity dashboard',
  keywords: ['productivity', 'tasks', 'habits', 'journal', 'finance', 'notes', 'calendar', 'contacts'],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
    other: [
      { url: '/icon-512.png', sizes: '512x512' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Odeez',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}